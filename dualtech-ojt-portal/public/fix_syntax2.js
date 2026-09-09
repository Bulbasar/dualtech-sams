const fs = require('fs');

const adminPath = 'c:/Users/rober/dualtech-ojt-portal/public/bstpadmin.html';
let content = fs.readFileSync(adminPath, 'utf8');

// The string was: className={\\`px-4 py-3 rounded-lg border font-bold flex items-center justify-between \\${colorClasses[color]}\\`}
// Another one: className={\\`text-xs font-bold px-1.5 py-0.5 rounded \\${item.isLate ? 'bg-red-100 text-red-700 dark:bg-red-900/30' : 'bg-green-100 text-green-700 dark:bg-green-900/30'}\\`}

// Let's replace any occurrences of {\` and \`} that were escaped as {\\` and \\`}
// We can just replace `\\`` with '`' and `\\$` with '$' everywhere inside the OverviewTab block.
// Or just replace globally because they shouldn't exist in the file otherwise.
content = content.replace(/\\`/g, '`');
content = content.replace(/\\\$/g, '$');

fs.writeFileSync(adminPath, content);
console.log('Fixed all backtick syntax errors in bstpadmin.html');
