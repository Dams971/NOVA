const fs = require('fs');
const glob = require('glob');

// Find all TypeScript files
const files = glob.sync('src/**/*.{ts,tsx}', { ignore: ['node_modules/**', '.next/**'] });

let totalFixed = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let fixed = false;
  
  // Fix the double underscore error references
  // Pattern: catch (__error) { ... console.error('...', error)
  content = content.replace(/catch \(__error\) \{([^}]*)\berror\b/g, (match, block) => {
    // Check if 'error' is being used as a variable (not in strings or as property)
    if (block.includes('console.') && !block.includes('"error"') && !block.includes("'error'") && !block.includes('error:')) {
      fixed = true;
      return match.replace(/\berror\b/g, '__error');
    }
    return match;
  });
  
  // Also fix _error references
  content = content.replace(/catch \(_error\) \{([^}]*)\berror\b/g, (match, block) => {
    // Check if 'error' is being used as a variable (not in strings or as property)
    if (block.includes('console.') && !block.includes('"error"') && !block.includes("'error'") && !block.includes('error:')) {
      fixed = true;
      return match.replace(/\berror\b/g, '_error');
    }
    return match;
  });
  
  if (fixed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed: ${file}`);
    totalFixed++;
  }
});

console.log(`\nTotal files fixed: ${totalFixed}`);