const fs = require('fs');
const path = 'c:/Users/rober/dualtech-ojt-portal/trainee-portal/src/components/layout/BSTPLayout.jsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
    /\{\s*id:\s*'profile',\s*icon:\s*Settings,\s*label:\s*'Profile'\s*\}/g,
    ''
);

// We might be left with a trailing comma like `, ]`, which is valid in JS arrays, but let's clean it up just in case.
content = content.replace(/,\s*]/g, '\n                ]');

fs.writeFileSync(path, content);
console.log('BSTPLayout.jsx modified successfully!');
