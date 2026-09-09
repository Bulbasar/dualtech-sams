const fs = require('fs');
const file = 'c:/Users/rober/dualtech-ojt-portal/public/ic-management.html';
let content = fs.readFileSync(file, 'utf8');

// Replace using regex that matches the spaces loosely
const regex = /                            <\/div>\s*\);\s*weekly: getWeekString\(\),/;

const replacement = `                            </div>
                        );
                    })()}
                </div>
            );
        }

        // --- INTERACTIVE STATUS BAR ---
        const SyncStatusBar = ({ isVisible, message, type = 'loading' }) => {
            if (!isVisible) return null;
            return (
                <div className="fixed bottom-6 right-6 z-50 animate-bounce">
                    <div className={\`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-md border \${
                        type === 'loading' ? 'bg-blue-900/80 border-blue-500/50 text-blue-100' :
                        type === 'success' ? 'bg-emerald-900/80 border-emerald-500/50 text-emerald-100' :
                        'bg-red-900/80 border-red-500/50 text-red-100'
                    }\`}>
                        {type === 'loading' && <Loader2 className="w-5 h-5 animate-spin" />}
                        {type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                        {type === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
                        <span className="font-medium text-sm">{message}</span>
                    </div>
                </div>
            );
        };

        // --- MAIN PORTAL COMPONENT ---
        const ICManagementPortal = ({ user, handleLogout }) => {
            const [activeTab, setActiveTab] = useState('dashboard');
            const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
            const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

            useEffect(() => {
                if (darkMode) {
                    document.documentElement.classList.add('dark');
                    localStorage.setItem('theme', 'dark');
                } else {
                    document.documentElement.classList.remove('dark');
                    localStorage.setItem('theme', 'light');
                }
            }, [darkMode]);

            // Global Data States
            const [trainees, setTrainees] = useState([]);
            const [visits, setVisits] = useState([]);
            const [meetings, setMeetings] = useState([]);
            const [contacts, setContacts] = useState([]);
            const [companyProfiles, setCompanyProfiles] = useState({});
            const [geofences, setGeofences] = useState([]);
            const [attendanceLogs, setAttendanceLogs] = useState([]);
            const [attendanceLogsFetched, setAttendanceLogsFetched] = useState(false);
            const [loadingData, setLoadingData] = useState(true);
            const [syncStatus, setSyncStatus] = useState({ visible: false, message: '', type: 'loading' });
            const [isRefreshing, setIsRefreshing] = useState(false);

            const handleRefreshData = () => {
                setIsRefreshing(true);
                localStorage.removeItem('astp_attendance_cache');
                localStorage.removeItem('astp_attendance_cache_time');
                setAttendanceLogsFetched(false);
                setTimeout(() => setIsRefreshing(false), 1500);
            };

            const showSyncStatus = (message, type = 'loading', duration = 0) => {
                setSyncStatus({ visible: true, message, type });
                if (duration > 0) {
                    setTimeout(() => {
                        setSyncStatus(prev => ({ ...prev, visible: false }));
                    }, duration);
                }
            };

            // Filter States
            const [dateMode, setDateMode] = useState('Monthly');
            const [dateValues, setDateValues] = useState({
                daily: getTodayString(),
                weekly: getWeekString(),`;

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Restored successfully');
} else {
    console.log('Regex did not match!');
    const idx = content.indexOf('weekly: getWeekString()');
    if (idx !== -1) {
        console.log(content.substring(idx - 60, idx + 30));
    }
}
