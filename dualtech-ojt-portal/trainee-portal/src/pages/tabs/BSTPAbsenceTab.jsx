import React, { useState } from 'react';
import { Plus, X, Upload, Loader2, FileText, AlertTriangle } from 'lucide-react';
import { collection, addDoc, doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export default function BSTPAbsenceTab({ user, profile, db, appId, isActive, absenceLogs = [], fetchLogs }) {
    const [absenceType, setAbsenceType] = useState('Scheduled');
    const [absenceCat, setAbsenceCat] = useState('Health');
    const [dateToAdd, setDateToAdd] = useState('');
    const [selectedDates, setSelectedDates] = useState([]);
    const [absenceStartDate, setAbsenceStartDate] = useState('');
    const [absenceDescription, setAbsenceDescription] = useState('');
    const [otherDetails, setOtherDetails] = useState('');
    const [absenceFile, setAbsenceFile] = useState(null);
    const [submittingAbsence, setSubmittingAbsence] = useState(false);

    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxE2e9x3pcNN0rU5aqWjGX63x5GnG5KX1I7Vs3zSINpaw_6ecjD2vANCY-wkhArrtoo/exec";

    const handleAddDate = () => {
        if (!dateToAdd) return;
        if (!selectedDates.includes(dateToAdd)) {
            setSelectedDates([...selectedDates, dateToAdd].sort());
        }
        setDateToAdd('');
    };

    const handleRemoveDate = (dateToRemove) => {
        setSelectedDates(selectedDates.filter(d => d !== dateToRemove));
    };

    const fileToBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });

    const handleAbsenceSubmit = async (e) => {
        e.preventDefault();
        
        if (!isActive) {
            console.warn("Submission blocked because isActive is false.");
            return;
        }

        if (absenceType === 'Scheduled' && selectedDates.length === 0) return alert("Error: Please select at least one specific date.");
        if (absenceType === 'Emergency' && !absenceStartDate) return alert("Error: Please select the date.");
        if (absenceCat === 'Others' && !otherDetails.trim()) return alert("Error: Please provide details for 'Others' category.");

        if (absenceFile && absenceFile.size > 5 * 1024 * 1024) {
            return alert("Error: File is too large! Please upload a file smaller than 5MB.");
        }

        // Scheduled 3-day validation
        if (absenceType === 'Scheduled') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const firstDateStr = selectedDates[0];
            const firstDate = new Date(firstDateStr);
            const diffTime = firstDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (firstDate <= today || diffDays < 3) {
                if (!window.confirm("Warning: Scheduled absences must be filed at least 3 days prior to the requested date. This request is subject for further review and possible rejection by your Adviser. Do you want to proceed?")) {
                    return;
                }
            }
        }

        // Emergency date validation
        if (absenceType === 'Emergency') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const reqDate = new Date(absenceStartDate);
            if (reqDate > today) {
                return alert("Error: Emergency absence dates must be on or before the current date.");
            }
        }

        setSubmittingAbsence(true);

        try {
            const finalDates = absenceType === 'Scheduled' ? selectedDates.join(', ') : absenceStartDate;
            const fullCategory = absenceCat === 'Others' ? `Others - ${otherDetails}` : absenceCat;

            let fileUrl = "";

            if (absenceFile) {
                const base64Data = await fileToBase64(absenceFile);
                const payload = {
                    fileName: `${user.uid}_${Date.now()}_${absenceFile.name}`,
                    fileContent: base64Data,
                    mimeType: absenceFile.type
                };

                const response = await fetch(GOOGLE_SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                const data = await response.json();
                if(data.status === 'success') {
                    fileUrl = data.url;
                } else {
                    console.warn("Apps Script Upload returned error:", data);
                    alert("Warning: File uploaded failed. Proceeding without file.");
                }
            }

            // Get LF Initials from profile adviser
            let lfInitials = "";
            if (profile.adviser) {
                lfInitials = profile.adviser; 
            } else if (profile.Adviser) {
                lfInitials = profile.Adviser;
            }

            // Save to Firestore
            const absenceRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'bstpAbsences'));
            await setDoc(absenceRef, {
                uid: user.uid,
                studentNo: profile.studentId || profile.studentNo || "",
                name: `${profile.given || profile.name || ''} ${profile.family || ''}`.trim(),
                adviser: lfInitials,
                type: absenceType,
                category: fullCategory,
                dates: finalDates,
                narrative: absenceDescription,
                proofUrl: fileUrl,
                status: 'Pending Adviser Approval',
                timestamp: serverTimestamp(),
                isCanceled: false
            });

            // Trigger Notification to LF
            if (lfInitials) {
                await addDoc(collection(db, 'bstpNotifications'), {
                    type: 'ABSENCE_REQUEST',
                    title: 'New Absence Request',
                    message: `${profile.given || profile.name} filed a ${absenceType} absence for ${finalDates}`,
                    targetInitials: lfInitials,
                    timestamp: serverTimestamp(),
                    isRead: false,
                    reqId: absenceRef.id
                });
            }

            alert("Absence request successfully submitted!");
            setAbsenceType('Scheduled');
            setAbsenceCat('Health');
            setAbsenceStartDate('');
            setSelectedDates([]);
            setDateToAdd('');
            setAbsenceDescription('');
            setOtherDetails('');
            setAbsenceFile(null);
            
            if (fetchLogs) {
                await fetchLogs();
            }

        } catch (error) {
            console.error("Error submitting request:", error);
            alert("Error submitting request. Please try again.");
        } finally {
            setSubmittingAbsence(false);
        }
    };

    const cancelAbsenceRequest = async (id) => {
        if (!window.confirm("Are you sure you want to cancel this pending absence request?")) return;
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'bstpAbsences', id), {
                status: 'Canceled by Trainee',
                isCanceled: true
            });
            if (fetchLogs) {
                await fetchLogs();
            }
        } catch (error) {
            console.error("Error canceling request:", error);
            alert("Failed to cancel request.");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div>
                <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Absence Request</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Submit scheduled or emergency absences to your Adviser.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700">
                <form onSubmit={handleAbsenceSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Type</label>
                            <select value={absenceType} onChange={e => { setAbsenceType(e.target.value); setSelectedDates([]); setAbsenceStartDate(''); setAbsenceCat('Health'); }} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500">
                                <option value="Scheduled">Scheduled</option>
                                <option value="Emergency">Emergency</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Category</label>
                            <select value={absenceCat} onChange={e => setAbsenceCat(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500">
                                <option value="Health">Health</option>
                                <option value="Personal">Personal</option>
                                <option value="Family">Family</option>
                                {absenceType === 'Scheduled' && <option value="OJT Requirements">OJT Requirements</option>}
                                <option value="Others">Others</option>
                            </select>
                        </div>
                    </div>

                    {absenceCat === 'Others' && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Other Category Details</label>
                            <input type="text" value={otherDetails} onChange={e => setOtherDetails(e.target.value)} required className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500" placeholder="Specify category..." />
                        </div>
                    )}

                    {absenceType === 'Scheduled' ? (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Select Dates for Absence</label>
                            <div className="flex gap-2 mb-3">
                                <input type="date" value={dateToAdd} onChange={e => setDateToAdd(e.target.value)} className="flex-1 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500" />
                                <button type="button" onClick={handleAddDate} disabled={!isActive} className="bg-blue-100 text-blue-700 px-5 font-bold rounded-xl hover:bg-blue-200 transition-colors flex items-center gap-1 disabled:opacity-50"><Plus size={16} /> Add</button>
                            </div>
                            {selectedDates.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {selectedDates.map(date => (
                                        <div key={date} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm">
                                            {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            <button type="button" onClick={() => handleRemoveDate(date)} className="text-red-400 hover:text-red-600 bg-red-50 p-1 rounded"><X size={12} /></button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 italic">No dates added yet.</p>
                            )}
                            <p className="text-[10px] text-amber-600 font-bold mt-3">* Must be filed 3 days prior to the requested date.</p>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Date of Emergency</label>
                            <input type="date" value={absenceStartDate} onChange={e => setAbsenceStartDate(e.target.value)} required className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500" />
                            <p className="text-[10px] text-amber-600 font-bold mt-1">* Must be on or before the current date.</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Narrative / Reason</label>
                        <textarea
                            value={absenceDescription}
                            onChange={e => setAbsenceDescription(e.target.value)}
                            required
                            rows="3"
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none resize-none focus:border-blue-500"
                            placeholder="Provide a detailed narrative for the request..."
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Attach File (Optional)</label>
                        <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <Upload size={24} className="mb-2" />
                            <div className="text-center">
                                {absenceFile ? (
                                    <span className="font-bold text-blue-600">{absenceFile.name}</span>
                                ) : (
                                    <>
                                        <span className="font-bold text-blue-600">Click to upload</span> or drag and drop
                                    </>
                                )}
                                <p className="text-xs mt-1">Any file up to 5MB</p>
                            </div>
                            <input type="file" className="hidden" onChange={e => setAbsenceFile(e.target.files[0])} />
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={submittingAbsence || !isActive}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submittingAbsence ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Submitting Request...
                            </>
                        ) : (
                            <>
                                <Upload size={18} />
                                Submit Request to Adviser
                            </>
                        )}
                    </button>
                </form>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2"><FileText size={18} /> Absence Request History</h3>
                <div className="space-y-3">
                    {absenceLogs.map(l => {
                        const isPending = !l.status || l.status.toLowerCase().includes('pending');
                        const isCanceled = l.isCanceled || l.status?.toLowerCase().includes('canceled');

                        let statusColor = 'bg-amber-100 text-amber-700 border border-amber-200';
                        if (l.status?.toLowerCase() === 'approved') statusColor = 'bg-blue-100 text-blue-700 border border-blue-200';
                        else if (l.status?.toLowerCase().includes('denied') || l.status?.toLowerCase().includes('rejected')) statusColor = 'bg-rose-100 text-rose-700 border border-rose-200';
                        else if (isCanceled) statusColor = 'bg-slate-200 text-slate-600 border border-slate-300';

                        return (
                            <div key={l.id} className={`p-4 border rounded-xl flex flex-col md:flex-row justify-between md:items-start gap-3 ${isCanceled ? 'bg-slate-100/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-60' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded ${l.type === 'Emergency' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {l.type}
                                        </span>
                                        <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                                            {l.dates || 'Unknown Date'}
                                        </span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-1">{l.category}</p>

                                    {l.narrative && (
                                        <p className="text-xs text-slate-600 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700 mt-2 italic break-words">
                                            "{l.narrative}"
                                        </p>
                                    )}
                                    {l.proofUrl && (
                                        <a href={l.proofUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-2 inline-block">
                                            View Attached File
                                        </a>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2 items-start md:items-end mt-2 md:mt-0 shrink-0">
                                    <span className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg whitespace-nowrap text-center ${statusColor}`}>
                                        {l.status || 'Pending'}
                                    </span>

                                    {isActive && isPending && !isCanceled && (
                                        <button
                                            onClick={() => cancelAbsenceRequest(l.id)}
                                            className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 shadow-sm mt-1 w-full md:w-auto flex items-center justify-center gap-1"
                                        >
                                            <X size={14} /> Cancel Request
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                    {absenceLogs.length === 0 && <p className="text-sm text-slate-400 italic">No absence requests filed yet.</p>}
                </div>
            </div>
        </div>
    );
}
