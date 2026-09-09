const fs = require('fs');
const content = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const overviewChartData = useMemo(() => {')) {
        for (let j = Math.max(0, i - 10); j < i + 20; j++) {
            console.log(j + ': ' + lines[j]);
        }
        break;
    }
}
