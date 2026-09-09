const fs = require('fs');
const content = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8');
const lines = content.split('\n');
let activeLine = 0;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('TABS ROUTING')) {
        activeLine = i;
        break;
    }
}
if (activeLine > 0) {
    for (let i = activeLine; i < activeLine + 10; i++) {
        console.log(i + ': ' + lines[i]);
    }
} else {
    console.log('TABS ROUTING not found.');
}
