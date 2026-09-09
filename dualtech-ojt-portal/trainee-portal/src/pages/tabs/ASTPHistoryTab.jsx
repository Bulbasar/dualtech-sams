
import React, { useState, useMemo } from 'react';
import { Search, Calendar, FileText, Download, CheckCircle, X, ChevronDown, ChevronUp, AlertCircle , Eye, EyeOff } from 'lucide-react';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';

export default function ASTPHistoryTab({ profile, user, db, appId, allLogs, attendanceDisputes, absenceLogs, fetchLogs }) {
    
    const [historySortConfig, setHistorySortConfig] = useState({ key: 'date', direction: 'desc' });
    const [showLogDetailsModal, setShowLogDetailsModal] = useState(false);
    const [selectedLogForDetails, setSelectedLogForDetails] = useState(null);
    const [requestSortHistory, setRequestSortHistory] = useState({ key: 'date', direction: 'desc' });
    
    function getLocalYYYYMMDD(dateObj) {
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    const currentLocalMonth = (() => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        return `${y}-${m}`;
    })();
    
const [selectedMonth, setSelectedMonth] = useState(currentLocalMonth);

    /* STATES */

const [historyFilterMode, setHistoryFilterMode] = useState('month'); // 'month' or 'day'
const [historySelectedDay, setHistorySelectedDay] = useState(getLocalYYYYMMDD(new Date()));
  const isActive = profile?.status === 'Active';

    const submitAbsenceDispute = async (dateString) => {
        if (!isActive) return;
        const reason = prompt(`Reason for Absence on ${dateString}?`);
        if (!reason) return;
        try {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'requests'), {
                studentId: profile.studentId || profile['Student ID#'] || user.uid,
                studentName: (profile.given && profile.family) ? `${profile.given} ${profile.family}` : (profile.name || 'Unknown Trainee'),
                uid: user.uid,
                type: 'Dispute',
                category: 'Missing Log / Absence',
                date: dateString,
                reason: reason,
                status: 'Pending',
                createdAt: new Date().toISOString()
            });
            alert("Absence Dispute submitted successfully to your IC.");
            if (fetchLogs) fetchLogs();
        } catch (err) { alert("Failed to submit dispute."); }
    };


    const [showColDropdown, setShowColDropdown] = useState(false);
    const [historyVisibleColumns, setHistoryVisibleColumns] = useState(['Date', 'Time In', 'Time Out', 'Total Hours', 'Disputes', 'Remarks']);


/* FUNCTIONS */
const getBaseStartDate = () => {
                let baseStartDate = new Date('2020-01-01');
                if (profile.iptDateStart) {
                    const parsedIpt = new Date(profile.iptDateStart);
                    if (!isNaN(parsedIpt)) baseStartDate = parsedIpt;
                } else if (profile.registeredAt) {
                    baseStartDate = new Date(profile.registeredAt.seconds * 1000);
                }
                baseStartDate.setHours(0, 0, 0, 0);
                return baseStartDate;
            }

const historyTableData = useMemo(() => {
                const baseStartDate = getBaseStartDate();
                const [year, month] = selectedMonth.split('-');
                let startDate, endDate;

                if (historyFilterMode === 'month') {
                    startDate = new Date(year, month - 1, 1);
                    endDate = new Date(year, month, 0);
                } else {
                    startDate = new Date(historySelectedDay);
                    endDate = new Date(historySelectedDay);
                }

                const today = new Date();
                if (endDate > today) endDate = today;

                if (endDate < baseStartDate) return [];

                let tempDate = new Date(Math.max(startDate, baseStartDate));
                tempDate.setHours(0, 0, 0, 0);

                const tableRows = [];
                while (tempDate <= endDate) {
                    const dStr = getLocalYYYYMMDD(tempDate);
                    const dayLogs = allLogs.filter(l => l.dateString === dStr);
                    const dayDispute = attendanceDisputes.find(d => d.date === dStr);
                    const dayOfWeek = tempDate.getDay();

                    let firstIn = null;
                    let lastOut = null;
                    let totalHours = 0;
                    let remarks = [];
                    let hasMultiple = false;
                    let isOutOfLocation = false;

                    if (dayLogs.length > 0) {
                        const inLogs = dayLogs.filter(l => l.type === 'IN').sort((a, b) => a.timestamp - b.timestamp);
                        const outLogs = dayLogs.filter(l => l.type === 'OUT').sort((a, b) => a.timestamp - b.timestamp);
                        
                        if (inLogs.length > 0) firstIn = inLogs[0];
                        if (outLogs.length > 0) lastOut = outLogs[outLogs.length - 1];

                        if (inLogs.length > 1 || outLogs.length > 1) {
                            hasMultiple = true;
                        }

                        if (firstIn && lastOut && firstIn.timestamp < lastOut.timestamp) {
                            totalHours = (lastOut.timestamp - firstIn.timestamp) / (1000 * 60 * 60);
                        }

                        dayLogs.forEach(l => {
                            const remark = (l.type === 'IN' ? l.clockInDetails?.statusRemark : l.clockOutDetails?.statusRemark);
                            if (remark) {
                                remarks.push(remark);
                                if (remark.includes("Outside Location") || remark.includes("BLOCKED")) {
                                    isOutOfLocation = true;
                                }
                            }
                        });
                    }

                    if (dayOfWeek === 0 || dayOfWeek === 6) remarks.push("Rest Day");

                    tableRows.push({
                        date: dStr,
                        rawDate: new Date(tempDate),
                        firstIn,
                        lastOut,
                        totalHours: totalHours > 0 ? totalHours.toFixed(2) + 'h' : '-',
                        disputes: dayDispute ? dayDispute.status : '-',
                        remarks: [...new Set(remarks)].join(', '),
                        hasMultiple,
                        isOutOfLocation
                    });

                    tempDate.setDate(tempDate.getDate() + 1);
                }

                // Sorting
                tableRows.sort((a, b) => {
                    let aVal = a[historySortConfig.key];
                    let bVal = b[historySortConfig.key];
                    
                    if (historySortConfig.key === 'date') {
                        aVal = a.rawDate.getTime();
                        bVal = b.rawDate.getTime();
                    } else if (historySortConfig.key === 'Time In') {
                        aVal = a.firstIn ? a.firstIn.timestamp : 0;
                        bVal = b.firstIn ? b.firstIn.timestamp : 0;
                    } else if (historySortConfig.key === 'Time Out') {
                        aVal = a.lastOut ? a.lastOut.timestamp : 0;
                        bVal = b.lastOut ? b.lastOut.timestamp : 0;
                    } else if (historySortConfig.key === 'Total Hours') {
                        aVal = parseFloat(a.totalHours) || 0;
                        bVal = parseFloat(b.totalHours) || 0;
                    } else if (historySortConfig.key === 'Disputes') {
                        aVal = a.disputes;
                        bVal = b.disputes;
                    } else if (historySortConfig.key === 'Remarks') {
                        aVal = a.remarks;
                        bVal = b.remarks;
                    }

                    if (aVal < bVal) return historySortConfig.direction === 'asc' ? -1 : 1;
                    if (aVal > bVal) return historySortConfig.direction === 'asc' ? 1 : -1;
                    return 0;
                });

                return tableRows;
            }, [allLogs, profile, selectedMonth, historySelectedDay, historyFilterMode, historySortConfig, attendanceDisputes]);


    
    return (
        <div className="space-y-6 animate-fade-in pb-24">
            
(
                            <div className="space-y-6 animate-fade-in relative">
                                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                                    <div>
                                        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Attendance History</h1>
                                        <p className="text-slate-500 dark:text-slate-400 font-medium">Review your daily clock-ins, clock-outs, and render hours.</p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-center gap-3">
                                        <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
                                            <button onClick={() => setHistoryFilterMode('month')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${historyFilterMode === 'month' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Month</button>
                                            <button onClick={() => setHistoryFilterMode('day')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${historyFilterMode === 'day' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Day</button>
                                        </div>
                                        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl shadow-sm border border-slate-200/60 dark:border-slate-700">
                                            <Calendar size={18} className="text-blue-500 ml-2" />
                                            {historyFilterMode === 'month' ? (
                                                <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="p-2 font-bold text-slate-700 dark:text-slate-200 outline-none bg-transparent" />
                                            ) : (
                                                <input type="date" value={historySelectedDay} onChange={e => setHistorySelectedDay(e.target.value)} className="p-2 font-bold text-slate-700 dark:text-slate-200 outline-none bg-transparent" />
                                            )}
                                        </div>
                                        <div className="relative">
                                            <button onClick={() => setShowColDropdown(!showColDropdown)} className="flex items-center gap-2 bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm border border-slate-200/60 dark:border-slate-700 text-sm font-bold hover:bg-slate-50">
                                                <Eye size={16} /> Columns
                                            </button>
                                            {showColDropdown && (
                                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-10 p-2">
                                                    {['Date', 'Time In', 'Time Out', 'Total Hours', 'Disputes', 'Remarks'].map(col => (
                                                        <label key={col} className="flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded cursor-pointer">
                                                            <input type="checkbox" checked={historyVisibleColumns.includes(col)} onChange={(e) => {
                                                                if (e.target.checked) setHistoryVisibleColumns([...historyVisibleColumns, col]);
                                                                else setHistoryVisibleColumns(historyVisibleColumns.filter(c => c !== col));
                                                            }} className="rounded text-blue-600" />
                                                            <span className="text-sm font-medium">{col}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                                    {['Date', 'Time In', 'Time Out', 'Total Hours', 'Disputes', 'Remarks'].map(col => {
                                                        if (!historyVisibleColumns.includes(col)) return null;
                                                        return (
                                                            <th key={col} onClick={() => {
                                                                let key = col.toLowerCase() === 'date' ? 'date' : col;
                                                                setHistorySortConfig({ key, direction: historySortConfig.key === key && historySortConfig.direction === 'asc' ? 'desc' : 'asc' });
                                                            }} className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors whitespace-nowrap">
                                                                <div className="flex items-center gap-1">
                                                                    {col}
                                                                    {historySortConfig.key === (col.toLowerCase() === 'date' ? 'date' : col) && (
                                                                        <ChevronDown size={14} className={`transition-transform ${historySortConfig.direction === 'asc' ? 'rotate-180' : ''}`} />
                                                                    )}
                                                                </div>
                                                            </th>
                                                        );
                                                    })}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {historyTableData.length === 0 ? (
                                                    <tr><td colSpan="6" className="p-8 text-center text-slate-500 italic">No valid records found for this period.</td></tr>
                                                ) : historyTableData.map(row => (
                                                    <tr key={row.date} className={`border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors ${row.hasMultiple ? 'bg-rose-50/50 dark:bg-rose-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                                                        {historyVisibleColumns.includes('Date') && (
                                                            <td className="p-4 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                                                {new Date(row.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                            </td>
                                                        )}
                                                        {historyVisibleColumns.includes('Time In') && (
                                                            <td className="p-4">
                                                                {row.firstIn ? (
                                                                    <button onClick={() => setPreviewLocation({ lat: row.firstIn.location?.lat, lon: row.firstIn.location?.lon, title: `Time In: ${new Date(row.firstIn.timestamp).toLocaleTimeString()}` })}
                                                                        className={`text-sm hover:underline ${row.firstIn.clockInDetails?.statusRemark?.includes('Outside Location') || row.firstIn.clockInDetails?.statusRemark?.includes('BLOCKED') ? 'text-rose-600 font-black' : 'text-blue-600 font-bold'}`}>
                                                                        {new Date(row.firstIn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </button>
                                                                ) : <span className="text-slate-300">-</span>}
                                                            </td>
                                                        )}
                                                        {historyVisibleColumns.includes('Time Out') && (
                                                            <td className="p-4">
                                                                {row.lastOut ? (
                                                                    <button onClick={() => setPreviewLocation({ lat: row.lastOut.location?.lat, lon: row.lastOut.location?.lon, title: `Time Out: ${new Date(row.lastOut.timestamp).toLocaleTimeString()}` })}
                                                                        className={`text-sm hover:underline ${row.lastOut.clockOutDetails?.statusRemark?.includes('Outside Location') || row.lastOut.clockOutDetails?.statusRemark?.includes('BLOCKED') ? 'text-rose-600 font-black' : 'text-blue-600 font-bold'}`}>
                                                                        {new Date(row.lastOut.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </button>
                                                                ) : <span className="text-slate-300">-</span>}
                                                            </td>
                                                        )}
                                                        {historyVisibleColumns.includes('Total Hours') && (
                                                            <td className="p-4 font-bold text-slate-700 dark:text-slate-300">{row.totalHours}</td>
                                                        )}
                                                        {historyVisibleColumns.includes('Disputes') && (
                                                            <td className="p-4">
                                                                {row.disputes !== '-' ? (
                                                                    <span className={`px-2 py-1 text-xs font-bold rounded-lg ${row.disputes === 'Approved' ? 'bg-green-100 text-green-700' : row.disputes === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                                                        {row.disputes}
                                                                    </span>
                                                                ) : (
                                                                    !row.firstIn && !row.lastOut && !row.remarks.includes("Rest Day") && isActive ? (
                                                                        <button onClick={() => submitAbsenceDispute(row.date)} className="text-xs text-blue-600 hover:underline">Dispute</button>
                                                                    ) : <span className="text-slate-300">-</span>
                                                                )}
                                                            </td>
                                                        )}
                                                        {historyVisibleColumns.includes('Remarks') && (
                                                            <td className="p-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                                                                {row.remarks || '-'}
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )
        </div>
    );
}
