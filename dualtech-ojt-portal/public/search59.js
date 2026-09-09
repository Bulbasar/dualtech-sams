const fs = require('fs');
let content = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < 500; i++) {
    if (lines[i].includes('function') || lines[i].includes('const ') || lines[i].includes('let ')) {
        // console.log(i + ': ' + lines[i]);
    }
}
let rootDef = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const App = () => {') || lines[i].includes('const ICPortal = () => {') || lines[i].includes('const AdminSystem = () => {') || lines[i].includes('const Portal = () => {') || lines[i].includes('const Main = () => {')) {
        console.log('Found main component at ' + i + ': ' + lines[i]);
        break;
    }
}
