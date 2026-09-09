const fs = require('fs');
const file = 'c:/Users/rober/dualtech-ojt-portal/public/ic-management.html';
const content = fs.readFileSync(file, 'utf8');
const idx = content.indexOf('weekly: getWeekString(),');
console.log(JSON.stringify(content.substring(idx - 60, idx + 25)));
