import React, { useState, useEffect } from 'react';
import { Award, History, MessageCircle, UserCheck, FileText, AlertCircle, Clock, UserCircle2, RefreshCw } from 'lucide-react';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

        export default function ASTPDiligenceTab({ user, profile, db, appId, refreshTrigger }) {
            const [traineeData, setTraineeData] = useState(null);
            const [meetingLogs, setMeetingLogs] = useState([]);
            const [vouchers, setVouchers] = useState([]);
            const [loadingTrainee, setLoadingTrainee] = useState(true);
            const [loadingMeetings, setLoadingMeetings] = useState(true);
            const [loadingVouchers, setLoadingVouchers] = useState(true);

            // State to hold the drafted tasks before submission
            const [taskInputs, setTaskInputs] = useState({});

            useEffect(() => {
                if (!profile?.studentId) return;

                const fetchDiligenceData = async () => {
                    // 1. Fetch Trainee Master Data
                    // OPTIMIZED: Fetching only the matching trainee instead of the entire collection
                    const traineesRef = collection(db, 'artifacts', appId, 'public', 'data', 'trainees');
                    const q1 = query(traineesRef, where('studentId', '==', profile.studentId));
                    const q2 = query(traineesRef, where('Student ID#', '==', profile.studentId));
                    
                    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
                    
                    let match = null;
                    if (!snap1.empty) match = snap1.docs[0];
                    else if (!snap2.empty) match = snap2.docs[0];
                    if (match) {
                        setTraineeData({ id: match.id, ...match.data() });
                    }
                    setLoadingTrainee(false);

                    // 2. Fetch Official Coaching Meetings
                    const qMeetings = query(
                        collection(db, 'artifacts', appId, 'public', 'data', 'meetings'),
                        where('studentId', '==', profile.studentId)
                    );
                    const snapMeetings = await getDocs(qMeetings);
                    const mData = snapMeetings.docs.map(doc => doc.data());
                    mData.sort((a, b) => new Date(b.date) - new Date(a.date));
                    setMeetingLogs(mData);
                    setLoadingMeetings(false);

                    // 3. Fetch Performance Vouchers
                    const qVouchers = query(
                        collection(db, 'artifacts', appId, 'public', 'data', 'performanceVouchers'),
                        where('studentId', '==', profile.studentId)
                    );
                    const snapVouchers = await getDocs(qVouchers);
                    const vData = snapVouchers.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setVouchers(vData);
                    setLoadingVouchers(false);
                };
                fetchDiligenceData();
            }, [profile, refreshTrigger]);

            // Helper function to generate weeks from Portal Registration to IPT End
            const getGeneratedWeeks = () => {
                // UPDATED: Shift baseline from IPT Start Date to when the trainee actually registered in the portal
                if (!profile?.registeredAt) return [];

                // Safely convert Firestore Timestamp or standard ISO strings to a JS Date Object
                const start = profile.registeredAt.toDate ? profile.registeredAt.toDate() : new Date(profile.registeredAt);
                const endStr = traineeData?.iptDateEnd || traineeData?.IptDateEnd;

                // If end date isn't set yet, default to today's date + 1 week so they can still log tasks
                const end = endStr ? new Date(endStr) : new Date(new Date().setDate(new Date().getDate() + 7));

                const weeks = [];
                let current = new Date(start.getFullYear(), start.getMonth(), start.getDate()); // Normalize to midnight local time
                let weekNo = 1;

                while (current <= end) {
                    let weekStart = new Date(current);
                    let weekEnd = new Date(current);
                    weekEnd.setDate(weekEnd.getDate() + 6); // 7-day tracking window

                    // Cap the final week's endpoint to the exact official IPT End Date
                    if (endStr && weekEnd > new Date(endStr)) {
                        weekEnd = new Date(endStr);
                    }

                    weeks.push({
                        weekNo,
                        periodCovered: `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`
                    });

                    current.setDate(current.getDate() + 7);
                    weekNo++;
                }
                return weeks;
            };

            const handleSubmitTask = async (weekNo, periodCovered) => {
                const task = taskInputs[weekNo];
                if (!task || !task.trim()) return alert("Please enter the tasks you performed this week.");

                if (!window.confirm(`Submit task for Week ${weekNo}? You cannot edit this once submitted.`)) return;

                try {
                    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'performanceVouchers'), {
                        studentId: profile.studentId,
                        studentName: profile.name || traineeData?.name || "Unknown",
                        weekNo: weekNo,
                        periodCovered: periodCovered,
                        task: task,
                        rating: '',
                        companyTrainer: '',
                        remarks: '',
                        status: 'Pending Rating',
                        createdAt: new Date().toISOString()
                    });
                    alert("Task submitted successfully! Waiting for trainer rating.");
                } catch (error) {
                    console.error("Error submitting voucher:", error);
                    alert("Failed to submit task. Please try again.");
                }
            };

            if (loadingTrainee || loadingMeetings || loadingVouchers) return <div className="flex justify-center items-center py-20 text-blue-500"><RefreshCw className="animate-spin" size={40} /></div>;

            const meritPts = traineeData?.meritPoints || 0;
            const meritHistory = traineeData?.meritHistory || [];
            const icNotes = traineeData?.notes || [];
            const generatedWeeks = getGeneratedWeeks();

            // Map existing vouchers by Week No for easy lookup
            const voucherMap = vouchers.reduce((acc, curr) => ({ ...acc, [curr.weekNo]: curr }), {});

            return (
                <div className="space-y-6 animate-fade-in pb-20">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Diligence Report</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">View your merit points, coaching sessions, and submit your weekly performance.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* LEFT COLUMN: MERIT POINTS */}
                        <div className="space-y-6">
                            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl sm:rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                                <Award className="absolute right-[-20px] bottom-[-20px] text-blue-400 opacity-30" size={150} />
                                <div className="relative z-10">
                                    <h3 className="text-blue-100 font-bold uppercase tracking-wider text-sm mb-1">Total Merit Points</h3>
                                    <div className="text-6xl font-black">{meritPts}</div>
                                    <p className="text-blue-100 text-sm mt-2">Points are awarded or deducted based on attendance, performance, and diligence.</p>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700">
                                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2"><History size={18} className="text-slate-400" /> Merit Point History</h3>
                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                    {meritHistory.length === 0 ? (
                                        <div className="text-center p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                            <p className="text-sm text-slate-400 italic">No merit history recorded yet.</p>
                                        </div>
                                    ) : (
                                        [...meritHistory].reverse().map((log, i) => (
                                            <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl flex justify-between items-center gap-3">
                                                <div>
                                                    <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{log.remark || log.reason}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                                        {log.date && log.date.includes('T') ? new Date(log.date).toLocaleDateString() : log.date} • by {log.updatedBy || log.recordedBy || 'System Admin'}
                                                    </p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <span className={`block font-black text-lg ${String(log.change || log.points).includes('+') || (log.change || log.points) > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                                        {log.change || log.points}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: COACHING LOGS & NOTES */}
                        <div className="space-y-6">

                            {/* COACHING MEETING LOGS */}
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700">
                                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2"><MessageCircle size={18} className="text-violet-500" /> Coaching Sessions</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Official log of dates you were met by your Industrial Coordinator.</p>

                                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                                    {meetingLogs.length === 0 ? (
                                        <div className="text-center p-6 bg-violet-50 rounded-2xl border border-dashed border-violet-200 text-violet-500">
                                            <p className="text-sm font-medium">No coaching sessions logged yet.</p>
                                        </div>
                                    ) : (
                                        meetingLogs.map((m, i) => (
                                            <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl flex justify-between items-center gap-3">
                                                <div>
                                                    <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{m.date}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">IC: {m.icName || 'Coordinator'}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <span className={`px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider font-bold ${m.type === 'Face to Face' ? 'bg-violet-100 text-violet-700 border border-violet-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                                                        {m.type}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* DETAILED IC NOTES */}
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700 h-fit">
                                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2"><UserCheck size={18} className="text-blue-500" /> Detailed Meeting Notes</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Records of discussions, agendas, and action plans from your IC.</p>

                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                    {icNotes.length === 0 ? (
                                        <div className="text-center p-8 bg-blue-50 rounded-2xl border border-dashed border-blue-200 text-blue-400">
                                            <p className="text-sm font-medium">No meeting notes recorded yet.</p>
                                        </div>
                                    ) : (
                                        [...icNotes].reverse().map((note, i) => (
                                            <div key={i} className="relative pl-6 pb-2 border-l-2 border-blue-100 last:border-0 last:pb-0">
                                                <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow-sm"></div>

                                                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl rounded-tl-none -mt-1 shadow-sm">
                                                    <div className="flex justify-between items-start mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-100 px-2 py-0.5 rounded-md">Coordinator Note</span>
                                                        <span className="text-xs font-bold text-slate-400">{note.date}</span>
                                                    </div>

                                                    <div className="space-y-2">
                                                        {note.details && (
                                                            <div>
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Details / Agenda</span>
                                                                <p className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-relaxed">{note.details}</p>
                                                            </div>
                                                        )}

                                                        {note.remarks && (
                                                            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 mt-2">
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Remarks / Action Plan</span>
                                                                <p className="text-sm text-slate-600 whitespace-pre-wrap italic leading-relaxed">"{note.remarks}"</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* NEW SECTION: PERFORMANCE VOUCHERS */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700 mt-6">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2 text-lg">
                            <FileText size={20} className="text-blue-500" /> Weekly Performance Voucher
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Submit your tasks per week and await your company trainer's rating.</p>

                        {generatedWeeks.length === 0 ? (
                            <div className="text-center p-8 bg-amber-50 border border-dashed border-amber-200 rounded-2xl">
                                <AlertCircle size={32} className="text-amber-400 mx-auto mb-2" />
                                <p className="text-sm font-bold text-amber-700">IPT Date Start is not set.</p>
                                <p className="text-xs text-amber-600 mt-1">Please ask your coordinator to set your training start date to enable vouchers.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                                {generatedWeeks.map((week) => {
                                    const voucher = voucherMap[week.weekNo];

                                    return (
                                        <div key={week.weekNo} className="border border-slate-200 dark:border-slate-700 rounded-2xl p-5 bg-slate-50 dark:bg-slate-800 flex flex-col lg:flex-row gap-6 hover:shadow-md transition-all">
                                            {/* Week Info */}
                                            <div className="w-full lg:w-48 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-700 pb-4 lg:pb-0 lg:pr-4 flex flex-col justify-center">
                                                <span className="text-xs font-black text-blue-500 uppercase tracking-wider">Week {week.weekNo}</span>
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-1 block">{week.periodCovered}</span>
                                                {voucher && (
                                                    <span className={`mt-3 inline-block px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-center w-max ${voucher.status === 'Rated' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {voucher.status}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Form/Details */}
                                            <div className="flex-1 space-y-4">
                                                {/* Task Input or Display */}
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Task Performed</label>
                                                    {!voucher ? (
                                                        <div className="flex flex-col sm:flex-row gap-3">
                                                            <textarea
                                                                className="flex-1 w-full p-3 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none bg-white dark:bg-slate-900"
                                                                rows="2"
                                                                placeholder="Describe the tasks you completed this week..."
                                                                value={taskInputs[week.weekNo] || ''}
                                                                onChange={(e) => setTaskInputs({ ...taskInputs, [week.weekNo]: e.target.value })}
                                                            ></textarea>
                                                            <button
                                                                onClick={() => handleSubmitTask(week.weekNo, week.periodCovered)}
                                                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-colors h-fit shrink-0"
                                                            >
                                                                Submit Task
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-sm text-slate-700 dark:text-slate-200">
                                                            {voucher.task}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Trainer Rating Section (Only shows if voucher exists) */}
                                                {voucher && (
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                                        <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 pb-3 md:pb-0 flex flex-col justify-center">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Trainer Rating</label>
                                                            {!voucher.rating ? (
                                                                <span className="text-slate-300 text-sm font-bold flex items-center gap-1.5 mt-1">
                                                                    <Clock size={14} /> Waiting...
                                                                </span>
                                                            ) : (
                                                                <div>
                                                                    <div className={`text-2xl font-black leading-none ${voucher.rating.startsWith('4') ? 'text-blue-600' :
                                                                            voucher.rating.startsWith('3') ? 'text-blue-600' :
                                                                                voucher.rating.startsWith('2') ? 'text-amber-500' :
                                                                                    'text-red-500'
                                                                        }`}>
                                                                        {voucher.rating.charAt(0)} <span className="text-sm text-slate-400 font-bold">/ 4</span>
                                                                    </div>
                                                                    <div className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${voucher.rating.startsWith('4') ? 'text-blue-700' :
                                                                            voucher.rating.startsWith('3') ? 'text-blue-700' :
                                                                                voucher.rating.startsWith('2') ? 'text-amber-700' :
                                                                                    'text-red-700'
                                                                        }`}>
                                                                        {voucher.rating.substring(4)}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="md:col-span-2 space-y-3">
                                                            <div>
                                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Evaluator</label>
                                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                                                    <UserCircle2 size={14} className="text-slate-400" /> {voucher.companyTrainer || 'Pending'}
                                                                </span>
                                                            </div>
                                                            <div className={voucher.rating?.startsWith('2') || voucher.rating?.startsWith('1') ? 'bg-amber-50 p-3 rounded-lg border border-amber-100' : ''}>
                                                                <label className={`text-[10px] font-black uppercase tracking-wider mb-1 block ${voucher.rating?.startsWith('2') ? 'text-amber-600' : 'text-slate-400'}`}>
                                                                    Feedback / Remarks
                                                                </label>
                                                                <span className={`text-sm italic ${voucher.rating?.startsWith('2') || voucher.rating?.startsWith('1') ? 'text-amber-800 font-medium' : 'text-slate-600'}`}>
                                                                    {voucher.remarks ? `"${voucher.remarks}"` : 'No additional remarks provided.'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                </div>
            );
        }


        