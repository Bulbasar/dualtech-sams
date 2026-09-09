const fs = require('fs');
const file = 'c:/Users/rober/dualtech-ojt-portal/public/ic-management.html';
let content = fs.readFileSync(file, 'utf8');

// 1. Add isRefreshing state and handleRefreshData
const stateTarget = `            const [syncStatus, setSyncStatus] = useState({ visible: false, message: '', type: 'loading' });`;
const stateReplace = `            const [syncStatus, setSyncStatus] = useState({ visible: false, message: '', type: 'loading' });
            const [isRefreshing, setIsRefreshing] = useState(false);

            const handleRefreshData = () => {
                setIsRefreshing(true);
                localStorage.removeItem('astp_attendance_cache');
                localStorage.removeItem('astp_attendance_cache_time');
                setAttendanceLogsFetched(false);
                setTimeout(() => setIsRefreshing(false), 1500);
            };`;
content = content.replace(stateTarget, stateReplace);


// 2. Update fetchLogs to use localStorage caching
const fetchLogsTarget = `                const fetchLogs = async () => {
                    try {
                        showSyncStatus('Fetching ASTP attendance...', 'loading');
                        const astpTrainees = trainees.filter(t => String(t.level || t.Level || t.LEVEL || '').toUpperCase() === 'ASTP');`;

const fetchLogsReplace = `                const fetchLogs = async () => {
                    try {
                        const cachedLogs = localStorage.getItem('astp_attendance_cache');
                        const cacheTime = localStorage.getItem('astp_attendance_cache_time');
                        
                        if (cachedLogs && cacheTime && (Date.now() - parseInt(cacheTime)) < 3600000) {
                            try {
                                setAttendanceLogs(JSON.parse(cachedLogs));
                                setAttendanceLogsFetched(true);
                                showSyncStatus('Loaded attendance from cache', 'success', 2000);
                                return;
                            } catch (e) { console.error('Cache parse error', e); }
                        }

                        showSyncStatus('Fetching ASTP attendance...', 'loading');
                        const astpTrainees = trainees.filter(t => String(t.level || t.Level || t.LEVEL || '').toUpperCase() === 'ASTP');`;
content = content.replace(fetchLogsTarget, fetchLogsReplace);


// 3. Update fetchLogs success to save to localStorage
const fetchLogsSuccessTarget = `                        }
                        setAttendanceLogs(allAstpLogs);
                        showSyncStatus('Attendance loaded successfully', 'success', 3000);`;

const fetchLogsSuccessReplace = `                        }
                        setAttendanceLogs(allAstpLogs);
                        try {
                            localStorage.setItem('astp_attendance_cache', JSON.stringify(allAstpLogs));
                            localStorage.setItem('astp_attendance_cache_time', Date.now().toString());
                        } catch(e) { console.warn('Could not save to cache (limit exceeded?)', e); }
                        showSyncStatus('Attendance loaded successfully', 'success', 3000);`;
content = content.replace(fetchLogsSuccessTarget, fetchLogsSuccessReplace);


// 4. Add Refresh button to the header
const headerTarget = `                            <div className="flex items-center gap-2 md:gap-4 pl-4">
                                <button onClick={() => setDarkMode(!darkMode)} className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors">
                                    {darkMode ? <Sun size={20}/> : <Moon size={20}/>}
                                </button>
                                {/* Avatar Circle */}`;

const headerReplace = `                            <div className="flex items-center gap-2 md:gap-4 pl-4">
                                <button onClick={handleRefreshData} title="Force Refresh Records" className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors">
                                    <RefreshCw size={20} className={isRefreshing ? "animate-spin text-blue-500" : ""} />
                                </button>
                                <button onClick={() => setDarkMode(!darkMode)} className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors">
                                    {darkMode ? <Sun size={20}/> : <Moon size={20}/>}
                                </button>
                                {/* Avatar Circle */}`;
content = content.replace(headerTarget, headerReplace);


fs.writeFileSync(file, content, 'utf8');
