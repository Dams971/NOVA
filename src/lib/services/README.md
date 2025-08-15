# Cabinet Provisioning Service

The Cabinet Provisioning Service provides automated deployment and management capabilities for Nova cabinet instances. It handles the complete workflow from cabinet creation to database setup and configuration deployment.

## Features

- **Configuration Templates**: Pre-defined templates for different types of dental practices
- **Automated Database Setup**: Creates cabinet-specific databases with proper schema
- **Deployment Status Tracking**: Monitors deployment progress with detailed step tracking
- **Rollback Mechanisms**: Automatic and manual rollback capabilities for failed deployments
- **Integration Testing**: Comprehensive test coverage for all provisioning scenarios

## Usage

### Basic Cabinet Provisioning

```typescript
import { CabinetProvisioningService } from './cabinet-provisioning-service';
import { CreateCabinetRequest } from '../models/cabinet';

const provisioningService = new CabinetProvisioningService();

const cabinetData: CreateCabinetRequest = {
  name: 'Cabinet Dentaire Exemple',
  slug: 'cabinet-exemple',
  address: {
    street: '123 Rue de la Santé',
    city: 'Paris',
    postalCode: '75001',
    country: 'France'
  },
  phone: '+33123456789',
  email: 'contact@cabinet-exemple.fr'
};

// Provision with default template
const result = await provisioningService.provisionCabinet(cabinetData);

if (result.success) {
  console.log('Cabinet provisioned successfully:', result.data?.cabinet.id);
  console.log('Deployment status:', result.data?.deployment.status);
} else {
  console.error('Provisioning failed:', result.error);
}
```

### Using Templates

```typescript
// Provision with specific template
const result = await provisioningService.provisionCabinet(cabinetData, {
  templateId: 'orthodontics'
});

// Provision with custom settings override
const result = await provisioningService.provisionCabinet(cabinetData, {
  templateId: 'default-dental',
  customSettings: {
    timezone: 'America/New_York',
    branding: {
      primaryColor: '#FF0000'
    }
  }
});
```

### Template Management

```typescript
// Get all available templates
const templates = provisioningService.getAllTemplates();

// Get specific template
const template = provisioningService.getTemplate('orthodontics');

// Add custom template
const customTemplate = {
  id: 'custom-practice',
  name: 'Custom Practice Template',
  description: 'Specialized template for custom practice',
  isDefault: false,
  settings: {
    // ... template settings
  }
};

provisioningService.addTemplate(customTemplate);
```

### Deployment Management

```typescript
// Get deployment status
const deployment = provisioningService.getDeployment(deploymentId);
console.log('Deployment status:', deployment?.status);

// Get deployment history for a cabinet
const historyResult = await provisioningService.getCabinetDeploymentHistory(cabinetId);
if (historyResult.success) {
  console.log('Deployment history:', historyResult.data);
}

// Rollback a deployment
const rollbackResult = await provisioningService.rollbackDeployment(deploymentId);
if (rollbackResult.success) {
  console.log('Deployment rolled back successfully');
}
```

## Available Templates

### Default Templates

1. **default-dental**: Standard dental practice configuration
   - Standard working hours (8:00-18:00)
   - 30-minute appointment slots
   - 30-day advance booking
   - Email and SMS notifications

2. **orthodontics**: Specialized for orthodontic practices
   - Extended appointment slots (45 minutes)
   - 60-day advance booking
   - 48-hour cancellation policy

3. **pediatric**: Optimized for pediatric dentistry
   - Shorter appointment slots (20 minutes)
   - Family-friendly working hours
   - Reduced advance booking period (21 days)

### Custom Templates

You can create custom templates by defining:
- Working hours and availability
- Booking rules and policies
- Notification preferences
- Branding and customization

## Deployment Steps

The provisioning process follows these steps:

1. **Data Validation**: Validates cabinet data and configuration
2. **Cabinet Record Creation**: Creates the cabinet record in the main database
3. **Database Creation**: Creates cabinet-specific database (if not skipped)
4. **Schema Setup**: Initializes database schema with required tables
5. **Configuration Application**: Applies template and custom settings
6. **Cabinet Activation**: Sets cabinet status to active

Each step is tracked and can be monitored for progress and error handling.

## Error Handling

The service provides comprehensive error handling:

- **Validation Errors**: Detailed validation error messages
- **Database Errors**: Database connection and creation error handling
- **Rollback Support**: Automatic rollback on failure (configurable)
- **Step-by-Step Tracking**: Individual step status and error tracking

## API Endpoints

### Provision Cabinet
```
POST /api/cabinets/provision
```

### Get Templates
```
GET /api/templates
GET /api/templates/{templateId}
```

### Deployment Management
```
GET /api/deployments/{deploymentId}
DELETE /api/deployments/{deploymentId}  # Rollback
```

## Testing

The service includes comprehensive test coverage:

- Unit tests for all service methods
- Integration tests for deployment workflows
- Error handling and rollback scenarios
- Template management functionality
- Concurrent provisioning scenarios

Run tests with:
```bash
npm run test:run -- src/test/services/cabinet-provisioning-service.test.ts
```

## Configuration

### Environment Variables

- `DB_HOST`: Database host
- `DB_PORT`: Database port
- `DB_USER`: Database user
- `DB_PASSWORD`: Database password
- `DB_SSL`: Enable SSL connection

### Provisioning Options

- `templateId`: Template to use for provisioning
- `customSettings`: Override template settings
- `skipDatabaseCreation`: Skip database creation (for testing)
- `enableRollback`: Enable automatic rollback on failure

## Best Practices

1. **Always use templates** for consistent cabinet configurations
2. **Monitor deployment status** for long-running operations
3. **Test rollback procedures** in development environments
4. **Validate cabinet data** before provisioning
5. **Use unique slugs** to avoid conflicts
6. **Handle errors gracefully** with proper user feedback

## Requirements Satisfied

This implementation satisfies the following requirements from the Nova Internal Platform specification:

- **Requirement 2.1**: Automated cabinet deployment and configuration
- **Requirement 2.2**: Template-based provisioning with configuration management
- **Requirement 2.3**: Deployment status tracking and rollback mechanisms

The service provides a robust foundation for managing cabinet deployments in the Nova internal platform, supporting both automated and manual deployment scenarios with comprehensive error handling and monitoring capabilities.