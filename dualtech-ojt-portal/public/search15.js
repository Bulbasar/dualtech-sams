const fs = require('fs');
const content = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8');
const lines = content.split('\n');
let capture = false;
let depth = 0;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const ICManagementPortal =')) {
        capture = true;
    }
    if (capture && lines[i].includes('return (')) {
        console.log((i + 1) + ': ' + lines[i].trim());
        for (let j = i + 1; j < i + 30; j++) {
            console.log((j + 1) + ': ' + lines[j].trim());
        }
        break;
    }
}
