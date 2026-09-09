const fs = require('fs');
const file = 'c:/Users/rober/dualtech-ojt-portal/public/ic-management.html';
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
    if (line.includes('ICPortalLogin')) console.log('Line ' + (i+1) + ': ' + line);
});
