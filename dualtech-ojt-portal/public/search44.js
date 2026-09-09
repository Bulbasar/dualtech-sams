const fs = require('fs');
const content = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8');
const lines = content.split('\n');

for (let i = 1598; i < 1674; i++) {
    console.log(i + ': ' + lines[i]);
}
