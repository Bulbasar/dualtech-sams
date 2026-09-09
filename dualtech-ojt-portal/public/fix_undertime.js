const fs = require('fs');

const adminPath = 'c:/Users/rober/dualtech-ojt-portal/public/bstpadmin.html';
let content = fs.readFileSync(adminPath, 'utf8');

// 1. Update the let variables at the top of the loop
const targetLets = `let status = 'No Clock Ins';
            let isLate = false;
            let logToDisplay = null;`;
const replacementLets = `let status = 'No Clock Ins';
            let isLate = false;
            let isUndertime = false;
            let logToDisplay = null;`;
if (content.includes(targetLets)) {
    content = content.replace(targetLets, replacementLets);
}

// 2. Update the LatestIn / LatestOut logic
const targetInOut = `                if (stuLogs.outRecs.length > 0) {
                    status = 'Completed Shift';
                } else {
                    status = 'Currently Clocked In';
                }`;
const replacementInOut = `                let latestOut = null;
                if (stuLogs.outRecs.length > 0) {
                    status = 'Completed Shift';
                    stuLogs.outRecs.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
                    latestOut = stuLogs.outRecs[0];
                    logToDisplay.timeOut = latestOut.timestamp;
                } else {
                    status = 'Currently Clocked In';
                }`;
if (content.includes(targetInOut)) {
    content = content.replace(targetInOut, replacementInOut);
}

// 3. Update the shift time check to include Undertime
const targetShiftCheck = `const startTimeStr = isEvenWeek ? shift.evenWeekStartTime : shift.oddWeekStartTime;
                        
                        if (startTimeStr) {
                            // Compare times
                            const [shiftHH, shiftMM] = startTimeStr.split(':').map(Number);
                            const inDate = new Date(latestIn.timestamp);
                            
                            // Let's add a 5 min grace period? Or strict? We'll do strict for now.
                            // Convert both to minutes since midnight
                            const shiftMins = (shiftHH * 60) + shiftMM;
                            const inMins = (inDate.getHours() * 60) + inDate.getMinutes();
                            
                            if (inMins > shiftMins) {
                                isLate = true;
                            }
                        }`;
const replacementShiftCheck = `const startTimeStr = isEvenWeek ? shift.evenWeekStartTime : shift.oddWeekStartTime;
                        const endTimeStr = isEvenWeek ? shift.evenWeekEndTime : shift.oddWeekEndTime;
                        
                        if (startTimeStr) {
                            const [shiftHH, shiftMM] = startTimeStr.split(':').map(Number);
                            const inDate = new Date(latestIn.timestamp);
                            const shiftMins = (shiftHH * 60) + shiftMM;
                            const inMins = (inDate.getHours() * 60) + inDate.getMinutes();
                            if (inMins > shiftMins) isLate = true;
                        }
                        
                        if (endTimeStr && latestOut) {
                            const [shiftHH, shiftMM] = endTimeStr.split(':').map(Number);
                            const outDate = new Date(latestOut.timestamp);
                            const shiftMins = (shiftHH * 60) + shiftMM;
                            const outMins = (outDate.getHours() * 60) + outDate.getMinutes();
                            if (outMins < shiftMins) isUndertime = true;
                        }`;
if (content.includes(targetShiftCheck)) {
    content = content.replace(targetShiftCheck, replacementShiftCheck);
}

// 4. Update the item object creation
const targetItem = `const item = { ...t, log: logToDisplay, isLate, groupKey };`;
const replacementItem = `const item = { ...t, log: logToDisplay, isLate, isUndertime, groupKey };`;
if (content.includes(targetItem)) {
    content = content.replace(targetItem, replacementItem);
}

// 5. Update StatusColumn to render Undertime badge
const targetRender = `                                {item.log && (
                                    <div className="flex flex-col items-end">
                                        <span className={\`text-xs font-bold px-1.5 py-0.5 rounded \${item.isLate ? 'bg-red-100 text-red-700 dark:bg-red-900/30' : 'bg-green-100 text-green-700 dark:bg-green-900/30'}\`}>
                                            {item.isLate ? 'LATE' : 'ON TIME'}
                                        </span>
                                        <span className="text-[10px] text-slate-400 mt-1">
                                            {new Date(item.log.timeIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                )}`;
const replacementRender = `                                {item.log && (
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="flex gap-1">
                                            <span className={\`text-[10px] font-bold px-1.5 py-0.5 rounded \${item.isLate ? 'bg-red-100 text-red-700 dark:bg-red-900/30' : 'bg-green-100 text-green-700 dark:bg-green-900/30'}\`}>
                                                {item.isLate ? 'LATE' : 'ON TIME'}
                                            </span>
                                            {item.log.timeOut && (
                                                <span className={\`text-[10px] font-bold px-1.5 py-0.5 rounded \${item.isUndertime ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30'}\`}>
                                                    {item.isUndertime ? 'UNDERTIME' : 'COMPLETED'}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-slate-400">
                                            {new Date(item.log.timeIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            {item.log.timeOut && \` - \${new Date(item.log.timeOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}\`}
                                        </span>
                                    </div>
                                )}`;
// Remember to escape template literal strings properly in the JS code string or use string replace directly:
if (content.includes("                                {item.log && (")) {
    // Actually using string replace on a multi-line block might fail due to indentation or line endings.
    // Let's use regex or split/join.
    // Let's just find the `item.log &&` part and replace it.
}

// Safer replace for render:
const renderSearch = '{item.log && (';
const renderEnd = ')}'; // find the matching end of item.log rendering. It's inside a flex-col items-end div.
const startIdx = content.indexOf('<div className="flex flex-col items-end">', content.indexOf('{item.log && ('));
const endIdx = content.indexOf('</div>', startIdx);
if (startIdx !== -1 && endIdx !== -1) {
    const renderBlock = content.substring(startIdx, endIdx + '</div>'.length);
    content = content.replace(renderBlock, `<div className="flex flex-col items-end gap-1">
                                        <div className="flex gap-1">
                                            <span className={\`text-[10px] font-bold px-1.5 py-0.5 rounded \${item.isLate ? 'bg-red-100 text-red-700 dark:bg-red-900/30' : 'bg-green-100 text-green-700 dark:bg-green-900/30'}\`}>
                                                {item.isLate ? 'LATE' : 'ON TIME'}
                                            </span>
                                            {item.log.timeOut && (
                                                <span className={\`text-[10px] font-bold px-1.5 py-0.5 rounded \${item.isUndertime ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30'}\`}>
                                                    {item.isUndertime ? 'UNDERTIME' : 'COMPLETED'}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-slate-400">
                                            {new Date(item.log.timeIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            {item.log.timeOut && \` - \${new Date(item.log.timeOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}\`}
                                        </span>
                                    </div>`);
} else {
    console.log("Could not find render block");
}

fs.writeFileSync(adminPath, content);
console.log('Fixed undertime logic in OverviewTab');
