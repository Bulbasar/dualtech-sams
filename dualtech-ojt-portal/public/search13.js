const fs = require('fs');
const content = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-portal.html', 'utf8');
const lines = content.split('\n');
const result = [];
for (let i = lines.length - 100; i < lines.length; i++) {
    if (lines[i] && lines[i].includes('return <')) {
        result.push((i + 1) + ': ' + lines[i].trim());
    }
}
console.log(result.join('\n'));
