const fs = require('fs');
const content = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('{/* REGISTERED ATTENDANCE LIST */}')) {
        for (let j = i; j < i + 60; j++) {
            if (lines[j].includes('</div>')) {
                // print until the end of the subtab
            }
            if (j > i + 45) {
                console.log(j + ': ' + lines[j]);
            }
        }
        break;
    }
}
