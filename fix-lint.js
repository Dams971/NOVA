const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Function to fix unescaped entities
function fixUnescapedEntities(content) {
  return content
    .replace(/([^\\])'(?![^<]*>)/g, '$1&apos;')  // Replace ' with &apos; except in JSX tags
    .replace(/([^\\])"(?![^<]*>)/g, '$1&quot;');  // Replace " with &quot; except in JSX tags
}

// Function to remove unused parameters from route handlers
function fixRouteHandlers(content, filePath) {
  if (filePath.includes('/api/') && filePath.endsWith('.ts')) {
    // Fix GET/POST/PUT/DELETE handlers with unused request parameter
    content = content.replace(/export async function (GET|POST|PUT|DELETE|PATCH)\(request: NextRequest\)/g, 'export async function $1()');
    content = content.replace(/export async function (GET|POST|PUT|DELETE|PATCH)\(_req: NextRequest\)/g, 'export async function $1()');
    content = content.replace(/export async function (GET|POST|PUT|DELETE|PATCH)\(req: NextRequest\)/g, 'export async function $1()');
  }
  return content;
}

// Function to fix unused variables by prefixing with underscore
function fixUnusedVariables(content) {
  // Common patterns for unused error variables in catch blocks
  content = content.replace(/catch \(error\) \{(\s*console)/g, 'catch (_error) {$1');
  content = content.replace(/catch \(err\) \{(\s*console)/g, 'catch (_err) {$1');
  
  return content;
}

// Function to replace 'any' types with 'unknown' where safe
function fixAnyTypes(content) {
  // Replace : any with : unknown in function parameters and return types
  content = content.replace(/: any(\s*[,\)])/g, ': unknown$1');
  content = content.replace(/: any\[\]/g, ': unknown[]');
  
  return content;
}

// Main function to process files
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Apply fixes based on file type
    if (filePath.endsWith('.tsx')) {
      content = fixUnescapedEntities(content);
    }
    
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      content = fixRouteHandlers(content, filePath);
      content = fixUnusedVariables(content);
      // Commenting out any type fixes for now as they might break type checking
      // content = fixAnyTypes(content);
    }
    
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
  ...glob.sync('src/**/*.ts', { ignore: ['**/node_modules/**', '**/*.test.ts', '**/*.spec.ts'] }),
  ...glob.sync('src/**/*.tsx', { ignore: ['**/node_modules/**', '**/*.test.tsx', '**/*.spec.tsx'] })
];

console.log(`Found ${files.length} files to process...`);

let fixedCount = 0;
files.forEach(file => {
  if (processFile(file)) {
    fixedCount++;
  }
});

console.log(`\nFixed ${fixedCount} files.`);
console.log('Run "npm run lint" to see remaining issues.');