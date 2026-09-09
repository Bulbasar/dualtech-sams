const fs = require('fs');
const content = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8');
const lines = content.split('\n');
for (let i = 1400; i < 1500; i++) {
    if (lines[i].includes('button') && lines[i].includes('onClick={() => setActiveSubTab')) {
        console.log(lines[i].trim());
    }
}
