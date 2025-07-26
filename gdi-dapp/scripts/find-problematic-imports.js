const fs = require('fs');
const path = require('path');

// Directories to search
const searchDirs = [
  path.join(__dirname, '../src'),
  path.join(__dirname, '../node_modules')
];

// File extensions to check
const fileExtensions = ['.js', '.jsx', '.ts', '.tsx'];

// Patterns to search for
const patterns = [
  /import\s*\{\s*use\s*\}\s*from\s*['"]react['"]/g, // import { use } from 'react'
  /import\s*\*\s*as\s+React5\s+from\s*['"]react['"]/g, // import * as React5 from 'react'
  /React5\.use/g // React5.use
];

// Results array
const matches = [];

// Function to check if a file has one of the patterns
function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    patterns.forEach((pattern, index) => {
      const patternMatches = [...content.matchAll(pattern)];
      if (patternMatches.length > 0) {
        matches.push({
          file: filePath,
          pattern: pattern.toString(),
          matches: patternMatches.map(m => ({
            line: content.substring(0, m.index).split('\n').length,
            match: m[0].trim()
          }))
        });
      }
    });
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err.message);
  }
}

// Recursively search through directories
function searchDirectory(directory) {
  try {
    const files = fs.readdirSync(directory);
    files.forEach(file => {
      const fullPath = path.join(directory, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules in node_modules to speed up the search
        if (file === 'node_modules' && directory.includes('node_modules')) {
          return;
        }
        searchDirectory(fullPath);
      } else if (fileExtensions.some(ext => file.endsWith(ext))) {
        checkFile(fullPath);
      }
    });
  } catch (err) {
    console.error(`Error reading directory ${directory}:`, err.message);
  }
}

// Start the search
console.log('Searching for problematic imports...');
searchDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    searchDirectory(dir);
  } else {
    console.warn(`Directory not found: ${dir}`);
  }
});

// Output results
if (matches.length > 0) {
  console.log('\nFound potential issues:');
  matches.forEach((match, index) => {
    console.log(`\n${index + 1}. File: ${match.file}`);
    console.log(`   Pattern: ${match.pattern}`);
    console.log('   Matches:');
    match.matches.forEach((m, i) => {
      console.log(`     ${i + 1}. Line ${m.line}: ${m.match}`);
    });
  });
} else {
  console.log('\nNo problematic imports found in the searched directories.');
  console.log('This might be a deeper dependency issue. Try checking your lock file for inconsistencies.');
}

console.log('\nSearch complete.');
