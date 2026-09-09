const fs = require('fs');
const content = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8');
const lines = content.split('\n');
for (let i = 1725; i < 1810; i++) {
    console.log(i + ': ' + lines[i]);
}
