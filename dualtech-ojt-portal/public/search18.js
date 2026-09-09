const fs = require('fs');
const content = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8');
const lines = content.split('\n');
for (let i = 0; i < 150; i++) {
    if (lines[i].includes('} from "lucide-react";')) {
        for (let j = Math.max(0, i - 10); j <= i; j++) {
            console.log(lines[j]);
        }
        break;
    }
}
