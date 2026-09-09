const fs = require('fs');

const schoolingFile = 'c:\\Users\\rober\\dualtech-ojt-portal\\public\\schooling.html';
let content = fs.readFileSync(schoolingFile, 'utf8');

// 1. Add CSS
const cssToAdd = `
        /* Tab gamification animations */
        @keyframes tab-enter {
            0% { opacity: 0; transform: translateY(15px) scale(0.98); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .tab-content-enter {
            animation: tab-enter 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
`;
content = content.replace('    </style>', cssToAdd + '    </style>');

// 2. Replace the Dashboard header buttons
// Original: <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
// ... up to </header>
// Let's use regex to grab the whole buttons block
const buttonsRegex = /<div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 hide-scrollbar">([\s\S]*?)<\/header>/;

const newButtons = `<div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
                                <button onClick={() => setActiveTab('clockin')} className={\`px-4 py-2 rounded-lg text-sm font-semibold transition-all active:scale-90 flex items-center gap-2 \${activeTab === 'clockin' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 shadow-sm scale-105 transform' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:-translate-y-0.5'}\`}>
                                    <Clock size={16} className={activeTab === 'clockin' ? 'animate-bounce' : ''}/> Clock In
                                </button>
                                <button onClick={() => setActiveTab('validate')} className={\`px-4 py-2 rounded-lg text-sm font-semibold transition-all active:scale-90 flex items-center gap-2 \${activeTab === 'validate' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 shadow-sm scale-105 transform' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:-translate-y-0.5'}\`}>
                                    <CheckCircle size={16} className={activeTab === 'validate' ? 'animate-pulse' : ''}/> Validate
                                </button>
                                {hasOnlineAccess && (
                                    <button onClick={() => setActiveTab('online')} className={\`px-4 py-2 rounded-lg text-sm font-semibold transition-all active:scale-90 flex items-center gap-2 \${activeTab === 'online' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 shadow-sm scale-105 transform' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:-translate-y-0.5'}\`}>
                                        <CheckSquare size={16} className={activeTab === 'online' ? 'animate-pulse' : ''}/> Online
                                    </button>
                                )}
                                <button onClick={() => setActiveTab('history')} className={\`px-4 py-2 rounded-lg text-sm font-semibold transition-all active:scale-90 flex items-center gap-2 \${activeTab === 'history' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 shadow-sm scale-105 transform' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:-translate-y-0.5'}\`}>
                                    <History size={16} className={activeTab === 'history' ? 'animate-[spin_2s_linear_infinite]' : ''}/> History
                                </button>
                                <button onClick={() => setActiveTab('logs')} className={\`px-4 py-2 rounded-lg text-sm font-semibold transition-all active:scale-90 flex items-center gap-2 \${activeTab === 'logs' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 shadow-sm scale-105 transform' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:-translate-y-0.5'}\`}>
                                    <ClipboardList size={16} className={activeTab === 'logs' ? 'animate-pulse' : ''}/> Logs
                                </button>
                                <button onClick={onLogout} className="hidden md:flex px-4 py-2 rounded-lg text-sm font-semibold transition-all active:scale-90 items-center gap-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 ml-2 border border-transparent hover:border-rose-200 hover:-translate-y-0.5">
                                    <LogOut size={16}/> Quit
                                </button>
                            </div>
                        </div>
                    </header>`;
content = content.replace(buttonsRegex, newButtons);

// 3. Wrap main contents
const mainRegex = /<main className="flex-1 p-4 w-full max-w-5xl mx-auto mt-2">\s*\{activeTab === 'clockin' && <ClockInTab user=\{user\} \/>\}\s*\{activeTab === 'validate' && <ValidateTab user=\{user\} \/>\}\s*\{activeTab === 'online' && hasOnlineAccess && <OnlineSubmissionsTab user=\{user\} \/>\}\s*\{activeTab === 'history' && <AttendanceHistoryTab user=\{user\} \/>\}\s*\{activeTab === 'logs' && <LogsTab user=\{user\} \/>\}\s*<\/main>/;

const newMain = `<main className="flex-1 p-4 w-full max-w-5xl mx-auto mt-2">
                        <div key={activeTab} className="tab-content-enter">
                            {activeTab === 'clockin' && <ClockInTab user={user} />}
                            {activeTab === 'validate' && <ValidateTab user={user} />}
                            {activeTab === 'online' && hasOnlineAccess && <OnlineSubmissionsTab user={user} />}
                            {activeTab === 'history' && <AttendanceHistoryTab user={user} />}
                            {activeTab === 'logs' && <LogsTab user={user} />}
                        </div>
                    </main>`;
content = content.replace(mainRegex, newMain);

fs.writeFileSync(schoolingFile, content);
console.log("Successfully gamified schooling tabs! New length:", content.length);
