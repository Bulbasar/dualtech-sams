const fs = require('fs');
const content = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8');
const lines = content.split('\n');

let insideOverview = false;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("activeSubTab === 'overview'") || lines[i].includes("activeSubTab === 'attendance'")) {
        console.log(i + ': ' + lines[i].trim());
    }
}
