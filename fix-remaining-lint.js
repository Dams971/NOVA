const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Function to fix unused imports
function fixUnusedImports(content, filePath) {
  if (filePath.includes('/api/')) {
    // Remove unused NextRequest imports if function doesn't use it
    const hasRequestParam = /export async function (GET|POST|PUT|DELETE|PATCH)\([^)]*request/g.test(content);
    if (!hasRequestParam && content.includes("import { NextRequest")) {
      content = content.replace(/import { NextRequest, NextResponse } from 'next\/server';/g, 
        "import { NextResponse } from 'next/server';");
      content = content.replace(/import { NextRequest } from 'next\/server';/g, '');
    }
  }
  return content;
}

// Function to fix unused error variables
function fixUnusedErrors(content) {
  // Replace error with _error when it's not used
  content = content.replace(/} catch \(error\) \{\s*console\.error/g, '} catch (error) {\n    console.error');
  content = content.replace(/} catch \(_error\) \{\s*console\.log/g, '} catch (_error) {\n    console.log');
  
  // Fix cases where _error is not used at all
  const catchBlocks = content.match(/} catch \((_?error|_?err|_?e)\) \{[^}]*}/g) || [];
  catchBlocks.forEach(block => {
    const varName = block.match(/catch \(([^)]+)\)/)[1];
    // Check if the variable is used in the block
    const blockContent = block.substring(block.indexOf('{') + 1, block.lastIndexOf('}'));
    if (!blockContent.includes(varName) && !varName.startsWith('_')) {
      const newBlock = block.replace(`catch (${varName})`, `catch (_${varName})`);
      content = content.replace(block, newBlock);
    }
  });
  
  return content;
}

// Function to add specific ESLint disable comments for any types
function addEslintDisables(content) {
  // For lines with : any, add disable comment
  const lines = content.split('\n');
  const newLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Check if line contains ': any' and doesn't already have eslint-disable
    if (line.includes(': any') && !line.includes('eslint-disable')) {
      // Add eslint-disable comment on the previous line
      newLines.push('  // eslint-disable-next-line @typescript-eslint/no-explicit-any');
      newLines.push(line);
    } else {
      newLines.push(line);
    }
  }
  
  return newLines.join('\n');
}

// Main function to process files
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Apply fixes
    content = fixUnusedImports(content, filePath);
    content = fixUnusedErrors(content);
    // Don't add eslint disables for now - better to fix the types
    // content = addEslintDisables(content);
    
    // Only write if content changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed: ${path.basename(filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Find all TypeScript files in API routes
const apiFiles = glob.sync('src/app/api/**/*.ts', { ignore: ['**/node_modules/**'] });

console.log(`Found ${apiFiles.length} API files to process...`);

let fixedCount = 0;
apiFiles.forEach(file => {
  if (processFile(file)) {
    fixedCount++;
  }
});

console.log(`\nFixed ${fixedCount} files.`);
console.log('Run "npm run build" to verify.');