const fs = require('fs');
const lines = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8').split('\n');
console.log(lines.slice(1040, 1100).join('\n'));
