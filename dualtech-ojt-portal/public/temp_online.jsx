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
                   