const fs = require('fs');
const content = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8');
const lines = content.split('\n');

for (let i = 1760; i < 1790; i++) {
    console.log(i + ': ' + lines[i]);
}
