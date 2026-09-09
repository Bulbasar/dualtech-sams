const fs = require('fs');

let content = fs.readFileSync('tsd-portal/src/App.jsx', 'utf8');

// Add import { createIcons } from 'lucide';
content = `import { createIcons } from 'lucide';\n` + content;

// Replace window.lucide usage
content = content.replace(/window\.lucide/g, 'true'); // bypass the undefined check
content = content.replace(/true\.createIcons/g, 'createIcons');

fs.writeFileSync('tsd-portal/src/App.jsx', content);
console.log('App.jsx patched for Icon component');
