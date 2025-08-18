import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/database/unified-connection';
import JWTManager from './jwt';
import { MFAService } from './mfa-service';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'super_admin' | 'admin' | 'manager' | 'staff';
  isActive: boolean;
  assignedCabinets: string[];
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterUserRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: 'super_admin' | 'admin' | 'manager' | 'staff';
  assignedCabinets?: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: Omit<User, 'passwordHash'>;
  accessToken: string;
  refreshToken: string;
  requiresMFA?: boolean;
  tempToken?: string;
}

export interface MFALoginRequest {
  tempToken: string;
  mfaToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export class AuthenticationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthService {
  private static instance: AuthService;
  private jwtManager: JWTManager;

  private constructor() {
    this.jwtManager = JWTManager.getInstance();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Hash password using bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify password against hash
   */
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Validate password strength
   */
  private validatePassword(password: string): void {
    if (password.length < 8) {
      throw new AuthenticationError('Password must be at least 8 characters long', 'WEAK_PASSWORD');
    }
    
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      throw new AuthenticationError(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
        'WEAK_PASSWORD'
      );
    }
  }

  /**
   * Validate email format
   */
  private validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AuthenticationError('Invalid email format', 'INVALID_EMAIL');
    }
  }

  /**
   * Get user by email
   */
  private async getUserByEmail(email: string): Promise<User | null> {
    // Use unified database for user lookup
    const userData = await db.findUserByEmail(email);
    
    if (!userData) {
      return null;
    }

    // Map database fields to User interface
    return {
      id: userData.id,
      email: userData.email,
      firstName: userData.first_name,
      lastName: userData.last_name,
      role: userData.role as ('super_admin' | 'admin' | 'manager' | 'staff'),
      isActive: userData.is_active,
      assignedCabinets: [],
      lastLoginAt: undefined,
      createdAt: userData.created_at,
      updatedAt: userData.updated_at
    };
  }

  /**
   * Get user by ID
   */
  private async getUserById(userId: string): Promise<User | null> {
    // Use unified database for user lookup
    const userData = await db.findUserById(userId);
    
    if (!userData) {
      return null;
    }

    // Map database fields to User interface
    return {
      id: userData.id,
      email: userData.email,
      firstName: userData.first_name,
      lastName: userData.last_name,
      role: userData.role as ('super_admin' | 'admin' | 'manager' | 'staff'),
      isActive: userData.is_active,
      assignedCabinets: [],
      lastLoginAt: undefined,
      createdAt: userData.created_at,
      updatedAt: userData.updated_at
    };
  }

  /**
   * Update user's last login timestamp
   */
  private async updateLastLogin(userId: string): Promise<void> {
    await db.updateUser(userId, {
      last_login_at: new Date()
    });
  }

  /**
   * Register a new user
   */
  public async registerUser(request: RegisterUserRequest): Promise<User> {
    this.validateEmail(request.email);
    this.validatePassword(request.password);

    // Check if user already exists
    const existingUser = await this.getUserByEmail(request.email);
    if (existingUser) {
      throw new AuthenticationError('User with this email already exists', 'USER_EXISTS');
    }

    const userId = uuidv4();
    const passwordHash = await this.hashPassword(request.password);

    // Create user using unified database
    const newUser = await db.createUser({
      id: userId,
      email: request.email,
      password_hash: passwordHash,
      first_name: request.firstName || '',
      last_name: request.lastName || '',
      role: request.role,
      is_active: true,
      email_verified: false
    });

    if (!newUser) {
      throw new AuthenticationError('Failed to create user', 'REGISTRATION_FAILED');
    }

    return {
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.first_name,
      lastName: newUser.last_name,
      role: newUser.role as ('super_admin' | 'admin' | 'manager' | 'staff'),
      isActive: newUser.is_active,
      assignedCabinets: request.assignedCabinets || [],
      createdAt: newUser.created_at,
      updatedAt: newUser.updated_at
    };
  }

  /**
   * Authenticate user and return tokens (with MFA support)
   */
  public async login(request: LoginRequest): Promise<LoginResponse> {
    this.validateEmail(request.email);

    const user = await this.getUserByEmail(request.email);
    if (!user) {
      throw new AuthenticationError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw new AuthenticationError('Account is deactivated', 'ACCOUNT_DEACTIVATED');
    }

    // Get full user data with password hash for verification
    const fullUserData = await db.findUserById(user.id);
    if (!fullUserData || !fullUserData.password_hash) {
      throw new AuthenticationError('Invalid email or password', 'INVALID_CREDENTIALS');
    }
    
    const passwordHash = fullUserData.password_hash;

    const isPasswordValid = await this.verifyPassword(request.password, passwordHash);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Check if MFA is required for this user
    const mfaService = MFAService.getInstance();
    const requiresMFA = await mfaService.isMFARequired(user.id, user.role);

    if (requiresMFA) {
      // Generate temporary token for MFA verification
      const tempToken = await this.jwtManager.generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        assignedCabinets: user.assignedCabinets
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
          assignedCabinets: user.assignedCabinets,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        accessToken: '', // Empty until MFA is verified
        refreshToken: '', // Empty until MFA is verified
        requiresMFA: true,
        tempToken
      };
    }

    // No MFA required, complete login
    await this.updateLastLogin(user.id);

    const accessToken = await this.jwtManager.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      assignedCabinets: user.assignedCabinets
    });

    const refreshToken = await this.jwtManager.generateRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        assignedCabinets: user.assignedCabinets,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      accessToken,
      refreshToken
    };
  }

  /**
   * Complete MFA login process
   */
  public async loginWithMFA(request: MFALoginRequest): Promise<LoginResponse> {
    // Verify temporary token
    const tempPayload = await this.jwtManager.verifyAccessToken(request.tempToken);
    if (!tempPayload) {
      throw new AuthenticationError('Invalid or expired temporary token', 'INVALID_TEMP_TOKEN');
    }

    const user = await this.getUserById(tempPayload.userId);
    if (!user || !user.isActive) {
      throw new AuthenticationError('User not found or deactivated', 'USER_NOT_FOUND');
    }

    // Verify MFA token
    const mfaService = MFAService.getInstance();
    const mfaResult = await mfaService.verifyMFA(user.id, request.mfaToken);
    
    if (!mfaResult.isValid) {
      throw new AuthenticationError('Invalid MFA token', 'INVALID_MFA_TOKEN');
    }

    // Update last login
    await this.updateLastLogin(user.id);

    // Generate final tokens
    const accessToken = await this.jwtManager.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      assignedCabinets: user.assignedCabinets
    });

    const refreshToken = await this.jwtManager.generateRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        assignedCabinets: user.assignedCabinets,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      accessToken,
      refreshToken
    };
  }

  /**
   * Refresh access token using refresh token
   */
  public async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const decoded = await this.jwtManager.verifyRefreshToken(request.refreshToken);
    if (!decoded) {
      throw new AuthenticationError('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
    }

    const user = await this.getUserById(decoded.userId);
    if (!user || !user.isActive) {
      throw new AuthenticationError('User not found or deactivated', 'USER_NOT_FOUND');
    }

    // Generate new tokens
    const accessToken = await this.jwtManager.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      assignedCabinets: user.assignedCabinets
    });

    const refreshToken = await this.jwtManager.generateRefreshToken(user.id);

    return {
      accessToken,
      refreshToken
    };
  }

  /**
   * Validate access token and return user info
   */
  public async validateToken(token: string): Promise<User | null> {
    const payload = await this.jwtManager.verifyAccessToken(token);
    if (!payload) {
      return null;
    }

    const user = await this.getUserById(payload.userId);
    if (!user || !user.isActive) {
      return null;
    }

    return user;
  }

  /**
   * Change user password
   */
  public async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    this.validatePassword(newPassword);

    // Get current user data
    const userData = await db.findUserById(userId);
    if (!userData || !userData.is_active) {
      throw new AuthenticationError('User not found', 'USER_NOT_FOUND');
    }

    const isCurrentPasswordValid = await this.verifyPassword(currentPassword, userData.password_hash);
    
    if (!isCurrentPasswordValid) {
      throw new AuthenticationError('Current password is incorrect', 'INVALID_CURRENT_PASSWORD');
    }

    // Hash new password and update
    const newPasswordHash = await this.hashPassword(newPassword);
    await db.updateUser(userId, {
      password_hash: newPasswordHash
    });
  }

  /**
   * Deactivate user account
   */
  public async deactivateUser(userId: string): Promise<void> {
    await db.updateUser(userId, {
      is_active: false
    });
  }
}