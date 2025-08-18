import QRCode from 'qrcode';
import speakeasy from 'speakeasy';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MFAService, MFAError } from '@/lib/auth/mfa-service';

// Mock speakeasy
vi.mock('speakeasy', () => ({
  default: {
    generateSecret: vi.fn(),
    totp: {
      verify: vi.fn(),
    },
  },
}));

// Mock QRCode
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn(),
  },
}));

// Mock uuid
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'test-uuid-123'),
}));

// Mock database connection
const mockConnection = {
  execute: vi.fn(),
  release: vi.fn(),
};

const mockDbInstance = {
  getConnection: vi.fn().mockResolvedValue(mockConnection),
};

vi.mock('@/lib/database/connection', () => ({
  DatabaseConnection: {
    getInstance: vi.fn(() => mockDbInstance),
  },
}));

describe('MFAService', () => {
  let mfaService: MFAService;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Reset mock implementations
    mockConnection.execute.mockReset();
    mockConnection.release.mockReset();
    mockDbInstance.getConnection.mockResolvedValue(mockConnection);

    mfaService = MFAService.getInstance();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('requiresMFA', () => {
    it('should require MFA for super_admin users', () => {
      expect(mfaService.requiresMFA('super_admin')).toBe(true);
    });

    it('should not require MFA for other user roles', () => {
      expect(mfaService.requiresMFA('admin')).toBe(false);
      expect(mfaService.requiresMFA('manager')).toBe(false);
      expect(mfaService.requiresMFA('staff')).toBe(false);
    });
  });

  describe('setupMFA', () => {
    it('should setup MFA for a user successfully', async () => {
      const mockSecret = {
        base32: 'JBSWY3DPEHPK3PXP',
        otpauth_url: 'otpauth://totp/Nova%20Platform%20(test@example.com)?secret=JBSWY3DPEHPK3PXP&issuer=Nova%20Platform',
      };

      (speakeasy.generateSecret as any).mockReturnValue(mockSecret);
      (QRCode.toDataURL as any).mockResolvedValue('data:image/png;base64,mockqrcode');
      
      // Mock no existing MFA
      mockConnection.execute.mockResolvedValueOnce([[]]);
      // Mock successful insert
      mockConnection.execute.mockResolvedValueOnce([]);

      const result = await mfaService.setupMFA('user-123', 'test@example.com');

      expect(result).toMatchObject({
        secret: 'JBSWY3DPEHPK3PXP',
        qrCodeDataUrl: 'data:image/png;base64,mockqrcode',
        backupCodes: expect.any(Array),
      });

      expect(result.backupCodes).toHaveLength(10);
      expect(speakeasy.generateSecret).toHaveBeenCalledWith({
        name: 'Nova Platform (test@example.com)',
        issuer: 'Nova Platform',
        length: 32,
      });
    });

    it('should throw error if MFA is already enabled', async () => {
      // Mock existing enabled MFA
      mockConnection.execute.mockResolvedValueOnce([[{
        is_enabled: true,
      }]]);

      await expect(mfaService.setupMFA('user-123', 'test@example.com')).rejects.toThrow(
        new MFAError('MFA is already enabled for this user', 'MFA_ALREADY_ENABLED')
      );
    });

    it('should handle database errors', async () => {
      (speakeasy.generateSecret as any).mockReturnValue({
        base32: 'JBSWY3DPEHPK3PXP',
        otpauth_url: 'otpauth://totp/test',
      });
      (QRCode.toDataURL as any).mockResolvedValue('data:image/png;base64,mockqrcode');
      
      mockConnection.execute
        .mockResolvedValueOnce([[]]) // No existing MFA
        .mockRejectedValueOnce(new Error('Database error'));

      await expect(mfaService.setupMFA('user-123', 'test@example.com')).rejects.toThrow(
        new MFAError('Failed to setup MFA', 'MFA_SETUP_FAILED')
      );
    });
  });

  describe('enableMFA', () => {
    it('should enable MFA with valid token', async () => {
      // Mock existing MFA setup (not enabled)
      mockConnection.execute.mockResolvedValueOnce([[{
        is_enabled: false,
        secret: 'JBSWY3DPEHPK3PXP',
      }]]);
      
      // Mock successful update
      mockConnection.execute.mockResolvedValueOnce([]);

      (speakeasy.totp.verify as any).mockReturnValue(true);

      const result = await mfaService.enableMFA('user-123', '123456');

      expect(result).toBe(true);
      expect(speakeasy.totp.verify).toHaveBeenCalledWith({
        secret: 'JBSWY3DPEHPK3PXP',
        encoding: 'base32',
        token: '123456',
        window: 2,
      });
    });

    it('should throw error for invalid token', async () => {
      mockConnection.execute.mockResolvedValueOnce([[{
        is_enabled: false,
        secret: 'JBSWY3DPEHPK3PXP',
      }]]);

      (speakeasy.totp.verify as any).mockReturnValue(false);

      await expect(mfaService.enableMFA('user-123', '000000')).rejects.toThrow(
        new MFAError('Invalid MFA token', 'INVALID_MFA_TOKEN')
      );
    });

    it('should throw error if MFA setup not found', async () => {
      mockConnection.execute.mockResolvedValueOnce([[]]);

      await expect(mfaService.enableMFA('user-123', '123456')).rejects.toThrow(
        new MFAError('MFA setup not found', 'MFA_SETUP_NOT_FOUND')
      );
    });

    it('should throw error if MFA is already enabled', async () => {
      mockConnection.execute.mockResolvedValueOnce([[{
        is_enabled: true,
        secret: 'JBSWY3DPEHPK3PXP',
      }]]);

      await expect(mfaService.enableMFA('user-123', '123456')).rejects.toThrow(
        new MFAError('MFA is already enabled', 'MFA_ALREADY_ENABLED')
      );
    });
  });

  describe('verifyMFA', () => {
    it('should verify valid TOTP token', async () => {
      mockConnection.execute.mockResolvedValueOnce([[{
        is_enabled: true,
        secret: 'JBSWY3DPEHPK3PXP',
        backup_codes: JSON.stringify(['CODE1', 'CODE2']),
      }]]);

      (speakeasy.totp.verify as any).mockReturnValue(true);

      const result = await mfaService.verifyMFA('user-123', '123456');

      expect(result).toEqual({
        isValid: true,
        usedBackupCode: false,
      });
    });

    it('should verify valid backup code', async () => {
      mockConnection.execute
        .mockResolvedValueOnce([[{
          is_enabled: true,
          secret: 'JBSWY3DPEHPK3PXP',
          backup_codes: JSON.stringify(['CODE1', 'CODE2']),
        }]])
        .mockResolvedValueOnce([]); // Update backup codes

      (speakeasy.totp.verify as any).mockReturnValue(false);

      const result = await mfaService.verifyMFA('user-123', 'CODE1');

      expect(result).toEqual({
        isValid: true,
        usedBackupCode: true,
      });

      // Verify backup code was removed
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE user_mfa'),
        [JSON.stringify(['CODE2']), 'user-123']
      );
    });

    it('should reject invalid token and backup code', async () => {
      mockConnection.execute.mockResolvedValueOnce([[{
        is_enabled: true,
        secret: 'JBSWY3DPEHPK3PXP',
        backup_codes: JSON.stringify(['CODE1', 'CODE2']),
      }]]);

      (speakeasy.totp.verify as any).mockReturnValue(false);

      const result = await mfaService.verifyMFA('user-123', 'INVALID');

      expect(result).toEqual({
        isValid: false,
      });
    });

    it('should throw error if MFA is not enabled', async () => {
      mockConnection.execute.mockResolvedValueOnce([[{
        is_enabled: false,
      }]]);

      await expect(mfaService.verifyMFA('user-123', '123456')).rejects.toThrow(
        new MFAError('MFA is not enabled for this user', 'MFA_NOT_ENABLED')
      );
    });

    it('should throw error if MFA data not found', async () => {
      mockConnection.execute.mockResolvedValueOnce([[]]);

      await expect(mfaService.verifyMFA('user-123', '123456')).rejects.toThrow(
        new MFAError('MFA is not enabled for this user', 'MFA_NOT_ENABLED')
      );
    });
  });

  describe('disableMFA', () => {
    it('should disable MFA with valid token', async () => {
      // Mock MFA verification
      mockConnection.execute
        .mockResolvedValueOnce([[{
          is_enabled: true,
          secret: 'JBSWY3DPEHPK3PXP',
          backup_codes: JSON.stringify(['CODE1']),
        }]])
        .mockResolvedValueOnce([]); // Disable MFA

      (speakeasy.totp.verify as any).mockReturnValue(true);

      const result = await mfaService.disableMFA('user-123', '123456');

      expect(result).toBe(true);
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE user_mfa'),
        ['user-123']
      );
    });

    it('should throw error for invalid token', async () => {
      mockConnection.execute.mockResolvedValueOnce([[{
        is_enabled: true,
        secret: 'JBSWY3DPEHPK3PXP',
        backup_codes: JSON.stringify(['CODE1']),
      }]]);

      (speakeasy.totp.verify as any).mockReturnValue(false);

      await expect(mfaService.disableMFA('user-123', '000000')).rejects.toThrow(
        new MFAError('Invalid MFA token', 'INVALID_MFA_TOKEN')
      );
    });
  });

  describe('regenerateBackupCodes', () => {
    it('should regenerate backup codes with valid token', async () => {
      mockConnection.execute
        .mockResolvedValueOnce([[{
          is_enabled: true,
          secret: 'JBSWY3DPEHPK3PXP',
          backup_codes: JSON.stringify(['OLD1', 'OLD2']),
        }]])
        .mockResolvedValueOnce([]); // Update backup codes

      (speakeasy.totp.verify as any).mockReturnValue(true);

      const result = await mfaService.regenerateBackupCodes('user-123', '123456');

      expect(result).toHaveLength(10);
      expect(result.every(code => typeof code === 'string' && code.length === 8)).toBe(true);
    });

    it('should throw error for invalid token', async () => {
      mockConnection.execute.mockResolvedValueOnce([[{
        is_enabled: true,
        secret: 'JBSWY3DPEHPK3PXP',
        backup_codes: JSON.stringify(['CODE1']),
      }]]);

      (speakeasy.totp.verify as any).mockReturnValue(false);

      await expect(mfaService.regenerateBackupCodes('user-123', '000000')).rejects.toThrow(
        new MFAError('Invalid MFA token', 'INVALID_MFA_TOKEN')
      );
    });
  });

  describe('getMFAStatus', () => {
    it('should return MFA status for enabled user', async () => {
      mockConnection.execute.mockResolvedValueOnce([[{
        is_enabled: true,
        backup_codes: JSON.stringify(['CODE1', 'CODE2', 'CODE3']),
      }]]);

      const result = await mfaService.getMFAStatus('user-123');

      expect(result).toEqual({
        isEnabled: true,
        hasBackupCodes: true,
        backupCodesCount: 3,
      });
    });

    it('should return MFA status for user without MFA', async () => {
      mockConnection.execute.mockResolvedValueOnce([[]]);

      const result = await mfaService.getMFAStatus('user-123');

      expect(result).toEqual({
        isEnabled: false,
        hasBackupCodes: false,
        backupCodesCount: 0,
      });
    });
  });

  describe('isMFARequired', () => {
    it('should return true for super_admin with MFA enabled', async () => {
      mockConnection.execute.mockResolvedValueOnce([[{
        is_enabled: true,
      }]]);

      const result = await mfaService.isMFARequired('user-123', 'super_admin');

      expect(result).toBe(true);
    });

    it('should return false for super_admin without MFA enabled', async () => {
      mockConnection.execute.mockResolvedValueOnce([[{
        is_enabled: false,
      }]]);

      const result = await mfaService.isMFARequired('user-123', 'super_admin');

      expect(result).toBe(false);
    });

    it('should return false for non-super_admin users', async () => {
      const result = await mfaService.isMFARequired('user-123', 'admin');

      expect(result).toBe(false);
      expect(mockConnection.execute).not.toHaveBeenCalled();
    });
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = MFAService.getInstance();
      const instance2 = MFAService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });
});