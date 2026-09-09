const fs = require('fs');

const adminPath = 'c:/Users/rober/dualtech-ojt-portal/public/bstpadmin.html';
let content = fs.readFileSync(adminPath, 'utf8');

const targetStr = "{window.Recharts && (";
const replacementStr = "{Recharts && (";

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    fs.writeFileSync(adminPath, content);
    console.log('Fixed Recharts condition in bstpadmin.html');
} else {
    console.log('Could not find window.Recharts condition');
}
