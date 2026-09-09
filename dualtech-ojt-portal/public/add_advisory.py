import re

file_path = 'c:/Users/rober/dualtech-ojt-portal/public/lfportal.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

advisory_tab_code = """
        function AdvisoryClassTab({ lfData, showMessage }) {
            const [trainees, setTrainees] = useState([]);
            const [loading, setLoading] = useState(true);
            const [sortConfig, setSortConfig] = useState({ key: 'idNumber', direction: 'asc' });

            useEffect(() => {
                const fetchAdvisoryData = async () => {
                    setLoading(true);
                    try {
                        // 1. Fetch holidays
                        const holidaysDoc = await getDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'settings', 'globalHolidays'));
                        const globalHolidays = holidaysDoc.exists() && holidaysDoc.data().holidays ? holidaysDoc.data().holidays : [];

                        // 2. Fetch all BSTP trainees
                        const traineesRef = collection(db, "artifacts", APP_ID, "public", "data", "trainees");
                        const qTrainees = query(traineesRef, where("Level", "==", "BSTP"));
                        const traineesSnap = await getDocs(qTrainees);
                        
                        let assignedTrainees = [];
                        traineesSnap.forEach(d => {
                            const data = d.data();
                            const adviser = (data.adviser || data.Adviser || '').toLowerCase();
                            if (lfData.initials && adviser.includes(lfData.initials.toLowerCase())) {
                                assignedTrainees.push({ id: d.id, ...data });
                            }
                        });

                        // 3. Helper to calculate valid working days (excluding weekends and holidays)
                        const calculateWorkingDays = (startDateStr) => {
                            if (!startDateStr) return 0;
                            const start = new Date(startDateStr);
                            const end = new Date();
                            if (isNaN(start.getTime())) return 0;
                            
                            let workingDays = 0;
                            let current = new Date(start);
                            current.setHours(0,0,0,0);
                            end.setHours(0,0,0,0);
                            
                            const holidayDates = globalHolidays.map(h => h.date);

                            while (current <= end) {
                                const dayOfWeek = current.getDay();
                                const dateStr = current.toISOString().split('T')[0];
                                
                                // 0 is Sunday, 6 is Saturday
                                if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayDates.includes(dateStr)) {
                                    workingDays++;
                                }
                                current.setDate(current.getDate() + 1);
                            }
                            return workingDays;
                        };

                        // 4. Fetch attendance summaries in chunks
                        const studentIds = assignedTrainees.map(t => t.idNumber || t.id_number || t.id).filter(Boolean);
                        const summaryMap = new Map(); // studentNo -> summaries array

                        if (studentIds.length > 0) {
                            const chunkSize = 10;
                            for (let i = 0; i < studentIds.length; i += chunkSize) {
                                const chunk = studentIds.slice(i, i + chunkSize);
                                const qSum = query(
                                    collection(db, "artifacts", APP_ID, "public", "data", "bstpAttendanceSummary"),
                                    where("studentNo", "in", chunk)
                                );
                                const sumSnap = await getDocs(qSum);
                                sumSnap.forEach(d => {
                                    const data = d.data();
                                    if (!summaryMap.has(data.studentNo)) {
                                        summaryMap.set(data.studentNo, []);
                                    }
                                    summaryMap.get(data.studentNo).push(data);
                                });
                            }
                        }

                        // 5. Compute metrics
                        const enrichedTrainees = assignedTrainees.map(t => {
                            const sId = t.idNumber || t.id_number || t.id;
                            const summaries = summaryMap.get(sId) || [];
                            
                            const regDateStr = t.immersionDateStart || t['immersion Date Start'];
                            const workingDays = calculateWorkingDays(regDateStr);
                            
                            let presentCount = 0;
                            let lateCount = 0;

                            summaries.forEach(s => {
                                if (s.firstIn && s.lastOut) {
                                    presentCount++;
                                }
                                if (s.minutesLate && s.minutesLate > 0) {
                                    lateCount++;
                                }
                            });

                            let absencesCount = workingDays - presentCount;
                            if (absencesCount < 0) absencesCount = 0;
                            if (!regDateStr) absencesCount = 'N/A'; // Cannot determine absences without start date

                            return {
                                ...t,
                                computedRegDate: regDateStr || 'N/A',
                                computedPresent: presentCount,
                                computedAbsences: absencesCount,
                                computedLate: lateCount,
                                computedStatus: t.currentbstpStatus || '-'
                            };
                        });

                        setTrainees(enrichedTrainees);
                    } catch (error) {
                        console.error("Error fetching advisory data:", error);
                        showMessage("Failed to load advisory class data.", "error");
                    } finally {
                        setLoading(false);
                    }
                };

                fetchAdvisoryData();
            }, [lfData, showMessage]);

            const handleSort = (key) => {
                let direction = 'asc';
                if (sortConfig.key === key && sortConfig.direction === 'asc') {
                    direction = 'desc';
                }
                setSortConfig({ key, direction });
            };

            const sortedTrainees = [...trainees].sort((a, b) => {
                let valA = a[sortConfig.key];
                let valB = b[sortConfig.key];
                
                // Map complex keys
                if (sortConfig.key === 'idNumber') {
                    valA = a.idNumber || a.id_number || a.id || '';
                    valB = b.idNumber || b.id_number || b.id || '';
                } else if (sortConfig.key === 'section') {
                    valA = a.section || a.Section || '';
                    valB = b.section || b.Section || '';
                } else if (sortConfig.key === 'proctor') {
                    valA = a.proctor || a.Proctor || '';
                    valB = b.proctor || b.Proctor || '';
                }

                if (typeof valA === 'string') valA = valA.toLowerCase();
                if (typeof valB === 'string') valB = valB.toLowerCase();

                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });

            const renderSortIcon = (key) => {
                if (sortConfig.key !== key) return <div className="w-4 inline-block"></div>;
                return sortConfig.direction === 'asc' ? <ChevronUp size={14} className="inline ml-1" /> : <ChevronDown size={14} className="inline ml-1" />;
            };

            if (loading) {
                return (
                    <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">Loading your advisory class...</p>
                    </div>
                );
            }

            return (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                            <Users className="text-blue-600" />
                            My Advisory Class
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                            Trainees assigned to you ({lfData.initials}). Attendance metrics exclude weekends and global holidays.
                        </p>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                                    <th onClick={() => handleSort('idNumber')} className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors whitespace-nowrap">
                                        Student No {renderSortIcon('idNumber')}
                                    </th>
                                    <th onClick={() => handleSort('computedRegDate')} className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors whitespace-nowrap">
                                        Date Registered {renderSortIcon('computedRegDate')}
                                    </th>
                                    <th onClick={() => handleSort('section')} className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors whitespace-nowrap">
                                        Section {renderSortIcon('section')}
                                    </th>
                                    <th onClick={() => handleSort('proctor')} className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors whitespace-nowrap">
                                        BSTP Proctor {renderSortIcon('proctor')}
                                    </th>
                                    <th onClick={() => handleSort('computedPresent')} className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors whitespace-nowrap">
                                        Present {renderSortIcon('computedPresent')}
                                    </th>
                                    <th onClick={() => handleSort('computedAbsences')} className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors whitespace-nowrap">
                                        Absences {renderSortIcon('computedAbsences')}
                                    </th>
                                    <th onClick={() => handleSort('computedLate')} className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors whitespace-nowrap">
                                        Times Late {renderSortIcon('computedLate')}
                                    </th>
                                    <th onClick={() => handleSort('computedStatus')} className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors whitespace-nowrap">
                                        Current Status {renderSortIcon('computedStatus')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {sortedTrainees.map(t => (
                                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4 font-medium whitespace-nowrap">
                                            {t.idNumber || t.id_number || t.id}
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.lastName || t.Family}, {t.firstName || t.Given}</div>
                                        </td>
                                        <td className="p-4 text-sm whitespace-nowrap">{t.computedRegDate}</td>
                                        <td className="p-4 text-sm whitespace-nowrap">{t.section || t.Section || '-'}</td>
                                        <td className="p-4 text-sm whitespace-nowrap">{t.proctor || t.Proctor || '-'}</td>
                                        <td className="p-4 text-sm font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{t.computedPresent}</td>
                                        <td className="p-4 text-sm font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">{t.computedAbsences}</td>
                                        <td className="p-4 text-sm font-bold text-orange-500 dark:text-orange-400 whitespace-nowrap">{t.computedLate}</td>
                                        <td className="p-4 text-sm whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                                                t.computedStatus === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                                                'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                            }`}>
                                                {t.computedStatus}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {sortedTrainees.length === 0 && (
                                    <tr>
                                        <td colSpan="8" className="p-8 text-center text-slate-500 italic">
                                            No trainees assigned to your advisory class.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }
"""

# Insert AdvisoryClassTab
if 'function AdvisoryClassTab' not in content:
    content = content.replace(
        "function ManageClassTab({ lfData, showMessage }) {",
        advisory_tab_code + "\n        function ManageClassTab({ lfData, showMessage }) {"
    )

# Replace rendering logic
render_old = """                            {activeTab === 'manageClass' ? (
                                <ManageClassTab lfData={lfData} showMessage={showMessage} />
                            ) : ("""

render_new = """                            {activeTab === 'manageClass' ? (
                                <ManageClassTab lfData={lfData} showMessage={showMessage} />
                            ) : activeTab === 'advisory' ? (
                                <AdvisoryClassTab lfData={lfData} showMessage={showMessage} />
                            ) : ("""

content = content.replace(render_old, render_new)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Injected AdvisoryClassTab")
