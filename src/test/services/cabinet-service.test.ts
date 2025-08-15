import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CabinetService } from '../../lib/services/cabinet-service';
import { CabinetRepository } from '../../lib/repositories/cabinet-repository';
import { 
  Cabinet, 
  CreateCabinetRequest, 
  UpdateCabinetRequest, 
  CabinetStatus,
  CabinetFilters 
} from '../../lib/models/cabinet';

// Mock repository
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

  async findAll(filters?: CabinetFilters): Promise<Cabinet[]> {
    let cabinets = Array.from(this.cabinets.values());

    if (filters?.status) {
      cabinets = cabinets.filter(c => c.status === filters.status);
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      cabinets = cabinets.filter(c => 
        c.name.toLowerCase().includes(search) ||
        c.email.toLowerCase().includes(search) ||
        c.phone.includes(search)
      );
    }

    if (filters?.limit) {
      const offset = filters.offset || 0;
      cabinets = cabinets.slice(offset, offset + filters.limit);
    }

    return cabinets;
  }

  async update(id: string, data: UpdateCabinetRequest): Promise<Cabinet | null> {
    const cabinet = this.cabinets.get(id);
    if (!cabinet) {
      return null;
    }

    const updated = {
      ...cabinet,
      ...data,
      address: data.address ? { ...cabinet.address, ...data.address } : cabinet.address,
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

describe('CabinetService', () => {
  let service: CabinetService;
  let mockRepository: MockCabinetRepository;

  beforeEach(() => {
    mockRepository = new MockCabinetRepository();
    service = new CabinetService(mockRepository, true); // Skip database creation in tests
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

  describe('createCabinet', () => {
    it('should create a cabinet successfully', async () => {
      const result = await service.createCabinet(validCabinetData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.name).toBe('Test Cabinet');
      expect(result.data?.slug).toBe('test-cabinet');
      expect(result.data?.status).toBe(CabinetStatus.ACTIVE);
    });

    it('should reject invalid cabinet data', async () => {
      const invalidData = { ...validCabinetData, email: 'invalid-email' };
      const result = await service.createCabinet(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors?.length).toBeGreaterThan(0);
    });

    it('should handle repository errors', async () => {
      // Create a cabinet first
      await service.createCabinet(validCabinetData);
      
      // Try to create another with the same slug
      const result = await service.createCabinet(validCabinetData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });
  });

  describe('getCabinetById', () => {
    it('should return cabinet when found', async () => {
      const createResult = await service.createCabinet(validCabinetData);
      const cabinetId = createResult.data!.id;

      const result = await service.getCabinetById(cabinetId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe(cabinetId);
    });

    it('should return error when cabinet not found', async () => {
      const result = await service.getCabinetById('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cabinet not found');
    });
  });

  describe('getCabinetBySlug', () => {
    it('should return cabinet when found', async () => {
      await service.createCabinet(validCabinetData);

      const result = await service.getCabinetBySlug('test-cabinet');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.slug).toBe('test-cabinet');
    });

    it('should return error when cabinet not found', async () => {
      const result = await service.getCabinetBySlug('non-existent-slug');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cabinet not found');
    });
  });

  describe('getAllCabinets', () => {
    beforeEach(async () => {
      // Create test cabinets with unique slugs using timestamp to avoid conflicts
      const timestamp = Date.now();
      await service.createCabinet({
        ...validCabinetData,
        slug: `get-all-test-cabinet-1-${timestamp}`
      });
      
      await service.createCabinet({
        ...validCabinetData,
        name: 'Second Cabinet',
        slug: `get-all-test-cabinet-2-${timestamp}`,
        email: 'second@cabinet.com'
      });
    });

    it('should return all cabinets', async () => {
      const result = await service.getAllCabinets();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.length).toBe(2);
    });

    it('should filter cabinets by status', async () => {
      const result = await service.getAllCabinets({ status: CabinetStatus.ACTIVE });

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(2);
    });

    it('should search cabinets', async () => {
      const result = await service.getAllCabinets({ search: 'Second' });

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(1);
      expect(result.data?.[0].name).toBe('Second Cabinet');
    });

    it('should limit results', async () => {
      const result = await service.getAllCabinets({ limit: 1 });

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(1);
    });
  });

  describe('updateCabinet', () => {
    let cabinetId: string;

    beforeEach(async () => {
      const createResult = await service.createCabinet(validCabinetData);
      cabinetId = createResult.data!.id;
    });

    it('should update cabinet successfully', async () => {
      const updateData: UpdateCabinetRequest = {
        name: 'Updated Cabinet',
        status: CabinetStatus.ACTIVE
      };

      const result = await service.updateCabinet(cabinetId, updateData);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Updated Cabinet');
      expect(result.data?.status).toBe(CabinetStatus.ACTIVE);
    });

    it('should reject invalid update data', async () => {
      const updateData: UpdateCabinetRequest = {
        email: 'invalid-email'
      };

      const result = await service.updateCabinet(cabinetId, updateData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
    });

    it('should return error for non-existent cabinet', async () => {
      const result = await service.updateCabinet('non-existent-id', { name: 'Test' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cabinet not found');
    });
  });

  describe('deleteCabinet', () => {
    let cabinetId: string;

    beforeEach(async () => {
      const createResult = await service.createCabinet(validCabinetData);
      cabinetId = createResult.data!.id;
    });

    it('should delete cabinet successfully', async () => {
      const result = await service.deleteCabinet(cabinetId);

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);

      // Verify cabinet is deleted
      const getResult = await service.getCabinetById(cabinetId);
      expect(getResult.success).toBe(false);
    });

    it('should return error for non-existent cabinet', async () => {
      const result = await service.deleteCabinet('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cabinet not found');
    });
  });

  describe('setCabinetStatus', () => {
    let cabinetId: string;

    beforeEach(async () => {
      const createResult = await service.createCabinet(validCabinetData);
      cabinetId = createResult.data!.id;
    });

    it('should update cabinet status', async () => {
      const result = await service.setCabinetStatus(cabinetId, CabinetStatus.ACTIVE);

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe(CabinetStatus.ACTIVE);
    });
  });

  describe('Cabinet Configuration', () => {
    let cabinetId: string;

    beforeEach(async () => {
      const createResult = await service.createCabinet(validCabinetData);
      cabinetId = createResult.data!.id;
    });

    it('should set and get cabinet config', async () => {
      const configValue = { key: 'value', number: 42 };
      
      const setResult = await service.setCabinetConfig(cabinetId, 'test-config', configValue);
      expect(setResult.success).toBe(true);

      const getResult = await service.getCabinetConfig(cabinetId, 'test-config');
      expect(getResult.success).toBe(true);
      expect(getResult.data).toEqual(configValue);
    });

    it('should return error for non-existent config', async () => {
      const result = await service.getCabinetConfig(cabinetId, 'non-existent-config');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Configuration not found');
    });

    it('should delete cabinet config', async () => {
      await service.setCabinetConfig(cabinetId, 'test-config', { key: 'value' });

      const deleteResult = await service.deleteCabinetConfig(cabinetId, 'test-config');
      expect(deleteResult.success).toBe(true);
      expect(deleteResult.data).toBe(true);

      const getResult = await service.getCabinetConfig(cabinetId, 'test-config');
      expect(getResult.success).toBe(false);
    });

    it('should get all cabinet configs', async () => {
      await service.setCabinetConfig(cabinetId, 'config1', { value: 1 });
      await service.setCabinetConfig(cabinetId, 'config2', { value: 2 });

      const result = await service.getAllCabinetConfigs(cabinetId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        config1: { value: 1 },
        config2: { value: 2 }
      });
    });
  });

  describe('Convenience methods', () => {
    beforeEach(async () => {
      await service.createCabinet(validCabinetData);
      await service.createCabinet({
        ...validCabinetData,
        name: 'Inactive Cabinet',
        slug: 'inactive-cabinet',
        email: 'inactive@cabinet.com'
      });
      
      // Set one cabinet to inactive status
      const cabinets = await service.getAllCabinets();
      if (cabinets.data && cabinets.data.length > 1) {
        await service.setCabinetStatus(cabinets.data[1].id, CabinetStatus.INACTIVE);
      }
    });

    it('should get active cabinets only', async () => {
      const result = await service.getActiveCabinets();

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(1);
      expect(result.data?.[0].status).toBe(CabinetStatus.ACTIVE);
    });

    it('should search cabinets with limit', async () => {
      const result = await service.searchCabinets('Cabinet', 1);

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(1);
    });
  });
});