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
                            <span className="text-primary-500">{sortConfig.direction === 'asc' ? 'â†‘' : 'â†“'}</span>
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
                                            // Month input: YYYY-MM â†’ YYYY-MM-01
                                            val += '-01';
                                        } else if (val.includes('-W')) {
                                            // Week input: YYYY-Www â†’ convert to Monday of that week
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
                                <img src="/dualtech-logo.png" alt="Loading" className="w-16 h-16 object-contain animate-pulse opacity-90 drop-shadow-md" />
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
                                                        </>
                                                    )}

                                                    {viewMode !== 'Daily' && visibleColumns.daysPresent && <td className="p-4 font-black text-center text-emerald-600">{t.daysPresent}</td>}
                                                    {viewMode !== 'Daily' && visibleColumns.daysAbsent && <td className="p-4 font-black text-center text-rose-600">{t.daysAbsent}</td>}
                                                    
                                                    {visibleColumns.rawHours && <td className="p-4 font-black text-center text-blue-600">{t.rawHours || t.totalHours || '0'}</td>}
                                                    {visibleColumns.remarks && <td className="p-4 text-slate-500 text-xs italic max-w-xs truncate" title={t.remarks}>{t.remarks}</td>}
                                                </tr>
                                            ))}
                                            {filteredTrainees.length === 0 && !loading && (
                                                <tr>
                                                    <td colSpan="15" className="p-8 text-center text-slate-400 font-bold">
                                                        No records found for the selected filters.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Map Preview Modal */}
                {mapPreviewLocation && (
                    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                                <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                    <MapPin size={18} className="text-primary-600" />
                                    Location Preview
                                </h3>
                                <button onClick={() => setMapPreviewLocation(null)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-2 h-[400px]">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    frameBorder="0"
                                    style={{ border: 0, borderRadius: '0.5rem' }}
                                    src={`https://maps.google.com/maps?q=${mapPreviewLocation.latitude},${mapPreviewLocation.longitude}&z=16&output=embed`}
                                    allowFullScreen
                                ></iframe>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };


    const CompanyAttendanceView = ({ currentUser }) => {
        const [allTrainees, setAllTrainees] = useState([]);
        const [companies, setCompanies] = useState([]);
        const [selectedCompany, setSelectedCompany] = useState('');
        const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
        
        const [attendanceRecords, setAttendanceRecords] = useState([]);
        const [loadingInitial, setLoadingInitial] = useState(true);
        const [loadingLogs, setLoadingLogs] = useState(false);
        const [showExportModal, setShowExportModal] = useState(false);

        useEffect(() => {
            const fetchInitialData = async () => {
                setLoadingInitial(true);
                try {
                    const APP_ID = "dualtech-ojt-portal"; 
                    const traineesRef = db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('trainees');
                    const snapshot = await traineesRef.get();
                    
                    const traineesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setAllTrainees(traineesList);
                    
                    const companySet = new Set();
                    traineesList.forEach(t => {
                        const comp = t.company || t.companyName;
                        if (comp) companySet.add(comp);
                    });
                    
                    const companyArray = Array.from(companySet).sort((a, b) => a.localeCompare(b));
                    setCompanies(companyArray);
                    if (companyArray.length > 0) {
                        setSelectedCompany(companyArray[0]);
                    }
                } catch (error) {
                    console.error("Error fetching trainees:", error);
                } finally {
                    setLoadingInitial(false);
                }
            };
            fetchInitialData();
        }, []);

        useEffect(() => {
            const fetchCompanyAttendance = async () => {
                if (!selectedCompany) {
                    setAttendanceRecords([]);
                    return;
                }

                setLoadingLogs(true);
                setAttendanceRecords([]);
                try {
                    const APP_ID = "dualtech-ojt-portal"; 
                    const traineesRef = db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('trainees');
                    
                    const companyTrainees = allTrainees.filter(t => 
                        (t.company === selectedCompany || t.companyName === selectedCompany)
                    );

                    let fetchedAttendance = [];
                    // Process in chunks to avoid memory freeze and show progress
                    const chunkSize = 5;
                    for (let i = 0; i < companyTrainees.length; i += chunkSize) {
                        const chunk = companyTrainees.slice(i, i + chunkSize);
                        const attendancePromises = chunk.map(async (trainee) => {
                            const attSnapshot = await traineesRef.doc(trainee.id).collection('attendance').get();
                            return attSnapshot.docs.map(doc => ({
                                id: doc.id,
                                traineeId: trainee.id,
                                traineeName: `${trainee.firstName || ''} ${trainee.lastName || ''}`.trim() || trainee.name || 'Unknown',
                                status: trainee.status || 'Unknown',
                                company: trainee.company || trainee.companyName || 'Unassigned',
                                ic: trainee.ic || trainee.coordinator || 'Unassigned',
                                ...doc.data()
                            }));
                        });

                        const chunkResults = await Promise.all(attendancePromises);
                        fetchedAttendance = [...fetchedAttendance, ...chunkResults.flat()];
                        
                        fetchedAttendance.sort((a, b) => new Date(b.date) - new Date(a.date));
                        setAttendanceRecords([...fetchedAttendance]);
                        
                        await new Promise(r => setTimeout(r, 100)); // Small delay for UI update
                    }
                    setLoadingLogs(false);

                } catch (error) {
                    console.error("Error fetching company attendance:", error);
                    setLoadingLogs(false);
                }
            };

            fetchCompanyAttendance();
        }, [selectedCompany, allTrainees]);

        const filteredRecords = attendanceRecords.filter(r => r.date === dateFilter);

        if (loadingInitial) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/50">
                    <Loader size={48} className="text-primary-500 animate-spin mb-4" />
                    <h2 className="text-xl font-bold text-slate-700">Loading Dashboard...</h2>
                </div>
            );
        }

        return (
            <div className="flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-900/50">
                <div className="max-w-7xl mx-auto p-4 md:p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-3">
                                <ListChecks className="text-primary-600 dark:text-primary-400" size={32} strokeWidth={2.5} />
                                Company Attendance
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1 text-sm">View attendance logs filtered by partner company.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                            <button
                                onClick={() => setShowExportModal(true)}
                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                            >
                                <Download size={18} />
                                Export Attendance
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-8 flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Company</label>
                            <select 
                                value={selectedCompany} 
                                onChange={(e) => setSelectedCompany(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:border-primary-500 focus:ring-0 outline-none transition-colors"
                            >
                                <option value="" disabled>Select a company</option>
                                {companies.map((comp, idx) => (
                                    <option key={idx} value={comp}>{comp}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Filter Date</label>
                            <input 
                                type="date" 
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:border-primary-500 focus:ring-0 outline-none transition-colors"
                            />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                    <tr>
                                        <th className="p-4 font-black text-slate-600 text-xs uppercase tracking-wider">Trainee Name</th>
                                        <th className="p-4 font-black text-slate-600 text-xs uppercase tracking-wider">Active Status</th>
                                        <th className="p-4 font-black text-slate-600 text-xs uppercase tracking-wider">Date</th>
                                        <th className="p-4 font-black text-slate-600 text-xs uppercase tracking-wider">Time In</th>
                                        <th className="p-4 font-black text-slate-600 text-xs uppercase tracking-wider">Time Out</th>
                                        <th className="p-4 font-black text-slate-600 text-xs uppercase tracking-wider text-center">Log Status</th>
                                        <th className="p-4 font-black text-slate-600 text-xs uppercase tracking-wider">Assigned IC</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {!selectedCompany ? (
                                        <tr><td colSpan="7" className="p-8 text-center text-slate-400">Please select a company to view attendance records.</td></tr>
                                    ) : filteredRecords.length > 0 ? (
                                        <>
                                            {loadingLogs && (
                                                <tr><td colSpan="7" className="p-3 text-center bg-blue-50 text-blue-600 text-xs font-bold animate-pulse">Actively fetching records from the database... ({attendanceRecords.length} loaded so far)</td></tr>
                                            )}
                                            {filteredRecords.slice(0, 50).map(record => (
                                                <tr key={record.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                                    <td className="p-3 md:p-4 font-semibold text-slate-800 text-sm">{record.traineeName}</td>
                                                    <td className="p-3 md:p-4 text-xs font-bold text-slate-500">{record.status}</td>
                                                    <td className="p-3 md:p-4 text-xs md:text-sm text-slate-600">{record.date}</td>
                                                    <td className="p-3 md:p-4 text-xs md:text-sm font-mono text-slate-600">{record.timeIn || '--:--'}</td>
                                                    <td className="p-3 md:p-4 text-xs md:text-sm font-mono text-slate-600">{record.timeOut || '--:--'}</td>
                                                    <td className="p-4 text-center">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                                                            record.status === 'Present' ? 'bg-emerald-100 text-emerald-700' :
                                                            record.status === 'Late' ? 'bg-amber-100 text-amber-700' :
                                                            record.status === 'Absent' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                                                        }`}>{record.status || 'No Status'}</span>
                                                    </td>
                                                    <td className="p-4 text-sm text-slate-500 italic">{record.ic}</td>
                                                </tr>
                                            ))}
                                            {filteredRecords.length > 50 && (
                                                <tr><td colSpan="7" className="p-4 text-center text-slate-500 font-medium bg-slate-50">Showing first 50 of {filteredRecords.length} records.</td></tr>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            {loadingLogs && (
                                                <tr><td colSpan="7" className="p-3 text-center bg-blue-50 text-blue-600 text-xs font-bold animate-pulse">Actively fetching records from the database...</td></tr>
                                            )}
                                            {!loadingLogs && (
                                                <tr><td colSpan="7" className="p-8 text-center text-slate-400">No records found for this date.</td></tr>
                                            )}
                                        </>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {showExportModal && <ExportAttendanceReport onClose={() => setShowExportModal(false)} allTrainees={allTrainees} companies={companies} />}
            </div>
        );
    };


    const ExportAttendanceReport = ({ onClose, allTrainees, companies }) => {
        const [exportScope, setExportScope] = useState('all_companies');
        const [selectedExportCompany, setSelectedExportCompany] = useState('');
        const [selectedTrainee, setSelectedTrainee] = useState(null);
        const [searchQuery, setSearchQuery] = useState('');
        const [showDropdown, setShowDropdown] = useState(false);
        const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
        const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
        const [isGenerating, setIsGenerating] = useState(false);
        const [previewData, setPreviewData] = useState([]);
        const [loadingMsg, setLoadingMsg] = useState('');
        const searchRef = useRef(null);

        useEffect(() => {
            const handleClickOutside = (event) => {
                if (searchRef.current && !searchRef.current.contains(event.target)) {
                    setShowDropdown(false);
                }
            };
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, []);

        const filteredSearchItems = exportScope === 'company' 
            ? companies.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
            : allTrainees.filter(t => 
                (t.firstName + ' ' + t.lastName).toLowerCase().includes(searchQuery.toLowerCase()) || 
                (t.studentId && t.studentId.includes(searchQuery))
              );

        const handleGeneratePreview = async () => {
            setIsGenerating(true);
            setPreviewData([]);
            const APP_ID = "dualtech-ojt-portal"; 
            const traineesRef = db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('trainees');

            try {
                let targetTrainees = [];
                if (exportScope === 'trainee' && selectedTrainee) {
                    targetTrainees = [selectedTrainee];
                } else if (exportScope === 'company' && selectedExportCompany) {
                    targetTrainees = allTrainees.filter(t => (t.company === selectedExportCompany || t.companyName === selectedExportCompany));
                } else if (exportScope === 'all_companies') {
                    targetTrainees = allTrainees.filter(t => (t.company || t.companyName));
                } else {
                    alert("Please select a target to export.");
                    setIsGenerating(false);
                    return;
                }

                let allLogs = [];
                // Chunk target trainees to prevent OOM
                const CHUNK_SIZE = 5;
                for (let i = 0; i < targetTrainees.length; i += CHUNK_SIZE) {
                    setLoadingMsg(`Fetching logs for trainees ${i+1} to ${Math.min(i+CHUNK_SIZE, targetTrainees.length)} of ${targetTrainees.length}...`);
                    const chunk = targetTrainees.slice(i, i + CHUNK_SIZE);
                    const attPromises = chunk.map(async (trainee) => {
                        const attSnapshot = await traineesRef.doc(trainee.id).collection('attendance')
                            .where('date', '>=', startDate)
                            .where('date', '<=', endDate)
                            .get();
                        
                        return attSnapshot.docs.map(doc => ({
                            id: doc.id,
                            studentId: trainee.studentId || 'N/A',
                            traineeName: `${trainee.firstName || ''} ${trainee.lastName || ''}`.trim() || trainee.name || 'Unknown',
                            company: trainee.company || trainee.companyName || 'Unassigned',
                            ic: trainee.ic || trainee.coordinator || 'Unassigned',
                            ...doc.data()
                        }));
                    });

                    const chunkLogs = await Promise.all(attPromises);
                    allLogs = [...allLogs, ...chunkLogs.flat()];
                    setPreviewData(allLogs.slice(0, 50)); // Only store 50 records in preview to save memory!
                    await new Promise(r => setTimeout(r, 100));
                }

                setLoadingMsg(`Sorting ${allLogs.length} records...`);
                allLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
                
                // Store the FULL data internally on a window object so we don't crash React state
                window._fullExportData = allLogs;
                
                setPreviewData(allLogs.slice(0, 50)); 
                setLoadingMsg('');
            } catch (error) {
                console.error("Error generating report:", error);
                alert("An error occurred. Check console for details.");
            } finally {
                setIsGenerating(false);
            }
        };

        const handleExportXLS = () => {
            const dataToExport = window._fullExportData || previewData;
            if (dataToExport.length === 0) return;

            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += "Student ID,Trainee Name,Company,Date,Time In,Time Out,Status,Assigned IC\n";

            dataToExport.forEach(row => {
                const escapeCsv = (str) => `"${String(str || '').replace(/"/g, '""')}"`;
                const r = [
                    escapeCsv(row.studentId),
                    escapeCsv(row.traineeName),
                    escapeCsv(row.company),
                    escapeCsv(row.date),
                    escapeCsv(row.timeIn),
                    escapeCsv(row.timeOut),
                    escapeCsv(row.status),
                    escapeCsv(row.ic)
                ];
                csvContent += r.join(",") + "\n";
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `Attendance_Export_${startDate}_to_${endDate}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

        const inputClass = "w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all";
        const labelClass = "block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5";

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200">
                    
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                                <Download size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">Export Attendance Report</h2>
                                <p className="text-xs font-medium text-slate-500">Generate and download attendance logs to Excel/CSV.</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
                        {/* Config Panel */}
                        <div className="bg-slate-50 dark:bg-slate-900/20 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-5">
                            
                            {/* Row 1: Scope & Dates */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className={labelClass}>Export Scope</label>
                                    <div className="flex gap-2">
                                        <button onClick={() => { setExportScope('company'); setSearchQuery(''); setSelectedTrainee(null); }} className={`flex-1 px-3 py-2 rounded-lg text-[11px] font-bold transition-colors ${exportScope === 'company' ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>Per Company</button>
                                        <button onClick={() => { setExportScope('trainee'); setSearchQuery(''); setSelectedExportCompany(''); }} className={`flex-1 px-3 py-2 rounded-lg text-[11px] font-bold transition-colors ${exportScope === 'trainee' ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>Per Trainee</button>
                                        <button onClick={() => { setExportScope('all_companies'); setSearchQuery(''); setSelectedExportCompany(''); setSelectedTrainee(null); }} className={`flex-1 px-3 py-2 rounded-lg text-[11px] font-bold transition-colors ${exportScope === 'all_companies' ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>All Companies</button>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <label className={labelClass}>Start Date</label>
                                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClass} />
                                    </div>
                                    <div className="flex-1">
                                        <label className={labelClass}>End Date</label>
                                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputClass} />
                                    </div>
                                </div>
                            </div>

                            {/* Row 2: Search */}
                            {exportScope !== 'all_companies' && (
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

                                    {showDropdown && searchQuery && (
                                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                            {filteredSearchItems.map((item, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => {
                                                        if (exportScope === 'company') {
                                                            setSelectedExportCompany(item);
                                                            setSearchQuery(item);
                                                        } else {
                                                            setSelectedTrainee(item);
                                                            setSearchQuery(`${item.lastName}, ${item.firstName}`);
                                                        }
                                                        setShowDropdown(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                                                >
                                                    {exportScope === 'company' ? item : `${item.lastName}, ${item.firstName} (${item.studentId || 'No ID'})`}
                                                </button>
                                            ))}
                                            {filteredSearchItems.length === 0 && (
                                                <div className="px-4 py-3 text-sm text-slate-500 text-center italic">No matches found.</div>
                                            )}
                                        </div>
                                    )}

                                    {/* Selected indicator */}
                                    {exportScope === 'trainee' && selectedTrainee && (
                                        <div className="mt-2 flex items-center gap-2 bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg px-3 py-2 text-sm">
                                            <CheckCircle size={14} className="text-primary-600" />
                                            <span className="font-bold text-primary-700 dark:text-primary-300">{selectedTrainee.lastName}, {selectedTrainee.firstName}</span>
                                            <span className="text-primary-500">({selectedTrainee.studentId})</span>
                                            <button onClick={() => { setSelectedTrainee(null); setSearchQuery(''); }} className="ml-auto text-primary-400 hover:text-primary-600"><X size={14} /></button>
                                        </div>
                                    )}
                                </div>
                            )}

                            <button 
                                onClick={handleGeneratePreview}
                                disabled={isGenerating || (exportScope === 'trainee' && !selectedTrainee) || (exportScope === 'company' && !selectedExportCompany)}
                                className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                {isGenerating ? <Loader size={16} className="animate-spin" /> : <ListChecks size={16} />}
                                {isGenerating ? 'Fetching & Analyzing...' : 'Generate Preview'}
                            </button>
                            {isGenerating && <p className="text-center text-xs font-bold text-primary-600 animate-pulse">{loadingMsg}</p>}
                        </div>

                        {/* Preview Section */}
                        <div className="flex-1 flex flex-col border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800 min-h-[200px]">
                            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/20 flex justify-between items-center">
                                <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">Data Preview</h3>
                                <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-md">
                                    {window._fullExportData && window._fullExportData.length > 50 ? `Showing first 50 of ${window._fullExportData.length} records` : `${previewData.length} records`}
                                </span>
                            </div>
                            <div className="flex-1 overflow-auto">
                                {previewData.length > 0 ? (
                                    <table className="w-full text-left whitespace-nowrap text-xs">
                                        <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                                            <tr>
                                                <th className="p-3 font-bold text-slate-500 uppercase">Trainee</th>
                                                <th className="p-3 font-bold text-slate-500 uppercase">Date</th>
                                                <th className="p-3 font-bold text-slate-500 uppercase">Time In</th>
                                                <th className="p-3 font-bold text-slate-500 uppercase">Time Out</th>
                                                <th className="p-3 font-bold text-slate-500 uppercase">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                            {previewData.map((row, i) => (
                                                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                                    <td className="p-3 font-medium">{row.traineeName}</td>
                                                    <td className="p-3 text-slate-500">{row.date}</td>
                                                    <td className="p-3 font-mono text-slate-500">{row.timeIn || '--:--'}</td>
                                                    <td className="p-3 font-mono text-slate-500">{row.timeOut || '--:--'}</td>
                                                    <td className="p-3"><span className="px-2 py-0.5 rounded-sm bg-slate-100 text-[10px] font-bold uppercase">{row.status}</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                                        <FileText size={32} className="text-slate-300 mb-3" />
                                        <p className="font-bold text-slate-400">No data generated yet</p>
                                        <p className="text-xs text-slate-400 max-w-xs mt-1">Select your scope and click Generate Preview to load attendance records.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
