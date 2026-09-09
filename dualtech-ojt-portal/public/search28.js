const fs = require('fs');
const content = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8');
const lines = content.split('\n');
let capture = false;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const fetchLogs = async () => {')) {
        capture = true;
    }
    if (capture) {
        console.log((i + 1) + ': ' + lines[i].trim());
        if (lines[i].includes('setAttendanceLogsFetched(true);') && i > 1240) {
            break;
        }
    }
}
