const fs = require('fs');
let content = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8');
const lines = content.split('\n');
for (let i = 200; i < 300; i++) {
    if (lines[i].includes('AdminPortal')) {
        console.log('Line ' + i + ': ' + lines[i]);
    }
}
