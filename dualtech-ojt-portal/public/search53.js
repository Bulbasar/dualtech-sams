const fs = require('fs');
const content = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8');
const lines = content.split('\n');

for (let i = 1200; i < 1280; i++) {
    if (lines[i].includes('const fetchLogs = async () => {')) {
        console.log("Found fetchLogs at " + i);
        break;
    }
}
