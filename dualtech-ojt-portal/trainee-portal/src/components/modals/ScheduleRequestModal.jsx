import React, { useState } from 'react';
import { X, CalendarDays, Loader2, AlertTriangle, AlertCircle, Send } from 'lucide-react';
import { primaryDb } from '../../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

export default function ScheduleRequestModal({ user, profile, onClose, existingRequests = [] }) {
    const [scheduleReqSchooling, setScheduleReqSchooling] = useState('Saturday');
    const [scheduleReqRest, setScheduleReqRest] = useState('Sunday');
    const [scheduleReqReason, setScheduleReqReason] = useState('');
    const [submittingSchedule, setSubmittingSchedule] = useState(false);
    const [scheduleReqFilter, setScheduleReqFilter] = useState('All');

    const hasPendingScheduleRequest = existingRequests.some(r => r.status === 'Pending');

    const handleSubmitScheduleRequest = async () => {
        if (!profile || !user) return;
        if (scheduleReqSchooling === scheduleReqRest) {
            alert('Schooling Day and Rest Day cannot be the same.');
            return;
        }
        if (!scheduleReqReason.trim()) {
            alert('Please provide a reason for the schedule change.');
            return;
        }
        if (hasPendingScheduleRequest) {
            alert('You already have a pending schedule request. Please wait for it to be reviewed.');
            return;
        }
        setSubmittingSchedule(true);
        try {
            const appId = "dualtech-ojt-portal";
            const currentStudentId = profile.studentId || profile['Student ID#'] || user.uid;
            let traineeDocId = '';
            
            const tq = query(collection(primaryDb, 'artifacts', appId, 'public', 'data', 'trainees'), where('studentId', '==', currentStudentId));
            const ts = await getDocs(tq);
            if (!ts.empty) traineeDocId = ts.docs[0].id;

            const traineeName = (profile.given && profile.family) ? `${profile.given} ${profile.family}`.trim() : (profile.name || 'Unknown Trainee');

            await addDoc(collection(primaryDb, 'artifacts', appId, 'public', 'data', 'schedule_requests'), {
                traineeId: currentStudentId,
                traineeName: traineeName,
                traineeDocId: traineeDocId,
                assignedIC: profile.assignedIC || 'Unassigned',
                currentSchoolingDay: profile.schoolingDay || 'Saturday',
                currentRestDay: profile.restDay || 'Sunday',
                requestedSchoolingDay: scheduleReqSchooling,
                requestedRestDay: scheduleReqRest,
                reason: scheduleReqReason.trim(),
                status: 'Pending',
                rejectionReason: '',
                requestedAt: serverTimestamp(),
                reviewedAt: null,
                reviewedBy: ''
            });

            alert('Schedule change request submitted successfully! Waiting for IC approval.');
            setScheduleReqReason('');
            setScheduleReqSchooling('Saturday');
            setScheduleReqRest('Sunday');
            onClose();
        } catch (err) {
            console.error('Error submitting schedule request:', err);
            alert('Failed to submit schedule request. Please try again.');
        } finally {
            setSubmittingSchedule(false);
        }
    };

    const formatTimestamp = (ts) => {
        if (!ts) return 'N/A';
        const date = ts.toDate ? ts.toDate() : new Date(ts);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full sm:w-[400px] h-full sm:h-[85vh] sm:rounded-3xl shadow-2xl sm:max-h-[90vh] overflow-hidden flex flex-col border border-slate-200/60 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                            <CalendarDays size={20} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-800 dark:text-white text-lg">Update Schedule</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Request a change to your weekly schedule</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    {/* Current Schedule Display */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Current Schedule</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                                <p className="text-[10px] font-bold text-blue-500 uppercase mb-1">Schooling Day</p>
                                <p className="font-black text-slate-800 dark:text-slate-100">{profile?.schoolingDay || 'Saturday'}</p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                                <p className="text-[10px] font-bold text-emerald-500 uppercase mb-1">Rest Day</p>
                                <p className="font-black text-slate-800 dark:text-slate-100">{profile?.restDay || 'Sunday'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Pending Request Banner */}
                    {hasPendingScheduleRequest && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
                            <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-amber-800 dark:text-amber-200 text-sm">Pending Request</p>
                                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                                    You have a pending schedule change request. Please wait for your IC to review it before submitting another.
                                </p>
                                {(() => {
                                    const pending = existingRequests.find(r => r.status === 'Pending');
                                    return pending ? (
                                        <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                                            <span className="font-bold">Requested:</span> Schooling = {pending.requestedSchoolingDay}, Rest = {pending.requestedRestDay}
                                        </div>
                                    ) : null;
                                })()}
                            </div>
                        </div>
                    )}

                    {/* Request Form */}
                    {!hasPendingScheduleRequest && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-1.5">New Schooling Day</label>
                                    <select value={scheduleReqSchooling} onChange={e => setScheduleReqSchooling(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition-all text-slate-800 dark:text-slate-100">
                                        <option value="Monday">Monday</option>
                                        <option value="Tuesday">Tuesday</option>
                                        <option value="Wednesday">Wednesday</option>
                                        <option value="Thursday">Thursday</option>
                                        <option value="Friday">Friday</option>
                                        <option value="Saturday">Saturday</option>
                                        <option value="Sunday">Sunday</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-1.5">New Rest Day</label>
                                    <select value={scheduleReqRest} onChange={e => setScheduleReqRest(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/40 transition-all text-slate-800 dark:text-slate-100">
                                        <option value="Monday">Monday</option>
                                        <option value="Tuesday">Tuesday</option>
                                        <option value="Wednesday">Wednesday</option>
                                        <option value="Thursday">Thursday</option>
                                        <option value="Friday">Friday</option>
                                        <option value="Saturday">Saturday</option>
                                        <option value="Sunday">Sunday</option>
                                    </select>
                                </div>
                            </div>

                            {scheduleReqSchooling === scheduleReqRest && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2">
                                    <AlertCircle size={16} className="text-red-500 shrink-0" />
                                    <p className="text-xs font-bold text-red-700 dark:text-red-400">Schooling and Rest day cannot be the same.</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Reason for Change <span className="text-red-500">*</span></label>
                                <textarea
                                    value={scheduleReqReason}
                                    onChange={e => setScheduleReqReason(e.target.value)}
                                    placeholder="Explain why you need to change your schedule (e.g., school class schedule conflict, company request, etc.)"
                                    rows={3}
                                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition-all resize-none text-slate-800 dark:text-slate-100 placeholder-slate-400"
                                />
                            </div>

                            <button
                                onClick={handleSubmitScheduleRequest}
                                disabled={submittingSchedule || scheduleReqSchooling === scheduleReqRest || !scheduleReqReason.trim()}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm"
                            >
                                {submittingSchedule ? <><Loader2 className="animate-spin" size={18} /> Submitting...</> : <><Send size={18} /> Submit Schedule Request</>}
                            </button>
                        </div>
                    )}

                    {/* Request History */}
                    {existingRequests.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between mb-3 border-t border-slate-100 dark:border-slate-800 pt-5">
                                <h4 className="font-bold text-slate-700 dark:text-slate-300">History</h4>
                                <div className="flex gap-1">
                                    {['All', 'Pending', 'Approved', 'Rejected'].map(f => (
                                        <button key={f} onClick={() => setScheduleReqFilter(f)} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                                            scheduleReqFilter === f ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                                        }`}>{f}</button>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {existingRequests.filter(r => scheduleReqFilter === 'All' || r.status === scheduleReqFilter).map((req, i) => (
                                    <div key={i} className={`rounded-xl p-3 border text-sm ${
                                        req.status === 'Approved' ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800' :
                                        req.status === 'Rejected' ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800' :
                                        'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                                    }`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                                                    Schooling: {req.requestedSchoolingDay}
                                                </p>
                                                <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                                                    Rest: {req.requestedRestDay}
                                                </p>
                                            </div>
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider
                                                ${req.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 
                                                  req.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 
                                                  'bg-rose-100 text-rose-800'}`}>
                                                {req.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                            <span className="font-semibold">Reason:</span> {req.reason}
                                        </p>
                                        <p className="text-[10px] text-slate-400">
                                            Requested: {formatTimestamp(req.requestedAt)}
                                        </p>
                                        {req.status === 'Rejected' && req.rejectionReason && (
                                            <p className="text-xs text-rose-600 mt-2 bg-rose-100/50 dark:bg-rose-900/20 p-2 rounded-lg border border-rose-200 dark:border-rose-800/50">
                                                <span className="font-bold">Rejected:</span> {req.rejectionReason}
                                            </p>
                                        )}
                                    </div>
                                ))}
                                {existingRequests.filter(r => scheduleReqFilter === 'All' || r.status === scheduleReqFilter).length === 0 && (
                                    <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-4 italic">No {scheduleReqFilter.toLowerCase()} requests found.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}