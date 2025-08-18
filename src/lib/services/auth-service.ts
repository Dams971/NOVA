import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';
import { getPool } from '../database/config';
import { 
  User, 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  AuthSession, 
  JWTPayload,
  UserPermissions,
  ROLE_PERMISSIONS
} from '../models/auth';

export class AuthService {
  private static instance: AuthService;
  private pool = getPool();
  private jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key');
  private jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Register new user
  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await this.getUserByEmail(data.email);
      if (existingUser) {
        return { success: false, error: 'User already exists with this email' };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(data.password, 12);
      const userId = uuidv4();

      // Create user
      await this.pool.execute(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, is_active, email_verified)
         VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, FALSE)`,
        [userId, data.email, passwordHash, data.firstName, data.lastName, data.phone || null, data.role]
      );

      // Get created user
      const user = await this.getUserById(userId);
      if (!user) {
        return { success: false, error: 'Failed to create user' };
      }

      // Create session and token
      const session = await this.createSession(user.id);
      const token = await this.generateJWT(user, session.id);

      return {
        success: true,
        user,
        token,
        expiresAt: session.expiresAt
      };
    } catch (_error) {
      console.error('Registration error:', _error);
      return { success: false, error: 'Registration failed' };
    }
  }

  // Login user
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      // Get user by email
      const user = await this.getUserByEmail(data.email);
      if (!user || !user.isActive) {
        return { success: false, error: 'Invalid credentials' };
      }

      // Get password hash
      const [rows] = await this.pool.execute(
        'SELECT password_hash FROM users WHERE id = ?',
        [user.id]
      );
      
      if ((rows as RowDataPacket[]).length === 0) {
        return { success: false, error: 'Invalid credentials' };
      }

      const passwordHash = (rows as RowDataPacket[])[0].password_hash;

      // Verify password
      const isValidPassword = await bcrypt.compare(data.password, passwordHash);
      if (!isValidPassword) {
        return { success: false, error: 'Invalid credentials' };
      }

      // Create session and token
      const session = await this.createSession(user.id, data.rememberMe);
      const token = await this.generateJWT(user, session.id);

      return {
        success: true,
        user,
        token,
        expiresAt: session.expiresAt
      };
    } catch (_error) {
      console.error('Login error:', _error);
      return { success: false, error: 'Login failed' };
    }
  }

  // Logout user
  async logout(token: string): Promise<boolean> {
    try {
      const payload = await this.verifyJWT(token);
      if (!payload) return false;

      // Delete session
      await this.pool.execute(
        'DELETE FROM sessions WHERE id = ?',
        [payload.sessionId]
      );

      return true;
    } catch (_error) {
      console.error('Logout error:', _error);
      return false;
    }
  }

  // Verify JWT token
  async verifyJWT(token: string): Promise<JWTPayload | null> {
    try {
      const { payload } = await jwtVerify(token, this.jwtSecret);
      return payload as unknown as JWTPayload;
    } catch (error) {
      return null;
    }
  }

  // Get user by token
  async getUserByToken(token: string): Promise<User | null> {
    try {
      const payload = await this.verifyJWT(token);
      if (!payload) return null;

      // Check if session is still valid
      const [sessionRows] = await this.pool.execute(
        'SELECT expires_at FROM sessions WHERE id = ? AND user_id = ?',
        [payload.sessionId, payload.userId]
      );

      if ((sessionRows as RowDataPacket[]).length === 0) return null;

      const session = (sessionRows as RowDataPacket[])[0];
      if (new Date(session.expires_at) < new Date()) {
        // Session expired, clean up
        await this.pool.execute('DELETE FROM sessions WHERE id = ?', [payload.sessionId]);
        return null;
      }

      return await this.getUserById(payload.userId);
    } catch (_error) {
      console.error('Get user by token error:', _error);
      return null;
    }
  }

  // Get user permissions
  async getUserPermissions(userId: string): Promise<UserPermissions | null> {
    try {
      const user = await this.getUserById(userId);
      if (!user) return null;

      // Get assigned cabinets
      const [cabinetRows] = await this.pool.execute(
        'SELECT cabinet_id FROM cabinet_members WHERE user_id = ? AND is_active = TRUE',
        [userId]
      );

      const assignedCabinets = (cabinetRows as RowDataPacket[]).map(row => row.cabinet_id);

      return {
        userId,
        role: user.role,
        permissions: ROLE_PERMISSIONS[user.role],
        assignedCabinets
      };
    } catch (_error) {
      console.error('Get user permissions error:', _error);
      return null;
    }
  }

  // Get user by ID
  private async getUserById(id: string): Promise<User | null> {
    const [rows] = await this.pool.execute(
      `SELECT id, email, first_name, last_name, phone, role, is_active, email_verified, created_at, updated_at
       FROM users WHERE id = ?`,
      [id]
    );

    const userRows = rows as RowDataPacket[];
    if (userRows.length === 0) return null;

    const row = userRows[0];
    return {
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      role: row.role,
      isActive: row.is_active,
      emailVerified: row.email_verified,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  // Get user by email
  private async getUserByEmail(email: string): Promise<User | null> {
    const [rows] = await this.pool.execute(
      `SELECT id, email, first_name, last_name, phone, role, is_active, email_verified, created_at, updated_at
       FROM users WHERE email = ?`,
      [email]
    );

    const userRows = rows as RowDataPacket[];
    if (userRows.length === 0) return null;

    const row = userRows[0];
    return {
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      role: row.role,
      isActive: row.is_active,
      emailVerified: row.email_verified,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  // Create session
  private async createSession(userId: string, rememberMe = false): Promise<AuthSession> {
    const sessionId = uuidv4();
    const expiresAt = new Date();
    
    // Set expiration based on remember me
    if (rememberMe) {
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days
    } else {
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    }

    const tokenHash = uuidv4(); // Simple token hash for now

    await this.pool.execute(
      'INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)',
      [sessionId, userId, tokenHash, expiresAt]
    );

    return {
      id: sessionId,
      userId,
      token: tokenHash,
      expiresAt,
      createdAt: new Date()
    };
  }

  // Generate JWT
  private async generateJWT(user: User, sessionId: string): Promise<string> {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId
    };

    return await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(this.jwtExpiresIn)
      .setIssuedAt()
      .sign(this.jwtSecret);
  }

  // Clean expired sessions
  async cleanExpiredSessions(): Promise<void> {
    await this.pool.execute('DELETE FROM sessions WHERE expires_at < NOW()');
  }
}
