const fs = require('fs');

const adminPath = 'c:/Users/rober/dualtech-ojt-portal/public/bstpadmin.html';
let content = fs.readFileSync(adminPath, 'utf8');

// 1. Update the groupKey logic in stats calculation (Line ~2409)
const targetStatsKey = `const groupKey = groupBy === 'shift' ? (t.shift || t.bstpshiftName || 'No Shift') : (t.adviser || 'No Adviser');`;
const replacementGroupKey = `let groupKey = 'Unknown';
            if (groupBy === 'shift') groupKey = (t.shift || t.bstpshiftName || 'No Shift');
            else if (groupBy === 'adviser') groupKey = (t.adviser || 'No Adviser');
            else if (groupBy === 'section') groupKey = (t.section || t.Section || 'No Section');
            else if (groupBy === 'status') groupKey = (t.currentbstpStatus || t.Status || t.status || 'No Status');`;
if (content.includes(targetStatsKey)) {
    // Only replace the FIRST occurrence here because it's inside the stats activeTrainees map block
    content = content.replace(targetStatsKey, replacementGroupKey);
}

// 2. Update the groupKey logic in barDataMap calculation (Line ~2481)
// It was exactly the same string originally, so if we replace the second occurrence, we get both!
// Actually, let's just do replace again.
if (content.includes(targetStatsKey)) {
    // We already replaced the first, so this replaces the second
    content = content.replace(targetStatsKey, replacementGroupKey);
}

// 3. Update the Dropdown options
const targetSelectOptions = `<option value="shift">Group by Shift</option>
                        <option value="adviser">Group by Adviser</option>`;
const replacementSelectOptions = `<option value="shift">Group by Shift</option>
                        <option value="adviser">Group by Adviser</option>
                        <option value="section">Group by Section</option>
                        <option value="status">Group by Status</option>`;
if (content.includes(targetSelectOptions)) {
    content = content.replace(targetSelectOptions, replacementSelectOptions);
}

// 4. Fix Punctuality text capitalization (Group by {groupBy})
// Currently it is "Punctuality by {groupBy === 'shift' ? 'Shift' : 'Adviser'}"
const targetPunctualityTitle = `Punctuality by {groupBy === 'shift' ? 'Shift' : 'Adviser'}`;
const replacementPunctualityTitle = `Punctuality by {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}`;
if (content.includes(targetPunctualityTitle)) {
    content = content.replace(targetPunctualityTitle, replacementPunctualityTitle);
}

fs.writeFileSync(adminPath, content);
console.log('Added Section and Status to Group By in OverviewTab');
