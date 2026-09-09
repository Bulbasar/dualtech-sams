const fs = require('fs');
const file = 'c:\\Users\\rober\\dualtech-ojt-portal\\public\\schooling.html';
const content = fs.readFileSync(file, 'utf8');

const part1 = content.substring(0, content.indexOf('        // Keep myVenuesRef updated for the scanner closure'));
const part2 = content.substring(content.indexOf('        // Keep myVenuesRef updated for the scanner closure'), content.indexOf('        // --- DASHBOARD ---'));
const part3 = content.substring(content.indexOf('        // --- DASHBOARD ---'));

// Reconstruct AttendanceHistoryTab UI
const historyTabUI = `
            const filteredRecords = records.filter(r => {
                const matchName = !searchName || (r.traineeName || r.studentName || '').toLowerCase().includes(searchName.toLowerCase());
                const matchComp = !searchCompany || (r.company || '').toLowerCase().includes(searchCompany.toLowerCase());
                const matchVenue = !searchVenue || (r.venueName || '').toLowerCase().includes(searchVenue.toLowerCase());
                return matchName && matchComp && matchVenue;
            });

            return (
                <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden dark:bg-slate-800 dark:border-slate-700">
                    <div className="p-4 bg-slate-50 border-b flex flex-col md:flex-row justify-between md:items-center gap-4 dark:bg-slate-900">
                        <div className="font-bold text-slate-700 flex items-center gap-2 dark:text-slate-300">
                            <History size={20} className="text-primary-600" /> Attendance History
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="p-2 border border-slate-300 rounded-lg text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
                            <button onClick={fetchHistory} className="p-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors" title="Refresh">
                                <RefreshCw size={18} className={historyLoading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 border-b flex gap-2 overflow-x-auto dark:bg-slate-900">
                        <input type="text" placeholder="Search Trainee" value={searchName} onChange={e => setSearchName(e.target.value)} className="p-2 border border-slate-300 rounded-lg text-sm flex-1 min-w-[150px] dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
                        <input type="text" placeholder="Search Company" value={searchCompany} onChange={e => setSearchCompany(e.target.value)} className="p-2 border border-slate-300 rounded-lg text-sm flex-1 min-w-[150px] dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
                        <input type="text" placeholder="Search Venue" value={searchVenue} onChange={e => setSearchVenue(e.target.value)} className="p-2 border border-slate-300 rounded-lg text-sm flex-1 min-w-[150px] dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                <tr>
                                    <th className="p-3">Trainee</th>
                                    <th className="p-3">Session</th>
                                    <th className="p-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historyLoading && <tr><td colSpan="3" className="p-8 text-center text-slate-500"><Loader2 className="animate-spin mx-auto mb-2" size={24}/>Loading...</td></tr>}
                                {!historyLoading && filteredRecords.length === 0 && <tr><td colSpan="3" className="p-8 text-center text-slate-500">No records found for this date.</td></tr>}
                                {!historyLoading && filteredRecords.map(rec => (
                                    <tr key={rec.id} className="border-t border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="p-3">
                                            <div className="font-bold text-slate-800 dark:text-slate-200">{rec.traineeName || rec.studentName}</div>
                                            <div className="text-xs text-slate-500">{rec.company}</div>
                                        </td>
                                        <td className="p-3">
                                            <div className="font-semibold text-primary-700">{rec.activityType || rec.type}</div>
                                            <div className="text-xs text-slate-600 dark:text-slate-400">{rec.venueName} - {rec.time}</div>
                                        </td>
                                        <td className="p-3">
                                            <span className={\`px-2 py-1 rounded text-xs font-bold \${rec.status === 'Verified' ? 'bg-emerald-100 text-emerald-800' : rec.status === 'Denied' ? 'bg-rose-100 text-rose-800' : rec.status === 'Present - Late' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'}\`}>
                                                {rec.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }

`;

// OnlineSubmissionsTab (Restored and optimized)
const onlineSubmissionsTab = `
        // --- ONLINE SUBMISSIONS TAB ---
        function OnlineSubmissionsTab({ user }) {
            const [submissions, setSubmissions] = useState([]);
            const [loading, setLoading] = useState(false);
            const [searchVenue, setSearchVenue] = useState('');

            const fetchSubmissions = async () => {
                if (!user.assignedVenues || user.assignedVenues.length === 0) return;
                setLoading(true);
                try {
                    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'schooling_activities'), where('venueId', 'in', user.assignedVenues));
                    const snap = await getDocs(q);
                    let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    data.sort((a, b) => b.timestamp - a.timestamp);
                    setSubmissions(data);
                } catch(e) { console.error(e); }
                setLoading(false);
            };

            useEffect(() => { fetchSubmissions(); }, [user]);

            const handleVerify = async (id, status) => {
                try {
                    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'schooling_activities', id), { status: status, verifiedByMentor: user.name });
                    fetchSubmissions(); // refresh
                } catch(e) { alert("Error verifying."); }
            };

            const filtered = submissions.filter(s => !searchVenue || (s.venueName || '').toLowerCase().includes(searchVenue.toLowerCase()));
            
            // Group by venue
            const grouped = filtered.reduce((acc, curr) => {
                const v = curr.venueName || 'Unknown Venue';
                if (!acc[v]) acc[v] = [];
                acc[v].push(curr);
                return acc;
            }, {});

            return (
                <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden dark:bg-slate-800 dark:border-slate-700">
                    <div className="p-4 bg-slate-50 border-b flex justify-between items-center dark:bg-slate-900">
                        <div className="font-bold text-slate-700 flex items-center gap-2 dark:text-slate-300">
                            <CheckSquare size={20} className="text-primary-600" /> Online Submissions
                        </div>
                        <div className="flex gap-2">
                            <input type="text" placeholder="Filter by Venue" value={searchVenue} onChange={e => setSearchVenue(e.target.value)} className="p-2 border border-slate-300 rounded-lg text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
                            <button onClick={fetchSubmissions} className="p-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors" title="Refresh">
                                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                    </div>
                    <div className="p-4">
                        {loading ? (
                            <div className="text-center p-8 text-slate-500"><Loader2 className="animate-spin mx-auto mb-2" size={24}/>Loading...</div>
                        ) : submissions.length === 0 ? (
                            <div className="text-center p-8 text-slate-500">No online submissions found for your venues.</div>
                        ) : (
                            Object.keys(grouped).map(venue => (
                                <div key={venue} className="mb-6">
                                    <h3 className="font-black text-slate-700 dark:text-slate-300 mb-3 bg-slate-100 dark:bg-slate-800 p-2 rounded">{venue}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {grouped[venue].map(sub => (
                                            <div key={sub.id} className="border border-slate-200 rounded-lg p-4 shadow-sm dark:border-slate-700">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <div className="font-bold text-slate-800 dark:text-slate-200">{sub.traineeName || 'Trainee'}</div>
                                                        <div className="text-xs text-slate-500">{sub.company}</div>
                                                    </div>
                                                    <span className={\`px-2 py-1 rounded text-xs font-bold \${sub.status === 'Verified' ? 'bg-emerald-100 text-emerald-800' : sub.status === 'Denied' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}\`}>
                                                        {sub.status || 'Pending'}
                                                    </span>
                                                </div>
                                                <div className="bg-slate-50 p-2 rounded mb-3 text-sm dark:bg-slate-900">
                                                    <div className="font-semibold">{sub.activityType}</div>
                                                    <div className="text-xs text-slate-600 dark:text-slate-400">{sub.date}</div>
                                                    {sub.reflection && <div className="mt-2 text-slate-700 italic border-l-2 border-slate-300 pl-2 dark:text-slate-300 dark:border-slate-600">"{sub.reflection}"</div>}
                                                </div>
                                                {(!sub.status || sub.status === 'Pending') && (
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleVerify(sub.id, 'Verified')} className="flex-1 bg-emerald-600 text-white text-xs font-bold py-2 rounded hover:bg-emerald-700">Verify</button>
                                                        <button onClick={() => handleVerify(sub.id, 'Denied')} className="flex-1 bg-rose-600 text-white text-xs font-bold py-2 rounded hover:bg-rose-700">Deny</button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            );
        }

`;

const logsTab = `
        // --- LOGS TAB ---
        function LogsTab({ user }) {
            const [logs, setLogs] = useState([]);
            const [loading, setLoading] = useState(false);

            const fetchLogs = async () => {
                setLoading(true);
                try {
                    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'mentor_clock_records'), where('mentorUid', '==', user.uid));
                    const snap = await getDocs(q);
                    let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    data.sort((a, b) => b.timestamp - a.timestamp);
                    setLogs(data);
                } catch(e) { console.error(e); }
                setLoading(false);
            };

            useEffect(() => { fetchLogs(); }, [user]);

            return (
                <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden dark:bg-slate-800 dark:border-slate-700">
                    <div className="p-4 bg-slate-50 border-b flex justify-between items-center dark:bg-slate-900">
                        <div className="font-bold text-slate-700 flex items-center gap-2 dark:text-slate-300">
                            <ClipboardList size={20} className="text-primary-600" /> My Clock Logs
                        </div>
                        <button onClick={fetchLogs} className="p-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors" title="Refresh">
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                <tr>
                                    <th className="p-3">Action</th>
                                    <th className="p-3">Venue</th>
                                    <th className="p-3">Date/Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && <tr><td colSpan="3" className="p-8 text-center text-slate-500"><Loader2 className="animate-spin mx-auto mb-2" size={24}/>Loading...</td></tr>}
                                {!loading && logs.length === 0 && <tr><td colSpan="3" className="p-8 text-center text-slate-500">No logs found.</td></tr>}
                                {!loading && logs.map(log => (
                                    <tr key={log.id} className="border-t border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="p-3 font-bold">
                                            <span className={\`\${log.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}\`}>{log.type}</span>
                                        </td>
                                        <td className="p-3">
                                            <div className="font-semibold text-slate-800 dark:text-slate-200">{log.venueName}</div>
                                            {log.inGeofence ? <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1 rounded">In Range</span> : <span className="text-[10px] bg-amber-100 text-amber-800 px-1 rounded">{log.distanceMeters}m away</span>}
                                        </td>
                                        <td className="p-3 text-slate-600 dark:text-slate-400">
                                            <div>{log.date}</div>
                                            <div className="text-xs font-semibold">{log.time}</div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }

`;

const clockInTabHeader = `
        // --- CLOCK IN TAB ---
        function ClockInTab({ user }) {
            const [clockStatus, setClockStatus] = useState(null);
            const [loading, setLoading] = useState(false);
            const [gpsStatus, setGpsStatus] = useState('');
            const [scannedData, setScannedData] = useState(null);
            const [previewLoc, setPreviewLoc] = useState(null);
            const [showClockOutModal, setShowClockOutModal] = useState(false);
            const [clockOutReason, setClockOutReason] = useState('');
            
            const [myVenues, setMyVenues] = useState([]);
            const [todayRecords, setTodayRecords] = useState([]);
            
            const scannerRef = useRef(null);
            const myVenuesRef = useRef([]);
            const todayStr = new Date().toISOString().split('T')[0];

            // Fetch assigned venues (one-time)
            useEffect(() => {
                const fetchVenues = async () => {
                    const mentorsQuery = query(collection(db, 'artifacts', appId, 'public', 'data', 'mentors'), where('email', '==', user.email));
                    const mentorSnap = await getDocs(mentorsQuery);
                    if (!mentorSnap.empty) {
                        const assignedVenueIds = mentorSnap.docs[0].data().assignedVenues || [];
                        const venuesSnap = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'venues'));
                        const allVenues = venuesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                        const allowed = allVenues.filter(v => assignedVenueIds.includes(v.id));
                        setMyVenues(allowed);
                    }
                };
                fetchVenues();
            }, [user.email]);

`;

const newContent = part1 + historyTabUI + onlineSubmissionsTab + logsTab + clockInTabHeader + part2 + part3;
fs.writeFileSync(file, newContent);
console.log('Successfully reconstructed the missing tabs! Total bytes:', newContent.length);
