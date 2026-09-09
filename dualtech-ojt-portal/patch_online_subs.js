const fs = require('fs');
const file = 'c:\\Users\\rober\\dualtech-ojt-portal\\public\\schooling.html';
const content = fs.readFileSync(file, 'utf8');

const newOnlineSubmissionsTab = `        // --- ONLINE SUBMISSIONS TAB ---
        function OnlineSubmissionsTab({ user }) {
            const [submissions, setSubmissions] = useState([]);
            const [groupedSubmissions, setGroupedSubmissions] = useState({});
            const [loading, setLoading] = useState(false);
            const [searchVenue, setSearchVenue] = useState('');
            
            const [trainees, setTrainees] = useState([]);
            const [venues, setVenues] = useState([]);

            // Load trainees and venues first
            useEffect(() => {
                const loadData = async () => {
                    try {
                        const [tSnap, vSnap] = await Promise.all([
                            getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'trainees')),
                            getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'venues'))
                        ]);
                        setTrainees(tSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                        setVenues(vSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                    } catch (e) {
                        console.error('Error loading trainees/venues:', e);
                    }
                };
                loadData();
            }, []);

            const fetchSubmissions = async () => {
                if (!user.assignedVenues || user.assignedVenues.length === 0 || trainees.length === 0 || venues.length === 0) return;
                setLoading(true);
                try {
                    // Fetch all online schooling submissions
                    const q = query(
                        collection(db, 'artifacts', appId, 'public', 'data', 'mentoring_attendance'), 
                        where('activityType', '==', 'Online Schooling')
                    );
                    const snap = await getDocs(q);
                    let allSubs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    
                    // Filter submissions by matching trainee's venue with user's assigned venues
                    let filtered = [];
                    allSubs.forEach(sub => {
                        const trainee = trainees.find(t => (t.studentId === sub.studentId || t['Student ID#'] === sub.studentId));
                        if (trainee && trainee.assignedVenue && user.assignedVenues.includes(trainee.assignedVenue)) {
                            const venueObj = venues.find(v => v.id === trainee.assignedVenue);
                            filtered.push({
                                ...sub,
                                matchedVenueId: trainee.assignedVenue,
                                matchedVenueName: venueObj ? venueObj.name : trainee.assignedVenue
                            });
                        }
                    });
                    
                    filtered.sort((a, b) => b.timestamp - a.timestamp);
                    setSubmissions(filtered);
                } catch(e) { console.error(e); }
                setLoading(false);
            };

            // Re-fetch when dependencies load
            useEffect(() => {
                fetchSubmissions();
            }, [user, trainees, venues]);

            // Handle verifying or denying
            const handleVerify = async (id, status) => {
                try {
                    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'mentoring_attendance', id), { 
                        status: status, 
                        verifiedByMentor: user.name,
                        updatedAt: new Date().getTime()
                    });
                    fetchSubmissions(); // refresh
                } catch(e) { alert("Error verifying submission."); }
            };

            // Search by venue name and group by venue name
            useEffect(() => {
                const searchFiltered = submissions.filter(s => 
                    !searchVenue || (s.matchedVenueName || '').toLowerCase().includes(searchVenue.toLowerCase())
                );
                
                const grouped = searchFiltered.reduce((acc, curr) => {
                    const v = curr.matchedVenueName || 'Unknown Venue';
                    if (!acc[v]) acc[v] = [];
                    acc[v].push(curr);
                    return acc;
                }, {});
                
                setGroupedSubmissions(grouped);
            }, [submissions, searchVenue]);

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
                        ) : Object.keys(groupedSubmissions).length === 0 ? (
                            <div className="text-center p-8 text-slate-500">No online submissions found for your venues.</div>
                        ) : (
                            Object.keys(groupedSubmissions).map(venueName => (
                                <div key={venueName} className="mb-6">
                                    <h3 className="font-black text-slate-700 dark:text-slate-300 mb-3 bg-slate-100 dark:bg-slate-800 p-2 rounded">{venueName}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {groupedSubmissions[venueName].map(sub => (
                                            <div key={sub.id} className="border border-slate-200 rounded-lg p-4 shadow-sm dark:border-slate-700 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <div className="font-bold text-slate-800 dark:text-slate-200">{sub.traineeName || 'Trainee'}</div>
                                                            <div className="text-xs text-slate-500">{sub.studentId} - {sub.company}</div>
                                                        </div>
                                                        <span className={\`px-2 py-1 rounded text-xs font-bold whitespace-nowrap \${sub.status === 'Verified' ? 'bg-emerald-100 text-emerald-800' : sub.status === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}\`}>
                                                            {sub.status || 'Pending'}
                                                        </span>
                                                    </div>
                                                    <div className="bg-slate-50 p-2 rounded mb-3 text-sm dark:bg-slate-900 border border-slate-100 dark:border-slate-700">
                                                        <div className="font-semibold text-primary-700">{sub.activityType}</div>
                                                        <div className="text-xs font-bold text-slate-600 dark:text-slate-400">{sub.topic}</div>
                                                        <div className="text-xs text-slate-500">{sub.date} at {sub.time}</div>
                                                        {sub.reflection && (
                                                            <div className="mt-3 text-slate-700 italic border-l-2 border-slate-300 pl-3 py-1 dark:text-slate-300 dark:border-slate-600 text-xs line-clamp-3 hover:line-clamp-none transition-all">
                                                                "{sub.reflection}"
                                                            </div>
                                                        )}
                                                        {sub.url && (
                                                            <a href={sub.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline">
                                                                View Attachment <ExternalLink size={12} />
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {(!sub.status || sub.status === 'Pending Verification') && (
                                                    <div className="flex gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                                                        <button onClick={() => handleVerify(sub.id, 'Verified')} className="flex-1 bg-emerald-600 text-white text-xs font-bold py-2.5 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">Approve</button>
                                                        <button onClick={() => handleVerify(sub.id, 'Rejected')} className="flex-1 bg-rose-600 text-white text-xs font-bold py-2.5 rounded-lg hover:bg-rose-700 transition-colors shadow-sm">Reject</button>
                                                    </div>
                                                )}
                                                {sub.status && sub.status !== 'Pending Verification' && sub.verifiedByMentor && (
                                                    <div className="mt-2 text-[10px] text-slate-400 text-right">
                                                        Processed by: {sub.verifiedByMentor}
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
        }`;

// Using Regex to replace the old OnlineSubmissionsTab
const regex = /\/\/ --- ONLINE SUBMISSIONS TAB ---[\s\S]*?function OnlineSubmissionsTab\(\{\s*user\s*\}\)\s*\{[\s\S]*?return\s*\([\s\S]*?\);\s*\}/;

const replaced = content.replace(regex, newOnlineSubmissionsTab);

if(replaced === content) {
    console.error("Failed to replace: regex did not match!");
} else {
    fs.writeFileSync(file, replaced);
    console.log("Successfully replaced OnlineSubmissionsTab. New length: " + replaced.length);
}
