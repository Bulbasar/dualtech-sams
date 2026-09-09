const fs = require('fs');
let content = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8');
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('if (loadingData) return (')) {
        for (let j = Math.max(0, i - 5); j < i + 30; j++) {
            if (lines[j]) console.log(j + ': ' + lines[j]);
        }
        break;
    }
}
