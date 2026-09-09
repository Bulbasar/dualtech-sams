const fs = require('fs');
const content = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("activeSubTab === 'attendance'")) {
        console.log('Found attendance at line ' + i);
        for (let j = i; j < i + 100; j++) {
            if (lines[j].includes('</ResponsiveContainer>')) {
                for (let k = j; k < j + 20; k++) {
                    console.log(k + ': ' + lines[k]);
                }
                break;
            }
        }
        break;
    }
}
