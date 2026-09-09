const fs = require('fs');
const content = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8');
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const fetchData = async () => {')) {
        for (let j = Math.max(0, i - 5); j < Math.min(lines.length, i + 35); j++) {
            console.log(j + ': ' + lines[j]);
        }
        break;
    }
}
