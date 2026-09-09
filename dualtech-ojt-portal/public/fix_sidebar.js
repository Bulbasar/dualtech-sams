const fs = require('fs');

const adminPath = 'c:/Users/rober/dualtech-ojt-portal/public/bstpadmin.html';
let content = fs.readFileSync(adminPath, 'utf8');

const regex = /<li className="mb-2">\s*<button title=\{isSidebarCollapsed \? "Manage Users" : ""\}/;

const overviewSidebarHtml = `<li className="mb-2">
                                    <button title={isSidebarCollapsed ? "Overview" : ""}
                                        onClick={() => setActiveTab('overview')}
                                        className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-bold transition-all \${activeTab === 'overview' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50'}\`}>
                                        <Lucide.LayoutDashboard size={18} className={activeTab === 'overview' ? 'text-blue-600 dark:text-blue-400' : ''} />
                                        {!isSidebarCollapsed && <span>Overview</span>}
                                    </button>
                                </li>
                                <li className="mb-2">
                                    <button title={isSidebarCollapsed ? "Manage Users" : ""}`;

if (regex.test(content) && !content.includes("setActiveTab('overview')")) {
    content = content.replace(regex, overviewSidebarHtml);
    fs.writeFileSync(adminPath, content);
    console.log('Successfully injected Overview into sidebar');
} else if (content.includes("setActiveTab('overview')")) {
    console.log('Already injected');
} else {
    console.log('Could not find sidebar target');
}
