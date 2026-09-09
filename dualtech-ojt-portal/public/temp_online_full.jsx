function OnlineSchoolingSubmissionsTab() {
            const [submissions, setSubmissions] = useState([]);
            const [loading, setLoading] = useState(true);
            const [selectedSub, setSelectedSub] = useState(null);
            const [feedback, setFeedback] = useState('');
            const [isUpdating, setIsUpdating] = useState(false);

            // Filters & Search
            const [filterStatus, setFilterStatus] = useState('Pending Verification');
            const [searchQuery, setSearchQuery] = useState('');

            useEffect(() => {
                // Fetch all online schooling logs
                const q = query(
                    collection(db, 'artifacts', appId, 'public', 'data', 'mentoring_attendance'),
                    where('activityType', '==', 'Online Schooling')
                );
                const unsub = onSnapshot(q, (snap) => {
                    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    // Sort newest first
                    data.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                    setSubmissions(data);
                    setLoading(false);
                });
                return () => unsub();
            }, []);

            // Apply filters and dynamic search
            const filteredSubmissions = submissions.filter(sub => {
                const matchesStatus = filterStatus === 'All' ? true : sub.status === filterStatus;
                const queryStr = searchQuery.toLowerCase();
                const matchesSearch = queryStr === '' ||
                    (sub.traineeName || '').toLowerCase().includes(queryStr) ||
                    (sub.studentId || '').toLowerCase().includes(queryStr) ||
                    (sub.company || '').toLowerCase().includes(queryStr);

                return matchesStatus && matchesSearch;
            });

            const handleValidate = async (statusToSet) => {
                if (!selectedSub) return;
                setIsUpdating(true);
                try {
                    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'mentoring_attendance', selectedSub.id);
                    await updateDoc(docRef, {
                        status: statusToSet,
                        feedback: feedback,
                        verifiedByMentor: auth.currentUser?.email || 'Admin',
                        updatedAt: new Date().getTime()
                    });
                    alert(`Submission successfully marked as ${statusToSet}!`);
                    setSelectedSub(null);
                    setFeedback('');
                } catch (err) {
                    alert("Error updating status: " + err.message);
                }
                setIsUpdating(false);
            };

            // --- NEW: Delete Submission Logic ---
            const handleDelete = async (id) => {
                if (window.confirm("Are you sure you want to permanently delete this submission record?")) {
                    try {
                        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'mentoring_attendance', id));
                        // alert removed for smoother UX, item just disappears
                    } catch (err) {
                        alert("Error deleting record: " + err.message);
                    }
                }
            };

            const openModal = (sub) => {
                setSelectedSub(sub);
                setFeedback(sub.feedback || '');
            };

            return (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="border-b border-slate-200 dark:border-slate-700 pb-4 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                                <CheckSquare className="text-emerald-600" /> Online Submissions
                            </h2>
                            <p className="text-slate-500 text-sm mt-1">Review and validate outputs from trainees assigned to Online Schooling.</p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                            {/* NEW: Search Bar */}
                            <div className="relative w-full sm:w-64">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                                    <Search size={16} />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Search name, ID, or company..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-emerald-500 shadow-sm"
                                />
                            </div>

                            {/* Status Filter */}
                            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm w-full sm:w-auto">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-2">Status:</label>
                                <select
                                    value={filterStatus}
                                    onChange={e => setFilterStatus(e.target.value)}
                                    className="bg-transparent border-none text-slate-800 font-bold text-sm outline-none cursor-pointer"
                                >
                                    <option value="Pending Verification">Pending Validation</option>
                                    <option value="Verified">Validated</option>
                                    <option value="All">All Submissions</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="p-16 text-center text-slate-500 flex flex-col items-center">
                                <Loader2 className="animate-spin mb-3 text-emerald-500" size={32} />
                                <p className="font-medium">Loading submissions...</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-slate-50 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase text-xs">
                                        <tr>
                                            <th className="p-4 font-bold">Date / Time</th>
                                            <th className="p-4 font-bold">Trainee</th>
                                            <th className="p-4 font-bold">Topics Covered</th>
                                            <th className="p-4 font-bold">Status</th>
                                            <th className="p-4 font-bold text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredSubmissions.length === 0 ? (
                                            <tr><td colSpan="5" className="p-8 text-center text-slate-400 italic">No {filterStatus} submissions found.</td></tr>
                                        ) : filteredSubmissions.map(sub => (
                                            <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4 text-slate-600">
                                                    <div className="font-bold">{sub.date}</div>
                                                    <div className="text-xs">{sub.time}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-bold text-slate-800">{sub.traineeName}</div>
                                                    <div className="text-xs text-slate-500">{sub.studentId} • {sub.company}</div>
                                                </td>
                                                <td className="p-4 text-xs">
                                                    <div className="text-emerald-700 dark:text-emerald-400 font-bold max-w-[200px] truncate" title={sub.vflTopic}>VFL: {sub.vflTopic}</div>
                                                    <div className="text-blue-700 dark:text-blue-400 font-bold max-w-[200px] truncate mt-1" title={sub.lsceTopic}>LSCE: {sub.lsceTopic}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${sub.status === 'Verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                                        }`}>
                                                        {sub.status === 'Pending Verification' ? 'Pending' : sub.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <div className="flex justify-center items-center gap-2">
                                                        <button
                                                            onClick={() => openModal(sub)}
                                                            className="bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold px-4 py-2 rounded-lg text-xs transition-colors shadow-sm"
                                                        >
                                                            Review Output
                                                        </button>

                                                        {/* NEW: Delete Button */}
                                                        <button
                                                            onClick={() => handleDelete(sub.id)}
                                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                                                            title="Delete Submission"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* REVIEW MODAL */}
                    {selectedSub && (
                        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
                            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                                <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 flex justify-between items-center shrink-0">
                                    <div>
                                        <h3 className="font-black text-slate-800 text-lg">Review Submission</h3>
                                        <p className="text-xs text-slate-500 mt-1">{selectedSub.traineeName} • {selectedSub.date}</p>
                                    </div>
                                    <button onClick={() => setSelectedSub(null)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button>
                                </div>

                                <div className="p-6 overflow-y-auto space-y-6">
                                    {/* NEW: Grid updated to 3 columns to include DR Entry */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                                        {/* VFL Output */}
                                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50">
                                            <h4 className="text-xs font-bold text-emerald-600 uppercase mb-2">VFL Output</h4>
                                            <p className="text-sm font-semibold text-slate-800 mb-3">{selectedSub.vflTopic}</p>
                                            <a href={selectedSub.vflDriveUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 py-3 rounded-lg text-sm font-bold hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors shadow-sm">
                                                <ExternalLink size={16} /> View Image File
                                            </a>
                                        </div>

                                        {/* LSCE Output */}
                                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50">
                                            <h4 className="text-xs font-bold text-blue-600 uppercase mb-2">LSCE Output</h4>
                                            <p className="text-sm font-semibold text-slate-800 mb-3">{selectedSub.lsceTopic}</p>
                                            <a href={selectedSub.lsceDriveUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 py-3 rounded-lg text-sm font-bold hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors shadow-sm">
                                                <ExternalLink size={16} /> View Image File
                                            </a>
                                        </div>

                                        {/* NEW: DR Entry Output */}
                                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 flex flex-col justify-between">
                                            <div>
                                                <h4 className="text-xs font-bold text-purple-600 uppercase mb-2">DR Entry</h4>
                                                <p className="text-xs text-slate-500 mb-3">Trainee Daily Reading</p>
                                            </div>
                                            {selectedSub.drEntryDriveUrl ? (
                                                <a href={selectedSub.drEntryDriveUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400 py-3 rounded-lg text-sm font-bold hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors shadow-sm mt-auto">
                                                    <ExternalLink size={16} /> View Image File
                                                </a>
                                            ) : (
                                                <div className="flex items-center justify-center py-3 bg-slate-100 rounded-lg text-xs font-bold text-slate-400 mt-auto">
                                                    No File Attached
                                                </div>
                                            )}
                                        </div>

                                    </div>

                                    {selectedSub.notes && (
                                        <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
                                            <h4 className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-2">Trainee Insights</h4>
                                            <p className="text-sm text-slate-700 dark:text-slate-200 italic">"{selectedSub.notes}"</p>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                                            <MessageSquare size={14} /> Provide Feedback
                                        </label>
                                        <textarea
                                            value={feedback}
                                            onChange={e => setFeedback(e.target.value)}
                                            placeholder="Add encouraging feedback or corrections..."
                                            className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 bg-white dark:bg-slate-800 resize-none text-sm shadow-sm"
                                            rows="3"
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 flex gap-3 shrink-0">
                                    <button
                                        disabled={isUpdating}
                                        onClick={() => handleValidate('Verified')}
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center gap-2 shadow-sm"
                                    >
                                        {isUpdating ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />} Validate & Approve
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        // --- MENTOR CLOCK RECORDS TAB ---
        function MentorClockRecordsTab() {
            const [records, setRecords] = useState([]);
            const [loading, setLoading] = useState(true);
            const [searchTerm, setSearchTerm] = useState('');
            const [dateFrom, setDateFrom] = useState('');
            const [dateTo, setDateTo] = useState('');
            const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

            // Real-time listener on mentor_clock_records
            useEffect(() => {
                const unsub = onSnapshot(
                    collection(db, 'artifacts', appId, 'public', 'data', 'mentor_clock_records'),
                    (snap) => {
                        const recs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                        setRecords(recs);
                        setLoading(false);
                    },
                    (err) => {
                        console.error('Clock records listen error:', err);
                        setLoading(false);
                    }
                );
                return () => unsub();
            }, []);

            // Pair clock-in/out records by mentor + date + venue
            const pairedRecords = useMemo(() => {
                // Group by mentorUid + date + venueId
                const groups = {};
                records.forEach(rec => {
                    const key = `${rec.mentorUid}_${rec.date}_${rec.venueId}`;
                    if (!groups[key]) groups[key] = { ins: [], outs: [], mentorName: rec.mentorName, mentorEmail: rec.mentorEmail, venueName: rec.venueName, date: rec.date };
                    if (rec.type === 'IN') groups[key].ins.push(rec);
                    else groups[key].outs.push(rec);
                });

                // Sort ins and outs by timestamp
                Object.values(groups).forEach(g => {
                    g.ins.sort((a, b) => a.timestamp - b.timestamp);
                    g.outs.sort((a, b) => a.timestamp - b.timestamp);
                });

                // Create paired rows
                const rows = [];
                Object.values(groups).forEach(g => {
                    const maxPairs = Math.max(g.ins.length, g.outs.length, 1);
                    for (let i = 0; i < maxPairs; i++) {
                        const inRec = g.ins[i] || null;
                        const outRec = g.outs[i] || null;

                        let hoursRendered = '—';
                        if (inRec && outRec) {
                            const diff = (outRec.timestamp - inRec.timestamp) / (1000 * 60 * 60);
                            hoursRendered = diff.toFixed(2);
                        } else if (inRec && !outRec) {
                            hoursRendered = 'Open';
                        }

                        // Build remarks
                        const remarks = [];
                        if (inRec && !inRec.inGeofence) remarks.push(`Clock In: Out of Location (${inRec.distanceMeters}m)`);
                        if (outRec && !outRec.inGeofence) remarks.push(`Clock Out: Out of Location (${outRec.distanceMeters}m)`);
                        if (inRec && inRec.inGeofence && (!outRec || outRec.inGeofence)) remarks.push('In Location');

                        rows.push({
                            mentorName: g.mentorName,
                            venueName: g.venueName,
                            date: g.date,
                            clockIn: inRec ? inRec.time : '—',
                            clockOut: outRec ? outRec.time : '—',
                            hoursRendered,
                            remarks: remarks.join('; '),
                            inGeofenceIn: inRec ? inRec.inGeofence : true,
                            inGeofenceOut: outRec ? outRec.inGeofence : true,
                            timestamp: inRec?.timestamp || outRec?.timestamp || 0
                        });
                    }
                });

                return rows;
            }, [records]);

            // Apply search and date range filters
            const filteredRecords = useMemo(() => {
                return pairedRecords.filter(row => {
                    const q = searchTerm.toLowerCase();
                    const matchesSearch = q === '' ||
                        (row.mentorName || '').toLowerCase().includes(q) ||
                        (row.venueName || '').toLowerCase().includes(q);

                    let matchesDate = true;
                    if (dateFrom && row.date < dateFrom) matchesDate = false;
                    if (dateTo && row.date > dateTo) matchesDate = false;

                    return matchesSearch && matchesDate;
                });
            }, [pairedRecords, searchTerm, dateFrom, dateTo]);

            // Apply sorting
            const sortedRecords = useMemo(() => {
                const sorted = [...filteredRecords];
                sorted.sort((a, b) => {
     