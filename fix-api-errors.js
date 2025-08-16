const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all TypeScript files in API routes
const apiFiles = glob.sync('src/app/api/**/*.ts');

let totalFixed = 0;

apiFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let fixed = false;
  
  // Fix __error references - these should just be _error
  if (content.includes('catch (__error)')) {
    content = content.replace(/catch \(__error\)/g, 'catch (_error)');
    
    // Now fix any references to 'error' that should be '_error'
    // Look for patterns like console.error('...', error) after catch (_error)
    const lines = content.split('\n');
    let inCatchBlock = false;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('catch (_error)')) {
        inCatchBlock = true;
      } else if (inCatchBlock && lines[i].includes('}')) {
        // Check if this closes the catch block
        const openBraces = (lines[i].match(/{/g) || []).length;
        const closeBraces = (lines[i].match(/}/g) || []).length;
        if (closeBraces > openBraces) {
          inCatchBlock = false;
        }
      }
      
      if (inCatchBlock && lines[i].includes('console.error')) {
        // Replace , error) with , _error) but not in strings
        lines[i] = lines[i].replace(/, error\)/g, ', _error)');
      }
    }
    
    content = lines.join('\n');
    fixed = true;
  }
  
  if (fixed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed: ${file}`);
    totalFixed++;
  }
});

console.log(`\nTotal API files fixed: ${totalFixed}`);