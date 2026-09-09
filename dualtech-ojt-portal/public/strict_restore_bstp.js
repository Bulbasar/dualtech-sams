const fs = require('fs');
const path = 'c:/Users/rober/dualtech-ojt-portal/public/bstpadmin.html';
let content = fs.readFileSync(path, 'utf8');

// The file is currently corrupted between "setGlobalData(dataToSet);" and the sidebar.
// We will wipe out EVERYTHING between "const [user, setUser] = useState(null);"
// and "{!isSidebarCollapsed && (" (which is line 2900).
// And replace it with the completely reconstructed valid App block.

const startStr = "const [user, setUser] = useState(null);";
const endStr = "{!isSidebarCollapsed && (";

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr);

if (startIdx !== -1 && endIdx !== -1) {
    const fixedBlock = `const [user, setUser] = useState(null);
            const [adminData, setAdminData] = useState(null);
            const [loading, setLoading] = useState(true);
            const [activeTab, setActiveTab] = useState('overview');
            
            const [email, setEmail] = useState('');
            const [password, setPassword] = useState('');
            const [errorMsg, setErrorMsg] = useState('');
            const [loginLoading, setLoginLoading] = useState(false);
            const [showPassword, setShowPassword] = useState(false);
            const [resetLoading, setResetLoading] = useState(false);
            
            const [theme, setTheme] = useState(localStorage.getItem('theme') || 'system');
            const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
            const [showNotifications, setShowNotifications] = useState(false);
            const [showMessages, setShowMessages] = useState(false);
            const [totalUnread, setTotalUnread] = useState(0);
            const [notifications, setNotifications] = useState([]);

            useEffect(() => {
                const unsub = onAuthStateChanged(auth, async (u) => {
                    if (u) {
                        try {
                            const q = query(collection(db, "admins"), where("email", "==", u.email));
                            const adminSnaps = await getDocs(q);
                            
                            if (!adminSnaps.empty) {
                                const adminSnap = adminSnaps.docs[0];
                                if (adminSnap.data().allowedPortals?.includes('bstp_admin_portal')) {
                                    setUser(u);
                                    setAdminData({ id: adminSnap.id, ...adminSnap.data() });
                                } else {
                                    await signOut(auth);
                                    const portals = adminSnap.data().allowedPortals || [];
                                    setErrorMsg(\`Access Denied: You do not have permissions. Your portals: [\${portals.join(', ')}]\`);
                                }
                            } else {
                                await signOut(auth);
                                setErrorMsg(\`Access Denied: Admin record not found for email \${u.email}\`);
                            }
                        } catch(e) {
                            console.error(e);
                        }
                    } else {
                        setUser(null);
                        setAdminData(null);
                    }
                    setLoading(false);
                });
                return () => unsub();
            }, []);

            useEffect(() => {
                if (!adminData?.id) return;
                const q = query(collection(db, "chat_conversations"), where("participants", "array-contains", adminData.id));
                const unsub = onSnapshot(q, (snap) => {
                    let total = 0;
                    snap.forEach(d => {
                        total += (d.data().unreadCount?.[adminData.id] || 0);
                    });
                    setTotalUnread(total);
                });
                return () => unsub();
            }, [adminData?.id]);

            useEffect(() => {
                if (user && adminData) {
                    const q = query(collection(db, "bstpNotifications"), orderBy("timestamp", "desc"), limit(50));
                    const unsub = onSnapshot(q, (snap) => {
                        const notifs = [];
                        const dismissed = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
                        snap.forEach(d => {
                            if (dismissed.includes(d.id)) return;
                            const data = d.data();
                            
                            if (data.targetGroup === "LF" || (data.targetInitials && data.targetInitials !== "ADMIN")) {
                                return;
                            }
                            
                            let timeStr = "Just now";
                            if (data.timestamp) {
                                const date = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
                                timeStr = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                            }
                            notifs.push({ id: d.id, ...data, time: timeStr });
                        });
                        setNotifications(notifs);
                    });
                    return () => unsub();
                }
            }, [user, adminData]);

            const dismissNotification = (id) => {
                const dismissed = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
                if (!dismissed.includes(id)) {
                    dismissed.push(id);
                    localStorage.setItem('dismissed_notifications', JSON.stringify(dismissed));
                }
                setNotifications(prev => prev.filter(n => n.id !== id));
            };

            const [globalData, setGlobalData] = useState({
                trainees: [],
                lfs: [],
                shifts: [],
                skillsets: [],
                venues: []
            });
            const [isFetchingData, setIsFetchingData] = useState(false);

            const openDB = () => new Promise((resolve, reject) => {
                const request = indexedDB.open('bstpadmin_cache', 1);
                request.onupgradeneeded = (e) => {
                    e.target.result.createObjectStore('data');
                };
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
            const setCache = async (key, val) => {
                try {
                    const db = await openDB();
                    const tx = db.transaction('data', 'readwrite');
                    tx.objectStore('data').put(val, key);
                    return new Promise(resolve => tx.oncomplete = resolve);
                } catch(e) { console.error(e); }
            };

            const [syncStatus, setSyncStatus] = useState({ active: false, progress: 0, message: '' });
            const getCache = async (key) => {
                try {
                    const db = await openDB();
                    const tx = db.transaction('data', 'readonly');
                    const req = tx.objectStore('data').get(key);
                    return new Promise(resolve => {
                        req.onsuccess = () => resolve(req.result);
                        req.onerror = () => resolve(null);
                    });
                } catch(e) { return null; }
            };

            const fetchGlobalData = async (forceRefresh = false) => {
                setIsFetchingData(true);
                setSyncStatus({ active: true, progress: 10, message: 'Checking Cache...' });
                try {
                    if (!forceRefresh) {
                        const cachedData = await getCache('bstpadmin_globalData');
                        const cachedTime = await getCache('bstpadmin_globalData_timestamp');
                        if (cachedData && cachedTime) {
                            const now = new Date().getTime();
                            if (now - parseInt(cachedTime) < 5 * 60 * 1000) { 
                                try {
                                    setGlobalData(JSON.parse(cachedData));
                                    setIsFetchingData(false);
                                    setSyncStatus({ active: true, progress: 100, message: 'Loaded from Cache' });
                                    setTimeout(() => setSyncStatus(s => ({...s, active: false})), 1500);
                                    return;
                                } catch(e) {
                                    console.error('Cache parse error', e);
                                }
                            }
                        }
                    }

                    setSyncStatus({ active: true, progress: 20, message: 'Fetching Trainees...' });
                    const traineesRef = collection(db, "artifacts", "dualtech-ojt-portal", "public", "data", "trainees");
                    const qTrainees = query(traineesRef, where("Level", "==", "BSTP"));
                    const traineesSnap = await getDocs(qTrainees);
                    const traineesList = [];
                    traineesSnap.forEach(d => traineesList.push({ id: d.id, ...d.data() }));

                    setSyncStatus({ active: true, progress: 40, message: 'Fetching LFs...' });
                    const qLFs = query(collection(db, "bstpUsers"), where("status", "!=", "Deleted"));
                    const lfsSnap = await getDocs(qLFs);
                    const lfsList = [];
                    lfsSnap.forEach(d => lfsList.push({ id: d.id, ...d.data() }));

                    setSyncStatus({ active: true, progress: 60, message: 'Fetching Shifts...' });
                    const shiftsRef = collection(db, "artifacts", "dualtech-ojt-portal", "public", "data", "bstpShifts");
                    const shiftsSnap = await getDocs(shiftsRef);
                    const shiftsList = [];
                    shiftsSnap.forEach(d => shiftsList.push({ id: d.id, ...d.data() }));

                    setSyncStatus({ active: true, progress: 80, message: 'Fetching Skillsets...' });
                    const skillsetsRef = collection(db, "artifacts", "dualtech-ojt-portal", "public", "data", "bstpSkillsets");
                    const skillsetsSnap = await getDocs(skillsetsRef);
                    const skillsetsList = [];
                    skillsetsSnap.forEach(d => skillsetsList.push({ id: d.id, ...d.data() }));

                    setSyncStatus({ active: true, progress: 95, message: 'Fetching Venues...' });
                    const venuesRef = collection(db, "artifacts", "dualtech-ojt-portal", "public", "data", "bstpVenues");
                    const venuesSnap = await getDocs(venuesRef);
                    const venuesList = [];
                    venuesSnap.forEach(d => venuesList.push({ id: d.id, ...d.data() }));

                    const dataToSet = {
                        trainees: traineesList,
                        lfs: lfsList,
                        shifts: shiftsList,
                        skillsets: skillsetsList,
                        venues: venuesList
                    };
                    setGlobalData(dataToSet);
                    await setCache('bstpadmin_globalData', JSON.stringify(dataToSet));
                    await setCache('bstpadmin_globalData_timestamp', new Date().getTime().toString());
                    
                    setSyncStatus({ active: true, progress: 100, message: 'Sync Complete!' });
                    setTimeout(() => setSyncStatus(s => ({...s, active: false})), 2000);
                } catch(e) {
                    console.error("Error fetching global data:", e);
                    setSyncStatus({ active: true, progress: 100, message: 'Sync Error!' });
                    setTimeout(() => setSyncStatus(s => ({...s, active: false})), 3000);
                    showMessage("Error fetching data.", "error");
                }
                setIsFetchingData(false);
            };

            useEffect(() => {
                if (user && adminData) {
                    fetchGlobalData();
                }
            }, [user, adminData]);

            const [toast, setToast] = useState(null);
            const showMessage = (msg, type='success') => {
                setToast({ msg, type });
                setTimeout(() => setToast(null), 3000);
            };

            const handleResetPassword = async () => {
                if (!email) {
                    setErrorMsg("Please enter your email address first.");
                    return;
                }
                setResetLoading(true);
                try {
                    await sendPasswordResetEmail(auth, email.trim());
                    setErrorMsg("Password reset email sent! Check your inbox.");
                } catch(e) {
                    setErrorMsg("Failed to send reset email: " + e.message);
                }
                setResetLoading(false);
            };

            const handleLogin = async (e) => {
                e.preventDefault();
                setLoginLoading(true);
                setErrorMsg('');
                try {
                    await signInWithEmailAndPassword(auth, email.trim(), password);
                } catch(e) {
                    setErrorMsg("Invalid credentials. Please try again.");
                }
                setLoginLoading(false);
            };

            useEffect(() => {
                const root = window.document.documentElement;
                root.classList.remove('light', 'dark');
                if (theme === 'system') {
                    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    root.classList.add(systemTheme);
                } else {
                    root.classList.add(theme);
                }
                localStorage.setItem('theme', theme);
            }, [theme]);

            if (loading) {
                return <div className="h-full flex items-center justify-center bg-slate-100 dark:bg-slate-900"><Loader2 className="animate-spin text-blue-500" size={40}/></div>;
            }

            if (!user) {
                return (
                    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
                        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-center text-white relative overflow-hidden">
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                                <img src="/dualtech-logo.png" alt="Dualtech Logo" className="w-20 mx-auto mb-4 drop-shadow-md hover:scale-105 transition-transform duration-300" />
                                <h1 className="text-3xl font-black tracking-tight">BSTP Admin</h1>
                                <p className="text-blue-100 mt-2 font-medium">Authentication Required</p>
                            </div>
                            <form onSubmit={handleLogin} className="p-8 space-y-5">
                                {errorMsg && <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-bold text-center flex items-center justify-center gap-2 animate-shake"><AlertTriangle size={16}/> {errorMsg}</div>}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                        <input type="email" required className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@dualtech.edu.ph" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                        <input type={showPassword ? "text" : "password"} required className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-end mt-1">
                                    <button
                                        type="button"
                                        onClick={handleResetPassword}
                                        disabled={resetLoading}
                                        className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 flex items-center gap-1 transition-all"
                                    >
                                        {resetLoading && <Loader2 size={12} className="animate-spin" />} Forgot Password?
                                    </button>
                                </div>
                                <button type="submit" disabled={loginLoading} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2">
                                    {loginLoading ? <Loader2 className="animate-spin" size={20}/> : <Lock size={18}/>} Sign In Securely
                                </button>
                            </form>
                        </div>
                    </div>
                );
            }

            return (
                <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
                    {/* Mobile Overlay */}`;

    const newContent = content.substring(0, startIdx) + fixedBlock + content.substring(endIdx + endStr.length);
    fs.writeFileSync(path, newContent);
    console.log('Restored and Fixed BSTP Admin Login UI completely');
} else {
    console.log('Could not find markers for replacement.');
    console.log('startIdx:', startIdx);
    console.log('endIdx:', endIdx);
}
