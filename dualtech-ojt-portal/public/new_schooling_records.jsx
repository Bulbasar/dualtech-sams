        // ==========================================
        // SCHOOLING RECORDS DASHBOARD (NEW)
        // ==========================================
        let globalSchoolingTraineesCache = null;
        let globalSchoolingTraineesPromise = null;

        function SchoolingRecordsTab({ profiles, attendance }) {
            const [allTrainees, setAllTrainees] = useState([]);
            const [loadingTrainees, setLoadingTrainees] = useState(true);
            const [errorMsg, setErrorMsg] = useState('');
            const [searchQuery, setSearchQuery] = useState('');
            const [activeCategory, setActiveCategory] = useState('All');
            const [selectedRows, setSelectedRows] = useState(new Set());
            const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

            // --- Approved Schooling Credit Applications ---
            const [approvedCreditApps, setApprovedCreditApps] = useState([]);
            
            // --- Calendar Schedules ---
            const [allSchedules, setAllSchedules] = useState([]);

            useEffect(() => {
                const q = query(
                    collection(db, 'artifacts', appId, 'public', 'data', 'schooling_credit_applications'),
                    where('status', '==', 'Approved')
                );
                const unsub = onSnapshot(q, snap => {
                    setApprovedCreditApps(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                });
                
                const qSchedules = query(collection(db, 'artifacts', appId, 'public', 'data', 'schooling_calendar'));
                const unsubSchedules = onSnapshot(qSchedules, snap => {
                    setAllSchedules(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                });
                
                return () => { unsub(); unsubSchedules(); };
            }, []);

            // Modal States
            const [selectedProfile, setSelectedProfile] = useState(null);
            const [modalData, setModalData] = useState(null);
            const [loadingModal, setLoadingModal] = useState(false);

            const safeFormatTime = (val) => {
                if (!val) return '--';
                let d = val;
                if (val.toMillis) d = val.toMillis();
                else if (val.seconds) d = val.seconds * 1000;
                const dateObj = new Date(d);
                if (isNaN(dateObj.getTime())) return typeof val === 'string' ? val : '--';
                return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            };

            const safeFormatDate = (val) => {
                if (!val) return '--';
                let d = val;
                if (val.toMillis) d = val.toMillis();
                else if (val.seconds) d = val.seconds * 1000;
                const dateObj = new Date(d);
                if (isNaN(dateObj.getTime())) return '--';
                return dateObj.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
            };

            const attendanceWeeks = useMemo(() => {
                if (!selectedProfile || !selectedProfile.rawTrainee) return { missing: [], multiple: [] };
                const trainee = selectedProfile.rawTrainee;
                const startDateStr = trainee['IPT Date Start'] || trainee.iptDateStart || trainee.startDate || '';
                if (!startDateStr) return { missing: [], multiple: [] };
                
                const start = new Date(startDateStr);
                if (isNaN(start.getTime())) return { missing: [], multiple: [] };
                
                const stat = String(trainee.Status || trainee.status || trainee.studentStatus || 'Unknown').trim().toLowerCase();
                const endDateStr = trainee['IPT Date End'] || trainee.iptDateEnd || trainee.endDate || '';
                let endCalc = new Date();
                if (stat.includes('complete') && endDateStr) {
                    const parsedEnd = new Date(endDateStr);
                    if (!isNaN(parsedEnd.getTime())) endCalc = parsedEnd;
                }
                
                const totalWeeks = Math.floor((endCalc - start) / (1000 * 60 * 60 * 24 * 7));
                const missing = [];
                const multiple = [];
                const traineeVenue = trainee.schoolingHub || trainee.hub || trainee.venue || trainee['Company Name'] || trainee.company || trainee.Company || '';
                
                for (let w = 1; w <= totalWeeks; w++) {
                    const weekStart = new Date(start.getTime() + (w - 1) * 7 * 24 * 60 * 60 * 1000);
                    const weekEnd = new Date(start.getTime() + w * 7 * 24 * 60 * 60 * 1000);
                    
                    let logCount = 0;
                    selectedProfile.rawLogs.forEach(l => {
                        let logDate;
                        if (l.timestamp) {
                            if (l.timestamp.toMillis) logDate = new Date(l.timestamp.toMillis());
                            else if (l.timestamp.seconds) logDate = new Date(l.timestamp.seconds * 1000);
                            else logDate = new Date(l.timestamp);
                        } else if (l.date) {
                            logDate = new Date(l.date);
                        }
                        if (logDate && !isNaN(logDate.getTime())) {
                            if (logDate >= weekStart && logDate < weekEnd) {
                                logCount++;
                            }
                        }
                    });
                    
                    if (logCount === 0) {
                        const weekStartISO = weekStart.toISOString().split('T')[0];
                        const weekEndISO = weekEnd.toISOString().split('T')[0];
                        
                        let isExempted = false;
                        if (traineeVenue) {
                            const relevantSchedules = allSchedules.filter(sch => 
                                (sch.viewableFrom <= weekEndISO && sch.viewableUntil >= weekStartISO) || 
                                (sch.meetingDates && sch.meetingDates.some(d => d >= weekStartISO && d <= weekEndISO))
                            );
                            if (relevantSchedules.some(sch => sch.exemptedVenues && sch.exemptedVenues.includes(traineeVenue))) {
                                isExempted = true;
                            }
                        }
                        
                        if (!isExempted) {
                            missing.push({
                                weekNumber: w,
                                startStr: weekStart.toLocaleDateString(),
                                endStr: weekEnd.toLocaleDateString()
                            });
                        }
                    } else if (logCount >= 2) {
                        multiple.push({
                            weekNumber: w,
                            startStr: weekStart.toLocaleDateString(),
                            endStr: weekEnd.toLocaleDateString(),
                            count: logCount
                        });
                    }
                }
                return { missing, multiple };
            }, [selectedProfile, allSchedules]);

            // Phase 1: Load Trainees
            useEffect(() => {
                const fetchTrainees = async () => {
                    if (globalSchoolingTraineesCache) {
                        setAllTrainees(globalSchoolingTraineesCache);
                        setLoadingTrainees(false);
                        return;
                    }

                    if (globalSchoolingTraineesPromise) {
                        setLoadingTrainees(true);
                        const data = await globalSchoolingTraineesPromise;
                        setAllTrainees(data);
                        setLoadingTrainees(false);
                        return;
                    }

                    setLoadingTrainees(true);
                    setErrorMsg('');
                    try {
                        const traineesRef = collection(db, 'artifacts', appId, 'public', 'data', 'trainees');
                        globalSchoolingTraineesPromise = getDocs(traineesRef);
                        const traineesSnap = await globalSchoolingTraineesPromise;
                        const rawTrainees = traineesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                        const processedTraineesBase = rawTrainees.map(trainee => {
                            const stat = String(trainee.Status || trainee.status || trainee.studentStatus || 'Unknown').trim().toLowerCase();
                            const startDateStr = trainee['IPT Date Start'] || trainee.iptDateStart || trainee.startDate || '';
                            const endDateStr = trainee['IPT Date End'] || trainee.iptDateEnd || trainee.endDate || '';
                            
                            let iptWTD = 0;
                            if (startDateStr) {
                                const start = new Date(startDateStr);
                                let endCalc = new Date();
                                if (stat.includes('complete') && endDateStr) {
                                    const parsedEnd = new Date(endDateStr);
                                    if (!isNaN(parsedEnd.getTime())) {
                                        endCalc = parsedEnd;
                                    }
                                }
                                if (!isNaN(start.getTime()) && start < endCalc) {
                                    iptWTD = Math.floor((endCalc - start) / (1000 * 60 * 60 * 24 * 7));
                                }
                            }
                            return { ...trainee, calculatedIptWTD: iptWTD, normalizedStatus: stat };
                        });
                        globalSchoolingTraineesCache = processedTraineesBase;
                        setAllTrainees(processedTraineesBase);
                    } catch (err) {
                        console.error("Fetch Error:", err);
                        setErrorMsg(`Failed fetching trainees: ${err.message}`);
                    }
                    setLoadingTrainees(false);
                    globalSchoolingTraineesPromise = null;
                };
                fetchTrainees();
            }, []);

            // Process Data with Attendance & Profiles
            const processedData = useMemo(() => {
                if (!allTrainees.length) return [];
                
                // Pre-group attendance by studentId for O(1) lookup
                const attendanceByStudent = {};
                attendance.forEach(l => {
                    const id1 = String(l.studentId || '').trim();
                    const id2 = String(l.traineeUid || '').trim();
                    if (id1) {
                        if (!attendanceByStudent[id1]) attendanceByStudent[id1] = [];
                        attendanceByStudent[id1].push(l);
                    }
                    if (id2 && id2 !== id1) {
                        if (!attendanceByStudent[id2]) attendanceByStudent[id2] = [];
                        attendanceByStudent[id2].push(l);
                    }
                });

                // Helper to get meeting credits
                const getMeetingCredits = (h) => {
                    const locationText = `${h.hub || ''} ${h.venue || ''} ${h.rawSheetData?.['Schooling / Mentoring Hub'] || ''}`;
                    const combinedText = `${h.activityType || ''} ${h.type || ''} ${h.topic || ''} ${h.rawSheetData?.['Topic'] || ''} ${locationText}`.toUpperCase();
                    if (combinedText.includes('RETREAT')) return 4;
                    if (combinedText.includes('PDS9') || combinedText.includes('PDS 9') || 
                        combinedText.includes('PDS18') || combinedText.includes('PDS 18')) return 2;
                    return 1; 
                };

                return allTrainees.map(trainee => {
                    const sId = String(trainee['Student ID#'] || trainee.studentId || '').trim();
                    const uid = String(trainee.id || trainee.uid || '').trim();
                    const studentLogsRaw = [];
                    if (sId && attendanceByStudent[sId]) studentLogsRaw.push(...attendanceByStudent[sId]);
                    if (uid && attendanceByStudent[uid]) studentLogsRaw.push(...attendanceByStudent[uid]);
                    // deduplicate studentLogs by log.id
                    const studentLogs = Array.from(new Map(studentLogsRaw.map(l => [l.id, l])).values());
                    
                    const validSchoolingRecords = studentLogs.filter(h => {
                        const locationText = `${h.hub || ''} ${h.venue || ''} ${h.rawSheetData?.['Schooling / Mentoring Hub'] || ''}`;
                        const combinedText = `${h.activityType || ''} ${h.type || ''} ${h.topic || ''} ${locationText}`.toUpperCase();
                        const isSchooling = combinedText.includes('SCHOOLING') || combinedText.includes('MENTORING') || combinedText.includes('PERSONAL DEVELOPMENT SEMINAR') || combinedText.includes('PDS') || combinedText.includes('RETREAT');
                        if (!isSchooling) return false;
                        return ['Present', 'Late', 'Verified', 'Pending Verification', 'Pending Attendance'].includes(String(h.status).trim());
                    });

                    const totalActivitiesCredits = validSchoolingRecords.reduce((total, h) => {
                        if (['Present', 'Late', 'Verified'].includes(String(h.status).trim())) {
                            return total + getMeetingCredits(h);
                        }
                        return total;
                    }, 0);

                    // Add approved schooling credit applications (Option B)
                    const traineeApprovedCredits = approvedCreditApps
                        .filter(app => String(app.studentId || '').trim() === sId)
                        .reduce((sum, app) => sum + (app.creditsRequested || 0), 0);
                    const totalWithBonusCredits = totalActivitiesCredits + traineeApprovedCredits;

                    const fullName = `${trainee.Given || trainee.given || trainee.firstName || ''} ${trainee.Family || trainee.family || trainee.lastName || ''}`.trim() || trainee.name || trainee.Name || 'Unknown';
                    const company = trainee['Company Name'] || trainee.companyName || trainee.company || trainee.Company || 'Unassigned';
                    const ic = trainee.assignedIC || trainee['Assigned IC'] || 'Unassigned';
                    
                    const traineeVenue = trainee.schoolingHub || trainee.hub || trainee.venue || company || '';
                    const startDateStr = trainee['IPT Date Start'] || trainee.iptDateStart || trainee.startDate || '';
                    
                    let exemptedWeeksCountToDate = 0;
                    let totalExemptedWeeksCount = 0;
                    
                    if (startDateStr && traineeVenue) {
                        const start = new Date(startDateStr);
                        if (!isNaN(start.getTime())) {
                            const rawIptWTD = trainee.calculatedIptWTD || 0;
                            
                            // Check all 72 weeks to find total exempted weeks
                            for (let w = 1; w <= 72; w++) {
                                const weekStart = new Date(start.getTime() + (w - 1) * 7 * 24 * 60 * 60 * 1000);
                                const weekEnd = new Date(start.getTime() + w * 7 * 24 * 60 * 60 * 1000);
                                const weekStartISO = weekStart.toISOString().split('T')[0];
                                const weekEndISO = weekEnd.toISOString().split('T')[0];
                                
                                const relevantSchedules = allSchedules.filter(sch => 
                                    (sch.viewableFrom <= weekEndISO && sch.viewableUntil >= weekStartISO) || 
                                    (sch.meetingDates && sch.meetingDates.some(d => d >= weekStartISO && d <= weekEndISO))
                                );
                                
                                if (relevantSchedules.some(sch => sch.exemptedVenues && sch.exemptedVenues.includes(traineeVenue))) {
                                    totalExemptedWeeksCount++;
                                    if (w <= rawIptWTD) {
                                        exemptedWeeksCountToDate++;
                                    }
                                }
                            }
                        }
                    }
                    
                    const iptWTD = Math.max(0, (trainee.calculatedIptWTD || 0) - exemptedWeeksCountToDate);
                    const totalRequired = Math.max(0, 72 - totalExemptedWeeksCount);

                    // Months since IPT (1 month = 4 weeks)
                    const monthsSinceIPT = Math.ceil(iptWTD / 4) || 1;

                    return {
                        id: trainee.id,
                        studentId: sId || 'N/A',
                        name: fullName,
                        company: company,
                        status: trainee.normalizedStatus,
                        ic: ic,
                        totalActivities: totalWithBonusCredits,
                        baseActivities: totalActivitiesCredits,
                        bonusCredits: traineeApprovedCredits,
                        iptWTD: iptWTD,
                        totalRequired: totalRequired,
                        monthsSinceIPT: monthsSinceIPT,
                        rawTrainee: trainee,
                        rawLogs: validSchoolingRecords
                    };
                });
            }, [allTrainees, attendance, approvedCreditApps, allSchedules]);

            // Dashboard Groupings (Only count if lacking activities)
            const categories = useMemo(() => {
                const groups = {};
                // Initialize Month 1 to Month 18
                for (let i = 1; i <= 18; i++) {
                    groups[i] = [];
                }

                processedData.forEach(t => {
                    if (!t.status.includes('active')) return;
                    let targetMonth = t.monthsSinceIPT;
                    if (targetMonth > 18) targetMonth = 18; // Cap at 72 weeks
                    if (t.totalActivities < t.iptWTD) {
                        if (groups[targetMonth]) {
                            groups[targetMonth].push(t);
                        }
                    }
                });
                return groups;
            }, [processedData]);

            // Filtered & Sorted Table Data
            const tableData = useMemo(() => {
                let data = processedData;

                // Category Filter
                if (activeCategory !== 'All') {
                    const month = parseInt(activeCategory);
                    // Filter those who are lacking and in this month
                    data = data.filter(t => t.monthsSinceIPT === month && t.totalActivities < t.iptWTD && t.status.includes('active'));
                }

                // Search Filter
                if (searchQuery) {
                    const q = searchQuery.toLowerCase();
                    data = data.filter(t => 
                        t.name.toLowerCase().includes(q) || 
                        t.studentId.toLowerCase().includes(q) || 
                        t.company.toLowerCase().includes(q) || 
                        t.ic.toLowerCase().includes(q)
                    );
                }

                // Sort
                data.sort((a, b) => {
                    let valA = a[sortConfig.key];
                    let valB = b[sortConfig.key];
                    if (typeof valA === 'string') valA = valA.toLowerCase();
                    if (typeof valB === 'string') valB = valB.toLowerCase();
                    
                    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                    return 0;
                });

                return data;
            }, [processedData, activeCategory, searchQuery, sortConfig]);

            // Sort Handler
            const handleSort = (key) => {
                let direction = 'asc';
                if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
                setSortConfig({ key, direction });
            };

            const SortIcon = ({ columnKey }) => {
                if (sortConfig.key !== columnKey) return <div className="w-3" />;
                return sortConfig.direction === 'asc' ? <span className="text-xs ml-1">▲</span> : <span className="text-xs ml-1">▼</span>;
            };

            // Checkbox Handlers
            const toggleSelectRow = (id) => {
                const newSet = new Set(selectedRows);
                if (newSet.has(id)) newSet.delete(id);
                else newSet.add(id);
                setSelectedRows(newSet);
            };

            const toggleSelectAll = () => {
                if (selectedRows.size === tableData.length) {
                    setSelectedRows(new Set());
                } else {
                    setSelectedRows(new Set(tableData.map(t => t.id)));
                }
            };

            // Export to XLS
            const handleExportXLS = () => {
                if (selectedRows.size === 0) return;
                const exportData = tableData.filter(t => selectedRows.has(t.id));
                const headers = ["Student ID", "Trainee Name", "Company Name", "Status", "Assigned IC", "Months Since IPT", "Activities", "IPT WTD"];
                
                const csvRows = [headers.join(",")];
                exportData.forEach(t => {
                    const row = [
                        `"${t.studentId}"`, `"${t.name}"`, `"${t.company}"`, `"${t.status}"`, `"${t.ic}"`,
                        `"${t.monthsSinceIPT}"`, `"${t.totalActivities}"`, `"${t.iptWTD}"`
                    ];
                    csvRows.push(row.join(","));
                });

                const csvString = csvRows.join("\n");
                const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", `Schooling_Lacking_Export_${new Date().getTime()}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            };

            // View Profile Fetch
            const handleViewProfile = async (t) => {
                setSelectedProfile(t);
                setLoadingModal(true);
                setModalData(null);

                try {
                    // 1. Find uid from profiles mapping
                    let traineeUid = profiles[t.studentId] || null;

                    // 2. Fetch Company Attendance (Complete History)
                    let compAttendance = [];
                    if (traineeUid) {
                        // We query the user's attendance logs
                        const attQ = query(
                            collection(db, 'artifacts', appId, 'users', traineeUid, 'attendanceLogs'),
                            orderBy('timestamp', 'desc')
                        );
                        // Note: Depending on Firestore index, if this fails, we will just fetch all and sort
                        try {
                            const attSnap = await getDocs(attQ);
                            let allLogs = attSnap.docs.map(d => d.data());
                            compAttendance = allLogs.filter(log => log.type !== 'OUT');
                        } catch (err) {
                            // Fallback if index is missing
                            const fallbackQ = query(collection(db, 'artifacts', appId, 'users', traineeUid, 'attendanceLogs'));
                            const fSnap = await getDocs(fallbackQ);
                            let allLogs = fSnap.docs.map(d => d.data());
                            allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                            compAttendance = allLogs.filter(log => log.type !== 'OUT');
                        }
                    }

                    // 3. Fetch Merit Points
                    const meritQ = query(collection(db, 'artifacts', appId, 'public', 'data', 'performanceVouchers'), where('studentId', '==', t.studentId));
                    const meritSnap = await getDocs(meritQ);
                    const meritPoints = meritSnap.docs.map(d => d.data());

                    // 4. Fetch Coaching Dates
                    const meetQ = query(collection(db, 'artifacts', appId, 'public', 'data', 'meetings'), where('studentId', '==', t.studentId));
                    const meetSnap = await getDocs(meetQ);
                    let meetings = meetSnap.docs.map(d => d.data());
                    meetings.sort((a,b) => new Date(b.date) - new Date(a.date));

                    setModalData({
                        companyAttendance: compAttendance,
                        meritPoints: meritPoints,
                        meetings: meetings,
                        uidFound: !!traineeUid
                    });

                } catch (err) {
                    console.error("Error fetching modal data", err);
                    alert("Error loading profile details: " + err.message);
                }
                setLoadingModal(false);
            };

            return (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                            <LayoutDashboard className="text-indigo-600 dark:text-indigo-400" size={28} /> 
                            Schooling Lacking Dashboard
                        </h2>
                    </div>

                    {errorMsg && (
                        <div className="bg-rose-50 dark:bg-rose-900/30 border border-rose-200 text-rose-800 p-5 rounded-xl font-semibold text-sm">
                            ⚠️ {errorMsg}
                        </div>
                    )}

                    {/* Dashboard Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9 gap-3">
                        {Array.from({length: 18}).map((_, idx) => {
                            const month = idx + 1;
                            const count = categories[month]?.length || 0;
                            const isActive = activeCategory === month.toString();
                            return (
                                <div 
                                    key={month} 
                                    onClick={() => setActiveCategory(isActive ? 'All' : month.toString())}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col items-center justify-center text-center
                                        ${isActive ? 'bg-indigo-600 border-indigo-600 text-white shadow-md scale-105' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}
                                    `}
                                >
                                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Month {month}</span>
                                    <span className="text-[10px] font-medium opacity-70">(Wk {month*4 - 3}-{month*4})</span>
                                    <span className={`text-2xl font-black mt-1 ${isActive ? 'text-white' : (count > 0 ? 'text-rose-500' : 'text-slate-400')}`}>
                                        {count}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Table View */}
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 w-full md:w-96">
                                <Search size={18} className="text-slate-400" />
                                <input 
                                    type="text"
                                    placeholder="Search name, ID, company, IC..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-transparent border-none outline-none text-sm w-full font-medium dark:text-white"
                                />
                            </div>
                            <div className="flex gap-3 w-full md:w-auto">
                                <button 
                                    onClick={handleExportXLS}
                                    disabled={selectedRows.size === 0}
                                    className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition-colors text-sm w-full md:w-auto"
                                >
                                    <Download size={18} />
                                    Export Selected ({selectedRows.size})
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase text-xs">
                                    <tr>
                                        <th className="p-4 w-10">
                                            <input type="checkbox" checked={selectedRows.size === tableData.length && tableData.length > 0} onChange={toggleSelectAll} className="w-4 h-4 rounded text-indigo-600" />
                                        </th>
                                        <th className="p-4 font-bold cursor-pointer" onClick={() => handleSort('studentId')}>Student ID <SortIcon columnKey="studentId" /></th>
                                        <th className="p-4 font-bold cursor-pointer" onClick={() => handleSort('name')}>Trainee Name <SortIcon columnKey="name" /></th>
                                        <th className="p-4 font-bold cursor-pointer" onClick={() => handleSort('company')}>Company <SortIcon columnKey="company" /></th>
                                        <th className="p-4 font-bold cursor-pointer" onClick={() => handleSort('status')}>Status <SortIcon columnKey="status" /></th>
                                        <th className="p-4 font-bold cursor-pointer" onClick={() => handleSort('monthsSinceIPT')}>Months <SortIcon columnKey="monthsSinceIPT" /></th>
                                        <th className="p-4 font-bold cursor-pointer" onClick={() => handleSort('totalActivities')}>Activities <SortIcon columnKey="totalActivities" /></th>
                                        <th className="p-4 font-bold text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {loadingTrainees ? (
                                        <tr><td colSpan="8" className="p-8 text-center"><Loader2 className="animate-spin inline mr-2"/> Loading...</td></tr>
                                    ) : tableData.length === 0 ? (
                                        <tr><td colSpan="8" className="p-8 text-center text-slate-500">No trainees found matching this filter.</td></tr>
                                    ) : (
                                        tableData.map(t => (
                                            <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                                <td className="p-4">
                                                    <input type="checkbox" checked={selectedRows.has(t.id)} onChange={() => toggleSelectRow(t.id)} className="w-4 h-4 rounded text-indigo-600" />
                                                </td>
                                                <td className="p-4 font-mono font-medium">{t.studentId}</td>
                                                <td className="p-4 font-bold text-slate-900 dark:text-white">{t.name}</td>
                                                <td className="p-4 text-slate-700 dark:text-slate-300">{t.company}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${t.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                                                        {t.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-slate-700 font-bold dark:text-slate-300 text-center">{t.monthsSinceIPT}</td>
                                                <td className="p-4 font-bold text-center">
                                                    <span className={`${t.totalActivities < t.iptWTD ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                        {t.totalActivities}
                                                    </span>
                                                    <span className="text-slate-400 text-xs ml-1">/ {t.totalRequired}</span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button onClick={() => handleViewProfile(t)} className="bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                                                        View Profile
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* VIEW PROFILE MODAL */}
                    {selectedProfile && (
                        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
                            <div className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
                                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-indigo-100 dark:bg-indigo-900/50 p-3 rounded-full text-indigo-600 dark:text-indigo-400">
                                            <User size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{selectedProfile.name}</h3>
                                            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm flex gap-2">
                                                <span>{selectedProfile.studentId}</span> | 
                                                <span className="font-bold text-slate-700 dark:text-slate-300">{selectedProfile.company}</span> | 
                                                <span>IC: {selectedProfile.ic}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedProfile(null)} className="p-2 bg-slate-200 dark:bg-slate-700 rounded-full hover:bg-rose-100 dark:hover:bg-rose-900/50 hover:text-rose-600 transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-900">
                                    {/* Left Column */}
                                    <div className="space-y-6">
                                        
                                        {/* Mentoring Attendance (Training History) */}
                                        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-4">
                                            <div>
                                                <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                                                    <FileText className="text-blue-500" size={18}/> 
                                                    Training History (Schooling)
                                                    <span className="ml-auto text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{selectedProfile.rawLogs.length} Records</span>
                                                </h4>
                                                <div className="max-h-64 overflow-y-auto custom-scrollbar border border-slate-100 dark:border-slate-700 rounded-lg">
                                                    {selectedProfile.rawLogs.length === 0 ? (
                                                        <div className="p-4 text-center text-sm text-slate-500">No training records found.</div>
                                                    ) : (
                                                        <table className="w-full text-left text-xs">
                                                            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 sticky top-0">
                                                                <tr><th className="p-2">Date</th><th className="p-2">Activity</th><th className="p-2">Status</th></tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                                                {selectedProfile.rawLogs.map((l, i) => (
                                                                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                                                                        <td className="p-2 whitespace-nowrap">{safeFormatDate(l.timestamp || l.date)}</td>
                                                                        <td className="p-2 font-medium">{l.activityType} - {l.topic}</td>
                                                                        <td className="p-2"><span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[10px]">{l.status}</span></td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Missing Schooling Weeks */}
                                            {attendanceWeeks.missing.length > 0 && (
                                                <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-xl border border-rose-100 dark:border-rose-900/50">
                                                    <h5 className="font-bold text-rose-800 dark:text-rose-400 text-sm mb-2 flex items-center gap-2">
                                                        <span className="bg-rose-200 dark:bg-rose-800 text-rose-900 dark:text-rose-200 rounded-full w-5 h-5 flex items-center justify-center text-xs">{attendanceWeeks.missing.length}</span>
                                                        Missing Schooling Weeks
                                                    </h5>
                                                    <div className="flex gap-2 flex-wrap max-h-32 overflow-y-auto custom-scrollbar pr-2">
                                                        {attendanceWeeks.missing.map(w => (
                                                            <span key={w.weekNumber} className="text-xs bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 px-2 py-1 rounded shadow-sm" title={`${w.startStr} - ${w.endStr}`}>
                                                                Week {w.weekNumber}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Multiple Attendances Weeks */}
                                            {attendanceWeeks.multiple.length > 0 && (
                                                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                                                    <h5 className="font-bold text-emerald-800 dark:text-emerald-400 text-sm mb-2 flex items-center gap-2">
                                                        <span className="bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-200 rounded-full w-5 h-5 flex items-center justify-center text-xs">{attendanceWeeks.multiple.length}</span>
                                                        Multiple Attendances in a Week
                                                    </h5>
                                                    <div className="flex gap-2 flex-wrap max-h-32 overflow-y-auto custom-scrollbar pr-2">
                                                        {attendanceWeeks.multiple.map(w => (
                                                            <span key={w.weekNumber} className="text-xs bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-1 rounded shadow-sm" title={`${w.startStr} - ${w.endStr} (${w.count} attendances)`}>
                                                                Week {w.weekNumber} ({w.count})
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Coaching Dates */}
                                        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                                            <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                                                <MessageCircle className="text-violet-500" size={18}/> 
                                                Coaching Sessions (IC)
                                                {modalData && <span className="ml-auto text-xs bg-violet-100 text-violet-800 px-2 py-1 rounded-full">{modalData.meetings.length} Sessions</span>}
                                            </h4>
                                            {loadingModal ? <div className="p-4 text-center text-sm text-slate-500"><Loader2 className="animate-spin inline mr-2"/> Loading...</div> : (
                                                <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                                    {modalData?.meetings.length === 0 ? (
                                                        <div className="p-4 text-center text-sm text-slate-500 border border-dashed rounded-lg">No coaching sessions logged by IC.</div>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {modalData?.meetings.map((m, i) => (
                                                                <div key={i} className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-100 dark:border-slate-700">
                                                                    <div className="flex justify-between items-center mb-1">
                                                                        <span className="font-bold text-sm dark:text-white">{m.date}</span>
                                                                        <span className="text-[10px] uppercase font-bold text-violet-600 bg-violet-100 px-2 py-0.5 rounded">{m.type}</span>
                                                                    </div>
                                                                    <p className="text-xs text-slate-600 dark:text-slate-400">{m.notes}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                    </div>

                                    {/* Right Column */}
                                    <div className="space-y-6">
                                        
                                        {/* Merit Points */}
                                        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                                            <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                                                <Award className="text-amber-500" size={18}/> 
                                                Merit Points
                                                {modalData && <span className="ml-auto text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">{modalData.meritPoints.length} Vouchers</span>}
                                            </h4>
                                            {loadingModal ? <div className="p-4 text-center text-sm text-slate-500"><Loader2 className="animate-spin inline mr-2"/> Loading...</div> : (
                                                <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                                    {modalData?.meritPoints.length === 0 ? (
                                                        <div className="p-4 text-center text-sm text-slate-500 border border-dashed rounded-lg">No merit points awarded.</div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {modalData?.meritPoints.map((v, i) => (
                                                                <div key={i} className="flex justify-between items-center p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-900/50">
                                                                    <div>
                                                                        <p className="text-sm font-bold text-amber-900 dark:text-amber-400">{v.points} Points</p>
                                                                        <p className="text-xs text-amber-700/70">{v.reason}</p>
                                                                    </div>
                                                                    <div className="text-[10px] text-right text-amber-600">
                                                                        {v.date} <br/> {v.issuedBy}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Company Attendance (Trainee App) */}
                                        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                                            <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                                                <Clock className="text-emerald-500" size={18}/> 
                                                Company Attendance (Complete History)
                                                {modalData && !modalData.uidFound && <span className="ml-auto text-xs bg-rose-100 text-rose-800 px-2 py-1 rounded-full">App Not Linked</span>}
                                            </h4>
                                            {loadingModal ? <div className="p-4 text-center text-sm text-slate-500"><Loader2 className="animate-spin inline mr-2"/> Loading...</div> : (
                                                <div className="max-h-64 overflow-y-auto custom-scrollbar border border-slate-100 dark:border-slate-700 rounded-lg">
                                                    {!modalData?.uidFound ? (
                                                        <div className="p-8 text-center text-sm text-slate-500 bg-slate-50">
                                                            Trainee has not created a portal account yet, so no app clock-ins exist.
                                                        </div>
                                                    ) : modalData?.companyAttendance.length === 0 ? (
                                                        <div className="p-4 text-center text-sm text-slate-500">No company attendance records found.</div>
                                                    ) : (
                                                        <table className="w-full text-left text-xs">
                                                            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 sticky top-0">
                                                                <tr><th className="p-2">Date</th><th className="p-2">Time IN</th><th className="p-2">Time OUT</th></tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                                                {modalData.companyAttendance.map((log, i) => (
                                                                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                                                                        <td className="p-2 font-medium">{safeFormatDate(log.timestamp)}</td>
                                                                        <td className="p-2 text-emerald-600 font-bold">{safeFormatTime(log.timeIn)}</td>
                                                                        <td className="p-2 text-rose-600 font-bold">{safeFormatTime(log.timeOut)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

window.SchoolingRecordsTab = SchoolingRecordsTab;