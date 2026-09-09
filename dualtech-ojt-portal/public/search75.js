const fs = require('fs');
let content = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8');
const lines = content.split('\n');
for (let i = 1560; i < 1570; i++) {
    console.log('Line ' + i + ': ' + lines[i]);
}
