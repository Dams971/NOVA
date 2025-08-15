const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Function to fix over-escaped quotes
function fixEscaping(content) {
  // Replace &apos; with '
  content = content.replace(/&apos;/g, "'");
  // Replace &quot; with "
  content = content.replace(/&quot;/g, '"');
  
  return content;
}

// Main function to process files
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Apply fixes
    content = fixEscaping(content);
    
    // Only write if content changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Find all TypeScript and TSX files
const files = [
  ...glob.sync('src/**/*.ts', { ignore: ['**/node_modules/**'] }),
  ...glob.sync('src/**/*.tsx', { ignore: ['**/node_modules/**'] })
];

console.log(`Found ${files.length} files to process...`);

let fixedCount = 0;
files.forEach(file => {
  if (processFile(file)) {
    fixedCount++;
  }
});

console.log(`\nFixed ${fixedCount} files.`);
console.log('Run "npm run build" to verify.');