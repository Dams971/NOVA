const fs = require('fs');
const glob = require('glob');

// Find all TypeScript files
const files = glob.sync('src/**/*.{ts,tsx}', { ignore: ['node_modules/**', '.next/**'] });

let totalFixed = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let fixed = false;
  
  // Fix pattern: catch (_error) { ... console.error('...', error) -> _error
  const pattern = /catch\s*\((_\w+)\)\s*\{[^}]*console\.(error|log|warn)\([^,]+,\s*(\w+)\)/g;
  
  content = content.replace(pattern, (match, catchVar, logType, errorVar) => {
    if (catchVar !== errorVar && errorVar === 'error') {
      fixed = true;
      return match.replace(errorVar, catchVar);
    }
    return match;
  });
  
  // Also fix simpler pattern where error is used without console
  const simplePattern = /catch\s*\((_error)\)\s*\{[^}]*\berror\b/g;
  let matches = content.match(simplePattern);
  if (matches) {
    // Check each match to see if 'error' is being used as a variable (not as property name)
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('catch (_error)')) {
        // Look at the next few lines
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          if (lines[j].includes('error') && 
              !lines[j].includes('error:') && 
              !lines[j].includes('.error') &&
              !lines[j].includes('"error"') &&
              !lines[j].includes("'error'") &&
              lines[j].includes('console.')) {
            lines[j] = lines[j].replace(/\berror\b/g, '_error');
            fixed = true;
          }
        }
      }
    }
    if (fixed) {
      content = lines.join('\n');
    }
  }
  
  if (fixed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed: ${file}`);
    totalFixed++;
  }
});

console.log(`\nTotal files fixed: ${totalFixed}`);