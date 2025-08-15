import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/database/postgresql-connection';

export interface MFASecret {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface MFASetupResponse {
  secret: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
}

export interface MFAVerificationResult {
  isValid: boolean;
  usedBackupCode?: boolean;
}

export class MFAError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'MFAError';
  }
}

export class MFAService {
  private static instance: MFAService;
  private db: DatabaseConnection;

  private constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  public static getInstance(): MFAService {
    if (!MFAService.instance) {
      MFAService.instance = new MFAService();
    }
    return MFAService.instance;
  }

  /**
   * Generate backup codes for account recovery
   */
  private generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric codes
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Check if user requires MFA based on their role
   */
  public requiresMFA(userRole: string): boolean {
    // Only super_admin users require MFA
    return userRole === 'super_admin';
  }

  /**
   * Setup MFA for a user
   */
  public async setupMFA(userId: string, userEmail: string): Promise<MFASetupResponse> {
    try {
      // Check if user already has MFA enabled
      const existingMFA = await this.getUserMFA(userId);
      if (existingMFA && existingMFA.isEnabled) {
        throw new MFAError('MFA is already enabled for this user', 'MFA_ALREADY_ENABLED');
      }

      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `Nova Platform (${userEmail})`,
        issuer: 'Nova Platform',
        length: 32,
      });

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url!);

      // Store MFA setup in database (not yet enabled)
      const connection = await this.db.getConnection();
      
      try {
        await connection.execute(`
          INSERT INTO user_mfa (id, user_id, secret, backup_codes, is_enabled, created_at)
          VALUES (?, ?, ?, ?, FALSE, CURRENT_TIMESTAMP)
          ON DUPLICATE KEY UPDATE
          secret = VALUES(secret),
          backup_codes = VALUES(backup_codes),
          is_enabled = FALSE,
          updated_at = CURRENT_TIMESTAMP
        `, [
          uuidv4(),
          userId,
          secret.base32,
          JSON.stringify(backupCodes)
        ]);
      } finally {
        connection.release();
      }

      return {
        secret: secret.base32!,
        qrCodeDataUrl,
        backupCodes,
      };

    } catch (error) {
      console.error('MFA setup error:', error);
      if (error instanceof MFAError) {
        throw error;
      }
      throw new MFAError('Failed to setup MFA', 'MFA_SETUP_FAILED');
    }
  }

  /**
   * Verify MFA token and enable MFA for user
   */
  public async enableMFA(userId: string, token: string): Promise<boolean> {
    try {
      const mfaData = await this.getUserMFA(userId);
      if (!mfaData) {
        throw new MFAError('MFA setup not found', 'MFA_SETUP_NOT_FOUND');
      }

      if (mfaData.isEnabled) {
        throw new MFAError('MFA is already enabled', 'MFA_ALREADY_ENABLED');
      }

      // Verify the token
      const isValid = speakeasy.totp.verify({
        secret: mfaData.secret,
        encoding: 'base32',
        token,
        window: 2, // Allow 2 time steps (60 seconds) of tolerance
      });

      if (!isValid) {
        throw new MFAError('Invalid MFA token', 'INVALID_MFA_TOKEN');
      }

      // Enable MFA
      const connection = await this.db.getConnection();
      
      try {
        await connection.execute(`
          UPDATE user_mfa 
          SET is_enabled = TRUE, enabled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ?
        `, [userId]);
      } finally {
        connection.release();
      }

      return true;

    } catch (error) {
      console.error('MFA enable error:', error);
      if (error instanceof MFAError) {
        throw error;
      }
      throw new MFAError('Failed to enable MFA', 'MFA_ENABLE_FAILED');
    }
  }

  /**
   * Verify MFA token for login
   */
  public async verifyMFA(userId: string, token: string): Promise<MFAVerificationResult> {
    try {
      const mfaData = await this.getUserMFA(userId);
      if (!mfaData || !mfaData.isEnabled) {
        throw new MFAError('MFA is not enabled for this user', 'MFA_NOT_ENABLED');
      }

      // First try TOTP verification
      const isValidTOTP = speakeasy.totp.verify({
        secret: mfaData.secret,
        encoding: 'base32',
        token,
        window: 2,
      });

      if (isValidTOTP) {
        return { isValid: true, usedBackupCode: false };
      }

      // If TOTP fails, check backup codes
      const backupCodes = JSON.parse(mfaData.backupCodes || '[]');
      const codeIndex = backupCodes.indexOf(token.toUpperCase());
      
      if (codeIndex !== -1) {
        // Remove used backup code
        backupCodes.splice(codeIndex, 1);
        
        // Update backup codes in database
        const connection = await this.db.getConnection();
        
        try {
          await connection.execute(`
            UPDATE user_mfa 
            SET backup_codes = ?, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
          `, [JSON.stringify(backupCodes), userId]);
        } finally {
          connection.release();
        }

        return { isValid: true, usedBackupCode: true };
      }

      return { isValid: false };

    } catch (error) {
      console.error('MFA verification error:', error);
      if (error instanceof MFAError) {
        throw error;
      }
      throw new MFAError('Failed to verify MFA', 'MFA_VERIFICATION_FAILED');
    }
  }

  /**
   * Disable MFA for a user
   */
  public async disableMFA(userId: string, token: string): Promise<boolean> {
    try {
      // Verify current MFA token before disabling
      const verification = await this.verifyMFA(userId, token);
      if (!verification.isValid) {
        throw new MFAError('Invalid MFA token', 'INVALID_MFA_TOKEN');
      }

      const connection = await this.db.getConnection();
      
      try {
        await connection.execute(`
          UPDATE user_mfa 
          SET is_enabled = FALSE, disabled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ?
        `, [userId]);
      } finally {
        connection.release();
      }

      return true;

    } catch (error) {
      console.error('MFA disable error:', error);
      if (error instanceof MFAError) {
        throw error;
      }
      throw new MFAError('Failed to disable MFA', 'MFA_DISABLE_FAILED');
    }
  }

  /**
   * Generate new backup codes
   */
  public async regenerateBackupCodes(userId: string, token: string): Promise<string[]> {
    try {
      // Verify current MFA token before regenerating codes
      const verification = await this.verifyMFA(userId, token);
      if (!verification.isValid) {
        throw new MFAError('Invalid MFA token', 'INVALID_MFA_TOKEN');
      }

      const newBackupCodes = this.generateBackupCodes();
      const connection = await this.db.getConnection();
      
      try {
        await connection.execute(`
          UPDATE user_mfa 
          SET backup_codes = ?, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ?
        `, [JSON.stringify(newBackupCodes), userId]);
      } finally {
        connection.release();
      }

      return newBackupCodes;

    } catch (error) {
      console.error('Backup codes regeneration error:', error);
      if (error instanceof MFAError) {
        throw error;
      }
      throw new MFAError('Failed to regenerate backup codes', 'BACKUP_CODES_REGENERATION_FAILED');
    }
  }

  /**
   * Get user's MFA status and data
   */
  public async getUserMFA(userId: string): Promise<{
    isEnabled: boolean;
    secret?: string;
    backupCodes?: string;
    enabledAt?: Date;
    createdAt?: Date;
  } | null> {
    const connection = await this.db.getConnection();
    
    try {
      const [rows] = await connection.execute(`
        SELECT is_enabled, secret, backup_codes, enabled_at, created_at
        FROM user_mfa
        WHERE user_id = ?
      `, [userId]);

      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }

      const row = rows[0] as any;
      return {
        isEnabled: row.is_enabled,
        secret: row.secret,
        backupCodes: row.backup_codes,
        enabledAt: row.enabled_at,
        createdAt: row.created_at,
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Get MFA status for user (public info only)
   */
  public async getMFAStatus(userId: string): Promise<{
    isEnabled: boolean;
    hasBackupCodes: boolean;
    backupCodesCount: number;
  }> {
    const mfaData = await this.getUserMFA(userId);
    
    if (!mfaData) {
      return {
        isEnabled: false,
        hasBackupCodes: false,
        backupCodesCount: 0,
      };
    }

    const backupCodes = mfaData.backupCodes ? JSON.parse(mfaData.backupCodes) : [];
    
    return {
      isEnabled: mfaData.isEnabled,
      hasBackupCodes: backupCodes.length > 0,
      backupCodesCount: backupCodes.length,
    };
  }

  /**
   * Check if user has MFA enabled and is required to use it
   */
  public async isMFARequired(userId: string, userRole: string): Promise<boolean> {
    if (!this.requiresMFA(userRole)) {
      return false;
    }

    const mfaData = await this.getUserMFA(userId);
    return mfaData ? mfaData.isEnabled : false;
  }
}