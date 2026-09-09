const fs = require('fs');
const content = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
    if (line.includes('getDocs')) {
        console.log('Line ' + (i+1) + ': ' + line.trim());
    }
});
