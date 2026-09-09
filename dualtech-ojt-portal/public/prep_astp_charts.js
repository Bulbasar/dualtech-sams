const fs = require('fs');
const content = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8');

// Get fetchLogs
const lines = content.split('\n');
let fetchLogsBlock = [];
let capture = false;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const fetchLogs = async () => {')) capture = true;
    if (capture) {
        fetchLogsBlock.push(lines[i]);
        if (lines[i].includes('setAttendanceLogsFetched(true);') && fetchLogsBlock.length > 20) {
            capture = false;
            break;
        }
    }
}
fs.writeFileSync('c:/Users/rober/.gemini/antigravity-ide/brain/8a49551a-099f-44e2-a6fe-7dd4fc7b8cd1/scratch/fetchLogs.txt', fetchLogsBlock.join('\n'));

// Get the useEffect that calls fetchLogs
let effectBlock = [];
capture = false;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('if (attendanceLogsFetched) return;')) {
        for (let j = Math.max(0, i - 2); j < i + 80; j++) {
            if (lines[j].includes('}, [activeTab, attendanceLogsFetched]);')) {
                effectBlock.push(lines[j]);
                break;
            }
            effectBlock.push(lines[j]);
        }
        break;
    }
}
fs.writeFileSync('c:/Users/rober/.gemini/antigravity-ide/brain/8a49551a-099f-44e2-a6fe-7dd4fc7b8cd1/scratch/effectBlock.txt', effectBlock.join('\n'));

console.log('Extraction complete');
