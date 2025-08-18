import { v4 as uuidv4 } from 'uuid';
import DatabaseManager from '../database/connection';
import { 
  Cabinet, 
  CreateCabinetRequest, 
  CabinetStatus,
  CabinetSettings 
} from '../models/cabinet';
import { CabinetService, CabinetServiceResult } from './cabinet-service';

export enum DeploymentStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ROLLED_BACK = 'rolled_back'
}

export interface DeploymentStep {
  id: string;
  name: string;
  status: DeploymentStatus;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  rollbackAction?: () => Promise<void>;
}

export interface CabinetDeployment {
  id: string;
  cabinetId: string;
  status: DeploymentStatus;
  steps: DeploymentStep[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface CabinetTemplate {
  id: string;
  name: string;
  description: string;
  settings: CabinetSettings;
  isDefault: boolean;
}

export interface ProvisioningOptions {
  templateId?: string;
  customSettings?: Partial<CabinetSettings>;
  skipDatabaseCreation?: boolean;
  enableRollback?: boolean;
}

export class CabinetProvisioningService {
  private cabinetService: CabinetService;
  private dbManager: DatabaseManager;
  private deployments: Map<string, CabinetDeployment> = new Map();
  private templates: Map<string, CabinetTemplate> = new Map();

  constructor(cabinetService?: CabinetService) {
    this.cabinetService = cabinetService || new CabinetService();
    this.dbManager = DatabaseManager.getInstance();
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates(): void {
    // Default template for general dental practice
    const defaultTemplate: CabinetTemplate = {
      id: 'default-dental',
      name: 'Cabinet Dentaire Standard',
      description: 'Configuration standard pour un cabinet dentaire',
      isDefault: true,
      settings: {
        timezone: 'Europe/Paris',
        workingHours: {
          monday: { start: '08:00', end: '18:00', isOpen: true },
          tuesday: { start: '08:00', end: '18:00', isOpen: true },
          wednesday: { start: '08:00', end: '18:00', isOpen: true },
          thursday: { start: '08:00', end: '18:00', isOpen: true },
          friday: { start: '08:00', end: '18:00', isOpen: true },
          saturday: { start: '09:00', end: '13:00', isOpen: false },
          sunday: { start: '09:00', end: '13:00', isOpen: false }
        },
        bookingRules: {
          advanceBookingDays: 30,
          cancellationHours: 24,
          defaultAppointmentDuration: 30
        },
        notifications: {
          emailEnabled: true,
          smsEnabled: true,
          reminderHours: [24, 2]
        },
        branding: {
          primaryColor: '#3B82F6'
        }
      }
    };

    // Specialized template for orthodontics
    const orthodonticsTemplate: CabinetTemplate = {
      id: 'orthodontics',
      name: 'Cabinet d\'Orthodontie',
      description: 'Configuration spécialisée pour un cabinet d\'orthodontie',
      isDefault: false,
      settings: {
        ...defaultTemplate.settings,
        bookingRules: {
          advanceBookingDays: 60,
          cancellationHours: 48,
          defaultAppointmentDuration: 45
        },
        branding: {
          primaryColor: '#10B981'
        }
      }
    };

    // Pediatric dentistry template
    const pediatricTemplate: CabinetTemplate = {
      id: 'pediatric',
      name: 'Cabinet de Dentisterie Pédiatrique',
      description: 'Configuration adaptée pour la dentisterie pédiatrique',
      isDefault: false,
      settings: {
        ...defaultTemplate.settings,
        workingHours: {
          monday: { start: '09:00', end: '17:00', isOpen: true },
          tuesday: { start: '09:00', end: '17:00', isOpen: true },
          wednesday: { start: '09:00', end: '17:00', isOpen: true },
          thursday: { start: '09:00', end: '17:00', isOpen: true },
          friday: { start: '09:00', end: '17:00', isOpen: true },
          saturday: { start: '09:00', end: '12:00', isOpen: true },
          sunday: { start: '09:00', end: '12:00', isOpen: false }
        },
        bookingRules: {
          advanceBookingDays: 21,
          cancellationHours: 12,
          defaultAppointmentDuration: 20
        },
        branding: {
          primaryColor: 'warning-600'
        }
      }
    };

    this.templates.set(defaultTemplate.id, defaultTemplate);
    this.templates.set(orthodonticsTemplate.id, orthodonticsTemplate);
    this.templates.set(pediatricTemplate.id, pediatricTemplate);
  }

  async provisionCabinet(
    cabinetData: CreateCabinetRequest,
    options: ProvisioningOptions = {}
  ): Promise<CabinetServiceResult<{ cabinet: Cabinet; deployment: CabinetDeployment }>> {
    const deploymentId = uuidv4();
    
    try {
      // Apply template settings
      const finalCabinetData = await this.applyCabinetTemplate(cabinetData, options);
      
      // Create deployment record
      const deployment = this.createDeployment(deploymentId, finalCabinetData.slug);
      
      // Execute deployment steps
      const cabinet = await this.executeDeployment(deployment, finalCabinetData, options);
      
      return {
        success: true,
        data: { cabinet, deployment }
      };
    } catch (_error) {
      console.error('Cabinet provisioning failed:', _error);
      
      // Handle rollback if enabled
      if (options.enableRollback !== false) {
        await this.rollbackDeployment(deploymentId);
      }
      
      return {
        success: false,
        error: _error instanceof Error ? _error.message : 'Unknown provisioning error'
      };
    }
  }

  private async applyCabinetTemplate(
    cabinetData: CreateCabinetRequest,
    options: ProvisioningOptions
  ): Promise<CreateCabinetRequest> {
    let templateSettings: CabinetSettings | undefined;

    if (options.templateId) {
      const template = this.templates.get(options.templateId);
      if (!template) {
        throw new Error(`Template with ID '${options.templateId}' not found`);
      }
      templateSettings = template.settings;
    } else {
      // Use default template
      const defaultTemplate = Array.from(this.templates.values()).find(t => t.isDefault);
      if (defaultTemplate) {
        templateSettings = defaultTemplate.settings;
      }
    }

    // Merge template settings with custom settings and original data
    const mergedSettings = {
      ...templateSettings,
      ...cabinetData.settings,
      ...options.customSettings
    };

    return {
      ...cabinetData,
      settings: mergedSettings
    };
  }

  private createDeployment(deploymentId: string, cabinetSlug: string): CabinetDeployment {
    const deployment: CabinetDeployment = {
      id: deploymentId,
      cabinetId: cabinetSlug, // Will be updated with actual cabinet ID later
      status: DeploymentStatus.PENDING,
      steps: [
        {
          id: 'validate-data',
          name: 'Validation des données du cabinet',
          status: DeploymentStatus.PENDING
        },
        {
          id: 'create-cabinet-record',
          name: 'Création de l\'enregistrement cabinet',
          status: DeploymentStatus.PENDING
        },
        {
          id: 'create-database',
          name: 'Création de la base de données cabinet',
          status: DeploymentStatus.PENDING
        },
        {
          id: 'setup-schema',
          name: 'Configuration du schéma de base de données',
          status: DeploymentStatus.PENDING
        },
        {
          id: 'apply-configuration',
          name: 'Application de la configuration',
          status: DeploymentStatus.PENDING
        },
        {
          id: 'activate-cabinet',
          name: 'Activation du cabinet',
          status: DeploymentStatus.PENDING
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.deployments.set(deploymentId, deployment);
    return deployment;
  }

  private async executeDeployment(
    deployment: CabinetDeployment,
    cabinetData: CreateCabinetRequest,
    options: ProvisioningOptions
  ): Promise<Cabinet> {
    deployment.status = DeploymentStatus.IN_PROGRESS;
    deployment.updatedAt = new Date();

    let cabinet: Cabinet | undefined;
    const rollbackActions: (() => Promise<void>)[] = [];

    try {
      // Step 1: Validate data
      await this.executeStep(deployment, 'validate-data', async () => {
        // Validation is handled by the cabinet service
      });

      // Step 2: Create cabinet record
      await this.executeStep(deployment, 'create-cabinet-record', async () => {
        const result = await this.cabinetService.createCabinet(cabinetData);
        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to create cabinet record');
        }
        cabinet = result.data;
        deployment.cabinetId = cabinet.id;

        // Add rollback action
        rollbackActions.push(async () => {
          if (cabinet) {
            await this.cabinetService.deleteCabinet(cabinet.id);
          }
        });
      });

      if (!cabinet) {
        throw new Error('Cabinet creation failed');
      }

      // Step 3: Create database (if not skipped)
      if (!options.skipDatabaseCreation) {
        await this.executeStep(deployment, 'create-database', async () => {
          await this.dbManager.createCabinetDatabase(cabinet!.slug);
          
          // Add rollback action
          rollbackActions.push(async () => {
            // In production, you might want to backup before dropping
            const connection = await this.dbManager.getMainConnection();
            await connection.execute(`DROP DATABASE IF EXISTS nova_cabinet_${cabinet!.slug}`);
          });
        });

        // Step 4: Setup schema (already handled by createCabinetDatabase)
        await this.executeStep(deployment, 'setup-schema', async () => {
          // Schema setup is handled by createCabinetDatabase
        });
      } else {
        // Skip database steps
        this.skipStep(deployment, 'create-database');
        this.skipStep(deployment, 'setup-schema');
      }

      // Step 5: Apply configuration
      await this.executeStep(deployment, 'apply-configuration', async () => {
        if (cabinetData.settings) {
          await this.cabinetService.setCabinetConfig(cabinet!.id, 'settings', cabinetData.settings);
        }
      });

      // Step 6: Activate cabinet
      await this.executeStep(deployment, 'activate-cabinet', async () => {
        const updateResult = await this.cabinetService.setCabinetStatus(cabinet!.id, CabinetStatus.ACTIVE);
        if (!updateResult.success) {
          throw new Error('Failed to activate cabinet');
        }
        cabinet!.status = CabinetStatus.ACTIVE;
      });

      // Mark deployment as completed
      deployment.status = DeploymentStatus.COMPLETED;
      deployment.completedAt = new Date();
      deployment.updatedAt = new Date();

      return cabinet;

    } catch (error) {
      deployment.status = DeploymentStatus.FAILED;
      deployment.error = error instanceof Error ? error.message : 'Unknown error';
      deployment.updatedAt = new Date();

      // Store rollback actions for potential rollback
      deployment.steps.forEach((step, index) => {
        if (rollbackActions[index]) {
          step.rollbackAction = rollbackActions[index];
        }
      });

      throw error;
    }
  }

  private async executeStep(
    deployment: CabinetDeployment,
    stepId: string,
    action: () => Promise<void>
  ): Promise<void> {
    const step = deployment.steps.find(s => s.id === stepId);
    if (!step) {
      throw new Error(`Step '${stepId}' not found in deployment`);
    }

    step.status = DeploymentStatus.IN_PROGRESS;
    step.startedAt = new Date();

    try {
      await action();
      step.status = DeploymentStatus.COMPLETED;
      step.completedAt = new Date();
    } catch (error) {
      step.status = DeploymentStatus.FAILED;
      step.error = error instanceof Error ? error.message : 'Unknown error';
      step.completedAt = new Date();
      throw error;
    }
  }

  private skipStep(deployment: CabinetDeployment, stepId: string): void {
    const step = deployment.steps.find(s => s.id === stepId);
    if (step) {
      step.status = DeploymentStatus.COMPLETED;
      step.startedAt = new Date();
      step.completedAt = new Date();
    }
  }

  async rollbackDeployment(deploymentId: string): Promise<CabinetServiceResult<boolean>> {
    try {
      const deployment = this.deployments.get(deploymentId);
      if (!deployment) {
        return {
          success: false,
          error: 'Deployment not found'
        };
      }

      deployment.status = DeploymentStatus.IN_PROGRESS;
      deployment.updatedAt = new Date();

      // Execute rollback actions in reverse order
      const completedSteps = deployment.steps
        .filter(step => step.status === DeploymentStatus.COMPLETED && step.rollbackAction)
        .reverse();

      for (const step of completedSteps) {
        if (step.rollbackAction) {
          try {
            await step.rollbackAction();
          } catch (_error) {
            console.error(`Rollback failed for step ${step.id}:`, _error);
            // Continue with other rollback actions
          }
        }
      }

      deployment.status = DeploymentStatus.ROLLED_BACK;
      deployment.updatedAt = new Date();

      return {
        success: true,
        data: true
      };
    } catch (_error) {
      console.error('Rollback failed:', _error);
      return {
        success: false,
        error: _error instanceof Error ? _error.message : 'Rollback failed'
      };
    }
  }

  getDeployment(deploymentId: string): CabinetDeployment | null {
    return this.deployments.get(deploymentId) || null;
  }

  getAllDeployments(): CabinetDeployment[] {
    return Array.from(this.deployments.values());
  }

  getTemplate(templateId: string): CabinetTemplate | null {
    return this.templates.get(templateId) || null;
  }

  getAllTemplates(): CabinetTemplate[] {
    return Array.from(this.templates.values());
  }

  addTemplate(template: CabinetTemplate): void {
    this.templates.set(template.id, template);
  }

  removeTemplate(templateId: string): boolean {
    return this.templates.delete(templateId);
  }

  async getDeploymentStatus(deploymentId: string): Promise<CabinetServiceResult<DeploymentStatus>> {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) {
      return {
        success: false,
        error: 'Deployment not found'
      };
    }

    return {
      success: true,
      data: deployment.status
    };
  }

  async getCabinetDeploymentHistory(cabinetId: string): Promise<CabinetServiceResult<CabinetDeployment[]>> {
    try {
      const deployments = Array.from(this.deployments.values())
        .filter(d => d.cabinetId === cabinetId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return {
        success: true,
        data: deployments
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get deployment history'
      };
    }
  }
}