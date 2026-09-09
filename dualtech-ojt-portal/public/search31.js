const fs = require('fs');
const content = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8');
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('<div className="flex items-center gap-2 md:gap-4 pl-4">')) {
        for (let j = i; j < i + 10; j++) {
            console.log(j + ': ' + lines[j]);
        }
        break;
    }
}
