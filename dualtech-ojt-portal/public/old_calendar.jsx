        function CalendarTab() {
            const [schedules, setSchedules] = useState([]);
            const [venues, setVenues] = useState([]);
            const [isSubmitting, setIsSubmitting] = useState(false);

            // View Toggle State ('table' or 'calendar')
            const [viewMode, setViewMode] = useState('table');

            // CSV Import State
            const [isImporting, setIsImporting] = useState(false);
            const fileInputRef = useRef(null);

            const downloadTemplate = () => {
                const headers = ['Activity Type', 'Viewable From', 'Viewable Until', 'Meeting Dates', 'Topic', 'Video Link', 'LSCE Topic', 'LSCE Video Link', 'VFL Topic', 'VFL Video Link'];
                const exampleRow1 = ['Schooling', '2023-10-01', '2023-10-07', '2023-10-02,2023-10-03', '', '', 'Module 1', 'https://youtube.com/...', 'Module 1', 'https://youtube.com/...'];
                const exampleRow2 = ['Retreat', '2023-11-01', '2023-11-07', '2023-11-05', 'Retreat Topic 1', 'https://youtube.com/...', '', '', '', ''];

                const csvContent = headers.join(',') + '\n' + exampleRow1.join(',') + '\n' + exampleRow2.join(',');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", "calendar_import_template.csv");
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            };

            const handleFileChange = (e) => {
                const file = e.target.files[0];
                if (!file) return;

                window.Papa.parse(file, {
                    header: true,
                    skipEmptyLines: true,
                    complete: async (results) => {
                        setIsImporting(true);
                        let successCount = 0;
                        let errorCount = 0;

                        try {
                            for (const row of results.data) {
                                const activityType = row['Activity Type']?.trim();
                                const viewableFrom = row['Viewable From']?.trim();
                                const viewableUntil = row['Viewable Until']?.trim();

                                if (!activityType || !viewableFrom || !viewableUntil) {
                                    errorCount++;
                                    continue;
                                }

                                let meetingDates = [];
                                if (row['Meeting Dates']) {
                                    meetingDates = row['Meeting Dates'].split(',').map(d => d.trim()).filter(d => d);
                                }

                                const payload = {
                                    activityType,
                                    viewableFrom,
                                    viewableUntil,
                                    meetingDates,
                                    createdAt: new Date().toISOString(),
                                    updatedAt: new Date().toISOString()
                                };

                                if (activityType === 'Schooling') {
                                    payload.lsceTopic = row['LSCE Topic']?.trim() || '';
                                    payload.lsceVideoLink = row['LSCE Video Link']?.trim() || '';
                                    payload.vflTopic = row['VFL Topic']?.trim() || '';
                                    payload.vflVideoLink = row['VFL Video Link']?.trim() || '';
                                    payload.topic = null;
                                    payload.videoLink = null;
                                } else {
                                    payload.topic = row['Topic']?.trim() || '';
                                    payload.videoLink = row['Video Link']?.trim() || '';
                                    payload.lsceTopic = null;
                                    payload.lsceVideoLink = null;
                                    payload.vflTopic = null;
                                    payload.vflVideoLink = null;
                                }

                                await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'schooling_calendar'), payload);
                                successCount++;
                            }
                            alert(`Import completed! Successfully added ${successCount} schedules. Errors/Skipped: ${errorCount}`);
                        } catch (err) {
                            console.error("Import error", err);
                            alert("An error occurred during import: " + err.message);
                        } finally {
                            setIsImporting(false);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                        }
                    },
                    error: (err) => {
                        console.error("Parse error", err);
                        alert("Failed to parse the CSV file.");
                    }
                });
            };

            // Calendar Navigation State
            const [currentCalDate, setCurrentCalDate] = useState(new Date());

            // Form & Edit State
            const [editingId, setEditingId] = useState(null);
            const [formData, setFormData] = useState({
                activityType: 'Schooling',
                topic: '',
                videoLink: '',
                lsceTopic: '',
                lsceVideoLink: '',
                vflTopic: '',
                vflVideoLink: '',
                viewableFrom: '',
                viewableUntil: ''
            });

            // Selected Dates Array
            const [selectedDates, setSelectedDates] = useState([]);
            const [dateToAdd, setDateToAdd] = useState('');
            
            // Exempted Venues Array
            const [selectedExemptedVenues, setSelectedExemptedVenues] = useState([]);

            // Fetch existing schedules and venues
            useEffect(() => {
                const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'schooling_calendar'), orderBy('viewableFrom', 'asc'));
                const unsub = onSnapshot(q, (snap) => {
                    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setSchedules(data);
                }, (error) => {
                    console.error("Error fetching schedules:", error);
                });

                const unsubVenues = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'venues'), (snap) => {
                    setVenues(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                });

                return () => { unsub(); unsubVenues(); };
            }, []);

            const handleAddDate = () => {
                if (!dateToAdd) return;
                if (selectedDates.includes(dateToAdd)) return alert("Date is already in the list.");
                setSelectedDates([...selectedDates, dateToAdd].sort());
                setDateToAdd('');
            };

            const handleRemoveDate = (dateToRemove) => {
                setSelectedDates(selectedDates.filter(d => d !== dateToRemove));
            };

            const resetForm = () => {
                setFormData({
                    activityType: 'Schooling',
                    topic: '',
                    videoLink: '',
                    lsceTopic: '',
                    lsceVideoLink: '',
                    vflTopic: '',
                    vflVideoLink: '',
                    viewableFrom: '',
                    viewableUntil: ''
                });
                setSelectedDates([]);
                setSelectedExemptedVenues([]);
                setEditingId(null);
            };

            const handleEdit = (schedule) => {
                setEditingId(schedule.id);
                setFormData({
                    activityType: schedule.activityType || 'Schooling',
                    topic: schedule.topic || '',
                    videoLink: schedule.videoLink || '',
                    lsceTopic: schedule.lsceTopic || '',
                    lsceVideoLink: schedule.lsceVideoLink || '',
                    vflTopic: schedule.vflTopic || '',
                    vflVideoLink: schedule.vflVideoLink || '',
                    viewableFrom: schedule.viewableFrom || '',
                    viewableUntil: schedule.viewableUntil || ''
                });
                setSelectedDates(schedule.meetingDates || []);
                setSelectedExemptedVenues(schedule.exemptedVenues || []);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            };

            const handleSubmit = async (e) => {
                e.preventDefault();
                if (selectedDates.length === 0) return alert("Please select at least one meeting date.");
                if (formData.viewableFrom > formData.viewableUntil) return alert("Error: 'Viewable From' cannot be later than 'Viewable Until'.");

                setIsSubmitting(true);
                try {
                    const payload = {
                        activityType: formData.activityType,
                        viewableFrom: formData.viewableFrom,
                        viewableUntil: formData.viewableUntil,
                        meetingDates: selectedDates,
                        exemptedVenues: selectedExemptedVenues,
                        updatedAt: new Date().toISOString()
                    };

                    // Conditionally save fields based on activity type
                    if (formData.activityType === 'Schooling') {
                        payload.lsceTopic = formData.lsceTopic;
                        payload.lsceVideoLink = formData.lsceVideoLink;
                        payload.vflTopic = formData.vflTopic;
                        payload.vflVideoLink = formData.vflVideoLink;
                        // Clear out non-schooling fields just in case
                        payload.topic = null;
                        payload.videoLink = null;
                    } else {
                        payload.topic = formData.topic;
                        payload.videoLink = formData.videoLink;
                        // Clear out schooling fields
                        payload.lsceTopic = null;
                        payload.lsceVideoLink = null;
                        payload.vflTopic = null;
                        payload.vflVideoLink = null;
                    }

                    if (editingId) {
                        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'schooling_calendar', editingId), payload);
                        alert("Schedule updated successfully!");
                    } else {
                        payload.createdAt = new Date().toISOString();
                        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'schooling_calendar'), payload);
                        alert("Schedule added successfully!");
                    }

                    resetForm();
                } catch (error) {
                    console.error("Error saving schedule:", error);
                    alert("Failed to save schedule: " + error.message);
                }
                setIsSubmitting(false);
            };

            const handleDelete = async (id) => {
                if (window.confirm("Are you sure you want to delete this schedule?")) {
                    try {
                        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'schooling_calendar', id));
                        if (editingId === id) resetForm();
                    } catch (error) {
                        alert("Error deleting schedule: " + error.message);
                    }
                }
            };

            // --- CALENDAR GRID LOGIC ---
            const nextMonth = () => setCurrentCalDate(new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() + 1, 1));
            const prevMonth = () => setCurrentCalDate(new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() - 1, 1));

            const year = currentCalDate.getFullYear();
            const month = currentCalDate.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const firstDay = new Date(year, month, 1).getDay();

            const blanks = Array(firstDay).fill(null);
            const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

            // Calculate currently active online venues
            const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
            const activeOnlineVenues = venues.filter(v => v.onlineOverride && new Date(v.onlineOverrideExpiry) >= todayStart);

            return (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="border-b border-slate-200 dark:border-slate-700 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                                <Calendar className="text-blue-600 dark:text-blue-400" /> Calendar of Schedules
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage weekly schooling activities, topics, and video materials.</p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                            <button
                                onClick={downloadTemplate}
                                className="px-3 py-1.5 md:px-4 md:py-2 text-xs font-bold rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-2 shadow-sm border border-blue-100 dark:border-blue-800"
                            >
                                <Download size={14} /> Download Template
                            </button>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isImporting}
                                className="px-3 py-1.5 md:px-4 md:py-2 text-xs font-bold rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 transition-colors flex items-center gap-2 shadow-sm border border-emerald-100 dark:border-emerald-800 disabled:opacity-50"
                            >
                                {isImporting ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                                Import Activities
                            </button>

                            {/* View Toggle */}
                            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg transition-colors ml-0 md:ml-2">
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`px-4 py-2 text-xs font-bold rounded-md transition-colors flex items-center gap-2 ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                >
                                    <Menu size={14} /> Table View
                                </button>
                                <button
                                    onClick={() => setViewMode('calendar')}
                                    className={`px-4 py-2 text-xs font-bold rounded-md transition-colors flex items-center gap-2 ${viewMode === 'calendar' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                >
                                    <Calendar size={14} /> Calendar View
                                </button>
                            </div>
                        </div>
                    </div>

                    {activeOnlineVenues.length > 0 && (
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-4 flex items-start gap-3 transition-colors">
                            <Wifi className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" size={20} />
                            <div>
                                <h3 className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">Active Online Venue Overrides</h3>
                                <p className="text-emerald-600 dark:text-emerald-400/80 text-xs mt-1 mb-2">The following physical venues currently have temporary online access to calendar materials for their trainees.</p>
                                <div className="flex flex-wrap gap-2">
                                    {activeOnlineVenues.map(v => (
                                        <span key={v.id} className="bg-white dark:bg-slate-800 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm">
                                            {v.name} <span className="font-normal text-[10px] text-emerald-500 dark:text-emerald-500/80">(Expires: {new Date(v.onlineOverrideExpiry).toLocaleDateString()})</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Form Section */}
                        <div className={`xl:col-span-1 p-6 rounded-2xl shadow-sm border transition-colors h-fit ${editingId ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className={`font-bold flex items-center gap-2 ${editingId ? 'text-amber-800 dark:text-amber-400' : 'text-slate-800 dark:text-white'}`}>
                                    {editingId ? <Edit size={18} className="text-amber-600 dark:text-amber-500" /> : <Plus size={18} className="text-emerald-500" />}
                                    {editingId ? 'Edit Schedule' : 'Add New Schedule'}
                                </h3>
                                {editingId && (
                                    <button onClick={resetForm} className="text-xs text-amber-700 dark:text-amber-500 hover:text-amber-900 dark:hover:text-amber-300 underline font-bold">
                                        Cancel Edit
                                    </button>
                                )}
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Activity Type</label>
                                    <select
                                        value={formData.activityType}
                                        onChange={e => setFormData({ ...formData, activityType: e.target.value })}
                                        className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:border-blue-500 dark:text-white transition-colors"
                                    >
                                        <option value="Schooling">Schooling (LSCE & VFL)</option>
                                        <option value="Retreat">Retreat</option>
                                        <option value="PDS 9">PDS 9</option>
                                        <option value="PDS 18">PDS 18</option>
                                    </select>
                                </div>

                                <div className="p-4 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl transition-colors">
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-300 uppercase mb-2">Meeting Dates</label>
                                    <div className="flex gap-2 mb-3">
                                        <input
                                            type="date"
                                            value={dateToAdd}
                                            onChange={e => setDateToAdd(e.target.value)}
                                            className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-blue-500 text-sm dark:text-white transition-colors"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddDate}
                                            className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 px-4 font-bold rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors flex items-center gap-1 text-sm"
                                        >
                                            <Plus size={16} /> Add
                                        </button>
                                    </div>
                                    {selectedDates.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {selectedDates.map(date => (
                                                <div key={date} className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-2 shadow-sm transition-colors">
                                                    {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    <button type="button" onClick={() => handleRemoveDate(date)} className="text-red-400 hover:text-red-600 dark:hover:text-red-300 p-0.5 rounded transition-colors"><X size={12} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-[10px] text-slate-400 italic">No dates added yet.</p>
                                    )}
                                </div>

                                {/* EXEMPTED VENUES */}
                                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <MapPin size={12} className="text-amber-500" /> Exempted Venues (No Schooling)
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {venues.length === 0 ? (
                                            <p className="text-xs text-slate-400 col-span-3">No venues found.</p>
                                        ) : (
                                            venues.map(v => {
                                                const isExempted = selectedExemptedVenues.includes(v.name);
                                                return (
                                                    <label key={v.id} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition-colors ${isExempted ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800' : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                                                        <input 
                                                            type="checkbox" 
                                                            checked={isExempted}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedExemptedVenues([...selectedExemptedVenues, v.name]);
                                                                } else {
                                                                    setSelectedExemptedVenues(selectedExemptedVenues.filter(name => name !== v.name));
                                                                }
                                                            }}
                                                            className="rounded text-amber-600 focus:ring-amber-500 bg-white border-slate-300"
                                                        />
                                                        <span className={`text-xs font-bold ${isExempted ? 'text-amber-700 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'}`}>{v.name}</span>
                                                    </label>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>

                                {/* CONDITIONAL TOPIC FIELDS */}
                                {formData.activityType === 'Schooling' ? (
                                    <div className="space-y-4 p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-xl transition-colors">
                                        <div>
                                            <label className="block text-xs font-bold text-blue-800 dark:text-blue-400 uppercase mb-1">LSCE Topic</label>
                                            <input
                                                required
                                                type="text"
                                                placeholder="Enter LSCE Topic..."
                                                value={formData.lsceTopic}
                                                onChange={e => setFormData({ ...formData, lsceTopic: e.target.value })}
                                                className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:border-blue-500 dark:text-white transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 flex justify-between">
                                                LSCE Video Link <span className="text-slate-400 dark:text-slate-500 font-normal">(Optional)</span>
                                            </label>
                                            <input
                                                type="url"
                                                placeholder="https://..."
                                                value={formData.lsceVideoLink}
                                                onChange={e => setFormData({ ...formData, lsceVideoLink: e.target.value })}
                                                className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:border-blue-500 dark:text-white transition-colors"
                                            />
                                        </div>
                                        <hr className="border-blue-200 dark:border-blue-800/50" />
                                        <div>
                                            <label className="block text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase mb-1">VFL Topic</label>
                                            <input
                                                required
                                                type="text"
                                                placeholder="Enter VFL Topic..."
                                                value={formData.vflTopic}
                                                onChange={e => setFormData({ ...formData, vflTopic: e.target.value })}
                                                className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:border-blue-500 dark:text-white transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 flex justify-between">
                                                VFL Video Link <span className="text-slate-400 dark:text-slate-500 font-normal">(Optional)</span>
                                            </label>
                                            <input
                                                type="url"
                                                placeholder="https://..."
                                                value={formData.vflVideoLink}
                                                onChange={e => setFormData({ ...formData, vflVideoLink: e.target.value })}
                                                className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:border-blue-500 dark:text-white transition-colors"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Specific Topic Details</label>
                                            <input
                                                required
                                                type="text"
                                                placeholder="e.g., Module 1: Work Ethics"
                                                value={formData.topic}
                                                onChange={e => setFormData({ ...formData, topic: e.target.value })}
                                                className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:border-blue-500 dark:text-white transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 flex justify-between">
                                                Video Material Link <span className="text-slate-400 dark:text-slate-500 font-normal">(Optional)</span>
                                            </label>
                                            <input
                                                type="url"
                                                placeholder="https://..."
                                                value={formData.videoLink}
                                                onChange={e => setFormData({ ...formData, videoLink: e.target.value })}
                                                className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:border-blue-500 dark:text-white transition-colors"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Viewable From</label>
                                        <input
                                            required
                                            type="date"
                                            value={formData.viewableFrom}
                                            onChange={e => setFormData({ ...formData, viewableFrom: e.target.value })}
                                            className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:border-blue-500 dark:text-white transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Viewable Until</label>
                                        <input
                                            required
                                            type="date"
                                            value={formData.viewableUntil}
                                            onChange={e => setFormData({ ...formData, viewableUntil: e.target.value })}
                                            className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:border-blue-500 dark:text-white transition-colors"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`w-full text-white font-bold py-3 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 mt-4 ${editingId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : (editingId ? "Update Schedule" : "Save Schedule")}
                                </button>
                            </form>
                        </div>

                        {/* Display Section */}
                        <div className="xl:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col transition-colors">

                            {viewMode === 'table' ? (
                                <>
                                    <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 shrink-0">
                                        <BookOpen size={18} className="text-blue-500 dark:text-blue-400" /> Scheduled Activities (List)
                                    </h3>

                                    <div className="overflow-x-auto custom-scrollbar">
                                        <table className="w-full text-left text-sm whitespace-nowrap">
                                            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider transition-colors">
                                                <tr>
                                                    <th className="p-3 font-bold rounded-tl-lg">Activity Type</th>
                                                    <th className="p-3 font-bold">Topics</th>
                                                    <th className="p-3 font-bold">Meeting Dates</th>
                                                    <th className="p-3 font-bold">Video Access</th>
                                                    <th className="p-3 font-bold text-center rounded-tr-lg">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                                {schedules.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="5" className="p-6 text-center text-slate-400 dark:text-slate-500 italic">No schedules created yet.</td>
                                                    </tr>
                                                ) : (
                                                    schedules.map(schedule => (
                                                        <tr key={schedule.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                                            <td className="p-3 align-top pt-4">
                                                                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md ${schedule.activityType === 'Schooling' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' :
                                                                        schedule.activityType === 'Retreat' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400' :
                                                                            'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400'
                                                                    }`}>
                                                                    {schedule.activityType}
                                                                </span>
                                                            </td>
                                                            <td className="p-3 whitespace-normal min-w-[200px] align-top">
                                                                {schedule.activityType === 'Schooling' ? (
                                                                    <div className="space-y-2">
                                                                        <div>
                                                                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 block leading-tight">LSCE:</span>
                                                                            <span className="font-bold text-slate-800 dark:text-slate-200">{schedule.lsceTopic}</span>
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block leading-tight">VFL:</span>
                                                                            <span className="font-bold text-slate-800 dark:text-slate-200">{schedule.vflTopic}</span>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <span className="font-bold text-slate-800 dark:text-slate-200">{schedule.topic}</span>
                                                                )}

                                                                {schedule.exemptedVenues?.length > 0 && (
                                                                    <div className="mt-2 text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-900/20 p-1.5 rounded border border-amber-200 dark:border-amber-800">
                                                                        <span className="flex items-center gap-1 mb-0.5"><MapPin size={10} /> Exempted Venues:</span>
                                                                        <span className="font-medium text-amber-700 dark:text-amber-300">{schedule.exemptedVenues.join(', ')}</span>
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="p-3 text-xs text-slate-600 dark:text-slate-400 align-top pt-4">
                                                                <div className="flex flex-col gap-1">
                                                                    {schedule.meetingDates?.map((d, i) => (
                                                                        <span key={i} className="bg-slate-200/50 dark:bg-slate-700/50 px-2 py-0.5 rounded w-max transition-colors">
                                                                            {new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                        </span>
                                                                    )) || 'Unspecified'}
                                                                </div>
                                                            </td>
                                                            <td className="p-3 text-xs text-slate-500 dark:text-slate-400 align-top pt-4">
                                                                <div className="flex flex-col gap-1.5">
                                                                    <div className="flex flex-col">
                                                                        <span><strong className="text-emerald-600 dark:text-emerald-400">From:</strong> {new Date(schedule.viewableFrom).toLocaleDateString('en-US')}</span>
                                                                        <span><strong className="text-rose-500 dark:text-rose-400">Until:</strong> {new Date(schedule.viewableUntil).toLocaleDateString('en-US')}</span>
                                                                    </div>

                                                                    {/* Render links based on activity type */}
                                                                    {schedule.activityType === 'Schooling' ? (
                                                                        <div className="flex flex-col gap-1 mt-1">
                                                                            {schedule.lsceVideoLink && (
                                                                                <a href={schedule.lsceVideoLink} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-bold bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded w-max transition-colors">
                                                                                    <Video size={10} /> LSCE Video
                                                                                </a>
                                                                            )}
                                                                            {schedule.vflVideoLink && (
                                                                                <a href={schedule.vflVideoLink} target="_blank" rel="noopener noreferrer" className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-bold bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded w-max transition-colors">
                                                                                    <Video size={10} /> VFL Video
                                                                                </a>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        schedule.videoLink && (
                                                                            <a href={schedule.videoLink} target="_blank" rel="noopener noreferrer" className="mt-1 text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-bold bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded w-max transition-colors">
                                                                                <Video size={12} /> View Video
                                                                            </a>
                                                                        )
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="p-3 text-center align-top pt-4">
                                                                <div className="flex justify-center gap-2">
                                                                    <button
                                                                        onClick={() => handleEdit(schedule)}
                                                                        className="text-slate-400 hover:text-amber-600 dark:hover:text-amber-500 transition-colors bg-white dark:bg-slate-700/50 hover:bg-amber-50 dark:hover:bg-amber-900/30 p-2 rounded-lg border border-transparent hover:border-amber-100 dark:hover:border-amber-800"
                                                                        title="Edit Schedule"
                                                                    >
                                                                        <Edit size={16} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDelete(schedule.id)}
                                                                        className="text-slate-400 hover:text-red-600 dark:hover:text-red-500 transition-colors bg-white dark:bg-slate-700/50 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-lg border border-transparent hover:border-red-100 dark:hover:border-red-800"
                                                                        title="Delete Schedule"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-200">
                                    {/* Calendar Header */}
                                    <div className="flex justify-between items-center mb-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0 transition-colors">
                                        <button onClick={prevMonth} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors font-bold text-sm px-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800">
                                            &lt; Prev
                                        </button>
                                        <h3 className="font-black text-lg text-slate-800 dark:text-white">
                                            {monthNames[month]} {year}
                                        </h3>
                                        <button onClick={nextMonth} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors font-bold text-sm px-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800">
                                            Next &gt;
                                        </button>
                                    </div>

                                    {/* Calendar Grid */}
                                    <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 shrink-0">
                                        <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                                    </div>

                                    <div className="grid grid-cols-7 gap-1 sm:gap-2 auto-rows-fr">
                                        {blanks.map((_, i) => (
                                            <div key={`blank-${i}`} className="p-2 rounded-xl bg-transparent"></div>
                                        ))}

                                        {days.map(d => {
                                            const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

                                            // Find schedules that have this exact date in their meetingDates array
                                            const daySchedules = schedules.filter(s => s.meetingDates?.includes(dStr));

                                            const isToday = new Date().toLocaleDateString('en-US') === new Date(year, month, d).toLocaleDateString('en-US');

                                            return (
                                                <div key={d} className={`group relative p-1.5 sm:p-2 border rounded-xl min-h-[80px] sm:min-h-[100px] flex flex-col items-start gap-1 transition-all ${isToday ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                                    }`}>
                                                    <span className={`text-xs font-black ${isToday ? 'text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-1.5 py-0.5 rounded' : 'text-slate-700 dark:text-slate-300'}`}>
                                                        {d}
                                                    </span>

                                                    <div className="flex flex-col gap-1 w-full overflow-hidden">
                                                        {daySchedules.map(sch => (
                                                            <div
                                                                key={sch.id}
                                                                className={`text-[9px] sm:text-[10px] w-full p-1 rounded font-bold truncate text-left cursor-help transition-colors ${sch.activityType === 'Schooling' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60' :
                                                                        sch.activityType === 'Retreat' ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60' :
                                                                            'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                                                                    }`}
                                                                title={sch.activityType === 'Schooling' ? `LSCE: ${sch.lsceTopic}\nVFL: ${sch.vflTopic}` : sch.topic}
                                                            >
                                                                {sch.activityType}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* HOVER DETAILS TOOLTIP */}
                                                    {daySchedules.length > 0 && (
                                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 sm:w-64 bg-slate-800 text-white p-4 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none border border-slate-700">
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3 border-b border-slate-700 pb-2">
                                                                {new Date(year, month, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                            </p>
                                                            <div className="space-y-4">
                                                                {daySchedules.map(sch => (
                                                                    <div key={sch.id} className="flex flex-col gap-1.5">
                                                                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded w-max ${sch.activityType === 'Schooling' ? 'bg-blue-900/50 text-blue-300' :
                                                                                sch.activityType === 'Retreat' ? 'bg-purple-900/50 text-purple-300' :
                                                                                    'bg-emerald-900/50 text-emerald-300'
                                                                            }`}>
                                                                            {sch.activityType}
                                                                        </span>

                                                                        {sch.activityType === 'Schooling' ? (
                                                                            <div className="space-y-1 bg-slate-700/50 p-2 rounded text-xs">
                                                                                <div className="font-bold text-slate-200"><span className="text-blue-400">LSCE:</span> {sch.lsceTopic}</div>
                                                                                {sch.lsceVideoLink && <div className="text-[9px] text-blue-300 flex items-center gap-1"><Video size={10} /> LSCE Video Attached</div>}

                                                                                <div className="font-bold text-slate-200 mt-1.5"><span className="text-emerald-400">VFL:</span> {sch.vflTopic}</div>
                                                                                {sch.vflVideoLink && <div className="text-[9px] text-emerald-300 flex items-center gap-1"><Video size={10} /> VFL Video Attached</div>}
                                                                            </div>
                                                                        ) : (
                                                                            <>
                                                                                <span className="text-xs font-bold leading-tight">{sch.topic}</span>
                                                                                {sch.videoLink && (
                                                                                    <span className="text-[10px] text-blue-400 font-medium flex items-center gap-1">
                                                                                        <Video size={10} /> Video Attached
                                                                                    </span>
                                                                                )}
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

