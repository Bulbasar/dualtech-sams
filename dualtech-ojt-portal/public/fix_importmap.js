const fs = require('fs');

const adminPath = 'c:/Users/rober/dualtech-ojt-portal/public/bstpadmin.html';
let content = fs.readFileSync(adminPath, 'utf8');

const target = '"react-dom/client": "https://esm.sh/react-dom@18.2.0/client",';
const replacement = '"react-dom": "https://esm.sh/react-dom@18.2.0",\n            "react-dom/client": "https://esm.sh/react-dom@18.2.0/client",';

if (content.includes(target) && !content.includes('"react-dom": "https://esm.sh/react-dom@18.2.0"')) {
    content = content.replace(target, replacement);
    fs.writeFileSync(adminPath, content);
    console.log('Fixed react-dom importmap in bstpadmin.html');
} else {
    console.log('Could not find target or already fixed');
}
