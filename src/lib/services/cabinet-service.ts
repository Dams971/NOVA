import { 
  Cabinet, 
  CreateCabinetRequest, 
  UpdateCabinetRequest, 
  CabinetFilters,
  CabinetStatus 
} from '../models/cabinet';
import { CabinetRepository, MySQLCabinetRepository } from '../repositories/cabinet-repository';
import { validateCreateCabinet, validateUpdateCabinet, ValidationResult } from '../validation/cabinet';
import DatabaseManager from '../database/connection';

export interface CabinetServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  validationErrors?: ValidationResult['errors'];
}

export class CabinetService {
  private repository: CabinetRepository;
  private dbManager: DatabaseManager;
  private skipDatabaseCreation: boolean;

  constructor(repository?: CabinetRepository, skipDatabaseCreation: boolean = false) {
    this.repository = repository || new MySQLCabinetRepository();
    this.dbManager = DatabaseManager.getInstance();
    this.skipDatabaseCreation = skipDatabaseCreation;
  }

  async createCabinet(data: CreateCabinetRequest): Promise<CabinetServiceResult<Cabinet>> {
    try {
      // Validate input data
      const validation = validateCreateCabinet(data);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          validationErrors: validation.errors
        };
      }

      // Create cabinet record
      const cabinet = await this.repository.create(data);

      // Create cabinet-specific database (skip in test mode)
      if (!this.skipDatabaseCreation) {
        try {
          await this.dbManager.createCabinetDatabase(cabinet.slug);
          
          // Update status to active after successful database creation
          await this.repository.update(cabinet.id, { status: CabinetStatus.ACTIVE });
          cabinet.status = CabinetStatus.ACTIVE;
        } catch (dbError) {
          console.error('Failed to create cabinet database:', dbError);
          
          // Update status to indicate deployment failure
          await this.repository.update(cabinet.id, { status: CabinetStatus.INACTIVE });
          cabinet.status = CabinetStatus.INACTIVE;
          
          return {
            success: false,
            error: 'Failed to create cabinet database',
            data: cabinet
          };
        }
      } else {
        // In test mode, just set status to active
        await this.repository.update(cabinet.id, { status: CabinetStatus.ACTIVE });
        cabinet.status = CabinetStatus.ACTIVE;
      }

      return {
        success: true,
        data: cabinet
      };
    } catch (error) {
      console.error('Error in createCabinet:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getCabinetById(id: string): Promise<CabinetServiceResult<Cabinet>> {
    try {
      const cabinet = await this.repository.findById(id);
      
      if (!cabinet) {
        return {
          success: false,
          error: 'Cabinet not found'
        };
      }

      return {
        success: true,
        data: cabinet
      };
    } catch (error) {
      console.error('Error in getCabinetById:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getCabinetBySlug(slug: string): Promise<CabinetServiceResult<Cabinet>> {
    try {
      const cabinet = await this.repository.findBySlug(slug);
      
      if (!cabinet) {
        return {
          success: false,
          error: 'Cabinet not found'
        };
      }

      return {
        success: true,
        data: cabinet
      };
    } catch (error) {
      console.error('Error in getCabinetBySlug:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getAllCabinets(filters?: CabinetFilters): Promise<CabinetServiceResult<Cabinet[]>> {
    try {
      const cabinets = await this.repository.findAll(filters);

      return {
        success: true,
        data: cabinets
      };
    } catch (error) {
      console.error('Error in getAllCabinets:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async updateCabinet(id: string, data: UpdateCabinetRequest): Promise<CabinetServiceResult<Cabinet>> {
    try {
      // Validate input data
      const validation = validateUpdateCabinet(data);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          validationErrors: validation.errors
        };
      }

      const cabinet = await this.repository.update(id, data);
      
      if (!cabinet) {
        return {
          success: false,
          error: 'Cabinet not found'
        };
      }

      return {
        success: true,
        data: cabinet
      };
    } catch (error) {
      console.error('Error in updateCabinet:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async deleteCabinet(id: string): Promise<CabinetServiceResult<boolean>> {
    try {
      // First check if cabinet exists
      const cabinet = await this.repository.findById(id);
      if (!cabinet) {
        return {
          success: false,
          error: 'Cabinet not found'
        };
      }

      // Delete the cabinet record
      const deleted = await this.repository.delete(id);
      
      if (!deleted) {
        return {
          success: false,
          error: 'Failed to delete cabinet'
        };
      }

      // Note: In a production system, you might want to:
      // 1. Archive the cabinet database instead of deleting it
      // 2. Handle data migration/backup before deletion
      // 3. Implement soft delete instead of hard delete

      return {
        success: true,
        data: true
      };
    } catch (error) {
      console.error('Error in deleteCabinet:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async setCabinetStatus(id: string, status: CabinetStatus): Promise<CabinetServiceResult<Cabinet>> {
    return this.updateCabinet(id, { status });
  }

  async getCabinetConfig(cabinetId: string, configKey: string): Promise<CabinetServiceResult<any>> {
    try {
      const config = await this.repository.getConfig(cabinetId, configKey);
      
      if (!config) {
        return {
          success: false,
          error: 'Configuration not found'
        };
      }

      return {
        success: true,
        data: config.configValue
      };
    } catch (error) {
      console.error('Error in getCabinetConfig:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async setCabinetConfig(cabinetId: string, configKey: string, configValue: any): Promise<CabinetServiceResult<void>> {
    try {
      // Verify cabinet exists
      const cabinet = await this.repository.findById(cabinetId);
      if (!cabinet) {
        return {
          success: false,
          error: 'Cabinet not found'
        };
      }

      await this.repository.setConfig(cabinetId, configKey, configValue);

      return {
        success: true
      };
    } catch (error) {
      console.error('Error in setCabinetConfig:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async deleteCabinetConfig(cabinetId: string, configKey: string): Promise<CabinetServiceResult<boolean>> {
    try {
      const deleted = await this.repository.deleteConfig(cabinetId, configKey);

      return {
        success: true,
        data: deleted
      };
    } catch (error) {
      console.error('Error in deleteCabinetConfig:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getAllCabinetConfigs(cabinetId: string): Promise<CabinetServiceResult<Record<string, any>>> {
    try {
      const configs = await this.repository.getAllConfigs(cabinetId);
      
      // Convert array to object for easier access
      const configObject = configs.reduce((acc, config) => {
        acc[config.configKey] = config.configValue;
        return acc;
      }, {} as Record<string, any>);

      return {
        success: true,
        data: configObject
      };
    } catch (error) {
      console.error('Error in getAllCabinetConfigs:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getActiveCabinets(): Promise<CabinetServiceResult<Cabinet[]>> {
    return this.getAllCabinets({ status: CabinetStatus.ACTIVE });
  }

  async searchCabinets(searchTerm: string, limit?: number): Promise<CabinetServiceResult<Cabinet[]>> {
    return this.getAllCabinets({ 
      search: searchTerm, 
      limit: limit || 10 
    });
  }
}