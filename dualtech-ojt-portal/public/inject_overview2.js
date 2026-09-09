const fs = require('fs');

const adminPath = 'c:/Users/rober/dualtech-ojt-portal/public/bstpadmin.html';
let content = fs.readFileSync(adminPath, 'utf8');

const start = content.indexOf('function OverviewTab({');
const end = content.indexOf('function App() {');

if (start !== -1 && end !== -1) {
    let newTabCode = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/OverviewTab2.jsx', 'utf8');
    
    // Replace \` and \$ with regular unescaped strings
    newTabCode = newTabCode.replace(/\\`/g, '`');
    newTabCode = newTabCode.replace(/\\\$/g, '$');
    
    content = content.substring(0, start) + newTabCode + '\n\n' + content.substring(end);
    fs.writeFileSync(adminPath, content);
    console.log('Replaced OverviewTab in bstpadmin.html');
} else {
    console.log('Could not find OverviewTab boundaries');
}
