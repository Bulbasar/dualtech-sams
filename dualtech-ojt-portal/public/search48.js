const fs = require('fs');
let content = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8');
const lines = content.split('\n');

// Find start and end of GRAPH SECTION
let startIndex = -1;
let endIndex = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('{/* GRAPH SECTION */}')) startIndex = i;
    if (startIndex !== -1 && lines[i].includes(')} // End of chart')) {
        endIndex = i + 2; // to cover the closing divs
        break;
    }
}
if (startIndex !== -1 && endIndex !== -1) {
    console.log('Graph section from ' + startIndex + ' to ' + endIndex);
} else {
    console.log('Could not find graph section bounds.');
}
