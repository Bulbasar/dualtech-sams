const fs = require('fs');
const content = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8');
const lines = content.split('\n');
let foundOverview = false;
let foundAttendance = false;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('activeSubTab === \\'overview\\'')) foundOverview = true;
    if (lines[i].includes('activeSubTab === \\'attendance\\'')) foundAttendance = true;
    if (lines[i].includes('Registered ASTP Trainees')) {
        console.log('Found table at line ' + i);
        console.log('Context (overview vs attendance):');
        for (let j = Math.max(0, i - 15); j <= i; j++) {
            console.log(j + ': ' + lines[j]);
        }
        break;
    }
}
