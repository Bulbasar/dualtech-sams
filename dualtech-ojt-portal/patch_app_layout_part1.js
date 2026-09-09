const fs = require('fs');

let content = fs.readFileSync('tsd-portal/src/App.jsx', 'utf8');

// --- 1. REPLACE LoginScreen ---
const newLoginScreen = `const LoginScreen = ({ onLogin, error }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(error || '');

    useEffect(() => {
        setErrorMessage(error);
    }, [error]);

    useEffect(() => {
        const savedRemember = localStorage.getItem('tsd_remember_me') === 'true';
        setRememberMe(savedRemember);
        if (savedRemember) {
            const savedEmail = localStorage.getItem('tsd_email');
            if (savedEmail) setEmail(savedEmail);
        }
    }, []);

    const handleSignIn = async (e) => {
        e.preventDefault();
        setLoading(true);
        if (rememberMe) {
            localStorage.setItem('tsd_remember_me', 'true');
            localStorage.setItem('tsd_email', email);
        } else {
            localStorage.removeItem('tsd_remember_me');
            localStorage.removeItem('tsd_email');
        }
        await onLogin(email, password);
        setLoading(false);
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 bg-slate-900 overflow-hidden font-sans">
            {/* Professional Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-900/30 blur-[120px] animate-[pulse_8s_ease-in-out_infinite_alternate]"></div>
                <div className="absolute top-[60%] -right-[10%] w-[60%] h-[60%] rounded-full bg-indigo-900/30 blur-[120px] animate-[pulse_10s_ease-in-out_infinite_alternate-reverse]"></div>
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgNDBoNDBWMEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDQwaDFWMEgweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIvPjxwYXRoIGQ9Ik0wIDQwaDQwdi0xSDB6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDIpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-50"></div>
            </div>
            
            <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-700">
                <div className="bg-white/10 dark:bg-slate-800/60 backdrop-blur-2xl p-10 rounded-3xl border border-white/10 shadow-2xl">
                    
                    <div className="text-center mb-10">
                        <div className="flex justify-center mb-6">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                                <div className="relative bg-white p-3 rounded-2xl shadow-lg border border-slate-100 transform transition-transform duration-500 group-hover:-translate-y-1 group-hover:shadow-xl">
                                    <img src="https://dualtech.org.ph/wp-content/uploads/2023/07/dualtech-logo-1.png" alt="Dualtech Logo" className="w-20 h-20 object-contain" />
                                </div>
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">TSD Portal</h1>
                        <p className="text-sm text-slate-400 mt-2 font-medium">Secure access for administrators</p>
                    </div>

                    {errorMessage && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
                            <AlertCircle size={18} className="text-red-400" /> 
                            <span className="text-red-400 text-sm font-medium">{errorMessage}</span>
                        </div>
                    )}

                    <form onSubmit={handleSignIn} className="space-y-5">
                        <div className="space-y-2 group/input">
                            <label className="block text-sm font-medium text-slate-300">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within/input:text-blue-400 transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} 
                                    className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-slate-100 placeholder-slate-500 outline-none transition-all shadow-inner" 
                                    placeholder="admin@example.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 group/input">
                            <label className="block text-sm font-medium text-slate-300">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within/input:text-blue-400 transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input required type={showPassword ? "text" : "password"} value={password} onChange={e=>setPassword(e.target.value)} 
                                    className="w-full pl-10 pr-12 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-slate-100 placeholder-slate-500 outline-none transition-all shadow-inner" 
                                    placeholder="••••••••"
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-blue-400 transition-colors focus:outline-none"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center mt-2">
                            <label className="flex items-center cursor-pointer group">
                                <div className="relative flex items-center justify-center w-4 h-4 mr-2">
                                    <input 
                                        type="checkbox" 
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="peer appearance-none w-4 h-4 border border-slate-600 rounded bg-slate-900/50 checked:bg-blue-600 checked:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer"
                                    />
                                    <Check size={12} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" strokeWidth={3} />
                                </div>
                                <span className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">Remember me</span>
                            </label>
                        </div>

                        <button disabled={loading} className="mt-8 relative w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-slate-900 transition-all shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group">
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out"></div>
                            <span className="relative flex items-center gap-2">
                                {loading ? <><Loader2 className="animate-spin" size={18} /> Authenticating...</> : "Sign In"}
                            </span>
                        </button>
                    </form>
                </div>
                <div className="mt-8 text-center animate-in fade-in delay-300 duration-1000">
                    <p className="text-xs text-slate-500 font-medium">© {new Date().getFullYear()} Dualtech Training Center</p>
                </div>
            </div>
        </div>
    );
};`;

const loginScreenStart = content.indexOf('const LoginScreen =');
let braceCount = 0;
let inComponent = false;
let loginScreenEnd = -1;

for (let i = loginScreenStart; i < content.length; i++) {
    if (content[i] === '{') {
        braceCount++;
        inComponent = true;
    } else if (content[i] === '}') {
        braceCount--;
    }

    if (inComponent && braceCount === 0) {
        loginScreenEnd = i;
        break;
    }
}

if (loginScreenStart !== -1 && loginScreenEnd !== -1) {
    content = content.substring(0, loginScreenStart) + newLoginScreen + content.substring(loginScreenEnd + 1);
} else {
    console.error("Could not find LoginScreen");
}

// --- 2. REPLACE Sidebar ---

const newSidebar = `const Sidebar = ({ user, activeView, setActiveView, selectedProject, setSelectedProject, isOpen, onClose, theme, setTheme, isSidebarCollapsed, setIsSidebarCollapsed }) => {
    const currentUserName = user?.displayName || user?.email?.split('@')[0] || "User";

    const menuItems = [
        { id: 'performance', name: 'ASTP Performance', icon: Activity },
        { id: 'ojtAttendance', name: 'OJT Attendance', icon: ClipboardList },
        { id: 'visitSchedule', name: 'Visit Schedule', icon: Calendar },
        { id: 'allowanceRecords', name: 'Allowance Records', icon: DollarSign },
        { id: 'settings', name: 'Settings', icon: Settings },
    ];

    return (
        <>
            {!isSidebarCollapsed && (
                <div className="md:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarCollapsed(true)} />
            )}
            
            <div className={\`fixed inset-y-0 left-0 z-50 md:static \${isSidebarCollapsed ? '-translate-x-full md:translate-x-0 md:w-20' : 'translate-x-0 w-64'} flex-shrink-0 bg-slate-50 dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300\`}>
                <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700">
                    {!isSidebarCollapsed && <div className="font-bold text-lg text-primary-600 dark:text-primary-400 flex items-center gap-2">
                        <img src="https://dualtech.org.ph/wp-content/uploads/2023/07/dualtech-logo-1.png" alt="Dualtech" className="w-8 h-8 object-contain" />
                        Dualtech
                    </div>}
                    {isSidebarCollapsed && <div className="w-full flex justify-center">
                        <img src="https://dualtech.org.ph/wp-content/uploads/2023/07/dualtech-logo-1.png" alt="Dualtech" className="w-8 h-8 object-contain" />
                    </div>}
                    <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="hidden md:block p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md ml-auto">
                        <Menu size={20}/>
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
                    <ul className="space-y-1 px-3">
                        {menuItems.map(tab => {
                            const IconCmp = tab.icon;
                            const isActive = activeView === tab.id;
                            return (
                                <li key={tab.id}>
                                    <button onClick={() => { setActiveView(tab.id); if(window.innerWidth < 768) setIsSidebarCollapsed(true); }} title={isSidebarCollapsed ? tab.name : ''}
                                        className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium transition-all \${isActive ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300 font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'}\`}>
                                        <IconCmp size={18} className={isActive ? 'text-primary-600 dark:text-primary-400' : ''} />
                                        {!isSidebarCollapsed && <span>{tab.name}</span>}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
                
                {/* User Profile Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                    <div className={\`flex items-center \${isSidebarCollapsed ? 'justify-center' : 'gap-3'} mb-4\`}>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md">
                            {currentUserName.charAt(0).toUpperCase()}
                        </div>
                        {!isSidebarCollapsed && (
                            <div className="overflow-hidden flex-1">
                                <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{currentUserName}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate text-ellipsis w-[150px]" title={user?.email}>{user?.email}</p>
                            </div>
                        )}
                    </div>
                    
                    {!isSidebarCollapsed && (
                        <div className="flex items-center justify-between gap-2">
                            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-600">
                                {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                            </button>
                            <button onClick={() => auth.signOut()} className="flex items-center justify-center p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900/50" title="Sign out">
                                <LogOut size={16} />
                            </button>
                        </div>
                    )}
                    {isSidebarCollapsed && (
                        <div className="flex flex-col gap-2">
                            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="flex items-center justify-center p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-600" title="Toggle Theme">
                                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                            </button>
                            <button onClick={() => auth.signOut()} className="flex items-center justify-center p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Sign out">
                                <LogOut size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};`;

const sidebarStart = content.indexOf('const Sidebar =');
braceCount = 0;
inComponent = false;
let sidebarEnd = -1;

if (sidebarStart !== -1) {
    for (let i = sidebarStart; i < content.length; i++) {
        if (content[i] === '{') {
            braceCount++;
            inComponent = true;
        } else if (content[i] === '}') {
            braceCount--;
        }
        
        if (inComponent && braceCount === 0) {
            sidebarEnd = i;
            break;
        }
    }
    
    if (sidebarEnd !== -1) {
        content = content.substring(0, sidebarStart) + newSidebar + content.substring(sidebarEnd + 1);
    } else {
        console.error("Could not find end of Sidebar");
    }
} else {
    console.error("Could not find Sidebar");
}

fs.writeFileSync('tsd-portal/src/App.jsx', content);
console.log('LoginScreen and Sidebar updated.');
