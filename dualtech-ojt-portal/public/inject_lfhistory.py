import sys

code = r'''    function LFHistoryModal({ onClose, lfData, user, showMessage, db, getDocs, query, where, collection, APP_ID }) {
        const [activeView, setActiveView] = React.useState('daily');
        const [historyData, setHistoryData] = React.useState([]);
        const [loading, setLoading] = React.useState(true);

        React.useEffect(() => {
            const fetchHistory = async () => {
                if (!lfData || !user) return;
                setLoading(true);
                try {
                    // Fetch LF Clock In/Out Logs
                    const attRef = collection(db, "artifacts", APP_ID, "public", "data", "lfAttendance");
                    const qAtt = query(attRef, where("lfEmail", "==", user.email));
                    const attSnap = await getDocs(qAtt);
                    
                    const clockLogs = [];
                    attSnap.forEach(doc => {
                        const d = doc.data();
                        if (d.timestamp) {
                            clockLogs.push({
                                type: d.type || 'IN',
                                date: d.timestamp.toDate ? d.timestamp.toDate() : new Date(d.timestamp)
                            });
                        }
                    });

                    // Fetch Skillset verification logs for this LF
                    const bstpAttRef = collection(db, "artifacts", APP_ID, "public", "data", "bstpAttendance");
                    const qBstp = query(bstpAttRef, where("skillsetLf", "==", lfData.initials));
                    const bstpSnap = await getDocs(qBstp);
                    
                    const skillsetLogs = [];
                    bstpSnap.forEach(doc => {
                        const d = doc.data();
                        if ((d.type === 'SKILLSET_IN' || d.type === 'SKILLSET_OUT') && d.timestamp) {
                            skillsetLogs.push({
                                type: d.type,
                                studentNo: d.studentNo,
                                skillset: d.skillset || d.roomSkillset || 'Unknown',
                                date: d.timestamp.toDate ? d.timestamp.toDate() : new Date(d.timestamp)
                            });
                        }
                    });

                    // Aggregate Data by Day
                    const dailyMap = {}; 
                    
                    clockLogs.forEach(log => {
                        const dStr = log.date.toLocaleDateString();
                        if (!dailyMap[dStr]) dailyMap[dStr] = { dateStr: dStr, dateObj: log.date, clockIns: [], clockOuts: [], skillsets: new Set(), trainees: new Set() };
                        if (log.type === 'IN') dailyMap[dStr].clockIns.push(log.date);
                        else dailyMap[dStr].clockOuts.push(log.date);
                    });

                    skillsetLogs.forEach(log => {
                        const dStr = log.date.toLocaleDateString();
                        if (!dailyMap[dStr]) dailyMap[dStr] = { dateStr: dStr, dateObj: log.date, clockIns: [], clockOuts: [], skillsets: new Set(), trainees: new Set() };
                        dailyMap[dStr].skillsets.add(log.skillset);
                        dailyMap[dStr].trainees.add(log.studentNo);
                    });

                    const getIsoWeek = (d) => {
                        const date = new Date(d.getTime());
                        date.setHours(0, 0, 0, 0);
                        date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
                        const week1 = new Date(date.getFullYear(), 0, 4);
                        return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
                    };

                    const processed = Object.values(dailyMap).map(day => {
                        day.clockIns.sort((a,b) => a-b);
                        day.clockOuts.sort((a,b) => b-a); 
                        
                        const firstIn = day.clockIns.length > 0 ? day.clockIns[0] : null;
                        const lastOut = day.clockOuts.length > 0 ? day.clockOuts[0] : null;
                        
                        let totalHours = 0;
                        if (firstIn && lastOut && lastOut > firstIn) {
                            totalHours = (lastOut - firstIn) / (1000 * 60 * 60);
                        }

                        return {
                            ...day,
                            firstIn,
                            lastOut,
                            totalHours,
                            isCompleted: firstIn !== null && lastOut !== null,
                            skillsetArr: Array.from(day.skillsets),
                            traineeCount: day.trainees.size,
                            weekStr: `${day.dateObj.getFullYear()}-W${getIsoWeek(day.dateObj).toString().padStart(2, '0')}`,
                            monthStr: `${day.dateObj.getFullYear()}-${(day.dateObj.getMonth()+1).toString().padStart(2, '0')}`
                        };
                    });
                    
                    processed.sort((a,b) => b.dateObj - a.dateObj);
                    setHistoryData(processed);

                } catch (e) {
                    console.error("Error fetching LF history", e);
                    showMessage("Failed to load history data", "error");
                } finally {
                    setLoading(false);
                }
            };
            fetchHistory();
        }, [lfData, user]);

        const aggregatedData = React.useMemo(() => {
            if (activeView === 'daily') return historyData;
            
            const groupMap = {};
            historyData.forEach(day => {
                const key = activeView === 'weekly' ? day.weekStr : day.monthStr;
                if (!groupMap[key]) {
                    groupMap[key] = { label: key, daysCompleted: 0, skillsets: new Set(), trainees: 0, sortDate: day.dateObj };
                }
                if (day.isCompleted) groupMap[key].daysCompleted++;
                day.skillsetArr.forEach(s => groupMap[key].skillsets.add(s));
                groupMap[key].trainees += day.traineeCount;
            });
            
            return Object.values(groupMap).sort((a,b) => b.sortDate - a.sortDate);
        }, [historyData, activeView]);

        const handleExport = () => {
            let csv = "";
            if (activeView === 'daily') {
                csv = "Date,Clock In,Clock Out,Total Hours,Skillsets Handled,Verified Trainees\n";
                aggregatedData.forEach(row => {
                    csv += `"${row.dateStr}","${row.firstIn ? row.firstIn.toLocaleTimeString() : 'N/A'}","${row.lastOut ? row.lastOut.toLocaleTimeString() : 'N/A'}","${row.totalHours.toFixed(2)}","${row.skillsetArr.join(', ')}","${row.traineeCount}"\n`;
                });
            } else {
                csv = "Period,Days Completed,Skillsets Handled,Verified Trainees\n";
                aggregatedData.forEach(row => {
                    csv += `"${row.label}","${row.daysCompleted}","${Array.from(row.skillsets).join(', ')}","${row.trainees}"\n`;
                });
            }

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `lf_history_${activeView}_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

        return (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-700">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 rounded-t-2xl">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Lucide.History className="text-blue-500" /> My Activity History
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">Clock in/out logs and skillset verifications.</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500">
                            <Lucide.X size={20} />
                        </button>
                    </div>
                    
                    <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                                {['daily', 'weekly', 'monthly'].map(v => (
                                    <button 
                                        key={v}
                                        onClick={() => setActiveView(v)}
                                        className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors capitalize ${activeView === v ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                            <button 
                                onClick={handleExport}
                                disabled={loading || aggregatedData.length === 0}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 rounded-lg font-bold text-sm transition-colors disabled:opacity-50"
                            >
                                <Lucide.Download size={16} /> Export to CSV
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-blue-500">
                                <Lucide.Loader2 size={32} className="animate-spin mb-4" />
                                <p className="font-medium text-slate-500">Loading history data...</p>
                            </div>
                        ) : aggregatedData.length === 0 ? (
                            <div className="text-center py-20 text-slate-500">
                                <Lucide.Inbox size={48} className="mx-auto mb-4 opacity-20" />
                                <p>No history records found.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                                <table className="w-full text-left border-collapse whitespace-nowrap">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{activeView === 'daily' ? 'Date' : 'Period'}</th>
                                            {activeView === 'daily' ? (
                                                <>
                                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Clock In</th>
                                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Clock Out</th>
                                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Total Hours</th>
                                                </>
                                            ) : (
                                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Days Completed</th>
                                            )}
                                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Skillsets Handled</th>
                                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Verified Trainees</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {aggregatedData.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{activeView === 'daily' ? row.dateStr : row.label}</td>
                                                {activeView === 'daily' ? (
                                                    <>
                                                        <td className="p-4 font-mono text-sm text-emerald-600">{row.firstIn ? row.firstIn.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : <span className="text-slate-400">N/A</span>}</td>
                                                        <td className="p-4 font-mono text-sm text-blue-600">{row.lastOut ? row.lastOut.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : <span className="text-slate-400">N/A</span>}</td>
                                                        <td className="p-4 font-mono text-sm">{row.totalHours > 0 ? `${row.totalHours.toFixed(1)}h` : '-'}</td>
                                                    </>
                                                ) : (
                                                    <td className="p-4 font-bold text-blue-600">{row.daysCompleted}</td>
                                                )}
                                                <td className="p-4">
                                                    <div className="flex flex-wrap gap-1 max-w-xs whitespace-normal">
                                                        {(activeView === 'daily' ? row.skillsetArr : Array.from(row.skillsets)).map(s => (
                                                            <span key={s} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs rounded-full border border-slate-200 dark:border-slate-700">{s}</span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="p-4 font-bold text-slate-700 dark:text-slate-300">{activeView === 'daily' ? row.traineeCount : row.trainees}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }
'''

content = open('lfportal.html', 'r', encoding='utf-8').read()
if 'function LFHistoryModal' not in content:
    idx = content.find('function App() {')
    if idx != -1:
        new_content = content[:idx] + code + '\n' + content[idx:]
        open('lfportal.html', 'w', encoding='utf-8').write(new_content)
        print("Added LFHistoryModal")
    else:
        print("App component not found")
else:
    print("LFHistoryModal already exists")
