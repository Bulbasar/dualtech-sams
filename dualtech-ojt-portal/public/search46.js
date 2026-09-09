const fs = require('fs');
const content = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8');
const lines = content.split('\n');

let insideMemo = false;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const overviewChartData = useMemo(() => {')) {
        insideMemo = true;
    }
    if (insideMemo) {
        console.log(i + ': ' + lines[i].trim());
        if (lines[i].includes('}, [activeAstpTrainees, activeChart]);')) {
            break;
        }
    }
}
