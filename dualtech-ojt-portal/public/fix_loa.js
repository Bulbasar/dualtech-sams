const fs = require('fs');

const adminPath = 'c:/Users/rober/dualtech-ojt-portal/public/bstpadmin.html';
let content = fs.readFileSync(adminPath, 'utf8');

const targetActiveTrainees = `return (globalData?.trainees || []).filter(t => t.Level === 'BSTP' && t.isRegistered === true);`;
const replacementActiveTrainees = `return (globalData?.trainees || []).filter(t => {
            if (t.Level !== 'BSTP' || !t.isRegistered) return false;
            const status = (t.currentbstpStatus || t.Status || t.status || '').toLowerCase();
            return status !== 'loa';
        });`;

if (content.includes(targetActiveTrainees)) {
    content = content.replace(targetActiveTrainees, replacementActiveTrainees);
    fs.writeFileSync(adminPath, content);
    console.log('Filtered out LOA status trainees');
} else {
    console.log('Could not find activeTrainees logic');
}
