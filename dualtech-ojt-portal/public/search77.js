const fs = require('fs');
let content = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8');
const lines = content.split('\n');
let start = -1;
let end = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const DashboardTab = ({ allTrainees = []')) start = i;
}
if (start !== -1) {
    let braceCount = 0;
    for (let i = start; i < lines.length; i++) {
        const line = lines[i];
        for (let j = 0; j < line.length; j++) {
            if (line[j] === '{') braceCount++;
            else if (line[j] === '}') braceCount--;
        }
        if (braceCount === 0) {
            end = i;
            break;
        }
    }
}
console.log('Start: ' + start);
console.log('End: ' + end);
for (let i = end - 5; i <= end + 5; i++) {
    if (lines[i]) console.log(i + ': ' + lines[i]);
}
