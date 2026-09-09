const fs = require('fs');
const content = fs.readFileSync('tsd-portal/src/App.jsx', 'utf8');

// Get all imports
const importMatch = content.match(/import\s+\{([^}]+)\}\s+from\s+["']lucide-react["']/);
const imports = importMatch ? importMatch[1].split(',').map(s => s.trim()) : [];

// Get all components used in JSX
const componentRegex = /<([A-Z][a-zA-Z0-9]*)/g;
const usedComponents = new Set();
let match;
while ((match = componentRegex.exec(content)) !== null) {
    usedComponents.add(match[1]);
}

// Ignore known components that aren't icons
const ignoreList = ['BrowserRouter','Routes','Route','ResponsiveContainer','BarChart','Bar','XAxis','YAxis','CartesianGrid','Tooltip','Legend','PieChart','Pie','Cell','Icon','LoginScreen','AstpPerformanceView','OjtAttendanceView','CompanyEngagementView','SurveysView','ICSurveysView','ConcernsView','AnnouncementsView','AstpSchoolingDashboard','PortfolioView','ProjectWorkspace','PerfectAttendanceSection','SortIndicator','SortIcon','IconCmp','LucideIcon'];

const missingIcons = [...usedComponents].filter(c => !imports.includes(c) && !ignoreList.includes(c));

console.log("Missing imports:", missingIcons);
