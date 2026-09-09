function OverviewTab({ showMessage, globalData, setGlobalData }) {
    const { useState, useEffect, useMemo } = React;
    const { RefreshCw, Users, Clock, AlertTriangle, ChevronDown } = Lucide;
    const { collection, query, where, getDocs } = window; // from firestore
    
    // We expect Recharts to be available globally from CDN
    const { PieChart, Pie, Cell, Tooltip: RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } = window.Recharts || {};

    const [attendanceData, setAttendanceData] = useState({});
    const [isFetching, setIsFetching] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [groupBy, setGroupBy] = useState('shift'); // 'shift' or 'adviser'

    const activeTrainees = useMemo(() => {
        return (globalData?.trainees || []).filter(t => t.role === 'BSTP' && t.bstp_status === 'active');
    }, [globalData?.trainees]);

    const fetchAttendance = async () => {
        setIsFetching(true);
        const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local
        const newData = {};
        
        try {
            const appId = 'dualtech-ojt-portal';
            const db = window.db; // assuming db is available globally or we can use the injected db. Actually we should get db from window.db which is initialized in bstpadmin.html
            
            // Fetch logs for all active trainees
            const promises = activeTrainees.map(async (trainee) => {
                try {
                    const q = query(
                        collection(db, 'artifacts', appId, 'users', trainee.id, 'attendanceLogs'),
                        where('dateString', '==', todayStr)
                    );
                    const snap = await getDocs(q);
                    if (!snap.empty) {
                        // Assuming 1 log per day, or take the latest
                        let latestLog = null;
                        snap.forEach(doc => {
                            const d = doc.data();
                            if (!latestLog || d.timestamp > latestLog.timestamp) {
                                latestLog = d;
                            }
                        });
                        newData[trainee.id] = latestLog;
                    }
                } catch(e) {
                    console.error("Error fetching for trainee", trainee.id, e);
                }
            });
            
            await Promise.all(promises);
            setAttendanceData(newData);
            setLastUpdated(new Date());
            showMessage("Attendance data refreshed successfully!");
        } catch(e) {
            console.error(e);
            showMessage("Error refreshing attendance data", "error");
        } finally {
            setIsFetching(false);
        }
    };

    // Auto-fetch on mount if not fetched
    useEffect(() => {
        if (activeTrainees.length > 0 && !lastUpdated && !isFetching) {
            fetchAttendance();
        }
    }, [activeTrainees]);

    // Derived Statistics
    const stats = useMemo(() => {
        const groups = {
            'Currently Clocked In': [],
            'Completed Shift': [],
            'No Clock Ins': []
        };
        
        activeTrainees.forEach(t => {
            const log = attendanceData[t.id];
            // Determine grouping key
            const groupKey = groupBy === 'shift' ? (t.shift_name || 'No Shift') : (t.adviser || 'No Adviser');
            
            let status = 'No Clock Ins';
            let isLate = false;

            if (log) {
                if (log.timeIn && log.timeOut) {
                    status = 'Completed Shift';
                } else if (log.timeIn) {
                    status = 'Currently Clocked In';
                }
                
                // Determine Late vs On Time based on statusRemark
                const remark = log.clockInDetails?.statusRemark || '';
                if (remark.toLowerCase().includes('late')) {
                    isLate = true;
                }
            }

            const item = { ...t, log, isLate, groupKey };
            groups[status].push(item);
        });

        return groups;
    }, [activeTrainees, attendanceData, groupBy]);

    // Chart Data Preparation
    const pieData = [
        { name: 'Clocked In', value: stats['Currently Clocked In'].length, color: '#3b82f6' },
        { name: 'Completed', value: stats['Completed Shift'].length, color: '#10b981' },
        { name: 'No Clock In', value: stats['No Clock Ins'].length, color: '#94a3b8' }
    ];

    const barDataMap = {};
    [...stats['Currently Clocked In'], ...stats['Completed Shift']].forEach(item => {
        if (!barDataMap[item.groupKey]) {
            barDataMap[item.groupKey] = { name: item.groupKey, OnTime: 0, Late: 0 };
        }
        if (item.isLate) barDataMap[item.groupKey].Late++;
        else barDataMap[item.groupKey].OnTime++;
    });
    const barData = Object.values(barDataMap);

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                <div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Users className="text-blue-500" /> BSTP Trainee Attendance Overview
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Monitoring {activeTrainees.length} active trainees. 
                        {lastUpdated && <span className="ml-2 inline-flex items-center gap-1"><Clock size={12}/> Last updated: {lastUpdated.toLocaleTimeString()}</span>}
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <select 
                        value={groupBy} 
                        onChange={e => setGroupBy(e.target.value)}
                        className="bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300 rounded-lg px-3 py-2 border-none focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="shift">Group by Shift</option>
                        <option value="adviser">Group by Adviser</option>
                    </select>
                    <button 
                        onClick={fetchAttendance}
                        disabled={isFetching}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 whitespace-nowrap shadow-sm"
                    >
                        <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} /> Refresh
                    </button>
                </div>
            </div>

            {/* Dashboard Graphs */}
            {window.Recharts && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Pie Chart */}
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

                    {/* Bar Chart */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Punctuality by {groupBy === 'shift' ? 'Shift' : 'Adviser'}</h3>
                        <div className="w-full h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                    <XAxis dataKey="name" tick={{fontSize: 12}} />
                                    <YAxis tick={{fontSize: 12}} allowDecimals={false} />
                                    <RechartsTooltip cursor={{fill: 'transparent'}} />
                                    <Legend />
                                    <Bar dataKey="OnTime" name="On Time" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                                    <Bar dataKey="Late" name="Late" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Detailed Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <StatusColumn title="Currently Clocked In" color="blue" items={stats['Currently Clocked In']} groupBy={groupBy} />
                <StatusColumn title="Completed Shift" color="emerald" items={stats['Completed Shift']} groupBy={groupBy} />
                <StatusColumn title="No Clock Ins" color="slate" items={stats['No Clock Ins']} groupBy={groupBy} />
            </div>
        </div>
    );
}

function StatusColumn({ title, color, items, groupBy }) {
    // Group items by the chosen groupKey
    const grouped = items.reduce((acc, item) => {
        if (!acc[item.groupKey]) acc[item.groupKey] = [];
        acc[item.groupKey].push(item);
        return acc;
    }, {});

    const colorClasses = {
        blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
        emerald: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
        slate: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700"
    };

    return (
        <div className="flex flex-col gap-3">
            <div className={`px-4 py-3 rounded-lg border font-bold flex items-center justify-between ${colorClasses[color]}`}>
                <span>{title}</span>
                <span className="bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-full text-sm">{items.length}</span>
            </div>
            
            {Object.keys(grouped).sort().map(key => (
                <div key={key} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                    <div className="bg-slate-50 dark:bg-slate-800/50 px-3 py-2 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase flex justify-between">
                        <span>{key}</span>
                        <span>{grouped[key].length} Trainees</span>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
                        {grouped[key].map(item => (
                            <div key={item.id} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.name}</span>
                                    <span className="text-[10px] text-slate-500">{item.section || 'No Section'}</span>
                                </div>
                                {item.log && (
                                    <div className="flex flex-col items-end">
                                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${item.isLate ? 'bg-red-100 text-red-700 dark:bg-red-900/30' : 'bg-green-100 text-green-700 dark:bg-green-900/30'}`}>
                                            {item.isLate ? 'LATE' : 'ON TIME'}
                                        </span>
                                        <span className="text-[10px] text-slate-400 mt-1">
                                            {new Date(item.log.timeIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            
            {items.length === 0 && (
                <div className="p-6 text-center text-slate-400 text-sm border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    No trainees in this category.
                </div>
            )}
        </div>
    );
}
