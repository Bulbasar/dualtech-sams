import re

code = r'''
    function StatusColumn({ title, color, items, groupBy }) {
        const grouped = items.reduce((acc, item) => {
            if (!acc[item.groupKey]) acc[item.groupKey] = [];
            acc[item.groupKey].push(item);
            return acc;
        }, {});

        const colorMap = {
            blue: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
            emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
            slate: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
        };
        const dotColorMap = {
            blue: 'bg-blue-500', emerald: 'bg-emerald-500', slate: 'bg-slate-400'
        };

        return (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800 h-[600px] flex flex-col">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${dotColorMap[color]}`}></div>
                        {title}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${colorMap[color]} border`}>
                        {items.length}
                    </span>
                </div>
                
                <div className="overflow-y-auto pr-2 space-y-4 flex-1 custom-scrollbar">
                    {Object.entries(grouped).length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 pb-10">
                            <Lucide.Inbox size={32} className="mb-2 opacity-20" />
                            <p className="text-sm">No trainees in this status</p>
                        </div>
                    ) : (
                        Object.entries(grouped).sort((a,b)=>a[0].localeCompare(b[0])).map(([groupName, groupItems]) => (
                            <div key={groupName} className="space-y-2">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider sticky top-0 bg-slate-50 dark:bg-slate-800/50 py-1 z-10">{groupName}</h4>
                                {groupItems.map(t => (
                                    <div key={t.studentNo} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{t.lastName}, {t.firstName}</p>
                                                <p className="text-xs text-slate-500">{t.studentNo}</p>
                                            </div>
                                            {t.log && (
                                                <div className="text-right">
                                                    <div className={`text-xs font-bold ${t.isLate ? 'text-red-500' : 'text-emerald-500'}`}>
                                                        IN: {new Date(t.log.timeIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                        {t.isLate && <span className="ml-1 text-[10px] bg-red-100 text-red-700 px-1 rounded">LATE</span>}
                                                    </div>
                                                    {t.log.timeOut && (
                                                        <div className={`text-xs font-bold mt-0.5 ${t.isUndertime ? 'text-orange-500' : 'text-blue-500'}`}>
                                                            OUT: {new Date(t.log.timeOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                            {t.isUndertime && <span className="ml-1 text-[10px] bg-orange-100 text-orange-700 px-1 rounded">UT</span>}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    function OverviewTab({ lfData, showMessage }) {
        const { PieChart, Pie, Cell, Tooltip: RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ComposedChart, Line } = Recharts;

        const [attendanceData, setAttendanceData] = React.useState({});
        const [shifts, setShifts] = React.useState([]);
        const [isFetching, setIsFetching] = React.useState(false);
        const [lastUpdated, setLastUpdated] = React.useState(null);
        const [groupBy, setGroupBy] = React.useState('shift'); // 'shift' or 'section'
        const [activeTrainees, setActiveTrainees] = React.useState([]);

        // Helper to determine week parity
        const getWeekNumber = (d) => {
            d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
            d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
            return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
        };

        const fetchTraineesAndAttendance = async () => {
            setIsFetching(true);
            try {
                // Fetch shifts
                const shiftsRef = collection(db, "artifacts", APP_ID, "public", "data", "shifts");
                const shiftsSnap = await getDocs(shiftsRef);
                const fetchedShifts = [];
                shiftsSnap.forEach(doc => fetchedShifts.push({ id: doc.id, ...doc.data() }));
                setShifts(fetchedShifts);

                // Fetch trainees assigned to logged-in user
                const traineesRef = collection(db, "artifacts", APP_ID, "public", "data", "trainees");
                const qTrainees = query(traineesRef, where("Level", "==", "BSTP"));
                const traineeSnap = await getDocs(qTrainees);
                const fetchedTrainees = [];

                traineeSnap.forEach(doc => {
                    const data = doc.data();
                    const status = String(data.status || data.Status || data.currentbstpStatus || '').toLowerCase();
                    if (status === 'loa' || !data.isRegistered) return;
                    
                    const adviser = (data.adviser || data.Adviser || '').toLowerCase().trim();
                    const isMy = lfData.initials && adviser.includes(lfData.initials.toLowerCase().trim());
                    if (isMy) {
                        fetchedTrainees.push(data);
                    }
                });

                setActiveTrainees(fetchedTrainees);

                // Fetch Attendance
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todayIsoStart = today.toISOString();

                const qAtt = query(
                    collection(db, 'artifacts', APP_ID, 'public', 'data', 'bstpAttendance'),
                    where('timestamp', '>=', todayIsoStart)
                );
                
                const snap = await getDocs(qAtt);
                
                // Map logs by studentNo
                const logsByStudent = {};
                snap.forEach(doc => {
                    const d = doc.data();
                    if (!d.studentNo) return;
                    
                    if (!logsByStudent[d.studentNo]) {
                        logsByStudent[d.studentNo] = { inRecs: [], outRecs: [] };
                    }
                    
                    if (d.type === 'IN') {
                        logsByStudent[d.studentNo].inRecs.push(d);
                    } else if (d.type === 'OUT') {
                        logsByStudent[d.studentNo].outRecs.push(d);
                    }
                });
                
                setAttendanceData(logsByStudent);
                setLastUpdated(new Date());
                showMessage("Attendance data refreshed successfully!");

            } catch (e) {
                console.error(e);
                showMessage("Error fetching data", "error");
            } finally {
                setIsFetching(false);
            }
        };

        // Auto-fetch on mount
        React.useEffect(() => {
            fetchTraineesAndAttendance();
        }, []);

        // Derived Statistics
        const stats = React.useMemo(() => {
            const groups = {
                'Currently Clocked In': [],
                'Completed Shift': [],
                'No Clock Ins': []
            };
            
            activeTrainees.forEach(t => {
                const studentNo = t.studentNo || t.studentId || t.idNumber || t.id_number || t.id;
                const stuLogs = attendanceData[studentNo];
                
                let groupKey = 'Unknown';
                if (groupBy === 'shift') groupKey = (t.shift || t.bstpshiftName || 'No Shift');
                else if (groupBy === 'adviser') groupKey = (t.adviser || 'No Adviser');
                else if (groupBy === 'section') groupKey = (t.section || t.Section || 'No Section');
                else if (groupBy === 'status') groupKey = (t.currentbstpStatus || t.Status || t.status || 'No Status');
                
                let status = 'No Clock Ins';
                let isLate = false;
                let isUndertime = false;
                let logToDisplay = null;

                if (stuLogs && stuLogs.inRecs.length > 0) {
                    // Sort by latest IN
                    stuLogs.inRecs.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
                    const latestIn = stuLogs.inRecs[0];
                    logToDisplay = { timeIn: latestIn.timestamp };
                    
                    let latestOut = null;
                    if (stuLogs.outRecs.length > 0) {
                        status = 'Completed Shift';
                        stuLogs.outRecs.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
                        latestOut = stuLogs.outRecs[0];
                        logToDisplay.timeOut = latestOut.timestamp;
                    } else {
                        status = 'Currently Clocked In';
                    }
                    
                    // Calculate if Late based on Shift
                    let targetShiftId = t.bstpshiftId;
                    if (!targetShiftId && t.shift && shifts.length > 0) {
                        const found = shifts.find(s => s.name === t.shift);
                        if (found) targetShiftId = found.id;
                    }
                    if (targetShiftId && shifts.length > 0) {
                        const shift = shifts.find(s => s.id === targetShiftId);
                        if (shift) {
                            const weekNum = getWeekNumber(new Date(latestIn.timestamp));
                            const isEvenWeek = weekNum % 2 === 0;
                            const startTimeStr = isEvenWeek ? shift.evenWeekStartTime : shift.oddWeekStartTime;
                            const endTimeStr = isEvenWeek ? shift.evenWeekEndTime : shift.oddWeekEndTime;
                            
                            if (startTimeStr) {
                                const [shiftHH, shiftMM] = startTimeStr.split(':').map(Number);
                                const inDate = new Date(latestIn.timestamp);
                                const shiftMins = (shiftHH * 60) + shiftMM;
                                const inMins = (inDate.getHours() * 60) + inDate.getMinutes();
                                if (inMins > shiftMins) isLate = true;
                            }
                            
                            if (endTimeStr && latestOut) {
                                const [shiftHH, shiftMM] = endTimeStr.split(':').map(Number);
                                const outDate = new Date(latestOut.timestamp);
                                const shiftMins = (shiftHH * 60) + shiftMM;
                                const outMins = (outDate.getHours() * 60) + outDate.getMinutes();
                                if (outMins < shiftMins) isUndertime = true;
                            }
                        }
                    }
                }

                const item = { ...t, log: logToDisplay, isLate, isUndertime, groupKey };
                groups[status].push(item);
            });

            return groups;
        }, [activeTrainees, attendanceData, groupBy, shifts]);

        // Chart Data Preparation
        const pieData = [
            { name: 'Clocked In', value: stats['Currently Clocked In'].length, color: '#3b82f6' },
            { name: 'Completed', value: stats['Completed Shift'].length, color: '#10b981' },
            { name: 'No Clock In', value: stats['No Clock Ins'].length, color: '#94a3b8' }
        ];

        const barDataMap = {};
        activeTrainees.forEach(t => {
            let groupKey = 'Unknown';
            if (groupBy === 'shift') groupKey = (t.shift || t.bstpshiftName || 'No Shift');
            else if (groupBy === 'adviser') groupKey = (t.adviser || 'No Adviser');
            else if (groupBy === 'section') groupKey = (t.section || t.Section || 'No Section');
            else if (groupBy === 'status') groupKey = (t.currentbstpStatus || t.Status || t.status || 'No Status');
            if (!barDataMap[groupKey]) {
                barDataMap[groupKey] = { name: groupKey, OnTime: 0, Late: 0, NoClockIn: 0, Total: 0 };
            }
            barDataMap[groupKey].Total++;
        });

        [...stats['Currently Clocked In'], ...stats['Completed Shift']].forEach(item => {
            if (item.isLate) barDataMap[item.groupKey].Late++;
            else barDataMap[item.groupKey].OnTime++;
        });
        
        stats['No Clock Ins'].forEach(item => {
            barDataMap[item.groupKey].NoClockIn++;
        });

        const barData = Object.values(barDataMap).map(d => {
            return {
                ...d,
                Rate: d.Total > 0 ? parseFloat(((d.OnTime / d.Total) * 100).toFixed(1)) : 0
            };
        });

        return (
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <Lucide.Users className="text-blue-500" /> My Trainees Attendance Overview
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Monitoring {activeTrainees.length} active trainees. 
                            {lastUpdated && <span className="ml-2 inline-flex items-center gap-1"><Lucide.Clock size={12}/> Last updated: {lastUpdated.toLocaleTimeString()}</span>}
                        </p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <select 
                            value={groupBy} 
                            onChange={e => setGroupBy(e.target.value)}
                            className="bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300 rounded-lg px-3 py-2 border-none focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="shift">Group by Shift</option>
                            <option value="section">Group by Section</option>
                            <option value="status">Group by Status</option>
                        </select>
                        <button 
                            onClick={fetchTraineesAndAttendance}
                            disabled={isFetching}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 whitespace-nowrap shadow-sm"
                        >
                            <Lucide.RefreshCw size={16} className={isFetching ? "animate-spin" : ""} /> Refresh
                        </button>
                    </div>
                </div>

                {Recharts && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col items-center">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Overall Status</h3>
                            <div className="w-full h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                            {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                        </Pie>
                                        <RechartsTooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Attendance by {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}</h3>
                            <div className="w-full h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                        <XAxis dataKey="name" tick={{fontSize: 12}} />
                                        <YAxis yAxisId="left" tick={{fontSize: 12}} allowDecimals={false} />
                                        <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12}} domain={[0, 100]} />
                                        <RechartsTooltip cursor={{fill: 'transparent'}} />
                                        <Legend />
                                        <Bar yAxisId="left" dataKey="OnTime" name="Clocked In On Time" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                                        <Bar yAxisId="left" dataKey="Late" name="Late" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                                        <Bar yAxisId="left" dataKey="NoClockIn" name="No Clock In" stackId="a" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                                        <Line yAxisId="right" type="monotone" dataKey="Rate" name="Attendance Rate %" stroke="#3b82f6" strokeWidth={3} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <StatusColumn title="Currently Clocked In" color="blue" items={stats['Currently Clocked In']} groupBy={groupBy} />
                    <StatusColumn title="Completed Shift" color="emerald" items={stats['Completed Shift']} groupBy={groupBy} />
                    <StatusColumn title="No Clock Ins" color="slate" items={stats['No Clock Ins']} groupBy={groupBy} />
                </div>
            </div>
        );
    }
'''

content = open('lfportal.html', 'r', encoding='utf-8').read()

start_idx = content.find('function OverviewTab(')
end_idx = content.find('function AdvisoryClassTab', start_idx)

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + code + '\n    ' + content[end_idx:]
    open('lfportal.html', 'w', encoding='utf-8').write(new_content)
    print("Replaced OverviewTab")
else:
    print("Could not find OverviewTab or next function")
