const fs = require('fs');
const content = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8');
const lines = content.split('\n');
const result = [];
lines.forEach((line, i) => {
    if (line.includes('SyncStatusBar') || line.includes('function ICManagementPortal') || line.includes('showSyncStatus')) {
        result.push((i + 1) + ': ' + line.trim());
    }
});
console.log(result.join('\n'));
