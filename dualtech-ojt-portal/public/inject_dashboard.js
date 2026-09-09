const fs = require('fs');

let html = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8');
const dashboardNew = fs.readFileSync('C:/Users/rober/.gemini/antigravity-ide/brain/8a49551a-099f-44e2-a6fe-7dd4fc7b8cd1/scratch/dashboard_tab_new.jsx', 'utf8');

const startIndex = html.indexOf('            const DashboardTab =');
const endIndex = html.indexOf('            const CompaniesTab =');

if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find DashboardTab or CompaniesTab boundaries.');
    process.exit(1);
}

const newHtml = html.substring(0, startIndex) + dashboardNew + '\n' + html.substring(endIndex);

fs.writeFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', newHtml);
console.log('Successfully injected dashboard_tab_new.jsx into ic-management.html');
