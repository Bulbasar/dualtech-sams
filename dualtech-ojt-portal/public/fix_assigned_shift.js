const fs = require('fs');

const adminPath = 'c:/Users/rober/dualtech-ojt-portal/public/bstpadmin.html';
let content = fs.readFileSync(adminPath, 'utf8');

// Replace groupKey logic
const targetGroupKey = "const groupKey = groupBy === 'shift' ? (t.bstpshiftName || 'No Shift') : (t.adviser || 'No Adviser');";
const replaceGroupKey = "const groupKey = groupBy === 'shift' ? (t.shift || t.bstpshiftName || 'No Shift') : (t.adviser || 'No Adviser');";
if (content.includes(targetGroupKey)) {
    content = content.replace(targetGroupKey, replaceGroupKey);
} else {
    console.log("Could not find groupKey assignment");
}

// Replace Late calculation logic to also respect t.shift
const targetLateLogic = `if (t.bstpshiftId && globalData?.shifts) {
                    const shift = globalData.shifts.find(s => s.id === t.bstpshiftId);`;

const replaceLateLogic = `let targetShiftId = t.bstpshiftId;
                if (!targetShiftId && t.shift && globalData?.shifts) {
                    const found = globalData.shifts.find(s => s.name === t.shift);
                    if (found) targetShiftId = found.id;
                }
                if (targetShiftId && globalData?.shifts) {
                    const shift = globalData.shifts.find(s => s.id === targetShiftId);`;

if (content.includes(targetLateLogic)) {
    content = content.replace(targetLateLogic, replaceLateLogic);
} else {
    console.log("Could not find late logic assignment");
}

// Replace trainee list rendering logic
const targetTraineeRender = "item.bstpshiftName || 'No Shift'";
const replaceTraineeRender = "item.shift || item.bstpshiftName || 'No Shift'";
if (content.includes(targetTraineeRender)) {
    content = content.replace(targetTraineeRender, replaceTraineeRender);
} else {
    console.log("Could not find trainee list rendering logic");
}

fs.writeFileSync(adminPath, content);
console.log('Fixed assigned shift logic in OverviewTab');
