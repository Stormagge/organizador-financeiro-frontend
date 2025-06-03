// Using Node.js instead of bash for better Windows/Vercel compatibility
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Current directory:', process.cwd());
console.log('Listing directories:');
try {
  const files = fs.readdirSync('.');
  console.log(files.join('\n'));
} catch (error) {
  console.error('Error listing files:', error);
}

// Check if FRONTEND directory exists
if (fs.existsSync('FRONTEND')) {
  console.log('Found FRONTEND directory, building from there');
  process.chdir('FRONTEND');
  execSync('npm ci', { stdio: 'inherit' });
  execSync('npm run build', { stdio: 'inherit' });
  process.exit(0);
} else if (fs.existsSync('frontend')) {
  console.log('Found lowercase frontend directory, building from there');
  process.chdir('frontend');
  execSync('npm ci', { stdio: 'inherit' });
  execSync('npm run build', { stdio: 'inherit' });
  process.exit(0);
} else {
  console.error('ERROR: Could not find FRONTEND or frontend directory');
  console.error('Contents of current directory:');
  console.error(fs.readdirSync('.').join('\n'));
  process.exit(1);
}
