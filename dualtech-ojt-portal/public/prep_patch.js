const fs = require('fs');
let content = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8');

// Find the start of the table block
const startMarker = '{/* REGISTERED ATTENDANCE LIST */}';
const startIndex = content.indexOf(startMarker);

if (startIndex === -1) {
    console.log('Could not find start of table');
    process.exit(1);
}

// The table block ends right before '{/* ACTIVE TRAINEES BY LEVEL CHART */}' but wait, 
// let's look at what comes after the table block in my previous search38.js output.
// Actually, wait, the table was injected at the VERY END of the overview subtab block!
// Wait! Let's check what comes after the table in overview.
