const fs = require('fs');
const content = fs.readFileSync('bstpadmin.html', 'utf8');

// Extract all scripts with text/babel
const scriptRegex = /<script type="text\/babel"[^>]*>([\s\S]*?)<\/script>/g;
let match;
let scripts = [];
while ((match = scriptRegex.exec(content)) !== null) {
    scripts.push(match[1]);
}

console.log("Found " + scripts.length + " babel scripts.");

if (scripts.length > 0) {
    fs.writeFileSync('test_babel.jsx', scripts[0]);
    console.log("Wrote test_babel.jsx");
}
