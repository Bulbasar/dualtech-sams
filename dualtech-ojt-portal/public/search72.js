const fs = require('fs');
let content = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8');
const lines = content.split('\n');
for (let i = 1000; i < 1500; i++) {
    if (lines[i] && lines[i].includes('const DashboardTab =')) {
        console.log('Line ' + i + ': ' + lines[i]);
    }
}
