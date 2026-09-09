        function AttendanceSchoolingTab({ currentUser, globalSearchPreFill, setGlobalSearchPreFill }) {
            const [viewMode, setViewMode] = useState('Daily'); // Daily, Weekly, Monthly, Perfect
            const [perfectMode, setPerfectMode] = useState('Weekly'); // Weekly, Monthly, 6-Months
            const [statusFilter, setStatusFilter] = useState('Active'); // Active, LOA, Completed IPT
            const [activeOnly, setActiveOnly] = useState(false);
            const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
            const [sortConfig, setSortConfig] = useState({ key: 'studentId', direction: 'asc' });

            const [loading, setLoading] = useState(false);
            const [data, setData] = useState([]);

            const [companySettings, setCompanySettings] = useState({});
            const [globalHolidays, setGlobalHolidays] = useState([]);

            useEffect(() => {
                const fetchGlobalHolidays = async () => {
                    try {
                        const holidayDoc = await getDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'settings', 'globalHolidays'));
                        if (holidayDoc.exists()) setGlobalHolidays(holidayDoc.data().holidays || []);
                    } catch (e) { console.error('Error fetching holidays:', e); }
                };
                fetchGlobalHolidays();
            }, []);

            const [companies, setCompanies] = useState([]);
            const [selectedCompany, setSelectedCompany] = useState('');
            const [showExportModal, setShowExportModal] = useState(false);
            const [allTrainees, setAllTrainees] = useState([]);

            const [searchQuery, setSearchQuery] = useState(globalSearchPreFill || '');
            useEffect(() => {
                if (globalSearchPreFill) {
                    setSearchQuery(globalSearchPreFill);
                    setGlobalSearchPreFill('');
                }
            }, [globalSearchPreFill]);
            const [showActiveOnly, setShowActiveOnly] = useState(true);
            const [showColumnToggle, setShowColumnToggle] = useState(false);
            const [showFilters, setShowFilters] = useState(true);
            const [visibleColumns, setVisibleColumns] = useState({
                studentId: true, studentName: true, company: true, iptDateStart: true,
                iptDateEnd: true, monthSinceIpt: true, clockIn: true, clockOut: true,
                remarks: true, daysPresent: true, daysAbsent: true, totalHours: true
            });
            const [mapPreviewLocation, setMapPreviewLocation] = useState(null);

            // Preload company settings
            useEffect(() => {
                const fetchCompanySettings = async () => {
                    try {
                        const settingsSnap = await getDocs(collection(db, 'artifacts', APP_ID, 'public', 'data', 'company_settings'));
                        const settings = {};
                        settingsSnap.forEach(doc => { settings[doc.id] = doc.data(); });
                        setCompanySettings(settings);
                    } catch (e) { console.error("Error fetching company settings:", e); }
                };
                fetchCompanySettings();
            }, []);

            const fetchData = async () => {
                setLoading(true);
                try {
                    // 1. Fetch Trainees
                    const traineesRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'trainees');
                    const q = query(traineesRef, where('assignedIC', '==', currentUser.assignedIC || ''));
                    const traineesSnap = await getDocs(q);

                    let fetchedTrainees = [];
                    traineesSnap.forEach(doc => {
                        const t = doc.data();
                        t.id = doc.id;
                        t.studentId = (t.studentId || t['Student ID#'] || '').trim();
                        fetchedTrainees.push(t);
                    });

                    setAllTrainees(fetchedTrainees);

                    // Target date for Completed IPT inclusion
                    const targetD = new Date(selectedDate);

                    // Filter trainees based on Status (ignoring Company filter to populate dropdown correctly)
                    const statusMatchedTrainees = fetchedTrainees.filter(t => {
                        const tStatus = (t.status || t.Status || '').trim();
                        if (statusFilter === 'Completed IPT' && tStatus === 'Completed IPT') return true;
                        if (statusFilter === 'LOA' && tStatus === 'LOA') return true;
                        if (statusFilter === 'Active') {
                            if (tStatus === 'Active') return true;
                            if (!activeOnly && tStatus === 'Completed IPT') {
                                const iptEnd = new Date(t.iptDateEnd || t['IPT Date End']);
                                if (!isNaN(iptEnd) && iptEnd >= targetD) {
                                    return true;
                                }
                            }
                        }
                        return false;
                    });

                    // Extract Companies for Filter based on status matched trainees
                    const compSet = new Set(statusMatchedTrainees.map(t => t.company || t['Company Name']).filter(Boolean));
                    const sortedComps = Array.from(compSet).sort();
                    setCompanies(sortedComps);

                    if (selectedCompany && !compSet.has(selectedCompany)) {
                        setSelectedCompany('');
                    }

                    // Filter trainees based on Status and Company
                    let filteredTrainees = statusMatchedTrainees.filter(t => {
                        const tComp = t.company || t['Company Name'] || '';
                        // Company check
                        if (selectedCompany && tComp !== selectedCompany && compSet.has(selectedCompany)) return false;
                        return true;
                    });

                    // 2. Map Student IDs to UIDs
                    const studentIds = filteredTrainees.map(t => t.studentId).filter(Boolean);

                    const chunkArray = (arr, size) => {
                        const chunks = [];
                        for (let i = 0; i < arr.length; i += size) {
                            chunks.push(arr.slice(i, i + size));
                        }
                        return chunks;
                    };

                    let uidsMap = {};
                    if (studentIds.length > 0) {
                        const profileChunks = chunkArray(studentIds, 30);
                        for (const chunk of profileChunks) {
                            const profilesSnap = await getDocs(query(collectionGroup(db, 'profile'), where('studentId', 'in', chunk)));
                            profilesSnap.forEach(doc => {
                                const d = doc.data();
                                if (d.studentId && d.uid) uidsMap[d.studentId] = d.uid;
                            });
                        }
                    }

                    filteredTrainees = filteredTrainees.map(t => ({
                        ...t,
                        uid: uidsMap[t.studentId] || null,
                        isRegistered: !!uidsMap[t.studentId]
                    }));

                    const uids = filteredTrainees.map(t => t.uid).filter(Boolean);
                    let allLogs = [];
                    let allLeaveRequests = [];

                    if (uids.length > 0) {
                        // Determine date range to fetch to avoid fetching massive data.
                        let rangeStartStr = '';
                        const d = new Date(selectedDate);
                        if (viewMode === 'Daily') {
                            rangeStartStr = d.toLocaleDateString('en-CA').substring(0, 7); // just fetch month
                        } else if (viewMode === 'Weekly' || perfectMode === 'Weekly') {
                            rangeStartStr = d.toLocaleDateString('en-CA').substring(0, 7);
                        } else if (viewMode === 'Monthly' || perfectMode === 'Monthly' || perfectMode === '6-Months') {
                            rangeStartStr = d.toLocaleDateString('en-CA').substring(0, 4); // fetch year?
                        }

                        try {
                            const attChunks = chunkArray(uids, 30);
                            for (const chunk of attChunks) {
                                await Promise.all(chunk.map(async (uid) => {
                                    const attSnap = await getDocs(collection(db, 'artifacts', APP_ID, 'users', uid, 'attendanceLogs'));
                                    attSnap.forEach(doc => {
                                        allLogs.push({ id: doc.id, uid: uid, ...doc.data() });
                                    });
                                }));
                            }
                        } catch (err) {
                            console.error("Error fetching attendance logs:", err);
                        }
                    }

                    // 3. Fetch Requests and Schooling
                    allLeaveRequests = [];
                    if (studentIds.length > 0) {
                        const reqChunks = chunkArray(studentIds, 30);
                        for (const chunk of reqChunks) {
                            try {
                                const reqSnap = await getDocs(query(collection(db, 'artifacts', APP_ID, 'public', 'data', 'requests'), where('studentId', 'in', chunk)));
                                reqSnap.forEach(doc => {
                                    allLeaveRequests.push({ id: doc.id, ...doc.data() });
                                });
                            } catch (e) { console.error("Error fetching requests:", e); }
                        }
                    }

                    let allSchooling = [];
                    if (studentIds.length > 0) {
                        const schoolChunks = chunkArray(studentIds, 30);
                        for (const chunk of schoolChunks) {
                            try {
                                const schoolSnap = await getDocs(query(collection(db, 'artifacts', APP_ID, 'public', 'data', 'mentoring_attendance'), where('studentId', 'in', chunk)));
                                schoolSnap.forEach(doc => {
                                    allSchooling.push({ id: doc.id, ...doc.data() });
                                });
                            } catch (e) { console.error("Error fetching schooling", e); }
                        }
                    }

                    // --- Processing Data ---
                    const processedData = filteredTrainees.map(trainee => {
                        const traineeLogs = allLogs.filter(l => l.uid === trainee.uid);
                        const traineeSchooling = allSchooling.filter(s => s.studentId === trainee.studentId);
                        const traineeRequests = allLeaveRequests.filter(r => r.studentId === trainee.studentId && (r.status === 'Approved' || r.status === 'Approved by IC' || r.icStatus === 'Approved' || r.hrStatus === 'Approved')); // Only approved leaves

                        let result = {
                            ...trainee,
                            monthSinceIpt: getMonthsDifference(trainee.iptDateStart || trainee['IPT Date Start'], targetD),
                            remarks: trainee.isRegistered ? '' : 'Not registered in portal',
                            totalHours: 0,
                            daysPresent: 0,
                            daysAbsent: 0,
                            awolCount: 0,
                            excusedCount: 0
                        };

                        const processDay = (dateString) => {
                            const dayLogs = traineeLogs.filter(l => l.dateString === dateString);
                            let timeIn = null, timeOut = null;
                            let inLoc = null, outLoc = null;
                            dayLogs.forEach(l => {
                                if (l.type === 'IN') { timeIn = l.timestamp; inLoc = getLoc(l.clockInDetails || l); }
                                if (l.type === 'OUT') { timeOut = l.timestamp; outLoc = getLoc(l.clockOutDetails || l); }
                            });

                            let isSchoolingDay = false;
                            traineeSchooling.forEach(s => {
                                let match = s.date === dateString;
                                if (!match && s.timestamp) {
                                    const d = new Date(s.timestamp);
                                    if (!isNaN(d.getTime())) {
                                        match = d.toISOString().startsWith(dateString);
                                    }
                                }
                                if (match) {
                                    if (['Present', 'Late', 'Verified'].includes(s.status)) isSchoolingDay = true;
                                }
                            });

                            let isExcused = false;
                            const formatDateLocal = (dateStr) => {
                                if (!dateStr) return '';
                                if (typeof dateString === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
                                let p = dateStr;
                                if (typeof p === 'string' && !p.includes('T')) p = p.replace(/-/g, '/');
                                const d = new Date(p);
                                if (isNaN(d.getTime())) return String(dateStr);
                                if (typeof dateStr === 'string' && dateStr.includes('T')) {
                                    const offset = d.getTimezoneOffset() * 60000;
                                    return new Date(d.getTime() - offset).toISOString().split('T')[0];
                                }
                                const mm = String(d.getMonth() + 1).padStart(2, '0');
                                const dd = String(d.getDate()).padStart(2, '0');
                                return `${d.getFullYear()}-${mm}-${dd}`;
                            };
                            traineeRequests.forEach(r => {
                                const rDate = formatDateLocal(r.date);
                                const tDate = formatDateLocal(r.targetDate);
                                const lDate = formatDateLocal(r.leaveDate);
                                if ((r.type?.toLowerCase().includes('leave') || r.type?.toLowerCase().includes('absence') || r.requestType?.toLowerCase().includes('leave')) &&
                                    (rDate === dateString || tDate === dateString || lDate === dateString || String(r.date).includes(dateString))) {
                                    
                                    // Only mark as excused if Approved
                                    if (r.icStatus === 'Approved' || r.status === 'Approved') {
                                        isExcused = true;
                                    }
                                }
                            });

                            let hours = 0;
                            if (timeIn && timeOut) {
                                hours = (new Date(timeOut) - new Date(timeIn)) / (1000 * 60 * 60);
                                const compSettings = companySettings[trainee.company || trainee['Company Name']];
                                if (compSettings && compSettings.applyBreak && hours > 4) {
                                    hours -= (compSettings.breakMinutes / 60);
                                }
                            }

                            let inOutOfRange = false;
                            let inNoLocation = false;
                            let outOutOfRange = false;
                            let outNoLocation = false;

                            const compSettings = companySettings[trainee.company || trainee['Company Name']];

                            if (timeIn && compSettings && compSettings.location) {
                                const compLoc = getLoc(compSettings);
                                if (inLoc && compLoc) {
                                    const dist = getDistanceFromLatLonInM(inLoc.lat, inLoc.lon, compLoc.lat, compLoc.lon);
                                    if (dist > (compSettings.radius || 1000)) inOutOfRange = true;
                                } else if (!inLoc) {
                                    inNoLocation = true;
                                }
                            } else if (timeIn && !inLoc) {
                                inNoLocation = true;
                            }

                            if (timeOut && compSettings && compSettings.location) {
                                const compLoc = getLoc(compSettings);
                                if (outLoc && compLoc) {
                                    const dist = getDistanceFromLatLonInM(outLoc.lat, outLoc.lon, compLoc.lat, compLoc.lon);
                                    if (dist > (compSettings.radius || 1000)) outOutOfRange = true;
                                } else if (!outLoc) {
                                    outNoLocation = true;
                                }
                            } else if (timeOut && !outLoc) {
                                outNoLocation = true;
                            }

                            const dateObj = new Date(dateString);
                            const dayOfWeekNum = dateObj.getDay();
                            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                            const traineeRestDay = (trainee.restDay || '').trim().toLowerCase();
                            let isRestDay = false;
                            if (traineeRestDay === dayNames[dayOfWeekNum].toLowerCase()) {
                                isRestDay = true;
                            } else if ((traineeRestDay === '' || traineeRestDay === 'weekend') && (dayOfWeekNum === 0 || dayOfWeekNum === 6)) {
                                isRestDay = true;
                            }
                            
                            let isHoliday = globalHolidays.some(h => h.date === dateString);
                            let holidayName = isHoliday ? globalHolidays.find(h => h.date === dateString).name : '';
                            
                            if (compSettings && compSettings.customHolidays) {
                                const customHol = compSettings.customHolidays.find(h => h.date === dateString);
                                if (customHol) {
                                    isHoliday = true;
                                    holidayName = customHol.name;
                                }
                            }

                            return { timeIn, timeOut, hours, isSchoolingDay, isExcused, inLoc, outLoc, inOutOfRange, inNoLocation, outOutOfRange, outNoLocation, isRestDay, isHoliday, holidayName };
                        };

                        if (viewMode === 'Daily') {
                            const dateStr = targetD.toLocaleDateString('en-CA');
                            const dayStats = processDay(dateStr);

                            result.clockIn = dayStats.timeIn;
                            result.clockOut = dayStats.timeOut;
                            result.inLoc = dayStats.inLoc;
                            result.outLoc = dayStats.outLoc;
                            result.inOutOfRange = dayStats.inOutOfRange;
                            result.inNoLocation = dayStats.inNoLocation;
                            result.outOutOfRange = dayStats.outOutOfRange;
                            result.outNoLocation = dayStats.outNoLocation;

                            if (dayStats.isSchoolingDay) {
                                result.rowColor = 'bg-blue-100 dark:bg-blue-900/30';
                                result.statusRemark = 'Schooling Day';
                            } else if (dayStats.isHoliday) {
                                result.rowColor = 'bg-gray-100 dark:bg-gray-800';
                                result.statusRemark = `Holiday (${dayStats.holidayName || 'Declared'})`;
                            } else if (dayStats.isRestDay) {
                                result.rowColor = 'bg-gray-100 dark:bg-gray-800';
                                result.statusRemark = 'Rest Day';
                            } else if (dayStats.hours >= 8) {
                                result.rowColor = 'bg-green-100 dark:bg-green-900/30';
                                result.statusRemark = 'Completed Shift';
                            } else if (dayStats.timeIn && !dayStats.timeOut) {
                                result.rowColor = 'bg-amber-100 dark:bg-amber-900/30';
                                result.statusRemark = 'Currently Clocked In';
                            } else if (dayStats.timeIn && dayStats.timeOut && dayStats.hours < 8) {
                                result.rowColor = 'bg-red-100 dark:bg-red-900/30';
                                result.statusRemark = 'Undertime';
                            } else if (dayStats.isExcused) {
                                result.rowColor = 'bg-orange-100 dark:bg-orange-900/30';
                                result.statusRemark = 'Absent (Acknowledge/Approved by the IC)';
                            } else {
                                result.rowColor = 'bg-red-100 dark:bg-red-900/30';
                                result.statusRemark = 'Absent (AWOL)';
                            }

                            if (result.remarks && result.statusRemark) result.remarks += ' | ' + result.statusRemark;
                            else if (result.statusRemark) result.remarks = result.statusRemark;

                            if (dayStats.inOutOfRange) result.remarks += ' | Clock In Out of Range';
                            if (dayStats.inNoLocation) result.remarks += ' | Clock In No Location Data';
                            if (dayStats.outOutOfRange) result.remarks += ' | Clock Out Out of Range';
                            if (dayStats.outNoLocation) result.remarks += ' | Clock Out No Location Data';

                        } else if (viewMode === 'Weekly' || viewMode === 'Monthly') {
                            let startDate, endDate;
                            if (viewMode === 'Weekly') {
                                const d = new Date(targetD);
                                const day = d.getDay() || 7;
                                if (day !== 1) d.setHours(-24 * (day - 1));
                                startDate = new Date(d);
                                endDate = new Date(d);
                                endDate.setDate(endDate.getDate() + 4);
                            } else {
                                startDate = new Date(targetD.getFullYear(), targetD.getMonth(), 1);
                                endDate = new Date(targetD.getFullYear(), targetD.getMonth() + 1, 0);
                            }

                            let expectedWorkingDays = 0;

                            let currDate = new Date(startDate);
                            while (currDate <= endDate && currDate <= new Date()) {
                                const dateStr = currDate.toLocaleDateString('en-CA');
                                const dayStats = processDay(dateStr);

                                if (dayStats.isRestDay || dayStats.isHoliday) {
                                    if (dayStats.timeIn) {
                                        result.daysPresent++;
                                        result.totalHours += dayStats.hours || 0;
                                    }
                                } else {
                                    expectedWorkingDays++;
                                    if (dayStats.isSchoolingDay) {
                                        result.daysPresent++;
                                        result.totalHours += 8;
                                    } else if (dayStats.hours >= 8) {
                                        result.daysPresent++;
                                        result.totalHours += dayStats.hours;
                                    } else {
                                        result.daysAbsent++;
                                        if (dayStats.isExcused) result.excusedCount++;
                                        else result.awolCount++;
                                        result.totalHours += dayStats.hours || 0;
                                    }
                                }
                                currDate.setDate(currDate.getDate() + 1);
                            }

                            if (viewMode === 'Weekly') {
                                if (result.daysPresent >= 5) result.rowColor = 'bg-green-100 dark:bg-green-900/30';
                                else result.rowColor = 'bg-red-100 dark:bg-red-900/30';
                            } else if (viewMode === 'Monthly') {
                                if (result.daysPresent >= expectedWorkingDays && expectedWorkingDays > 0) result.rowColor = 'bg-green-100 dark:bg-green-900/30';
                                else result.rowColor = 'bg-red-100 dark:bg-red-900/30';
                            }
                        } else if (viewMode === 'Perfect') {
                            result.isPerfect = true;
                            let startDate, endDate;
                            const d = new Date(targetD);
                            if (perfectMode === 'Weekly') {
                                const day = d.getDay() || 7;
                                if (day !== 1) d.setHours(-24 * (day - 1));
                                startDate = new Date(d);
                                endDate = new Date(d);
                                endDate.setDate(endDate.getDate() + 4);
                            } else if (perfectMode === 'Monthly') {
                                startDate = new Date(d.getFullYear(), d.getMonth(), 1);
                                endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0);
                            } else if (perfectMode === '6-Months') {
                                const iptStart = new Date(trainee.iptDateStart || trainee['IPT Date Start']);
                                if (isNaN(iptStart)) { result.isPerfect = false; }
                                else {
                                    startDate = iptStart;
                                    endDate = new Date(iptStart);
                                    endDate.setMonth(endDate.getMonth() + 6);
                                }
                            }

                            if (result.isPerfect) {
                                let currDate = new Date(startDate);
                                let expectedCount = 0;
                                let actualCount = 0;
                                while (currDate <= endDate && currDate <= new Date()) {
                                    const dayOfWeek = currDate.getDay();
                                    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                                        expectedCount++;
                                        const dateStr = currDate.toLocaleDateString('en-CA');
                                        const dayStats = processDay(dateStr);
                                        // For perfect, must be exactly 8 hours OJT shift. Not schooling day.
                                        if (dayStats.hours >= 8 && !dayStats.isSchoolingDay) {
                                            actualCount++;
                                        } else {
                                            result.isPerfect = false;
                                            break;
                                        }
                                    }
                                    currDate.setDate(currDate.getDate() + 1);
                                }
                                if (expectedCount > 0 && actualCount !== expectedCount) {
                                    result.isPerfect = false;
                                }
                            }
                        }

                        return result;
                    });

                    if (viewMode === 'Perfect') {
                        setData(processedData.filter(t => t.isPerfect));
                    } else {
                        setData(processedData);
                    }

                } catch (error) {
                    console.error("Error fetching data:", error);
                }
                setLoading(false);
            };

            useEffect(() => {
                fetchData();
            }, [viewMode, selectedDate, statusFilter, perfectMode, selectedCompany, activeOnly]);

            const handleSort = (key) => {
                let direction = 'asc';
                if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
                setSortConfig({ key, direction });
            };

            const sortedData = useMemo(() => {
                let sortableData = [...data];

                if (searchQuery.trim()) {
                    const q = searchQuery.toLowerCase();
                    sortableData = sortableData.filter(t => {
                        const name = `${t.firstName || ''} ${t.lastName || ''}`.toLowerCase();
                        const id = (t.studentId || '').toLowerCase();
                        const company = (t.company || t['Company Name'] || '').toLowerCase();
                        return name.includes(q) || id.includes(q) || company.includes(q);
                    });
                }

                if (sortConfig.key) {
                    sortableData.sort((a, b) => {
                        let aVal = a[sortConfig.key] || '';
                        let bVal = b[sortConfig.key] || '';
                        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
                        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
                        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                        return 0;
                    });
                }
                return sortableData;
            }, [data, sortConfig, searchQuery]);

            const TableHeader = ({ label, sortKey, align = 'left' }) => (
                <th
                    className={`p-4 font-black uppercase text-[10px] tracking-wider text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition ${align === 'center' ? 'text-center' : 'text-left'}`}
                    onClick={() => sortKey && handleSort(sortKey)}
                >
                    <div className={`flex items-center gap-1 ${align === 'center' ? 'justify-center' : 'justify-start'}`}>
                        {label}
                        {sortConfig.key === sortKey && (
                            <span className="text-primary-500">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                        )}
                    </div>
                </th>
            );

            return (
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6 space-y-6 animate-in fade-in duration-300">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                                <ListChecks className="text-primary-600" /> Trainees' Company Attendance
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Monitor daily, weekly, and monthly attendance.</p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="px-4 py-2 rounded-xl text-sm font-bold transition-colors bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 shadow-sm flex items-center gap-1.5"
                            >
                                {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                {showFilters ? 'Hide Filters' : 'Show Filters'}
                            </button>
                            {['Daily', 'Weekly', 'Monthly', 'Perfect'].map(m => (
                                <button
                                    key={m}
                                    onClick={() => setViewMode(m)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${viewMode === m ? 'bg-primary-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                                >
                                    {m}
                                </button>
                            ))}
                            <button
                                onClick={() => setShowExportModal(true)}
                                className="px-4 py-2 rounded-xl text-sm font-bold transition-colors bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5"
                            >
                                <Download size={14} /> Export XLS
                            </button>
                        </div>
                    </div>

                    {showFilters && (
                        <div className="flex flex-wrap gap-4 items-center bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm animate-in slide-in-from-top-2">
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date Selection</label>
                                <input
                                    type={(() => {
                                        if (viewMode === 'Perfect') {
                                            if (perfectMode === 'Monthly' || perfectMode === '6-Months') return 'month';
                                            if (perfectMode === 'Weekly') return 'week';
                                            return 'date';
                                        }
                                        if (viewMode === 'Monthly') return 'month';
                                        if (viewMode === 'Weekly') return 'week';
                                        return 'date';
                                    })()}
                                    value={(() => {
                                        const isMonth = viewMode === 'Monthly' || (viewMode === 'Perfect' && (perfectMode === 'Monthly' || perfectMode === '6-Months'));
                                        const isWeek = viewMode === 'Weekly' || (viewMode === 'Perfect' && perfectMode === 'Weekly');
                                        if (isMonth) return selectedDate.substring(0, 7);
                                        if (isWeek) {
                                            // Convert selectedDate (YYYY-MM-DD) to YYYY-Www format
                                            const d = new Date(selectedDate);
                                            const yearStart = new Date(d.getFullYear(), 0, 1);
                                            const days = Math.floor((d - yearStart) / 86400000);
                                            const weekNum = Math.ceil((days + yearStart.getDay() + 1) / 7);
                                            return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
                                        }
                                        return selectedDate;
                                    })()}
                                    onChange={e => {
                                        let val = e.target.value;
                                        if (!val) return;
                                        if (val.length === 7 && val.indexOf('W') === -1) {
                                            // Month input: YYYY-MM → YYYY-MM-01
                                            val += '-01';
                                        } else if (val.includes('-W')) {
                                            // Week input: YYYY-Www → convert to Monday of that week
                                            const [yearStr, weekStr] = val.split('-W');
                                            const year = parseInt(yearStr);
                                            const week = parseInt(weekStr);
                                            const jan1 = new Date(year, 0, 1);
                                            const dayOfWeek = jan1.getDay() || 7;
                                            const mondayOfWeek1 = new Date(jan1);
                                            mondayOfWeek1.setDate(jan1.getDate() + (1 - dayOfWeek));
                                            const targetMonday = new Date(mondayOfWeek1);
                                            targetMonday.setDate(mondayOfWeek1.getDate() + (week - 1) * 7);
                                            val = targetMonday.toLocaleDateString('en-CA');
                                        }
                                        setSelectedDate(val);
                                    }}
                                    className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium dark:text-white"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Company</label>
                                <select
                                    value={selectedCompany}
                                    onChange={e => setSelectedCompany(e.target.value)}
                                    className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium dark:text-white min-w-[150px]"
                                >
                                    <option value="">All Companies</option>
                                    {companies.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            {viewMode !== 'Perfect' && (
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status Filter</label>
                                    <select
                                        value={statusFilter}
                                        onChange={e => {
                                            setStatusFilter(e.target.value);
                                            if (e.target.value !== 'Active') setActiveOnly(false);
                                        }}
                                        className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium dark:text-white min-w-[150px]"
                                    >
                                        <option value="Active">Active / Completed (in range)</option>
                                        <option value="LOA">LOA</option>
                                        <option value="Completed IPT">Completed IPT</option>
                                    </select>
                                </div>
                            )}
                            {viewMode !== 'Perfect' && statusFilter === 'Active' && (
                                <div className="flex items-center gap-2 mt-5">
                                    <input
                                        type="checkbox"
                                        checked={activeOnly}
                                        onChange={e => setActiveOnly(e.target.checked)}
                                        id="activeOnly"
                                        className="w-4 h-4 text-primary-600 bg-slate-100 border-slate-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600 cursor-pointer"
                                    />
                                    <label htmlFor="activeOnly" className="text-[11px] font-bold text-slate-500 dark:text-slate-400 cursor-pointer uppercase tracking-wider">"Active" Only</label>
                                </div>
                            )}
                            {viewMode === 'Perfect' && (
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Perfect Attendance Range</label>
                                    <select
                                        value={perfectMode}
                                        onChange={e => setPerfectMode(e.target.value)}
                                        className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium dark:text-white min-w-[150px]"
                                    >
                                        <option value="Weekly">Weekly</option>
                                        <option value="Monthly">Monthly</option>
                                        <option value="6-Months">6-Months</option>
                                    </select>
                                </div>
                            )}
                            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Search</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search trainee name or ID..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium dark:text-white outline-none focus:border-primary-500"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 relative ml-auto">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-transparent select-none">Columns</label>
                                <button
                                    onClick={() => setShowColumnToggle(!showColumnToggle)}
                                    className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium dark:text-white flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <Columns size={16} /> Columns
                                </button>
                                {showColumnToggle && (
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 p-2 flex flex-col gap-1">
                                        <div className="px-2 py-1 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 mb-1">Toggle Columns</div>
                                        {Object.keys(visibleColumns).map(col => {
                                            // hide columns not relevant to the current view
                                            if (col === 'monthSinceIpt' && viewMode === 'Perfect') return null;
                                            if ((col === 'clockIn' || col === 'clockOut' || col === 'remarks') && viewMode !== 'Daily') return null;
                                            if ((col === 'daysPresent' || col === 'daysAbsent' || col === 'totalHours') && (viewMode !== 'Weekly' && viewMode !== 'Monthly')) return null;

                                            const labelMap = { studentId: 'Student ID#', studentName: 'Student Name', company: 'Assigned Company', iptDateStart: 'IPT Date Start', iptDateEnd: 'IPT Date End', monthSinceIpt: 'Month Since IPT', clockIn: 'Clock In', clockOut: 'Clock Out', remarks: 'Remarks', daysPresent: 'Days Present', daysAbsent: 'Days Absent', totalHours: 'Total Hours' };

                                            return (
                                                <label key={col} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors group">
                                                    <input
                                                        type="checkbox"
                                                        checked={visibleColumns[col]}
                                                        onChange={e => setVisibleColumns(prev => ({ ...prev, [col]: e.target.checked }))}
                                                        className="w-4 h-4 text-primary-600 bg-slate-100 border-slate-300 rounded focus:ring-primary-500 cursor-pointer"
                                                    />
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">{labelMap[col]}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="relative flex items-center justify-center mb-6">
                                <img src="dualtech-logo.png" alt="Loading" className="w-16 h-16 object-contain animate-pulse opacity-90 drop-shadow-md" />
                                <Loader2 className="absolute text-primary-600/50 animate-spin" size={100} strokeWidth={1.5} />
                            </div>
                            <p className="text-slate-500 font-bold tracking-wide animate-pulse">Analyzing Attendance Records...</p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                                            {visibleColumns.studentId && <TableHeader label="Student ID#" sortKey="studentId" />}
                                            {visibleColumns.studentName && <TableHeader label="Student Name" sortKey="firstName" />}
                                            {visibleColumns.company && <TableHeader label="Assigned Company" sortKey="company" />}
                                            {visibleColumns.iptDateStart && <TableHeader label="IPT Date Start" sortKey="iptDateStart" />}
                                            {visibleColumns.iptDateEnd && <TableHeader label="IPT Date End" sortKey="iptDateEnd" />}
                                            {viewMode !== 'Perfect' && visibleColumns.monthSinceIpt && <TableHeader label="Month (Since Start)" sortKey="monthSinceIpt" align="center" />}

                                            {viewMode === 'Daily' && (
                                                <>
                                                    {visibleColumns.clockIn && <TableHeader label="Clock In" />}
                                                    {visibleColumns.clockOut && <TableHeader label="Clock Out" />}
                                                    {visibleColumns.remarks && <TableHeader label="Remarks" />}
                                                </>
                                            )}

                                            {(viewMode === 'Weekly' || viewMode === 'Monthly') && (
                                                <>
                                                    {visibleColumns.daysPresent && <TableHeader label="Days Present" sortKey="daysPresent" align="center" />}
                                                    {visibleColumns.daysAbsent && <TableHeader label="Days Absent" sortKey="daysAbsent" align="center" />}
                                                    {visibleColumns.totalHours && <TableHeader label="Total Hours" sortKey="totalHours" align="center" />}
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                        {sortedData.length === 0 ? (
                                            <tr>
                                                <td colSpan="10" className="p-8 text-center text-slate-400 italic">No trainees match the current filters.</td>
                                            </tr>
                                        ) : (
                                            sortedData.map((t, idx) => (
                                                <tr key={idx} className={`${t.rowColor || 'bg-white dark:bg-slate-800'} transition-colors hover:opacity-80`}>
                                                    {visibleColumns.studentId && <td className="p-4 font-bold text-slate-700 dark:text-slate-300">{t.studentId}</td>}
                                                    {visibleColumns.studentName && <td className="p-4 font-medium text-slate-600 dark:text-slate-400">{t.lastName}, {t.firstName}</td>}
                                                    {visibleColumns.company && <td className="p-4 text-slate-600 dark:text-slate-400">{t.company || t['Company Name']}</td>}
                                                    {visibleColumns.iptDateStart && <td className="p-4 text-slate-600 dark:text-slate-400">{t.iptDateStart || t['IPT Date Start']}</td>}
                                                    {visibleColumns.iptDateEnd && <td className="p-4 text-slate-600 dark:text-slate-400">{t.iptDateEnd || t['IPT Date End']}</td>}
                                                    {viewMode !== 'Perfect' && visibleColumns.monthSinceIpt && <td className="p-4 font-medium text-center text-slate-600 dark:text-slate-400">{t.monthSinceIpt}</td>}

                                                    {viewMode === 'Daily' && (
                                                        <>
                                                            {visibleColumns.clockIn && (
                                                                <td className="p-4 font-medium">
                                                                    {t.clockIn ? (
                                                                        <span
                                                                            onClick={() => { if (!t.inOutOfRange && !t.inNoLocation && t.inLoc) setMapPreviewLocation(t.inLoc) }}
                                                                            className={`inline-flex items-center gap-1 ${t.inOutOfRange || t.inNoLocation ? 'text-red-500 font-bold' : t.inLoc ? 'text-emerald-600 font-bold cursor-pointer hover:underline' : 'text-slate-600 dark:text-slate-400'}`}
                                                                            title={t.inOutOfRange ? "Out of valid location range" : t.inNoLocation ? "No location data" : t.inLoc ? "Within valid location - Click to view" : ""}
                                                                        >
                                                                            {formatTime(t.clockIn)}
                                                                            {t.inLoc && !t.inOutOfRange && !t.inNoLocation && <MapPin size={12} className="ml-0.5" />}
                                                                        </span>
                                                                    ) : '--:--'}
                                                                </td>
                                                            )}
                                                            {visibleColumns.clockOut && (
                                                                <td className="p-4 font-medium">
                                                                    {t.clockOut ? (
                                                                        <span
                                                                            onClick={() => { if (!t.outOutOfRange && !t.outNoLocation && t.outLoc) setMapPreviewLocation(t.outLoc) }}
                                                                            className={`inline-flex items-center gap-1 ${t.outOutOfRange || t.outNoLocation ? 'text-red-500 font-bold' : t.outLoc ? 'text-emerald-600 font-bold cursor-pointer hover:underline' : 'text-slate-600 dark:text-slate-400'}`}
                                                                            title={t.outOutOfRange ? "Out of valid location range" : t.outNoLocation ? "No location data" : t.outLoc ? "Within valid location - Click to view" : ""}
                                                                        >
                                                                            {formatTime(t.clockOut)}
                                                                            {t.outLoc && !t.outOutOfRange && !t.outNoLocation && <MapPin size={12} className="ml-0.5" />}
                                                                        </span>
                                                                    ) : '--:--'}
                                                                </td>
                                                            )}
                                                            {visibleColumns.remarks && <td className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-normal min-w-[200px]">{t.remarks}</td>}
                                                        </>
                                                    )}

                                                    {(viewMode === 'Weekly' || viewMode === 'Monthly') && (
                                                        <>
                                                            {visibleColumns.daysPresent && <td className="p-4 font-black text-center text-emerald-600">{t.daysPresent}</td>}
                                                            {visibleColumns.daysAbsent && (
                                                                <td className="p-4 font-black text-center text-red-500">
                                                                    {t.daysAbsent} <span className="text-[10px] text-slate-500 block font-semibold">({t.awolCount} AWOL / {t.excusedCount} Excused)</span>
                                                                </td>
                                                            )}
                                                            {visibleColumns.totalHours && <td className="p-4 font-black text-center text-blue-600">{(t.totalHours || 0).toFixed(1)}</td>}
                                                        </>
                                                    )}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {mapPreviewLocation && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setMapPreviewLocation(null)} />
                            <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col">
                                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><MapPin size={18} className="text-emerald-600" /> Location Preview</h3>
                                    <button onClick={() => setMapPreviewLocation(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"><X size={20} /></button>
                                </div>
                                <div className="p-0 bg-slate-100 dark:bg-slate-900 h-[400px]">
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0 }}
                                        loading="lazy"
                                        allowFullScreen
                                        src={`https://maps.google.com/maps?q=${mapPreviewLocation.lat},${mapPreviewLocation.lon}&z=15&output=embed`}
                                    ></iframe>
                                </div>
                            </div>
                        </div>
                    )}

                    {showExportModal && (
                        <ExportModal
                            onClose={() => setShowExportModal(false)}
                            currentUser={currentUser}
                            allTrainees={allTrainees}
                            companies={companies}
                            companySettings={companySettings}
                        />
                    )}
                </div>
            );
        }

        // --- EXPORT MODAL COMPONENT ---
        function ExportModal({ onClose, currentUser, allTrainees, companies, companySettings }) {
            const [exportStatus, setExportStatus] = useState('Active');
            const [exportScope, setExportScope] = useState('company'); // 'trainee' or 'company'
            const [searchQuery, setSearchQuery] = useState('');
            const [selectedTrainee, setSelectedTrainee] = useState(null);
            const [selectedExportCompany, setSelectedExportCompany] = useState('');
            const [dateRangeMode, setDateRangeMode] = useState('daily'); // daily, weekly, monthly, custom
            const [exportDate, setExportDate] = useState(new Date().toISOString().split('T')[0]);
            const [customStartDate, setCustomStartDate] = useState('');
            const [customEndDate, setCustomEndDate] = useState('');
            const [previewData, setPreviewData] = useState([]);
            const [previewLoading, setPreviewLoading] = useState(false);
            const [showDropdown, setShowDropdown] = useState(false);
            const [globalHolidays, setGlobalHolidays] = useState([]);
            const searchRef = useRef(null);

            // Fetch global holidays
            useEffect(() => {
                const fetchHolidays = async () => {
                    try {
                        const holidayDoc = await getDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'settings', 'globalHolidays'));
                        if (holidayDoc.exists()) {
                            setGlobalHolidays(holidayDoc.data().holidays || []);
                        }
                    } catch (e) { console.error('Error fetching holidays:', e); }
                };
                fetchHolidays();
            }, []);

            // Filter trainees by status
            const filteredByStatus = useMemo(() => {
                return allTrainees.filter(t => {
                    const s = (t.status || t.Status || '').trim();
                    return s === exportStatus;
                });
            }, [allTrainees, exportStatus]);

            // Search results for trainee search
            const traineeSearchResults = useMemo(() => {
                if (!searchQuery.trim() || exportScope !== 'trainee') return [];
                const q = searchQuery.toLowerCase();
                return filteredByStatus.filter(t => {
                    const name = `${t.firstName || ''} ${t.lastName || ''}`.toLowerCase();
                    const id = (t.studentId || '').toLowerCase();
                    return name.includes(q) || id.includes(q);
                }).slice(0, 8);
            }, [filteredByStatus, searchQuery, exportScope]);

            // Search results for company search
            const companySearchResults = useMemo(() => {
                if (!searchQuery.trim() || exportScope !== 'company') return [];
                const q = searchQuery.toLowerCase();
                return companies.filter(c => c.toLowerCase().includes(q));
            }, [companies, searchQuery, exportScope]);

            // Compute date range
            const getDateRange = useCallback(() => {
                let startDate, endDate;
                const d = new Date(exportDate);
                if (dateRangeMode === 'daily') {
                    startDate = new Date(d);
                    endDate = new Date(d);
                } else if (dateRangeMode === 'weekly') {
                    const day = d.getDay() || 7;
                    const monday = new Date(d);
                    if (day !== 1) monday.setDate(d.getDate() - (day - 1));
                    startDate = monday;
                    endDate = new Date(monday);
                    endDate.setDate(monday.getDate() + 4); // Mon-Fri
                } else if (dateRangeMode === 'monthly') {
                    startDate = new Date(d.getFullYear(), d.getMonth(), 1);
                    endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0);
                } else if (dateRangeMode === 'custom') {
                    startDate = customStartDate ? new Date(customStartDate) : new Date();
                    endDate = customEndDate ? new Date(customEndDate) : new Date();
                }
                return { startDate, endDate };
            }, [exportDate, dateRangeMode, customStartDate, customEndDate]);

            const formatDateRange = () => {
                const { startDate, endDate } = getDateRange();
                if (dateRangeMode === 'daily') return startDate.toLocaleDateString('en-CA');
                return `${startDate.toLocaleDateString('en-CA')} to ${endDate.toLocaleDateString('en-CA')}`;
            };

            const chunkArray = (arr, size) => {
                const chunks = [];
                for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
                return chunks;
            };

            // Check if a date is a holiday
            const isHoliday = useCallback((dateStr) => {
                return globalHolidays.some(h => h.date === dateStr);
            }, [globalHolidays]);

            // Generate preview data
            const handleGeneratePreview = async () => {
                setPreviewLoading(true);
                setPreviewData([]);
                try {
                    // 1. Filter trainees by scope
                    let targetTrainees = filteredByStatus;
                    if (exportScope === 'trainee' && selectedTrainee) {
                        targetTrainees = targetTrainees.filter(t => t.studentId === selectedTrainee.studentId);
                    } else if (exportScope === 'company' && selectedExportCompany) {
                        targetTrainees = targetTrainees.filter(t => (t.company || t['Company Name'] || '') === selectedExportCompany);
                    }

                    if (targetTrainees.length === 0) {
                        setPreviewLoading(false);
                        return;
                    }

                    // 2. Map student IDs to UIDs
                    const studentIds = targetTrainees.map(t => t.studentId).filter(Boolean);
                    let uidsMap = {};
                    if (studentIds.length > 0) {
                        const chunks = chunkArray(studentIds, 30);
                        for (const chunk of chunks) {
                            const snap = await getDocs(query(collectionGroup(db, 'profile'), where('studentId', 'in', chunk)));
                            snap.forEach(d => { const data = d.data(); if (data.studentId && data.uid) uidsMap[data.studentId] = data.uid; });
                        }
                    }

                    targetTrainees = targetTrainees.map(t => ({ ...t, uid: uidsMap[t.studentId] || null }));

                    // 3. Fetch attendance logs
                    const uids = targetTrainees.map(t => t.uid).filter(Boolean);
                    let allLogs = [];
                    if (uids.length > 0) {
                        const uidChunks = chunkArray(uids, 30);
                        for (const chunk of uidChunks) {
                            await Promise.all(chunk.map(async (uid) => {
                                try {
                                    const attSnap = await getDocs(collection(db, 'artifacts', APP_ID, 'users', uid, 'attendanceLogs'));
                                    attSnap.forEach(d => allLogs.push({ id: d.id, uid, ...d.data() }));
                                } catch (e) { /* skip */ }
                            }));
                        }
                    }

                    // 4. Fetch schooling records
                    let allSchooling = [];
                    if (studentIds.length > 0) {
                        const sChunks = chunkArray(studentIds, 30);
                        for (const chunk of sChunks) {
                            try {
                                const snap = await getDocs(query(collection(db, 'artifacts', APP_ID, 'public', 'data', 'mentoring_attendance'), where('studentId', 'in', chunk)));
                                snap.forEach(d => allSchooling.push({ id: d.id, ...d.data() }));
                            } catch (e) { /* skip */ }
                        }
                    }

                    // 5. Process each trainee
                    const { startDate, endDate } = getDateRange();
                    const isDailyFormat = dateRangeMode === 'daily' || dateRangeMode === 'custom';
                    const results = [];

                    targetTrainees.forEach(trainee => {
                        const traineeLogs = allLogs.filter(l => l.uid === trainee.uid);
                        const traineeSchooling = allSchooling.filter(s => s.studentId === trainee.studentId);
                        const traineeRestDay = (trainee.restDay || '').trim();
                        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

                        let daysPresent = 0;
                        let totalHours = 0;
                        let expectedWorkDays = 0;

                        let currDate = new Date(startDate);
                        while (currDate <= endDate) {
                            const dayOfWeek = currDate.getDay();
                            const dateStr = currDate.toLocaleDateString('en-CA');
                            const dayName = dayNames[dayOfWeek];

                            // Skip weekends
                            if (dayOfWeek === 0 || dayOfWeek === 6) {
                                currDate.setDate(currDate.getDate() + 1);
                                continue;
                            }

                            // Skip holidays
                            if (isHoliday(dateStr)) {
                                currDate.setDate(currDate.getDate() + 1);
                                continue;
                            }

                            // Skip trainee's rest day
                            if (traineeRestDay && dayName === traineeRestDay) {
                                currDate.setDate(currDate.getDate() + 1);
                                continue;
                            }

                            // Skip schooling day
                            const isSchoolingDay = traineeSchooling.some(s => {
                                const sDate = s.date || s.dateString || '';
                                return sDate === dateStr && ['Present', 'Late', 'Verified'].includes(s.status);
                            });
                            if (isSchoolingDay) {
                                currDate.setDate(currDate.getDate() + 1);
                                continue;
                            }

                            expectedWorkDays++;

                            // Check for attendance
                            const dayLogs = traineeLogs.filter(l => {
                                const logDate = l.date || l.dateString || '';
                                if (logDate === dateStr) return true;
                                if (l.timestamp) {
                                    const d = typeof l.timestamp.toDate === 'function' ? l.timestamp.toDate() : new Date(l.timestamp);
                                    return d.toLocaleDateString('en-CA') === dateStr;
                                }
                                if (l.timeIn) {
                                    const d = typeof l.timeIn.toDate === 'function' ? l.timeIn.toDate() : new Date(l.timeIn);
                                    return d.toLocaleDateString('en-CA') === dateStr;
                                }
                                return false;
                            });

                            let timeIn = null, timeOut = null;
                            let inLoc = null, outLoc = null;

                            dayLogs.forEach(l => {
                                if (l.type === 'IN') { timeIn = l.timestamp || l.timeIn; inLoc = getLoc(l.clockInDetails || l); }
                                else if (l.type === 'OUT') { timeOut = l.timestamp || l.timeOut; outLoc = getLoc(l.clockOutDetails || l); }
                                else if (l.timeIn) {
                                    timeIn = l.timeIn; timeOut = l.timeOut;
                                    inLoc = getLoc(l.clockInDetails || l);
                                    outLoc = getLoc(l.clockOutDetails || l);
                                }
                            });

                            if (timeIn) {
                                const tIn = typeof timeIn.toDate === 'function' ? timeIn.toDate() : new Date(timeIn);
                                let tOut = timeOut ? (typeof timeOut.toDate === 'function' ? timeOut.toDate() : new Date(timeOut)) : null;

                                if (isDailyFormat) {
                                    // Build daily-style row for this date
                                    const timeInStr = tIn.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                                    const timeOutStr = tOut ? tOut.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--';

                                    let remarksArr = [];
                                    let dailyHoursRendered = 0;
                                    const compSettings = companySettings[trainee.company || trainee['Company Name']];
                                    if (compSettings && compSettings.location) {
                                        const compLoc = getLoc(compSettings);
                                        if (inLoc && compLoc) {
                                            const dist = getDistanceFromLatLonInM(inLoc.lat, inLoc.lon, compLoc.lat, compLoc.lon);
                                            if (dist > (compSettings.radius || 1000)) remarksArr.push('<span style="color:red;font-weight:bold;">Clock In: Out of Range</span>');
                                            else remarksArr.push('<span style="color:green;font-weight:bold;">Clock In: Valid Location</span>');
                                        } else {
                                            remarksArr.push('<span style="color:red;font-weight:bold;">Clock In: No Location data</span>');
                                        }
                                        if (tOut) {
                                            if (outLoc && compLoc) {
                                                const dist = getDistanceFromLatLonInM(outLoc.lat, outLoc.lon, compLoc.lat, compLoc.lon);
                                                if (dist > (compSettings.radius || 1000)) remarksArr.push('<span style="color:red;font-weight:bold;">Clock Out: Out of Range</span>');
                                                else remarksArr.push('<span style="color:green;font-weight:bold;">Clock Out: Valid Location</span>');
                                            } else {
                                                remarksArr.push('<span style="color:red;font-weight:bold;">Clock Out: No Location data</span>');
                                            }
                                        }
                                    } else {
                                        remarksArr.push('No location required');
                                    }

                                    if (!tOut) {
                                        remarksArr.push('<span style="color:#0284c7;font-weight:bold;">Currently Clocked In</span>');
                                    } else {
                                        const nextDay = (() => { const nd = new Date(tIn); nd.setDate(nd.getDate() + 1); return nd.toLocaleDateString('en-CA') === tOut.toLocaleDateString('en-CA'); })();
                                        let hrs = (tOut - tIn) / (1000 * 60 * 60);
                                        const compName = trainee.company || trainee['Company Name'];
                                        const cs = companySettings[compName];
                                        if (cs && cs.breakMinutes) hrs -= (cs.breakMinutes / 60);
                                        hrs = Math.max(0, hrs);

                                        if (hrs < 0 || (tOut < tIn && !nextDay)) {
                                            remarksArr.push('<span style="color:red;font-weight:bold;">Incomplete Shift</span>');
                                            dailyHoursRendered = 0;
                                        } else if (hrs < 8) {
                                            remarksArr.push('<span style="color:#d97706;font-weight:bold;">Incomplete Shift (' + hrs.toFixed(1) + 'h)</span>');
                                            dailyHoursRendered = hrs;
                                        } else {
                                            remarksArr.push('<span style="color:#059669;font-weight:bold;">Completed Shift</span>');
                                            dailyHoursRendered = hrs;
                                        }
                                    }

                                    results.push({
                                        studentId: trainee.studentId,
                                        name: `${trainee.lastName || ''}, ${trainee.firstName || ''}`,
                                        company: trainee.company || trainee['Company Name'] || '',
                                        dateRange: dateStr,
                                        timeInStr,
                                        timeOutStr,
                                        dailyRemarksStr: remarksArr.join('<br/>'),
                                        dailyHoursRendered: dailyHoursRendered.toFixed(1)
                                    });
                                }

                                if (tIn && tOut) {
                                    let hours = (tOut - tIn) / (1000 * 60 * 60);
                                    const compName = trainee.company || trainee['Company Name'];
                                    const cs = companySettings[compName];
                                    if (cs && cs.breakMinutes) hours -= (cs.breakMinutes / 60);
                                    totalHours += Math.max(0, hours);
                                }
                                daysPresent++;
                            } else if (isDailyFormat) {
                                // No attendance for this day — push an absent row
                                results.push({
                                    studentId: trainee.studentId,
                                    name: `${trainee.lastName || ''}, ${trainee.firstName || ''}`,
                                    company: trainee.company || trainee['Company Name'] || '',
                                    dateRange: dateStr,
                                    timeInStr: '--:--',
                                    timeOutStr: '--:--',
                                    dailyRemarksStr: '<span style="color:red;font-weight:bold;">Absent</span>',
                                    dailyHoursRendered: '0.0'
                                });
                            }

                            currDate.setDate(currDate.getDate() + 1);
                        }

                        // For non-daily formats (weekly/monthly), push an aggregated row
                        if (!isDailyFormat) {
                            const daysAbsent = Math.max(0, expectedWorkDays - daysPresent);
                            results.push({
                                studentId: trainee.studentId,
                                name: `${trainee.lastName || ''}, ${trainee.firstName || ''}`,
                                company: trainee.company || trainee['Company Name'] || '',
                                dateRange: formatDateRange(),
                                daysPresent,
                                totalHours: totalHours.toFixed(1),
                                daysAbsent
                            });
                        }
                    });

                    setPreviewData(results);
                } catch (err) {
                    console.error('Export preview error:', err);
                }
                setPreviewLoading(false);
            };

            // XLS Export
            const handleExportXLS = () => {
                if (previewData.length === 0) return;

                const isDailyFormat = dateRangeMode === 'daily' || dateRangeMode === 'custom';
                const headers = ['Student ID#', 'Name', 'Assigned Company', 'Date/Date Range'];
                if (isDailyFormat) {
                    headers.push('Clock In', 'Clock Out', 'Total Hours Rendered', 'Remarks');
                } else {
                    headers.push('Days Present', 'Hours Present', 'Days Absent');
                }

                let tableContent = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;

                previewData.forEach((row, i) => {
                    const bgColor = i % 2 === 0 ? '#ffffff' : '#f8fafc';
                    tableContent += `<tr style="background-color: ${bgColor};">
                        <td>${row.studentId}</td>
                        <td>${row.name}</td>
                        <td>${row.company}</td>
                        <td>${row.dateRange}</td>
                        ${isDailyFormat ? `<td>${row.timeInStr}</td><td>${row.timeOutStr}</td><td>${row.dailyHoursRendered}</td><td>${row.dailyRemarksStr || 'N/A'}</td>` : `<td>${row.daysPresent}</td><td>${row.totalHours}</td><td>${row.daysAbsent}</td>`}
                    </tr>`;
                });

                const xlsTemplate = `
                    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
                    <head>
                        <meta charset="utf-8">
                        <style>
                            table { border-collapse: collapse; font-family: Arial, sans-serif; }
                            th { background-color: #10b981; color: white; font-weight: bold; font-size: 14px; border: 1px solid #cccccc; padding: 8px; text-align: left; }
                            td { border: 1px solid #cccccc; padding: 6px 8px; font-size: 13px; mso-number-format:"\\@"; }
                        </style>
                    </head>
                    <body><table>${tableContent}</table></body>
                    </html>
                `;
                const blob = new Blob([xlsTemplate], { type: 'application/vnd.ms-excel;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.setAttribute('href', url);
                const { startDate, endDate } = getDateRange();
                const scopeName = exportScope === 'trainee' && selectedTrainee ? selectedTrainee.studentId : (selectedExportCompany || 'All').replace(/\s+/g, '_');
                link.setAttribute('download', `Attendance_${scopeName}_${startDate.toLocaleDateString('en-CA')}_to_${endDate.toLocaleDateString('en-CA')}.xls`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            };

            const inputClass = 'w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium dark:text-white outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500';
            const labelClass = 'text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block';

            return (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-3xl">
                            <div>
                                <h3 className="text-xl font-black flex items-center gap-2"><Download size={20} /> Export Attendance Report</h3>
                                <p className="text-emerald-100 text-sm mt-0.5">Generate and export attendance data as XLS</p>
                            </div>
                            <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-xl transition-colors"><X size={20} /></button>
                        </div>

                        {/* Body - scrollable */}
                        <div className="overflow-y-auto flex-1 p-6 space-y-5">

                            {/* Row 1: Status + Scope */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Trainee Status</label>
                                    <select value={exportStatus} onChange={e => { setExportStatus(e.target.value); setSelectedTrainee(null); setSearchQuery(''); }} className={inputClass}>
                                        <option value="Active">Active</option>
                                        <option value="LOA">LOA</option>
                                        <option value="Completed IPT">Completed IPT</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Export Scope</label>
                                    <div className="flex gap-2">
                                        <button onClick={() => { setExportScope('company'); setSearchQuery(''); setSelectedTrainee(null); }} className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${exportScope === 'company' ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>Per Company</button>
                                        <button onClick={() => { setExportScope('trainee'); setSearchQuery(''); setSelectedExportCompany(''); }} className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${exportScope === 'trainee' ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>Per Trainee</button>
                                    </div>
                                </div>
                            </div>

                            {/* Row 2: Search */}
                            <div className="relative" ref={searchRef}>
                                <label className={labelClass}>{exportScope === 'trainee' ? 'Search Trainee' : 'Search Company'}</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder={exportScope === 'trainee' ? 'Type trainee name or ID...' : 'Type company name...'}
                                        value={searchQuery}
                                        onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                                        onFocus={() => setShowDropdown(true)}
                                        className={`${inputClass} pl-9`}
                                    />
                                </div>

                                {/* Selected indicator */}
                                {exportScope === 'trainee' && selectedTrainee && (
                                    <div className="mt-2 flex items-center gap-2 bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg px-3 py-2 text-sm">
                                        <CheckCircle size={14} className="text-primary-600" />
                                        <span className="font-bold text-primary-700 dark:text-primary-300">{selectedTrainee.lastName}, {selectedTrainee.firstName}</span>
                                        <span className="text-primary-500">({selectedTrainee.studentId})</span>
                                        <button onClick={() => { setSelectedTrainee(null); setSearchQuery(''); }} className="ml-auto text-primary-400 hover:text-primary-600"><X size={14} /></button>
                                    </div>
                                )}
                                {exportScope === 'company' && selectedExportCompany && (
                                    <div className="mt-2 flex items-center gap-2 bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg px-3 py-2 text-sm">
                                        <CheckCircle size={14} className="text-primary-600" />
                                        <span className="font-bold text-primary-700 dark:text-primary-300">{selectedExportCompany}</span>
                                        <button onClick={() => { setSelectedExportCompany(''); setSearchQuery(''); }} className="ml-auto text-primary-400 hover:text-primary-600"><X size={14} /></button>
                                    </div>
                                )}

                                {/* Dropdown */}
                                {showDropdown && searchQuery.trim() && (
                                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                        {exportScope === 'trainee' && traineeSearchResults.map((t, i) => (
                                            <button key={i} onClick={() => { setSelectedTrainee(t); setSearchQuery(''); setShowDropdown(false); }} className="w-full text-left px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm flex justify-between items-center border-b border-slate-100 dark:border-slate-700 last:border-0">
                                                <span className="font-bold text-slate-700 dark:text-slate-200">{t.lastName}, {t.firstName}</span>
                                                <span className="text-slate-400 text-xs">{t.studentId}</span>
                                            </button>
                                        ))}
                                        {exportScope === 'company' && companySearchResults.map((c, i) => (
                                            <button key={i} onClick={() => { setSelectedExportCompany(c); setSearchQuery(''); setShowDropdown(false); }} className="w-full text-left px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700 last:border-0">
                                                {c}
                                            </button>
                                        ))}
                                        {((exportScope === 'trainee' && traineeSearchResults.length === 0) || (exportScope === 'company' && companySearchResults.length === 0)) && (
                                            <div className="px-4 py-3 text-sm text-slate-400 italic">No results found</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Row 3: Date Range Mode + Picker */}
                            <div>
                                <label className={labelClass}>Date Range</label>
                                <div className="flex gap-2 mb-3">
                                    {['daily', 'weekly', 'monthly', 'custom'].map(mode => (
                                        <button key={mode} onClick={() => setDateRangeMode(mode)} className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${dateRangeMode === mode ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                                            {mode}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-3 flex-wrap">
                                    {dateRangeMode === 'daily' && (
                                        <input type="date" value={exportDate} onChange={e => setExportDate(e.target.value)} className={inputClass + ' max-w-[200px]'} />
                                    )}
                                    {dateRangeMode === 'weekly' && (
                                        <input type="week" value={(() => { const d = new Date(exportDate); const ys = new Date(d.getFullYear(), 0, 1); const days = Math.floor((d - ys) / 86400000); const wn = Math.ceil((days + ys.getDay() + 1) / 7); return `${d.getFullYear()}-W${String(wn).padStart(2, '0')}`; })()} onChange={e => { const val = e.target.value; if (!val || !val.includes('-W')) return; const [y, w] = val.split('-W'); const jan1 = new Date(parseInt(y), 0, 1); const dow = jan1.getDay() || 7; const mon1 = new Date(jan1); mon1.setDate(jan1.getDate() + (1 - dow)); const target = new Date(mon1); target.setDate(mon1.getDate() + (parseInt(w) - 1) * 7); setExportDate(target.toLocaleDateString('en-CA')); }} className={inputClass + ' max-w-[200px]'} />
                                    )}
                                    {dateRangeMode === 'monthly' && (
                                        <input type="month" value={exportDate.substring(0, 7)} onChange={e => { let v = e.target.value; if (v.length === 7) v += '-01'; setExportDate(v); }} className={inputClass + ' max-w-[200px]'} />
                                    )}
                                    {dateRangeMode === 'custom' && (
                                        <>
                                            <div>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">Start</span>
                                                <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className={inputClass} />
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">End</span>
                                                <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className={inputClass} />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Generate Preview Button */}
                            <button
                                onClick={handleGeneratePreview}
                                disabled={previewLoading || (exportScope === 'trainee' && !selectedTrainee) || (exportScope === 'company' && !selectedExportCompany)}
                                className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                {previewLoading ? <><Loader2 className="animate-spin" size={16} /> Generating Preview...</> : <><Activity size={16} /> Generate Preview</>}
                            </button>

                            {/* Preview Table */}
                            {previewData.length > 0 && (
                                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                                    <div className="bg-slate-50 dark:bg-slate-900 px-4 py-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Preview — {previewData.length} record(s)</span>
                                    </div>
                                    <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                                        <table className="w-full text-sm">
                                            <thead className="sticky top-0 bg-slate-100 dark:bg-slate-900">
                                                <tr>
                                                    <th className="p-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-500">Student ID#</th>
                                                    <th className="p-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-500">Name</th>
                                                    <th className="p-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-500">Assigned Company</th>
                                                    <th className="p-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-500">Date/Date Range</th>
                                                    {(dateRangeMode === 'daily' || dateRangeMode === 'custom') ? (
                                                        <>
                                                            <th className="p-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-500">Clock In</th>
                                                            <th className="p-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-500">Clock Out</th>
                                                            <th className="p-3 text-center text-[10px] font-black uppercase tracking-wider text-blue-600">Total Hours</th>
                                                            <th className="p-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-500">Remarks</th>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <th className="p-3 text-center text-[10px] font-black uppercase tracking-wider text-emerald-600">Days Present</th>
                                                            <th className="p-3 text-center text-[10px] font-black uppercase tracking-wider text-blue-600">Hours Present</th>
                                                            <th className="p-3 text-center text-[10px] font-black uppercase tracking-wider text-red-500">Days Absent</th>
                                                        </>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {previewData.map((row, i) => (
                                                    <tr key={i} className={`border-t border-slate-100 dark:border-slate-700 ${i % 2 === 0 ? '' : 'bg-slate-50 dark:bg-slate-900/50'}`}>
                                                        <td className="p-3 font-medium text-slate-700 dark:text-slate-300">{row.studentId}</td>
                                                        <td className="p-3 font-bold text-slate-800 dark:text-white">{row.name}</td>
                                                        <td className="p-3 text-slate-600 dark:text-slate-400">{row.company}</td>
                                                        <td className="p-3 text-slate-600 dark:text-slate-400">{row.dateRange}</td>
                                                        {(dateRangeMode === 'daily' || dateRangeMode === 'custom') ? (
                                                            <>
                                                                <td className="p-3 font-bold text-slate-600 dark:text-slate-400">{row.timeInStr}</td>
                                                                <td className="p-3 font-bold text-slate-600 dark:text-slate-400">{row.timeOutStr}</td>
                                                                <td className="p-3 text-center font-black text-blue-600">{row.dailyHoursRendered}</td>
                                                                <td className="p-3 text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-normal min-w-[220px]" dangerouslySetInnerHTML={{ __html: row.dailyRemarksStr || 'N/A' }} />
                                                            </>
                                                        ) : (
                                                            <>
                                                                <td className="p-3 text-center font-black text-emerald-600">{row.daysPresent}</td>
                                                                <td className="p-3 text-center font-black text-blue-600">{row.totalHours}</td>
                                                                <td className="p-3 text-center font-black text-red-500">{row.daysAbsent}</td>
                                                            </>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                            <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                            <button
                                onClick={handleExportXLS}
                                disabled={previewData.length === 0}
                                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center gap-2 shadow-sm"
                            >
                                <Download size={16} /> Download XLS
                            </button>
                        </div>
                    </div>
                </div>
            );
        }






