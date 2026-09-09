const fs = require('fs');

const adminPath = 'c:/Users/rober/dualtech-ojt-portal/public/bstpadmin.html';
let content = fs.readFileSync(adminPath, 'utf8');

const target = "key={\\`cell-\\${index}\\`}";
const replacement = 'key={`cell-${index}`}';

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(adminPath, content);
    console.log('Fixed syntax error in bstpadmin.html');
} else {
    // try regex
    const regex = /key=\{\\`cell-\\\$\{index\}\\`\}/g;
    if (regex.test(content)) {
        content = content.replace(regex, 'key={`cell-${index}`}');
        fs.writeFileSync(adminPath, content);
        console.log('Fixed syntax error in bstpadmin.html using regex');
    } else {
        console.log('Could not find syntax error');
    }
}
