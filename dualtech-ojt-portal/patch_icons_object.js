const fs = require('fs');

let content = fs.readFileSync('tsd-portal/src/App.jsx', 'utf8');

// Update import
content = content.replace("import { createIcons } from 'lucide';", "import { createIcons, icons } from 'lucide';");

// Update createIcons call
content = content.replace("createIcons({ root: spanRef.current });", "createIcons({ root: spanRef.current, icons });");

fs.writeFileSync('tsd-portal/src/App.jsx', content);
console.log('App.jsx patched to provide icons object to createIcons');
