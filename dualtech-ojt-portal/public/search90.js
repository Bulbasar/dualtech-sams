const fs = require('fs');
let content = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8');
const lines = content.split('\n');
let start = -1;
let end = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const fetchTrainees = async () => {')) start = i;
    if (start !== -1 && i > start && lines[i].includes('};')) {
        end = i;
        break;
    }
}
for (let i = start; i <= end; i++) {
    console.log(i + ': ' + lines[i]);
}
