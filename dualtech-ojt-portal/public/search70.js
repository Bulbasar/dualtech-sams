const fs = require('fs');
let content = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8');
const lines = content.split('\n');
for (let i = 240; i < 260; i++) {
    console.log('Line ' + i + ': ' + lines[i]);
}
