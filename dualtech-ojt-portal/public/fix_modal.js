const fs = require('fs');

const blPath = '../trainee-portal/src/components/layout/BSTPLayout.jsx';
let bl = fs.readFileSync(blPath, 'utf8');

const regex = /\{showMessageModal && \(\s*<MessageModal onClose=\{\(\) => setShowMessageModal\(false\)\} \/>\s*\)\}/g;
bl = bl.replace(regex, '');

fs.writeFileSync(blPath, bl);
console.log('Fixed MessageModal');
