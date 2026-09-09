const fs = require('fs');
const content = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8');
const lines = content.split('\n');

let fetchLogsStarted = false;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const fetchLogs = async () => {')) {
        fetchLogsStarted = true;
    }
    if (fetchLogsStarted) {
        console.log(i + ': ' + lines[i].trim());
        if (lines[i].includes('setAttendanceLogsFetched(true);') && i > 1240) {
            break;
        }
    }
}
