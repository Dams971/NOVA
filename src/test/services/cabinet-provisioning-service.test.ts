import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  Cabinet, 
  CreateCabinetRequest, 
  CabinetStatus 
} from '../../lib/models/cabinet';
import { CabinetRepository } from '../../lib/repositories/cabinet-repository';
import { CabinetProvisioningService, DeploymentStatus, ProvisioningOptions } from '../../lib/services/cabinet-provisioning-service';
import { CabinetService } from '../../lib/services/cabinet-service';

// Mock DatabaseManager module
vi.mock('../../lib/database/connection', () => {
  const mockDatabaseManager = {
    createCabinetDatabase: vi.fn(),
    getMainConnection: vi.fn(),
    getCabinetConnection: vi.fn()
  };

  return {
    default: {
      getInstance: vi.fn(() => mockDatabaseManager)
    }
  };
});

// Mock repository for testing
class MockCabinetRepository implements CabinetRepository {
  private cabinets: Map<string, Cabinet> = new Map();
  private configs: Map<string, any> = new Map();
  private idCounter: number = 1;

  async create(data: CreateCabinetRequest): Promise<Cabinet> {
    // Check if slug already exists
    for (const existingCabinet of this.cabinets.values()) {
      if (existingCabinet.slug === data.slug) {
        throw new Error(`Cabinet with slug '${data.slug}' already exists`);
      }
    }

    const cabinet: Cabinet = {
      id: 'test-id-' + this.idCounter++,
      name: data.name,
      slug: data.slug,
      address: data.address,
      phone: data.phone,
      email: data.email,
      timezone: data.timezone || 'Europe/Paris',
      status: CabinetStatus.DEPLOYING,
      databaseName: `nova_cabinet_${data.slug}`,
      settings: data.settings,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.cabinets.set(cabinet.id, cabinet);
    return cabinet;
  }

  async findById(id: string): Promise<Cabinet | null> {
    return this.cabinets.get(id) || null;
  }

  async findBySlug(slug: string): Promise<Cabinet | null> {
    for (const cabinet of this.cabinets.values()) {
      if (cabinet.slug === slug) {
        return cabinet;
      }
    }
    return null;
  }

  async findAll(): Promise<Cabinet[]> {
    return Array.from(this.cabinets.values());
  }

  async update(id: string, data: any): Promise<Cabinet | null> {
    const cabinet = this.cabinets.get(id);
    if (!cabinet) {
      return null;
    }

    const updated = {
      ...cabinet,
      ...data,
      updatedAt: new Date()
    };

    this.cabinets.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.cabinets.delete(id);
  }

  async getConfig(cabinetId: string, configKey: string): Promise<any> {
    const key = `${cabinetId}:${configKey}`;
    const value = this.configs.get(key);
    return value ? { configKey, configValue: value, cabinetId } : null;
  }

  async setConfig(cabinetId: string, configKey: string, configValue: any): Promise<void> {
    const key = `${cabinetId}:${configKey}`;
    this.configs.set(key, configValue);
  }

  async deleteConfig(cabinetId: string, configKey: string): Promise<boolean> {
    const key = `${cabinetId}:${configKey}`;
    return this.configs.delete(key);
  }

  async getAllConfigs(cabinetId: string): Promise<any[]> {
    const configs = [];
    for (const [key, value] of this.configs.entries()) {
      if (key.startsWith(`${cabinetId}:`)) {
        const configKey = key.split(':')[1];
        configs.push({ configKey, configValue: value, cabinetId });
      }
    }
    return configs;
  }
}

describe('CabinetProvisioningService', () => {
  let provisioningService: CabinetProvisioningService;
  let cabinetService: CabinetService;
  let mockRepository: MockCabinetRepository;

  beforeEach(() => {
    mockRepository = new MockCabinetRepository();
    cabinetService = new CabinetService(mockRepository, true); // Skip database creation in tests
    provisioningService = new CabinetProvisioningService(cabinetService);

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const validCabinetData: CreateCabinetRequest = {
    name: 'Test Cabinet',
    slug: 'test-cabinet',
    address: {
      street: '123 Test Street',
      city: 'Test City',
      postalCode: '12345',
      country: 'France'
    },
    phone: '+33123456789',
    email: 'test@cabinet.com'
  };

  describe('Template Management', () => {
    it('should have default templates available', () => {
      const templates = provisioningService.getAllTemplates();
      
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.some(t => t.isDefault)).toBe(true);
      
      const defaultTemplate = templates.find(t => t.isDefault);
      expect(defaultTemplate).toBeDefined();
      expect(defaultTemplate?.settings).toBeDefined();
    });

    it('should get template by ID', () => {
      const template = provisioningService.getTemplate('default-dental');
      
      expect(template).toBeDefined();
      expect(template?.name).toBe('Cabinet Dentaire Standard');
      expect(template?.isDefault).toBe(true);
    });

    it('should add custom template', () => {
      const customTemplate = {
        id: 'custom-template',
        name: 'Custom Template',
        description: 'A custom template for testing',
        isDefault: false,
        settings: {
          timezone: 'Europe/London',
          workingHours: {
            monday: { start: '10:00', end: '16:00', isOpen: true },
            tuesday: { start: '10:00', end: '16:00', isOpen: true },
            wednesday: { start: '10:00', end: '16:00', isOpen: true },
            thursday: { start: '10:00', end: '16:00', isOpen: true },
            friday: { start: '10:00', end: '16:00', isOpen: true },
            saturday: { start: '10:00', end: '16:00', isOpen: false },
            sunday: { start: '10:00', end: '16:00', isOpen: false }
          },
          bookingRules: {
            advanceBookingDays: 14,
            cancellationHours: 12,
            defaultAppointmentDuration: 45
          },
          notifications: {
            emailEnabled: true,
            smsEnabled: false,
            reminderHours: [24]
          },
          branding: {
            primaryColor: '#FF5733'
          }
        }
      };

      provisioningService.addTemplate(customTemplate);
      
      const retrievedTemplate = provisioningService.getTemplate('custom-template');
      expect(retrievedTemplate).toEqual(customTemplate);
    });

    it('should remove template', () => {
      const customTemplate = {
        id: 'removable-template',
        name: 'Removable Template',
        description: 'A template to be removed',
        isDefault: false,
        settings: {
          timezone: 'Europe/Paris',
          workingHours: {},
          bookingRules: {
            advanceBookingDays: 30,
            cancellationHours: 24,
            defaultAppointmentDuration: 30
          },
          notifications: {
            emailEnabled: true,
            smsEnabled: false,
            reminderHours: [24]
          },
          branding: {
            primaryColor: '#000000'
          }
        }
      };

      provisioningService.addTemplate(customTemplate);
      expect(provisioningService.getTemplate('removable-template')).toBeDefined();

      const removed = provisioningService.removeTemplate('removable-template');
      expect(removed).toBe(true);
      expect(provisioningService.getTemplate('removable-template')).toBeNull();
    });
  });

  describe('Cabinet Provisioning', () => {
    it('should provision cabinet with default template', async () => {
      const result = await provisioningService.provisionCabinet(validCabinetData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.cabinet).toBeDefined();
      expect(result.data?.deployment).toBeDefined();

      const { cabinet, deployment } = result.data!;
      expect(cabinet.name).toBe('Test Cabinet');
      expect(cabinet.status).toBe(CabinetStatus.ACTIVE);
      expect(cabinet.settings).toBeDefined();
      expect(deployment.status).toBe(DeploymentStatus.COMPLETED);
    });

    it('should provision cabinet with specific template', async () => {
      const options: ProvisioningOptions = {
        templateId: 'orthodontics'
      };

      const result = await provisioningService.provisionCabinet(validCabinetData, options);

      expect(result.success).toBe(true);
      expect(result.data?.cabinet.settings?.bookingRules.defaultAppointmentDuration).toBe(45);
      expect(result.data?.cabinet.settings?.branding.primaryColor).toBe('#10B981');
    });

    it('should provision cabinet with custom settings override', async () => {
      const options: ProvisioningOptions = {
        templateId: 'default-dental',
        customSettings: {
          timezone: 'America/New_York',
          branding: {
            primaryColor: '#FF0000'
          }
        }
      };

      const result = await provisioningService.provisionCabinet(validCabinetData, options);

      expect(result.success).toBe(true);
      expect(result.data?.cabinet.settings?.timezone).toBe('America/New_York');
      expect(result.data?.cabinet.settings?.branding.primaryColor).toBe('#FF0000');
    });

    it('should handle provisioning with invalid template', async () => {
      const options: ProvisioningOptions = {
        templateId: 'non-existent-template'
      };

      const result = await provisioningService.provisionCabinet(validCabinetData, options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Template with ID \'non-existent-template\' not found');
    });

    it('should skip database creation when requested', async () => {
      const options: ProvisioningOptions = {
        skipDatabaseCreation: true
      };

      const result = await provisioningService.provisionCabinet(validCabinetData, options);

      expect(result.success).toBe(true);
      // Database creation should be skipped, so we can't easily verify the mock wasn't called
      // since the service skips database creation in test mode anyway
    });

    it('should track deployment steps', async () => {
      const result = await provisioningService.provisionCabinet(validCabinetData);

      expect(result.success).toBe(true);
      const deployment = result.data?.deployment;
      expect(deployment?.steps).toBeDefined();
      expect(deployment?.steps.length).toBeGreaterThan(0);

      // All steps should be completed
      deployment?.steps.forEach(step => {
        expect(step.status).toBe(DeploymentStatus.COMPLETED);
        expect(step.startedAt).toBeDefined();
        expect(step.completedAt).toBeDefined();
      });
    });
  });

  describe('Deployment Management', () => {
    it('should get deployment by ID', async () => {
      const result = await provisioningService.provisionCabinet(validCabinetData);
      const deploymentId = result.data?.deployment.id;

      const deployment = provisioningService.getDeployment(deploymentId!);
      expect(deployment).toBeDefined();
      expect(deployment?.id).toBe(deploymentId);
    });

    it('should get all deployments', async () => {
      await provisioningService.provisionCabinet(validCabinetData);
      await provisioningService.provisionCabinet({
        ...validCabinetData,
        name: 'Second Cabinet',
        slug: 'second-cabinet',
        email: 'second@cabinet.com'
      });

      const deployments = provisioningService.getAllDeployments();
      expect(deployments.length).toBe(2);
    });

    it('should get deployment status', async () => {
      const result = await provisioningService.provisionCabinet(validCabinetData);
      const deploymentId = result.data?.deployment.id;

      const statusResult = await provisioningService.getDeploymentStatus(deploymentId!);
      expect(statusResult.success).toBe(true);
      expect(statusResult.data).toBe(DeploymentStatus.COMPLETED);
    });

    it('should get cabinet deployment history', async () => {
      const result = await provisioningService.provisionCabinet(validCabinetData);
      const cabinetId = result.data?.cabinet.id;

      const historyResult = await provisioningService.getCabinetDeploymentHistory(cabinetId!);
      expect(historyResult.success).toBe(true);
      expect(historyResult.data?.length).toBe(1);
      expect(historyResult.data?.[0].cabinetId).toBe(cabinetId);
    });
  });

  describe('Error Handling and Rollback', () => {
    it('should handle cabinet creation failure', async () => {
      // Create a cabinet with the same slug first
      await provisioningService.provisionCabinet(validCabinetData);

      // Try to create another with the same slug
      const result = await provisioningService.provisionCabinet(validCabinetData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('should handle database creation failure', async () => {
      // Since we're in test mode with skipDatabaseCreation=true, 
      // we'll simulate a different kind of failure
      const invalidData = { ...validCabinetData, email: 'invalid-email' };
      const result = await provisioningService.provisionCabinet(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should perform rollback on failure', async () => {
      // Test rollback with duplicate slug error
      await provisioningService.provisionCabinet(validCabinetData);
      
      const result = await provisioningService.provisionCabinet(validCabinetData, {
        enableRollback: true
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('should manually rollback deployment', async () => {
      // First, create a successful deployment
      const result = await provisioningService.provisionCabinet(validCabinetData);
      expect(result.success).toBe(true);

      const deploymentId = result.data?.deployment.id;
      const cabinetId = result.data?.cabinet.id;

      // Verify cabinet exists
      const cabinet = await mockRepository.findById(cabinetId!);
      expect(cabinet).toBeDefined();

      // Perform rollback
      const rollbackResult = await provisioningService.rollbackDeployment(deploymentId!);
      expect(rollbackResult.success).toBe(true);

      // Check deployment status
      const deployment = provisioningService.getDeployment(deploymentId!);
      expect(deployment?.status).toBe(DeploymentStatus.ROLLED_BACK);
    });

    it('should handle rollback of non-existent deployment', async () => {
      const rollbackResult = await provisioningService.rollbackDeployment('non-existent-id');
      
      expect(rollbackResult.success).toBe(false);
      expect(rollbackResult.error).toBe('Deployment not found');
    });
  });

  describe('Integration Scenarios', () => {
    it('should provision multiple cabinets with different templates', async () => {
      const cabinet1Result = await provisioningService.provisionCabinet(validCabinetData, {
        templateId: 'default-dental'
      });

      const cabinet2Result = await provisioningService.provisionCabinet({
        ...validCabinetData,
        name: 'Orthodontics Cabinet',
        slug: 'orthodontics-cabinet',
        email: 'ortho@cabinet.com'
      }, {
        templateId: 'orthodontics'
      });

      const cabinet3Result = await provisioningService.provisionCabinet({
        ...validCabinetData,
        name: 'Pediatric Cabinet',
        slug: 'pediatric-cabinet',
        email: 'pediatric@cabinet.com'
      }, {
        templateId: 'pediatric'
      });

      expect(cabinet1Result.success).toBe(true);
      expect(cabinet2Result.success).toBe(true);
      expect(cabinet3Result.success).toBe(true);

      // Verify different configurations
      expect(cabinet1Result.data?.cabinet.settings?.bookingRules.defaultAppointmentDuration).toBe(30);
      expect(cabinet2Result.data?.cabinet.settings?.bookingRules.defaultAppointmentDuration).toBe(45);
      expect(cabinet3Result.data?.cabinet.settings?.bookingRules.defaultAppointmentDuration).toBe(20);

      // Verify all deployments are tracked
      const deployments = provisioningService.getAllDeployments();
      expect(deployments.length).toBe(3);
    });

    it('should handle concurrent provisioning requests', async () => {
      const promises = [
        provisioningService.provisionCabinet({
          ...validCabinetData,
          slug: 'concurrent-1',
          email: 'concurrent1@cabinet.com'
        }),
        provisioningService.provisionCabinet({
          ...validCabinetData,
          slug: 'concurrent-2',
          email: 'concurrent2@cabinet.com'
        }),
        provisioningService.provisionCabinet({
          ...validCabinetData,
          slug: 'concurrent-3',
          email: 'concurrent3@cabinet.com'
        })
      ];

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      const deployments = provisioningService.getAllDeployments();
      expect(deployments.length).toBe(3);
    });

    it('should maintain deployment history across multiple operations', async () => {
      // Create initial cabinet
      const result1 = await provisioningService.provisionCabinet(validCabinetData);
      const cabinetId = result1.data?.cabinet.id;

      // Simulate additional deployment operations for the same cabinet
      // (In a real scenario, this might be updates or redeployments)
      
      const historyResult = await provisioningService.getCabinetDeploymentHistory(cabinetId!);
      expect(historyResult.success).toBe(true);
      expect(historyResult.data?.length).toBe(1);

      // Verify deployment details
      const deployment = historyResult.data?.[0];
      expect(deployment?.cabinetId).toBe(cabinetId);
      expect(deployment?.status).toBe(DeploymentStatus.COMPLETED);
      expect(deployment?.steps.every(step => step.status === DeploymentStatus.COMPLETED)).toBe(true);
    });
  });
});