const fs = require('fs');

const adminPath = 'c:/Users/rober/dualtech-ojt-portal/public/bstpadmin.html';
let content = fs.readFileSync(adminPath, 'utf8');

const targetStr = "return (globalData?.trainees || []).filter(t => t.role === 'BSTP' && t.bstp_status === 'active');";
const replacementStr = "return (globalData?.trainees || []).filter(t => t.Level === 'BSTP' && t.isRegistered === true);";

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    fs.writeFileSync(adminPath, content);
    console.log('Fixed trainee filter in bstpadmin.html');
} else {
    console.log('Could not find target string');
}
