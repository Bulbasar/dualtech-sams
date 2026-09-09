const fs = require('fs');

const filepath = 'c:/Users/rober/dualtech-ojt-portal/public/schooling.html';
let content = fs.readFileSync(filepath, 'utf8');

// 1. Update <head> to include Inter font and tailwind config
content = content.replace(
    /<title>Schooling Validator - Dualtech<\/title>\s*<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>/,
    `<title>Schooling Validator - Dualtech</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
                    colors: {
                        primary: {
                            50: '#f0f9ff', 100: '#e0f2fe', 200: '#bae6fd', 300: '#7dd3fc',
                            400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1',
                            800: '#075985', 900: '#0c4a6e'
                        }
                    }
                }
            }
        }
    </script>`
);

// 2. Update <html> to include class="antialiased"
content = content.replace(/<html lang="en">/, '<html lang="en" class="antialiased">');

// 3. Update scrollbar styles
content = content.replace(
    /<style>([\s\S]*?)<\/style>/,
    `<style>
        body { font-family: 'Inter', sans-serif; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .dark ::-webkit-scrollbar-thumb { background: #475569; }
        .dark ::-webkit-scrollbar-thumb:hover { background: #64748b; }
        $1
    </style>`
);
// Remove the original body font-family since we set it
content = content.replace(/body \{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; \}\s*/, '');

// 4. Update body classes
content = content.replace(
    /<body class="bg-slate-50 min-h-screen text-slate-800">/,
    '<body class="bg-slate-50 dark:bg-slate-900 min-h-screen text-slate-800 dark:text-slate-200">'
);

// 5. Replace basic color classes from blue to primary globally (only tailwind color classes)
// We only want to replace tailwind color classes like bg-blue-600, text-blue-700, ring-blue-500, etc.
const colorRegex = /\b(bg|text|border|ring|hover:bg|hover:text|hover:border|focus:ring|focus:border)-blue-([0-9]{2,3})\b/g;
content = content.replace(colorRegex, '$1-primary-$2');

// 6. Fix LoginScreen to match MentoringLogin style
const loginScreenRegex = /function LoginScreen\(\{ onLoginSuccess \}\) \{([\s\S]*?)return \([\s\S]*?<div className="min-h-screen[\s\S]*?<\/div>\s*\);\s*\}/;
const newLoginScreenReturn = `return (
                <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-sm text-center">
                        <div className="inline-flex p-3 bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 rounded-2xl mb-4">
                            <User size={32} />
                        </div>
                        <h1 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Mentor Portal</h1>
                        <p className="text-slate-500 mt-1 mb-6 text-sm">Sign in using your assigned Admin/Mentor credentials.</p>
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div>
                                <input required type="email" placeholder="Email Address" value={email} onChange={e=>setEmail(e.target.value)} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-slate-50 dark:bg-slate-900 dark:text-white transition-all" />
                            </div>
                            <div>
                                <input required type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-slate-50 dark:bg-slate-900 dark:text-white transition-all" />
                            </div>
                            <button type="submit" disabled={loading} className="w-full bg-primary-600 text-white font-bold py-2.5 rounded-lg hover:bg-primary-700 flex justify-center items-center gap-2 transition-colors disabled:opacity-70">
                                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Sign In'}
                            </button>
                        </form>
                    </div>
                </div>
            );
        }`;
content = content.replace(loginScreenRegex, (match, body) => {
    return `function LoginScreen({ onLoginSuccess }) {${body}${newLoginScreenReturn}`;
});

// 7. Update Dashboard header
const dashboardHeaderRegex = /<header className="bg-primary-900 text-white p-4 shadow-md sticky top-0 z-10">([\s\S]*?)<\/header>/;
const newDashboardHeader = `<header className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-10 shadow-sm">
                        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                            <div className="flex items-center justify-between w-full md:w-auto">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary-100 dark:bg-primary-900/50 p-2 rounded-xl text-primary-600 dark:text-primary-400">
                                        <CheckCircle size={24}/>
                                    </div>
                                    <div>
                                        <h1 className="font-bold text-lg text-slate-900 dark:text-white">Validator Portal</h1>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">Logged in as: <span className="font-semibold text-slate-700 dark:text-slate-300">{user.name}</span></div>
                                    </div>
                                </div>
                                <button onClick={onLogout} className="md:hidden text-slate-400 hover:text-rose-500 transition-colors"><LogOut size={20}/></button>
                            </div>
                            
                            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
                                <button onClick={() => setActiveTab('scan')} className={\`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 \${activeTab === 'scan' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}\`}>
                                    <QrCode size={16}/> Scan
                                </button>
                                <button onClick={() => setActiveTab('validate')} className={\`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 \${activeTab === 'validate' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}\`}>
                                    <CheckCircle size={16}/> Validate
                                </button>
                                {hasOnlineAccess && (
                                    <button onClick={() => setActiveTab('online')} className={\`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 \${activeTab === 'online' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}\`}>
                                        <CheckSquare size={16}/> Online
                                    </button>
                                )}
                                <button onClick={() => setActiveTab('history')} className={\`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 \${activeTab === 'history' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}\`}>
                                    <History size={16}/> History
                                </button>
                                <button onClick={() => setActiveTab('logs')} className={\`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 \${activeTab === 'logs' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}\`}>
                                    <ClipboardList size={16}/> Logs
                                </button>
                                <button onClick={() => setActiveTab('clockin')} className={\`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 \${activeTab === 'clockin' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}\`}>
                                    <Clock size={16}/> Clock In
                                </button>
                                <button onClick={onLogout} className="hidden md:flex px-4 py-2 rounded-lg text-sm font-semibold transition-colors items-center gap-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 ml-2 border border-transparent hover:border-rose-200">
                                    <LogOut size={16}/> Quit
                                </button>
                            </div>
                        </div>
                    </header>`;

// Use regex to replace the <header> block exactly. Note that we replaced "blue" with "primary" earlier, 
// so the regex should match bg-primary-900 instead of bg-blue-900.
content = content.replace(dashboardHeaderRegex, newDashboardHeader);

// Let's add dark mode support to common background/border classes via some basic regex updates.
// Adding 'dark:bg-slate-800' where 'bg-white' is used.
content = content.replace(/className="([^"]*\bbg-white\b[^"]*)"/g, (match, classes) => {
    if (!classes.includes('dark:bg-')) {
        return `className="${classes} dark:bg-slate-800"`;
    }
    return match;
});

// Adding 'dark:border-slate-700' where 'border-slate-200' is used.
content = content.replace(/className="([^"]*\bborder-slate-200\b[^"]*)"/g, (match, classes) => {
    if (!classes.includes('dark:border-')) {
        return `className="${classes} dark:border-slate-700"`;
    }
    return match;
});

// Adding 'dark:bg-slate-900' where 'bg-slate-50' is used.
content = content.replace(/className="([^"]*\bbg-slate-50\b[^"]*)"/g, (match, classes) => {
    if (!classes.includes('dark:bg-')) {
        return `className="${classes} dark:bg-slate-900"`;
    }
    return match;
});

// Adding 'dark:text-slate-200' where 'text-slate-800' is used.
content = content.replace(/className="([^"]*\btext-slate-800\b[^"]*)"/g, (match, classes) => {
    if (!classes.includes('dark:text-')) {
        return `className="${classes} dark:text-slate-200"`;
    }
    return match;
});

// Adding 'dark:text-slate-300' where 'text-slate-700' is used.
content = content.replace(/className="([^"]*\btext-slate-700\b[^"]*)"/g, (match, classes) => {
    if (!classes.includes('dark:text-')) {
        return `className="${classes} dark:text-slate-300"`;
    }
    return match;
});

// Write it back
fs.writeFileSync(filepath, content);
console.log('Successfully updated schooling.html theme.');
