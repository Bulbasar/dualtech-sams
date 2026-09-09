const fs = require('fs');
let content = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8');
const lines = content.split('\n');

let startIndex = -1;
let endIndex = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const CustomPieLabel =')) startIndex = i;
    if (startIndex !== -1 && lines[i].includes('{/* 4-GRID GRAPH SECTION */}')) {
        endIndex = i; // Up to but not including the grid section itself (we'll replace both)
        break;
    }
}
console.log('CustomPieLabel bounds: ' + startIndex + ' to ' + endIndex);

// Also find the grid bounds
let gridStart = -1;
let gridEnd = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('{/* 4-GRID GRAPH SECTION */}')) gridStart = i;
    if (gridStart !== -1 && lines[i].includes('ASTP by IPT Months')) {
        gridEnd = i + 3; // roughly where the grid closes
        break;
    }
}
console.log('Grid bounds: ' + gridStart + ' to ' + gridEnd);

