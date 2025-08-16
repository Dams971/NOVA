const fs = require('fs');

// List of files to fix
const files = [
  'src/app/api/auth/logout/route.ts',
  'src/app/api/auth/me/route.ts',
  'src/app/api/auth/mfa/backup-codes/route.ts',
  'src/app/api/auth/mfa/disable/route.ts',
  'src/app/api/auth/mfa/enable/route.ts',
  'src/app/api/auth/mfa/setup/route.ts',
  'src/app/api/auth/mfa/status/route.ts',
  'src/app/api/auth/mfa/verify/route.ts',
  'src/app/api/auth/refresh/route.ts',
  'src/app/api/auth/register/route.ts',
  'src/app/api/auth/sign-in-otp/route.ts',
  'src/app/api/auth/validate/route.ts',
  'src/app/api/cabinets/[cabinetId]/patients/route.ts',
  'src/app/api/cabinets/provision/route.ts',
  'src/app/api/cabinets/route.ts',
  'src/app/api/chat/route.ts',
  'src/app/api/deployments/[deploymentId]/route.ts',
  'src/app/api/email/appointment-confirmation/route.ts',
  'src/app/api/email/otp/route.ts',
  'src/app/api/manager/dashboard/[cabinetId]/route.ts',
  'src/app/api/manager/patients/[patientId]/medical-history/route.ts',
  'src/app/api/manager/patients/[patientId]/route.ts',
  'src/app/api/manager/patients/route.ts',
  'src/app/api/manager/patients/statistics/route.ts',
  'src/app/api/patients/[id]/route.ts',
  'src/app/api/patients/route.ts',
  'src/app/api/templates/[templateId]/route.ts',
  'src/app/api/templates/route.ts',
  'src/app/api/users/route.ts'
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Replace __error with _error in catch blocks
    content = content.replace(/catch \(__error\)/g, 'catch (_error)');
    
    // Replace error with _error after catch (_error)
    // This is more complex - we need to find error references within catch blocks
    const lines = content.split('\n');
    let inCatchBlock = false;
    let braceCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('catch (_error)')) {
        inCatchBlock = true;
        braceCount = 0;
      }
      
      if (inCatchBlock) {
        // Count braces to track when we exit the catch block
        braceCount += (lines[i].match(/{/g) || []).length;
        braceCount -= (lines[i].match(/}/g) || []).length;
        
        if (braceCount < 0) {
          inCatchBlock = false;
          braceCount = 0;
        }
        
        // Replace error with _error in console statements and conditions
        if (lines[i].includes('console.error') || lines[i].includes('console.log') || lines[i].includes('console.warn')) {
          lines[i] = lines[i].replace(/, error\)/g, ', _error)');
        }
        
        // Replace error in instanceof checks
        if (lines[i].includes('error instanceof')) {
          lines[i] = lines[i].replace(/\berror instanceof/g, '_error instanceof');
        }
        
        // Replace error.message, error.code etc
        if (lines[i].includes('error.')) {
          lines[i] = lines[i].replace(/\berror\./g, '_error.');
        }
        
        // Replace standalone error in conditionals and returns
        lines[i] = lines[i].replace(/: error /g, ': _error ');
        lines[i] = lines[i].replace(/\(error\)/g, '(_error)');
      }
    }
    
    content = lines.join('\n');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Fixed: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`✗ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

let totalFixed = 0;
files.forEach(file => {
  if (fixFile(file)) {
    totalFixed++;
  }
});

console.log(`\nTotal files fixed: ${totalFixed}/${files.length}`);