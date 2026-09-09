const fs = require('fs');

const lfPath = 'c:/Users/rober/dualtech-ojt-portal/public/lfportal.html';
let content = fs.readFileSync(lfPath, 'utf8');

const dash1 = content.indexOf('function Dashboard(props)');
const chat1 = content.indexOf('function ChatWidget({');
const dash2 = content.indexOf('function Dashboard(props)', dash1 + 1);
const chat2 = content.indexOf('function ChatWidget({', chat1 + 1);
const app = content.indexOf('function App() {');

console.log({dash1, chat1, dash2, chat2, app});

if (dash1 > -1 && chat1 > -1 && dash2 > -1 && app > -1) {
    const part1 = content.substring(0, dash1);
    const part2 = content.substring(dash1, chat1); // Dashboard
    const part3 = content.substring(chat1, dash2); // New ChatWidget
    const part4 = content.substring(app); // App and EOF

    const newContent = part1 + part2 + '\n\n' + part3 + '\n\n' + part4;

    fs.writeFileSync(lfPath, newContent);
    console.log('Fixed lfportal.html! New size: ' + newContent.length);
} else {
    console.log('Could not find all markers');
}
