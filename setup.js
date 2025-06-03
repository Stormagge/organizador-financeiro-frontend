const https = require('https');
const fs = require('fs');
const path = require('path');

// Helper function to create directories recursively
function mkdirRecursive(dir) {
  if (fs.existsSync(dir)) return;
  
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    console.error(`Error creating directory ${dir}:`, err);
    throw err;
  }
}

// Copy all files from source to destination
function copyDir(src, dest) {
  // Create destination directory if it doesn't exist
  mkdirRecursive(dest);
  
  // Read the source directory
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    // Skip git directories and build artifacts
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'dist') {
      console.log(`Skipping ${srcPath}`);
      continue;
    }
    
    if (entry.isDirectory()) {
      // Recursively copy directories
      copyDir(srcPath, destPath);
    } else {
      // Copy files
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied ${srcPath} to ${destPath}`);
    }
  }
}

// Main script
console.log('Setting up fallback deployment structure...');

// Create frontend directory at root level if it doesn't exist
if (!fs.existsSync('frontend')) {
  console.log('Creating frontend directory...');
  fs.mkdirSync('frontend');
  
  // Check if FRONTEND directory exists
  if (fs.existsSync('FRONTEND')) {
    console.log('Copying from FRONTEND to frontend...');
    copyDir('FRONTEND', 'frontend');
  } else {
    console.log('ERROR: FRONTEND directory not found!');
    process.exit(1);
  }
}

console.log('Fallback deployment structure set up successfully!');
