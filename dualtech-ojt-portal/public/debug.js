const fs = require('fs');
const lines = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8').split('\n');
console.log('--- Around 652 ---');
console.log(lines.slice(645, 660).join('\n'));
console.log('--- Around 1060 ---');
console.log(lines.slice(1055, 1065).join('\n'));
