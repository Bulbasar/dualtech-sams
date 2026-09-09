import React, { useState, useEffect } from "react";
import { Clock, History, CalendarDays, Calendar, CalendarRange, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, FileText, Upload, X } from "lucide-react";
import { primaryDb } from "../../firebase";
import { collection, query, where, getDocs, doc, getDoc, setDoc } from "firebase/firestore";

export default function BSTPHistoryTab({ user, profile, absenceLogs = [] }) {
    const [viewMode, setViewMode] = useState('daily'); // 'daily', 'weekly', 'monthly'
    const [currentDate, setCurrentDate] = useState(new Date());
    const [attendanceLogs, setAttendanceLogs] = useState([]);
    const [globalHolidays, setGlobalHolidays] = useState([]);
    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(false);

    // AWOL Dispute State
    const [showAwolModal, setShowAwolModal] = useState(false);
    const [awolDatesList, setAwolDatesList] = useState([]);
    const [disputingDate, setDisputingDate] = useState(null);
    const [disputeNarrative, setDisputeNarrative] = useState("");
    const [disputeFile, setDisputeFile] = useState(null);
    const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);

    const [clockInTime, setClockInTime] = useState("");
    const [clockOutTime, setClockOutTime] = useState("");
    const [skillsetInTime, setSkillsetInTime] = useState("");
    const [skillsetOutTime, setSkillsetOutTime] = useState("");
    const [skillsetLf, setSkillsetLf] = useState("");
    const [skillset, setSkillset] = useState("");
    const [lfAccounts, setLfAccounts] = useState({});

    useEffect(() => {
        const fetchLFAccounts = async () => {
            try {
                const snap = await getDocs(query(collection(primaryDb, "bstpUsers"), where("role", "==", "Learning Facilitator")));
                const accounts = {};
                snap.forEach(doc => {
                    const data = doc.data();
                    if (data.email) {
                        accounts[data.email] = data.initials || data.email.split('@')[0].toUpperCase();
                    }
                });
                setLfAccounts(accounts);
            } catch (error) {
                console.error("Error fetching LF accounts:", error);
            }
        };
        fetchLFAccounts();
    }, []);


    const getEarliestDate = () => {
        const dates = [];
        const parseDate = (d) => {
            if (!d) return null;
            if (d.toDate) return d.toDate();
            if (d.seconds) return new Date(d.seconds * 1000);
            return new Date(d);
        };
        const cDate = parseDate(profile?.createdAt);
        if (cDate && !isNaN(cDate)) dates.push(cDate);
        const rDate = parseDate(profile?.registeredAt);
        if (rDate && !isNaN(rDate)) dates.push(rDate);
        const irDate = parseDate(profile?.initialRegisteredAt);
        if (irDate && !isNaN(irDate)) dates.push(irDate);
        
        if (dates.length === 0) return new Date(0);
        return new Date(Math.min(...dates));
    };
    const getBaselineDate = () => {
        const regDate = getEarliestDate();
        let immersionStart = null;
        const rawImmersion = profile?.immersionDateStart || profile?.['immersion Date Start'] || profile?.['Immersion Date Start'];
        if (rawImmersion) {
            immersionStart = new Date(rawImmersion);
            if (isNaN(immersionStart.getTime())) immersionStart = null;
        }
        return (immersionStart && immersionStart > regDate) ? immersionStart : regDate;
    };
    const registrationDate = getBaselineDate();
    registrationDate.setHours(0,0,0,0);

    // Month Navigation
    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    // Daily/Weekly Navigation
    const handlePrevDay = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1));
    const handleNextDay = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1));
    
    const handlePrevWeek = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7));
    const handleNextWeek = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7));

    const fetchDisputes = async () => {
        if (!profile?.studentId && !profile?.studentNo) return;
        try {
            const q = query(
                collection(primaryDb, "artifacts", "dualtech-ojt-portal", "public", "data", "bstpDisputes"),
                where("studentId", "==", profile.studentNo || profile.studentId)
            );
            const snap = await getDocs(q);
            setDisputes(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
        } catch (err) {
            console.error("Error fetching disputes:", err);
        }
    };

    useEffect(() => {
        const fetchHolidays = async () => {
            try {
                const docSnap = await getDoc(doc(primaryDb, "artifacts", "dualtech-ojt-portal", "public", "data", "settings", "globalHolidays"));
                if (docSnap.exists()) {
                    setGlobalHolidays(docSnap.data().holidays || []);
                }
            } catch (err) {
                console.error("Error fetching holidays:", err);
            }
        };
        fetchHolidays();
        fetchDisputes();
    }, [profile]);

    useEffect(() => {
        const fetchAttendance = async () => {
            if (!profile?.studentId && !profile?.studentNo) return;
            setLoading(true);
            try {
                const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
                const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59).toISOString();
                
                const q = query(
                    collection(primaryDb, "artifacts", "dualtech-ojt-portal", "public", "data", "bstpAttendance"),
                    where("studentNo", "==", profile.studentNo || profile.studentId),
                    where("timestamp", ">=", startOfMonth),
                    where("timestamp", "<=", endOfMonth)
                );
                const snap = await getDocs(q);
                const fetchedLogs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setAttendanceLogs(fetchedLogs);
            } catch (err) {
                console.error("Error fetching attendance:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAttendance();
    }, [currentDate.getMonth(), currentDate.getFullYear(), profile]);

    const isHoliday = (date) => {
        return globalHolidays.some(h => {
            if (!h.date) return false;
            const hDate = new Date(h.date);
            return hDate.getDate() === date.getDate() && hDate.getMonth() === date.getMonth() && hDate.getFullYear() === date.getFullYear();
        });
    };

    const isWeekend = (date) => date.getDay() === 0 || date.getDay() === 6;

    const getAbsenceForDate = (date) => {
        return absenceLogs.find(a => {
            if (a.dateFrom && a.dateTo) {
                const from = new Date(a.dateFrom);
                from.setHours(0,0,0,0);
                const to = new Date(a.dateTo);
                to.setHours(23, 59, 59);
                return date >= from && date <= to;
            }
            return false;
        });
    };

    const getLogsForDate = (date) => {
        const dStr = date.toDateString();
        return attendanceLogs.filter(l => new Date(l.timestamp).toDateString() === dStr);
    };

    const calculateHours = (inTime, outTime) => {
        if (!inTime || !outTime) return 0;
        const diffMs = new Date(outTime) - new Date(inTime);
        return diffMs > 0 ? diffMs / (1000 * 60 * 60) : 0;
    };

    const handleFileDispute = async (e) => {
        e.preventDefault();
        if (!disputeNarrative || !disputingDate) return;
        setIsSubmittingDispute(true);
        try {
            let fileUrl = "";
            if (disputeFile) {
                const base64 = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result.split(',')[1]);
                    reader.onerror = error => reject(error);
                    reader.readAsDataURL(disputeFile);
                });
                
                const res = await fetch("https://script.google.com/macros/s/AKfycbxQ0oRe274AzBllCPJsCE0LQemjNWOWsKR9eZwygtANDXJV8yMvPtaUvLpNKUa6arL0gQ/exec", {
                    method: 'POST',
                    body: JSON.stringify({
                        filename: disputeFile.name,
                        mimeType: disputeFile.type,
                        base64: base64
                    })
                });
                const json = await res.json();
                if (json.success) fileUrl = json.url;
                else throw new Error("File upload failed: " + json.error);
            }
            
            const newDocRef = doc(collection(primaryDb, "artifacts", "dualtech-ojt-portal", "public", "data", "bstpDisputes"));
            await setDoc(newDocRef, {
                studentId: profile.studentNo || profile.studentId,
                studentName: profile.name || `${profile.given} ${profile.family}`.trim(),
                adviserInitials: profile.adviser || profile.Adviser || "LF",
                date: disputingDate,
                narrative: disputeNarrative,
                fileUrl: fileUrl,
                status: "Pending",
                clockInTime: clockInTime,
                clockOutTime: clockOutTime,
                skillset: skillset || "",
                skillsetInTime: skillsetInTime || "",
                skillsetOutTime: skillsetOutTime || "",
                skillsetLfInitials: skillsetLf || "",
                skillsetStatus: skillsetLf ? "Pending" : "",
                createdAt: new Date().toISOString()
            });

            // Push notification for Adviser (AWOL Dispute)
            const notifRef = doc(collection(primaryDb, "bstpNotifications"));
            await setDoc(notifRef, {
                title: "New AWOL Dispute",
                message: `${profile.name || profile.given} submitted a dispute for ${disputingDate} with specified clock times.`,
                type: 'AWOL_DISPUTE',
                targetInitials: profile.adviser || profile.Adviser || "LF",
                read: false,
                createdAt: new Date().toISOString()
            });

            // Push notification for Skillset LF (if skillset added)
            if (skillsetLf) {
                const ssNotifRef = doc(collection(primaryDb, "bstpNotifications"));
                await setDoc(ssNotifRef, {
                    title: "New Skillset Dispute",
                    message: `${profile.name || profile.given} submitted a skillset dispute for ${disputingDate} in ${skillset}.`,
                    type: 'SKILLSET_DISPUTE',
                    targetInitials: skillsetLf,
                    read: false,
                    createdAt: new Date().toISOString()
                });
            }
            
            setDisputingDate(null);
            setDisputeNarrative("");
            setDisputeFile(null);
            setShowAwolModal(false);
            fetchDisputes();
            alert("Dispute submitted successfully!");
        } catch (err) {
            console.error("Error submitting dispute:", err);
            alert("Failed to submit dispute: " + err.message);
        } finally {
            setIsSubmittingDispute(false);
        }
    };

    // --- DAILY VIEW ---
    const renderDailyView = () => {
        const logs = getLogsForDate(currentDate);
        const absence = getAbsenceForDate(currentDate);
        const weekend = isWeekend(currentDate);
        const holiday = isHoliday(currentDate);
        const inLog = logs.find(l => l.type === 'IN');
        const outLog = logs.find(l => l.type === 'OUT');
        const skillsetIns = logs.filter(l => l.type === 'SKILLSET_IN');
        const skillsetOuts = logs.filter(l => l.type === 'SKILLSET_OUT');

        const hasAnyLog = logs.length > 0;
        
        let statusBadge = null;
        if (currentDate < registrationDate) {
            statusBadge = <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase">Pre-Immersion/Reg</span>;
        } else if (currentDate > new Date()) {
            statusBadge = <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase">Future Date</span>;
        } else if (hasAnyLog) {
            statusBadge = <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase">Present</span>;
        } else if (absence) {
            statusBadge = <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase">Absence: {absence.status || 'Pending'}</span>;
        } else if (holiday) {
            statusBadge = <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase">Holiday</span>;
        } else if (weekend) {
            statusBadge = <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase">Weekend</span>;
        } else {
            statusBadge = <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase">AWOL</span>;
        }

        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <button onClick={handlePrevDay} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500"><ChevronLeft /></button>
                    <div className="text-center">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{currentDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                        <div className="mt-2">{statusBadge}</div>
                    </div>
                    <button onClick={handleNextDay} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500"><ChevronRight /></button>
                </div>

                {hasAnyLog ? (
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2"><Clock size={18}/> Main Clock</h4>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">Clock In</p>
                                <p className="font-semibold text-slate-800 dark:text-slate-200">{inLog ? new Date(inLog.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}</p>
                                {inLog?.status === 'pending' && <p className="text-[10px] text-amber-600 mt-1">Pending Approval</p>}
                                {inLog?.remarks === 'Resolved via AWOL Dispute' && <p className="text-[10px] text-green-600 mt-1 font-semibold">Approved by {inLog.adviserInitials}</p>}
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">Clock Out</p>
                                <p className="font-semibold text-slate-800 dark:text-slate-200">{outLog ? new Date(outLog.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}</p>
                                {outLog?.remarks === 'Resolved via AWOL Dispute' && <p className="text-[10px] text-green-600 mt-1 font-semibold">Approved by {outLog.adviserInitials}</p>}
                            </div>
                        </div>

                        {skillsetIns.length > 0 && (
                            <>
                                <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2 mt-6"><History size={18}/> Skillsets</h4>
                                <div className="space-y-3">
                                    {skillsetIns.map((sIn, idx) => {
                                        const sOut = skillsetOuts.find(o => o.skillset === sIn.skillset && o.timestamp > sIn.timestamp) || skillsetOuts[idx];
                                        return (
                                            <div key={sIn.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                                                <div>
                                                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{sIn.skillset || sIn.roomName || 'Skillset Room'}</p>
                                                    <p className="text-xs text-slate-500">{new Date(sIn.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {sOut ? new Date(sOut.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Ongoing'}</p>
                                                    {sIn.remarks === 'Resolved via Skillset Dispute' && <p className="text-[10px] text-green-600 mt-1 font-semibold">Approved by LF {sIn.skillsetLf}</p>}
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-indigo-600 dark:text-indigo-400">{sOut ? calculateHours(sIn.timestamp, sOut.timestamp).toFixed(1) + ' hrs' : '-'}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm text-center">
                        <p className="text-slate-500 dark:text-slate-400 italic">No attendance records for this day.</p>
                        {absence && (
                            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg inline-block text-left">
                                <p className="font-bold text-amber-800 dark:text-amber-300 text-sm mb-1">Absence Request Found</p>
                                <p className="text-xs text-amber-700 dark:text-amber-400">Reason: {absence.reason}</p>
                                <p className="text-xs text-amber-700 dark:text-amber-400">Status: {absence.status || 'Pending'}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    // --- WEEKLY/MONTHLY VIEW Logic ---
    const generateAggregatedView = (type) => {
        let startDate, endDate;
        if (type === 'weekly') {
            const day = currentDate.getDay();
            const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1);
            startDate = new Date(currentDate.setDate(diff));
            startDate.setHours(0,0,0,0);
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            endDate.setHours(23,59,59,999);
        } else {
            startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);
        }

        let totalPresentHours = 0;
        const skillsetsAttended = [];
        const currentAwolDates = [];

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            if (d > new Date()) continue; // Skip future dates
            if (d < registrationDate) continue; // Skip dates before registration
            
            let isDeletedPeriod = false;
            let deletedAtDate = null;
            if (profile?.deletedAt) {
                if (profile.deletedAt.toDate) deletedAtDate = profile.deletedAt.toDate();
                else if (profile.deletedAt.seconds) deletedAtDate = new Date(profile.deletedAt.seconds * 1000);
                else deletedAtDate = new Date(profile.deletedAt);
                deletedAtDate.setHours(0,0,0,0);
            }
            
            let reRegisteredAtDate = null;
            if (profile?.registeredAt && profile?.initialRegisteredAt && profile.registeredAt !== profile.initialRegisteredAt) {
                if (profile.registeredAt.toDate) reRegisteredAtDate = profile.registeredAt.toDate();
                else if (profile.registeredAt.seconds) reRegisteredAtDate = new Date(profile.registeredAt.seconds * 1000);
                else reRegisteredAtDate = new Date(profile.registeredAt);
                reRegisteredAtDate.setHours(0,0,0,0);
            }
            
            if (deletedAtDate && reRegisteredAtDate && deletedAtDate < reRegisteredAtDate) {
                if (d >= deletedAtDate && d < reRegisteredAtDate) {
                    isDeletedPeriod = true;
                }
            }
            if (isDeletedPeriod) continue; // Skip dates between deletion and re-registration
            
            const logs = getLogsForDate(d);
            const weekend = isWeekend(d);
            const holiday = isHoliday(d);
            const absence = getAbsenceForDate(d);

            if (logs.length === 0 && !weekend && !holiday && !absence) {
                // Filter out dates that are already disputed
                const dateStr = d.toLocaleDateString();
                const alreadyDisputed = disputes.find(disp => disp.date === dateStr);
                if (!alreadyDisputed) {
                    currentAwolDates.push(dateStr);
                }
            }

            const inLog = logs.find(l => l.type === 'IN');
            const outLog = logs.find(l => l.type === 'OUT');
            if (inLog && outLog) {
                totalPresentHours += calculateHours(inLog.timestamp, outLog.timestamp);
            }

            const skillsetIns = logs.filter(l => l.type === 'SKILLSET_IN');
            const skillsetOuts = logs.filter(l => l.type === 'SKILLSET_OUT');

            skillsetIns.forEach((sIn, idx) => {
                const sOut = skillsetOuts.find(o => o.skillset === sIn.skillset && o.timestamp > sIn.timestamp) || skillsetOuts[idx];
                if (sOut) {
                    const hrs = calculateHours(sIn.timestamp, sOut.timestamp);
                    skillsetsAttended.push({
                        date: new Date(sIn.timestamp).toLocaleDateString(),
                        skillset: sIn.skillset || sIn.roomName || 'Skillset Room',
                        hours: hrs
                    });
                }
            });
        }

        const skillsetSummary = skillsetsAttended.reduce((acc, curr) => {
            acc[curr.skillset] = (acc[curr.skillset] || 0) + curr.hours;
            return acc;
        }, {});

        const title = type === 'weekly' 
            ? `${startDate.toLocaleDateString([], {month:'short', day:'numeric'})} - ${endDate.toLocaleDateString([], {month:'short', day:'numeric', year:'numeric'})}`
            : startDate.toLocaleDateString([], {month:'long', year:'numeric'});

        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <button onClick={type === 'weekly' ? handlePrevWeek : handlePrevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500"><ChevronLeft /></button>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{title}</h3>
                    <button onClick={type === 'weekly' ? handleNextWeek : handleNextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500"><ChevronRight /></button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm text-center">
                        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Clock size={20} />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">Total Present</p>
                        <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{totalPresentHours.toFixed(1)} <span className="text-sm font-medium text-slate-500">hrs</span></p>
                    </div>
                    
                    {/* Clickable AWOL Box */}
                    <div 
                        onClick={() => { setAwolDatesList(currentAwolDates); setShowAwolModal(true); }}
                        className="bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-900/50 p-6 shadow-sm text-center cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group relative"
                    >
                        <div className="w-10 h-10 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                            <AlertCircle size={20} />
                        </div>
                        <p className="text-xs text-red-500 dark:text-red-400 font-bold uppercase mb-1">AWOL (No Record)</p>
                        <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{currentAwolDates.length} <span className="text-sm font-medium text-slate-500">days</span></p>
                        {currentAwolDates.length > 0 && <span className="absolute top-2 right-2 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                    <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2"><CheckCircle2 size={18}/> Skillsets Attended ({skillsetsAttended.length})</h4>
                    
                    {Object.keys(skillsetSummary).length > 0 ? (
                        <div className="space-y-3">
                            {Object.entries(skillsetSummary).map(([name, hrs]) => (
                                <details key={name} className="group bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700 [&_summary::-webkit-details-marker]:hidden">
                                    <summary className="flex justify-between items-center p-3 cursor-pointer">
                                        <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{name}</p>
                                        <p className="font-bold text-indigo-600 dark:text-indigo-400">{hrs.toFixed(1)} hrs <span className="text-slate-400 ml-2 text-xs transition-transform group-open:rotate-180 inline-block">▼</span></p>
                                    </summary>
                                    <div className="p-3 pt-0 border-t border-slate-200 dark:border-slate-700 mt-2 space-y-2">
                                        {skillsetsAttended.filter(s => s.skillset === name).map((s, idx) => (
                                            <div key={idx} className="flex justify-between text-xs">
                                                <span className="text-slate-500">{s.date}</span>
                                                <span className="font-semibold text-slate-700 dark:text-slate-300">{s.hours.toFixed(1)} hrs</span>
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500 dark:text-slate-400 italic text-center text-sm py-4">No skillset records found for this period.</p>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
            
            <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-xl w-full max-w-md mx-auto">
                <button onClick={() => setViewMode('daily')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all ${viewMode === 'daily' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700'}`}>
                    <Calendar size={16} /> Daily
                </button>
                <button onClick={() => setViewMode('weekly')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all ${viewMode === 'weekly' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700'}`}>
                    <CalendarRange size={16} /> Weekly
                </button>
                <button onClick={() => setViewMode('monthly')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all ${viewMode === 'monthly' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700'}`}>
                    <CalendarDays size={16} /> Monthly
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></span>
                </div>
            ) : (
                <>
                    {viewMode === 'daily' && renderDailyView()}
                    {viewMode === 'weekly' && generateAggregatedView('weekly')}
                    {viewMode === 'monthly' && generateAggregatedView('monthly')}
                </>
            )}

            {/* My Disputes Section */}
            {disputes.length > 0 && (
                <div className="mt-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                    <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2"><FileText size={18}/> My AWOL Disputes</h4>
                    <div className="space-y-3">
                        {disputes.map(d => (
                            <div key={d.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between gap-4">
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">{d.date}</p>
                                    <p className="text-slate-600 dark:text-slate-400 text-xs italic">"{d.narrative}"</p>
                                    {d.fileUrl && <a href={d.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:underline mt-2 inline-block">View Attachment</a>}
                                </div>
                                <div className="shrink-0 flex flex-col items-end">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                        d.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                        d.status === 'Denied' ? 'bg-red-100 text-red-700' :
                                        'bg-amber-100 text-amber-700'
                                    }`}>
                                        {d.status === 'Approved' ? `AWOL: Approved by ${d.adviserInitials}` : d.status === 'Denied' ? `AWOL: Denied by ${d.adviserInitials}` : `AWOL: ${d.status}`}
                                    </span>
                                    {d.skillset && (
                                        <span className={`mt-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                            d.skillsetStatus === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                                            d.skillsetStatus === 'Denied' ? 'bg-rose-100 text-rose-700' :
                                            'bg-amber-100 text-amber-700'
                                        }`}>
                                            Skillset: {d.skillsetStatus === 'Approved' ? `Approved by ${d.skillsetLfInitials}` : d.skillsetStatus === 'Denied' ? `Denied by ${d.skillsetLfInitials}` : d.skillsetStatus}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* AWOL Dispute Modal */}
            {showAwolModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><AlertCircle size={18} className="text-red-500"/> AWOL Disputes</h3>
                            <button onClick={() => {setShowAwolModal(false); setDisputingDate(null);}} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"><X size={20}/></button>
                        </div>
                        
                        <div className="p-6 max-h-[70vh] overflow-y-auto">
                            {!disputingDate ? (
                                <>
                                    {awolDatesList.length === 0 ? (
                                        <div className="text-center py-8">
                                            <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle2 size={32}/></div>
                                            <h4 className="font-bold text-slate-700 text-lg">You have no AWOL dates</h4>
                                            <p className="text-slate-500 text-sm mt-1">Great job! All your attendance is accounted for this period.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <p className="text-sm text-slate-600 mb-4">You have {awolDatesList.length} recorded AWOL days for this period. Select a date to file a dispute.</p>
                                            {awolDatesList.map(date => (
                                                <div key={date} className="flex justify-between items-center p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/30">
                                                    <span className="font-bold text-slate-700 dark:text-slate-300">{date}</span>
                                                    <button onClick={() => setDisputingDate(date)} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-bold rounded-md transition-colors">File Dispute</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <form onSubmit={handleFileDispute} className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <button type="button" onClick={() => setDisputingDate(null)} className="text-slate-400 hover:text-slate-600"><ChevronLeft size={20}/></button>
                                        <h4 className="font-bold text-slate-700">Dispute: {disputingDate}</h4>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Narrative / Reason</label>
                                        <textarea 
                                            required
                                            value={disputeNarrative}
                                            onChange={e => setDisputeNarrative(e.target.value)}
                                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            rows="4"
                                            placeholder="Explain why you were not absent on this date..."
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 mb-4 dark:text-slate-200 mt-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Clock In Time <span className="text-red-500">*</span></label>
                                            <input type="time" required value={clockInTime} onChange={e => setClockInTime(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Clock Out Time <span className="text-red-500">*</span></label>
                                            <input type="time" required value={clockOutTime} onChange={e => setClockOutTime(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                        </div>
                                    </div>

                                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mb-4 dark:text-slate-200">
                                        <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Skillset Information (Optional)</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Skillset/Room Name</label>
                                                <input type="text" value={skillset} onChange={e => setSkillset(e.target.value)} placeholder="e.g. Mechatronics" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Skillset In Time</label>
                                                    <input type="time" value={skillsetInTime} onChange={e => setSkillsetInTime(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Skillset Out Time</label>
                                                    <input type="time" value={skillsetOutTime} onChange={e => setSkillsetOutTime(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Skillset LF</label>
                                                <select value={skillsetLf} onChange={e => setSkillsetLf(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                                                    <option value="">-- Select LF --</option>
                                                    {Object.entries(lfAccounts).map(([email, initials]) => (
                                                        <option key={email} value={initials}>{initials} ({email})</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Attachment (Proof)</label>
                                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 dark:hover:bg-bray-800 dark:bg-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:hover:border-slate-500 dark:hover:bg-slate-600">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <Upload className="w-8 h-8 mb-4 text-slate-500 dark:text-slate-400" />
                                                <p className="mb-2 text-sm text-slate-500 dark:text-slate-400 font-semibold">{disputeFile ? disputeFile.name : "Click to upload file"}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Photo or Document</p>
                                            </div>
                                            <input type="file" className="hidden" onChange={e => setDisputeFile(e.target.files[0])} />
                                        </label>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <button 
                                            disabled={isSubmittingDispute}
                                            type="submit" 
                                            className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                                        >
                                            {isSubmittingDispute ? <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span> : "Submit Dispute"}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
