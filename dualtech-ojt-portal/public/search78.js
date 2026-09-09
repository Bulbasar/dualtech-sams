const fs = require('fs');
let content = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8');
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const CompanyMeetingsTab =')) console.log('Line ' + i + ': ' + lines[i]);
    if (lines[i].includes('const VisitsTab =')) console.log('Line ' + i + ': ' + lines[i]);
}
