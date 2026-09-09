const fs = require('fs');
let content = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8');
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('if (loadingData)')) {
        for (let j = i; j < i + 15; j++) {
            if (lines[j]) console.log(j + ': ' + lines[j]);
        }
        break;
    }
}
