// Simple check to see if React app mounts
const fs = require('fs');
const path = require('path');

// Check if all required files exist
const requiredFiles = [
  'dist/index.html',
  'dist/assets/index-D92Pjr1e.js',
  'dist/assets/index-_ALsfh2W.css'
];

console.log('Checking built files...');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const stats = fs.statSync(file);
    console.log(`✓ ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
  } else {
    console.log(`✗ ${file} - MISSING`);
  }
});

// Check HTML structure
const html = fs.readFileSync('dist/index.html', 'utf8');
console.log('\nHTML structure:');
console.log('- Has root div:', html.includes('<div id="root">'));
console.log('- Has JS script:', html.includes('.js'));
console.log('- Has CSS link:', html.includes('.css'));
