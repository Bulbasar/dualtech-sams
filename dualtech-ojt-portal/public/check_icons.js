const fs = require('fs');
const code = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/mentoring.html', 'utf8');

// Extract imports from lucide-react
const importMatch = code.match(/import\s+\{([^}]+)\}\s+from\s+['\"]lucide-react['\"]/);
if (!importMatch) {
  console.log('No lucide-react import found.');
  process.exit(1);
}

const importedIcons = new Set(
  importMatch[1].split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0)
);

// Find all capitalized tags used as components
const tagRegex = /<([A-Z][a-zA-Z0-9]+)(?:\s|\/|>)/g;
const usedTags = new Set();
let match;
while ((match = tagRegex.exec(code)) !== null) {
  usedTags.add(match[1]);
}

// Known non-lucide components (e.g. standard React/Recharts or local components)
const nonLucide = new Set([
  'PieChart', 'Pie', 'Cell', 'Tooltip', 'Legend', 'ResponsiveContainer',
  'App', 'MentoringLogin', 'MentorsVenuesTab', 'MentorClockRecordsTab', 
  'SchoolingAssignmentTab', 'OnlineSubmissionsTab', 'SchoolingRecordsTab',
  'PdsLogsTab', 'CalendarTab', 'SortIcon'
]);

// Find tags that are used but not imported (and not in the exclude list)
const undefinedIcons = [...usedTags].filter(tag => !importedIcons.has(tag) && !nonLucide.has(tag));

console.log('Imported from lucide-react:', [...importedIcons].length);
console.log('Used Capitalized Tags:', [...usedTags].length);
console.log('Undefined/Unimported tags that might be icons:');
undefinedIcons.forEach(tag => console.log('- ' + tag));
