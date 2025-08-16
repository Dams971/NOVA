const fs = require('fs');
const path = require('path');

// Files with dynamic routes that need fixing
const filesToFix = [
  'src/app/api/manager/patients/[patientId]/route.ts',
  'src/app/api/manager/dashboard/[cabinetId]/route.ts',
  'src/app/api/manager/patients/[patientId]/medical-history/route.ts',
  'src/app/api/templates/[templateId]/route.ts',
  'src/app/api/cabinets/[cabinetId]/health/route.ts',
  'src/app/api/deployments/[deploymentId]/route.ts',
  'src/app/api/cabinets/alerts/[alertId]/route.ts',
  'src/app/api/appointments/[id]/route.ts'
];

function fixDynamicRoute(filePath) {
  console.log(`Fixing ${filePath}...`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix params type to be Promise
    content = content.replace(
      /\{ params \}: \{ params: \{ (\w+): string \} \}/g,
      '{ params }: { params: Promise<{ $1: string }> }'
    );
    
    // Fix params destructuring to await
    content = content.replace(
      /const \{ (\w+) \} = params;/g,
      'const { $1 } = await params;'
    );
    
    // Also handle direct property access
    content = content.replace(
      /const (\w+) = params\.(\w+);/g,
      'const $1 = (await params).$2;'
    );
    
    // Handle cases where params is used directly
    content = content.replace(
      /if \(!params\.(\w+)\)/g,
      'if (!(await params).$1)'
    );
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Fixed ${filePath}`);
  } catch (error) {
    console.error(`✗ Error fixing ${filePath}:`, error.message);
  }
}

// Fix all files
filesToFix.forEach(fixDynamicRoute);

console.log('\nAll dynamic routes fixed!');