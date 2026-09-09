const fs = require('fs');
let content = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8');
const lines = content.split('\n');
for (let i = 1575; i < 1600; i++) {
    console.log(i + ': ' + lines[i]);
}
