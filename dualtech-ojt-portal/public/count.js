const fs = require('fs');
const content = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-portal.html', 'utf8');
const lines = content.split('\n');
console.log('Total lines: ' + lines.length);
