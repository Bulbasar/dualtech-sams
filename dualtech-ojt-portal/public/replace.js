const fs = require('fs');
const file = 'c:/Users/rober/dualtech-ojt-portal/public/ic-management.html';
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');
const scratch = fs.readFileSync('C:/Users/rober/.gemini/antigravity-ide/brain/8a49551a-099f-44e2-a6fe-7dd4fc7b8cd1/scratch/dashboard_tab.jsx', 'utf8');
const before = lines.slice(0, 1317).join('\n');
const after = lines.slice(1683).join('\n');
const newContent = before + '\n' + scratch + '\n' + after;
fs.writeFileSync(file, newContent, 'utf8');
