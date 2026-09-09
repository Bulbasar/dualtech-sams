const fs = require('fs');

const adminPath = 'c:/Users/rober/dualtech-ojt-portal/public/bstpadmin.html';
let content = fs.readFileSync(adminPath, 'utf8');

// 1. Add recharts to importmap
if (!content.includes('"recharts"')) {
    content = content.replace(
        '"lucide-react": "https://esm.sh/lucide-react@0.294.0?external=react",',
        '"lucide-react": "https://esm.sh/lucide-react@0.294.0?external=react",\n            "recharts": "https://esm.sh/recharts@2.12.7?external=react,react-dom",'
    );
}

// 2. Add Recharts import to Babel script
if (!content.includes("import * as Recharts from 'recharts'")) {
    content = content.replace(
        "import * as Lucide from 'lucide-react';",
        "import * as Lucide from 'lucide-react';\n        import * as Recharts from 'recharts';"
    );
}

// 3. Inject OverviewTab component code
const tabCode = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/OverviewTab.jsx', 'utf8');
// We need to slightly adjust OverviewTab because we used `window.Recharts` in it instead of `Recharts` directly.
// Let's replace `const { ... } = window.Recharts || {}` with `const { ... } = Recharts`.
let modifiedTabCode = tabCode.replace(
    'const { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } = window.Recharts || {};',
    'const { PieChart, Pie, Cell, Tooltip: RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } = Recharts;'
);
modifiedTabCode = modifiedTabCode.replace(/window\.Recharts/g, 'Recharts');
// Also db is in scope as `db`, not `window.db`
modifiedTabCode = modifiedTabCode.replace('const db = window.db;', 'const db = window.db || window._firebaseDb; // fallback if needed, but db should be available from closure if we put it inside App or pass it');
// Wait, `db` is not passed to OverviewTab! It's better to pass it as a prop or rely on the global `db` variable defined in the inline script.
// In bstpadmin.html, `db` is defined globally in the inline script block: `const app = initializeApp(firebaseConfig); const db = getFirestore(app);`
// So `db` is just `db`. Let's remove `const db = window.db;`
modifiedTabCode = modifiedTabCode.replace('const db = window.db; // assuming db is available globally or we can use the injected db. Actually we should get db from window.db which is initialized in bstpadmin.html', '');

// Also, the lucide destructuring needs to remove `useMemo`, `useEffect`, `useState` from React since they are already imported at the top of the file!
modifiedTabCode = modifiedTabCode.replace('const { useState, useEffect, useMemo } = React;', '');
// Same for Lucide and Firestore
modifiedTabCode = modifiedTabCode.replace('const { RefreshCw, Users, Clock, AlertTriangle, ChevronDown } = Lucide;', 'const { RefreshCw, Users, Clock, AlertTriangle, ChevronDown, LayoutDashboard } = Lucide;');
modifiedTabCode = modifiedTabCode.replace('const { collection, query, where, getDocs } = window; // from firestore', 'const { collection, query, where, getDocs } = window.FirebaseFirestore || {};'); // wait, firestore is imported at the top!
// Let's just rely on the imports in bstpadmin.html.
// In bstpadmin.html: `import { collection, query, where, orderBy, getDocs, ... } from 'firebase/firestore'`
// So we don't need to destructure them from `window`.
modifiedTabCode = modifiedTabCode.replace('const { collection, query, where, getDocs } = window; // from firestore', '');

if (!content.includes('function OverviewTab(')) {
    // Inject right before function App()
    const appIndex = content.indexOf('function App() {');
    content = content.substring(0, appIndex) + modifiedTabCode + '\n\n' + content.substring(appIndex);
}

// 4. Register the tab in the Sidebar
// Replace `const [activeTab, setActiveTab] = useState('users');` with `const [activeTab, setActiveTab] = useState('overview');`
content = content.replace("const [activeTab, setActiveTab] = useState('users');", "const [activeTab, setActiveTab] = useState('overview');");

// Add Sidebar icon
const sidebarTarget = `<li className="mb-2">
                                    <button title={isSidebarCollapsed ? "Manage Users" : ""}`;
const sidebarReplacement = `<li className="mb-2">
                                    <button title={isSidebarCollapsed ? "Overview" : ""}
                                        onClick={() => setActiveTab('overview')}
                                        className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-bold transition-all \${activeTab === 'overview' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50'}\`}>
                                        <Lucide.LayoutDashboard size={18} className={activeTab === 'overview' ? 'text-blue-600 dark:text-blue-400' : ''} />
                                        {!isSidebarCollapsed && <span>Overview</span>}
                                    </button>
                                </li>
                                <li className="mb-2">
                                    <button title={isSidebarCollapsed ? "Manage Users" : ""}`;
if (!content.includes("setActiveTab('overview')")) {
    content = content.replace(sidebarTarget, sidebarReplacement);
}

// 5. Render the tab
const renderTarget = `{activeTab === 'users' && <ManageUsersTab showMessage={showMessage} globalData={globalData} setGlobalData={setGlobalData} />}`;
const renderReplacement = `{activeTab === 'overview' && <OverviewTab showMessage={showMessage} globalData={globalData} setGlobalData={setGlobalData} />}
                            {activeTab === 'users' && <ManageUsersTab showMessage={showMessage} globalData={globalData} setGlobalData={setGlobalData} />}`;
if (!content.includes("<OverviewTab showMessage")) {
    content = content.replace(renderTarget, renderReplacement);
}

fs.writeFileSync(adminPath, content);
console.log('Injected OverviewTab into bstpadmin.html');
