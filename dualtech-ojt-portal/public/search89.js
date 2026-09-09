const fs = require('fs');
let content = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8');
const lines = content.split('\n');
for (let i = 3360; i < 3390; i++) {
    if (lines[i]) console.log(i + ': ' + lines[i]);
}
