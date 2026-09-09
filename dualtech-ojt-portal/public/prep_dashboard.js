const fs = require('fs');

let dt = fs.readFileSync('c:/Users/rober/.gemini/antigravity-ide/brain/8a49551a-099f-44e2-a6fe-7dd4fc7b8cd1/scratch/dashboard_tab.jsx', 'utf8');

// 1. Update Props
dt = dt.replace(
    "const DashboardTab = ({ allTrainees = [], attendanceLogs = [] }) => {",
    "const DashboardTab = ({ allTrainees = [], attendanceLogs = [], registeredStudentIds = new Set() }) => {"
);

// 2. Remove "Total ASTP Masterlist" card
const cardToRemove =                                     <div className="bg-gradient-to-br from-blue-500 to-primary-600 rounded-3xl p-6 lg:p-8 text-white shadow-lg relative overflow-hidden group">
                                        <div className="absolute -right-6 -top-6 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                                        <div className="relative z-10">
                                            <p className="text-blue-100 font-bold tracking-wide uppercase text-xs mb-1">Total ASTP Masterlist</p>
                                            <div className="flex items-end gap-3">
                                                <h3 className="text-4xl lg:text-5xl font-black tracking-tight">{astpTrainees.length}</h3>
                                                <span className="text-blue-100 font-medium pb-1.5 flex items-center gap-1"><Users size={16}/> Sync Count</span>
                                            </div>
                                        </div>
                                    </div>;
dt = dt.replace(cardToRemove, "");

// Fix grid layout for the remaining single card
dt = dt.replace(
    className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6",
    className="grid grid-cols-1 md:grid-cols-1 gap-4 lg:gap-6"
);

// 3. Extract logsByStudent and calculate metrics and list
const metricsRegex = /const dailyAttendanceMetrics = useMemo\(\(\) => \{[\s\S]*?return \{ clockedInCount, completedShiftCount, undertimeCount, pctUndertime \};\n                \}, \[attendanceLogs, activeAstpTrainees\]\);/;

const newMetricsAndList =                 const logsByStudent = useMemo(() => {
                    const todayStr = getTodayString();
                    const todayLogs = attendanceLogs.filter(l => {
                        const t = parseTime(l.timestamp) || parseTime(l.timeIn) || parseTime(l.date);
                        if (!t) return false;
                        return t.toISOString().split('T')[0] === todayStr;
                    });
                    const logs = {};
                    todayLogs.forEach(log => {
                        let sid = log.studentId || log['Student ID#'];
                        if (!sid) return;
                        sid = String(sid).trim();
                        if (!logs[sid]) logs[sid] = { in: null, out: null };
                        if (log.type === 'IN') logs[sid].in = log.timestamp || log.timeIn;
                        if (log.type === 'OUT') logs[sid].out = log.timestamp || log.timeOut;
                    });
                    return logs;
                }, [attendanceLogs]);

                const registeredAttendanceList = useMemo(() => {
                    // Only get active ASTP trainees who are registered in Trainee Portal
                    const registeredActive = activeAstpTrainees.filter(t => {
                        const sid = String(t.studentId || t['Student ID#'] || '').trim();
                        return registeredStudentIds.has(sid);
                    });
                    
                    return registeredActive.map(t => {
                        const sid = String(t.studentId || t['Student ID#'] || '').trim();
                        const logs = logsByStudent[sid];
                        let status = 'Not Clocked In';
                        let statusColor = 'text-slate-500';
                        let bgBadge = 'bg-slate-100 dark:bg-slate-800';
                        
                        if (logs) {
                            if (logs.in && !logs.out) {
                                status = 'Currently Clocked In';
                                statusColor = 'text-blue-600 dark:text-blue-400';
                                bgBadge = 'bg-blue-100 dark:bg-blue-900/30';
                            } else if (logs.in && logs.out) {
                                const inTime = parseTime(logs.in).getTime();
                                const outTime = parseTime(logs.out).getTime();
                                const hours = (outTime - inTime) / (1000 * 60 * 60);
                                if (hours < 8) {
                                    status = 'Undertime';
                                    statusColor = 'text-orange-600 dark:text-orange-400';
                                    bgBadge = 'bg-orange-100 dark:bg-orange-900/30';
                                } else {
                                    status = 'Completed Shift';
                                    statusColor = 'text-emerald-600 dark:text-emerald-400';
                                    bgBadge = 'bg-emerald-100 dark:bg-emerald-900/30';
                                }
                            }
                        }
                        
                        return { ...t, status, statusColor, bgBadge, in: logs?.in, out: logs?.out };
                    }).sort((a, b) => {
                        // Sort by status priority: Clocked In -> Undertime -> Completed -> Not Clocked In
                        const prio = { 'Currently Clocked In': 1, 'Undertime': 2, 'Completed Shift': 3, 'Not Clocked In': 4 };
                        return prio[a.status] - prio[b.status] || (a.name || '').localeCompare(b.name || '');
                    });
                }, [activeAstpTrainees, registeredStudentIds, logsByStudent]);

                const dailyAttendanceMetrics = useMemo(() => {
                    let clockedInCount = 0;
                    let completedShiftCount = 0;
                    let undertimeCount = 0;
                    
                    registeredAttendanceList.forEach(t => {
                        if (t.status === 'Currently Clocked In') clockedInCount++;
                        if (t.status === 'Completed Shift' || t.status === 'Undertime') completedShiftCount++;
                        if (t.status === 'Undertime') undertimeCount++;
                    });
                    
                    const pctUndertime = completedShiftCount > 0 ? ((undertimeCount / completedShiftCount) * 100).toFixed(1) : 0;
                    return { clockedInCount, completedShiftCount, undertimeCount, pctUndertime };
                }, [registeredAttendanceList]);;

dt = dt.replace(metricsRegex, newMetricsAndList);

// 4. Update PieChart for modernity
dt = dt.replace(
    /innerRadius=\{60\} outerRadius=\{100\} paddingAngle=\{4\}/,
    innerRadius={75} outerRadius={105} paddingAngle={5} cornerRadius={6}
);

// 5. Add Table to UI
const tableUI =                                     {/* REGISTERED ATTENDANCE LIST */}
                                    <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                                        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                                    <Users className="text-primary-500"/> Registered ASTP Trainees
                                                </h3>
                                                <p className="text-slate-500 text-sm mt-1">Live status of trainees registered in the Trainee Portal</p>
                                            </div>
                                            <div className="text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900/50 px-4 py-2 rounded-xl">
                                                Total: {registeredAttendanceList.length} Trainees
                                            </div>
                                        </div>

                                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                                            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                                                <thead className="bg-slate-50 dark:bg-slate-900/50 font-bold text-slate-800 dark:text-slate-100">
                                                    <tr>
                                                        <th className="p-4 uppercase text-xs tracking-wider">Trainee</th>
                                                        <th className="p-4 uppercase text-xs tracking-wider">Company</th>
                                                        <th className="p-4 uppercase text-xs tracking-wider text-center">Time In</th>
                                                        <th className="p-4 uppercase text-xs tracking-wider text-center">Time Out</th>
                                                        <th className="p-4 uppercase text-xs tracking-wider text-right">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800/30">
                                                    {registeredAttendanceList.length === 0 ? (
                                                        <tr><td colSpan="5" className="p-8 text-center text-slate-400">No registered ASTP trainees found.</td></tr>
                                                    ) : (
                                                        registeredAttendanceList.map((t, idx) => (
                                                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                                                                <td className="p-4 font-bold text-slate-800 dark:text-slate-100">{t.name || t.Name}</td>
                                                                <td className="p-4">{t.company || t.companyName || t['Company Name']}</td>
                                                                <td className="p-4 text-center font-mono text-xs">{t.in ? new Date(t.in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}</td>
                                                                <td className="p-4 text-center font-mono text-xs">{t.out ? new Date(t.out).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}</td>
                                                                <td className="p-4 text-right">
                                                                    <span className={\inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold \ \\}>
                                                                        {t.status === 'Currently Clocked In' && <Clock size={12} className="mr-1"/>}
                                                                        {t.status === 'Completed Shift' && <CheckSquare size={12} className="mr-1"/>}
                                                                        {t.status === 'Undertime' && <AlertTriangle size={12} className="mr-1"/>}
                                                                        {t.status === 'Not Clocked In' && <XCircle size={12} className="mr-1"/>}
                                                                        {t.status}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>;

dt = dt.replace(
    /<\/div>\s*<\/div>\s*\)\}\s*<\/div>/, // Matches the end of the Pie chart div
    "</div>\n                                    </div>\n                                    )} // End of chart\n" + tableUI + "\n                                </div>"
);

fs.writeFileSync('c:/Users/rober/.gemini/antigravity-ide/brain/8a49551a-099f-44e2-a6fe-7dd4fc7b8cd1/scratch/dashboard_tab_new.jsx', dt);
console.log('Written to dashboard_tab_new.jsx');
