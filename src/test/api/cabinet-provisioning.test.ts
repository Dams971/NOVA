import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../../app/api/cabinets/provision/route';
import { GET as getTemplates, POST as createTemplate } from '../../app/api/templates/route';
import { GET as getTemplate, DELETE as deleteTemplate } from '../../app/api/templates/[templateId]/route';
import { GET as getDeployment, DELETE as rollbackDeployment } from '../../app/api/deployments/[deploymentId]/route';
import { CreateCabinetRequest } from '../../lib/models/cabinet';
import { ProvisioningOptions, CabinetTemplate } from '../../lib/services/cabinet-provisioning-service';

// Mock the database connection
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

describe('Cabinet Provisioning API Integration Tests', () => {
  const validCabinetData: CreateCabinetRequest = {
    name: 'Test Cabinet API',
    slug: 'test-cabinet-api',
    address: {
      street: '123 API Test Street',
      city: 'Test City',
      postalCode: '12345',
      country: 'France'
    },
    phone: '+33123456789',
    email: 'api-test@cabinet.com'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Cabinet Provisioning Endpoint', () => {
    it('should provision cabinet successfully', async () => {
      const request = new Request('http://localhost/api/cabinets/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cabinetData: validCabinetData })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.cabinet).toBeDefined();
      expect(data.data.deployment).toBeDefined();
      expect(data.data.cabinet.name).toBe('Test Cabinet API');
      expect(data.data.deployment.status).toBe('completed');
    });

    it('should provision cabinet with template', async () => {
      const options: ProvisioningOptions = {
        templateId: 'orthodontics'
      };

      const request = new Request('http://localhost/api/cabinets/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cabinetData: validCabinetData,
          options 
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.cabinet.settings.bookingRules.defaultAppointmentDuration).toBe(45);
    });

    it('should handle invalid cabinet data', async () => {
      const invalidData = { ...validCabinetData, email: 'invalid-email' };

      const request = new Request('http://localhost/api/cabinets/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cabinetData: invalidData })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBeFalsy();
      expect(data.error).toBeDefined();
    });

    it('should handle missing cabinet data', async () => {
      const request = new Request('http://localhost/api/cabinets/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Cabinet data is required');
    });

    it('should handle invalid template ID', async () => {
      const options: ProvisioningOptions = {
        templateId: 'non-existent-template'
      };

      const request = new Request('http://localhost/api/cabinets/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cabinetData: validCabinetData,
          options 
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Template with ID \'non-existent-template\' not found');
    });
  });

  describe('Templates API', () => {
    it('should get all templates', async () => {
      const response = await getTemplates();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
      expect(data.data.some((t: CabinetTemplate) => t.isDefault)).toBe(true);
    });

    it('should get specific template', async () => {
      const response = await getTemplate(
        new Request('http://localhost/api/templates/default-dental'),
        { params: { templateId: 'default-dental' } }
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('default-dental');
      expect(data.data.name).toBe('Cabinet Dentaire Standard');
    });

    it('should handle non-existent template', async () => {
      const response = await getTemplate(
        new Request('http://localhost/api/templates/non-existent'),
        { params: { templateId: 'non-existent' } }
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Template not found');
    });

    it('should create custom template', async () => {
      const customTemplate: CabinetTemplate = {
        id: 'api-test-template',
        name: 'API Test Template',
        description: 'A template created via API test',
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

      const request = new Request('http://localhost/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customTemplate)
      });

      const response = await createTemplate(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('api-test-template');
    });

    it('should handle duplicate template creation', async () => {
      const duplicateTemplate: CabinetTemplate = {
        id: 'default-dental', // Using existing template ID
        name: 'Duplicate Template',
        description: 'This should fail',
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

      const request = new Request('http://localhost/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicateTemplate)
      });

      const response = await createTemplate(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe('Template with this ID already exists');
    });

    it('should delete custom template', async () => {
      // First create a template
      const customTemplate: CabinetTemplate = {
        id: 'deletable-template',
        name: 'Deletable Template',
        description: 'A template to be deleted',
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

      const createRequest = new Request('http://localhost/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customTemplate)
      });

      await createTemplate(createRequest);

      // Now delete it
      const deleteResponse = await deleteTemplate(
        new Request('http://localhost/api/templates/deletable-template'),
        { params: { templateId: 'deletable-template' } }
      );
      const deleteData = await deleteResponse.json();

      expect(deleteResponse.status).toBe(200);
      expect(deleteData.success).toBe(true);
      expect(deleteData.message).toBe('Template removed successfully');
    });

    it('should prevent deletion of default template', async () => {
      const response = await deleteTemplate(
        new Request('http://localhost/api/templates/default-dental'),
        { params: { templateId: 'default-dental' } }
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Cannot delete default template');
    });
  });

  describe('Deployment Management API', () => {
    it('should get deployment status', async () => {
      // First create a deployment
      const provisionRequest = new Request('http://localhost/api/cabinets/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cabinetData: {
            ...validCabinetData,
            slug: 'deployment-test-cabinet'
          }
        })
      });

      const provisionResponse = await POST(provisionRequest);
      const provisionData = await provisionResponse.json();
      const deploymentId = provisionData.data.deployment.id;

      // Now get the deployment status
      const response = await getDeployment(
        new Request(`http://localhost/api/deployments/${deploymentId}`),
        { params: { deploymentId } }
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(deploymentId);
      expect(data.data.status).toBe('completed');
      expect(Array.isArray(data.data.steps)).toBe(true);
    });

    it('should handle non-existent deployment', async () => {
      const response = await getDeployment(
        new Request('http://localhost/api/deployments/non-existent-id'),
        { params: { deploymentId: 'non-existent-id' } }
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Deployment not found');
    });

    it('should rollback deployment', async () => {
      // First create a deployment
      const provisionRequest = new Request('http://localhost/api/cabinets/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cabinetData: {
            ...validCabinetData,
            slug: 'rollback-test-cabinet'
          }
        })
      });

      const provisionResponse = await POST(provisionRequest);
      const provisionData = await provisionResponse.json();
      const deploymentId = provisionData.data.deployment.id;

      // Now rollback the deployment
      const response = await rollbackDeployment(
        new Request(`http://localhost/api/deployments/${deploymentId}`),
        { params: { deploymentId } }
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Deployment rolled back successfully');
    });

    it('should handle rollback of non-existent deployment', async () => {
      const response = await rollbackDeployment(
        new Request('http://localhost/api/deployments/non-existent-id'),
        { params: { deploymentId: 'non-existent-id' } }
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Deployment not found');
    });
  });

  describe('End-to-End Integration Scenarios', () => {
    it('should complete full provisioning workflow', async () => {
      // 1. Get available templates
      const templatesResponse = await getTemplates();
      const templatesData = await templatesResponse.json();
      expect(templatesData.success).toBe(true);

      // 2. Select a template
      const orthodonticsTemplate = templatesData.data.find((t: CabinetTemplate) => t.id === 'orthodontics');
      expect(orthodonticsTemplate).toBeDefined();

      // 3. Provision cabinet with selected template
      const provisionRequest = new Request('http://localhost/api/cabinets/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cabinetData: {
            ...validCabinetData,
            slug: 'e2e-test-cabinet'
          },
          options: { templateId: 'orthodontics' }
        })
      });

      const provisionResponse = await POST(provisionRequest);
      const provisionData = await provisionResponse.json();
      
      expect(provisionResponse.status).toBe(200);
      expect(provisionData.success).toBe(true);
      expect(provisionData.data.cabinet.settings.bookingRules.defaultAppointmentDuration).toBe(45);

      // 4. Check deployment status
      const deploymentId = provisionData.data.deployment.id;
      const deploymentResponse = await getDeployment(
        new Request(`http://localhost/api/deployments/${deploymentId}`),
        { params: { deploymentId } }
      );
      const deploymentData = await deploymentResponse.json();

      expect(deploymentResponse.status).toBe(200);
      expect(deploymentData.data.status).toBe('completed');
      expect(deploymentData.data.steps.every((step: any) => step.status === 'completed')).toBe(true);
    });

    it('should handle template creation and usage workflow', async () => {
      // 1. Create custom template
      const customTemplate: CabinetTemplate = {
        id: 'e2e-custom-template',
        name: 'E2E Custom Template',
        description: 'Custom template for E2E testing',
        isDefault: false,
        settings: {
          timezone: 'America/New_York',
          workingHours: {
            monday: { start: '09:00', end: '17:00', isOpen: true },
            tuesday: { start: '09:00', end: '17:00', isOpen: true },
            wednesday: { start: '09:00', end: '17:00', isOpen: true },
            thursday: { start: '09:00', end: '17:00', isOpen: true },
            friday: { start: '09:00', end: '17:00', isOpen: true },
            saturday: { start: '09:00', end: '17:00', isOpen: false },
            sunday: { start: '09:00', end: '17:00', isOpen: false }
          },
          bookingRules: {
            advanceBookingDays: 21,
            cancellationHours: 48,
            defaultAppointmentDuration: 60
          },
          notifications: {
            emailEnabled: true,
            smsEnabled: true,
            reminderHours: [48, 24, 2]
          },
          branding: {
            primaryColor: '#8B5CF6'
          }
        }
      };

      const createTemplateRequest = new Request('http://localhost/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customTemplate)
      });

      const createTemplateResponse = await createTemplate(createTemplateRequest);
      expect(createTemplateResponse.status).toBe(200);

      // 2. Use custom template for provisioning
      const provisionRequest = new Request('http://localhost/api/cabinets/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cabinetData: {
            ...validCabinetData,
            slug: 'e2e-custom-template-cabinet'
          },
          options: { templateId: 'e2e-custom-template' }
        })
      });

      const provisionResponse = await POST(provisionRequest);
      const provisionData = await provisionResponse.json();
      
      expect(provisionResponse.status).toBe(200);
      expect(provisionData.data.cabinet.settings.timezone).toBe('America/New_York');
      expect(provisionData.data.cabinet.settings.bookingRules.defaultAppointmentDuration).toBe(60);
      expect(provisionData.data.cabinet.settings.branding.primaryColor).toBe('#8B5CF6');

      // 3. Clean up - delete custom template
      const deleteTemplateResponse = await deleteTemplate(
        new Request('http://localhost/api/templates/e2e-custom-template'),
        { params: { templateId: 'e2e-custom-template' } }
      );
      expect(deleteTemplateResponse.status).toBe(200);
    });
  });
});