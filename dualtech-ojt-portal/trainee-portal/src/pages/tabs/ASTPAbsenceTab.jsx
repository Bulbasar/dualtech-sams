
import React, { useState } from 'react';
import { Plus, X, Upload, Loader2, FileText } from 'lucide-react';
import { collection, addDoc, query, where, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function ASTPAbsenceTab({ user, profile, db, storage, appId, isActive, absenceLogs = [], fetchLogs }) {
    const [absenceType, setAbsenceType] = useState('Scheduled');
    const [absenceCat, setAbsenceCat] = useState('Health');
    const [dateToAdd, setDateToAdd] = useState('');
    const [selectedDates, setSelectedDates] = useState([]);
    const [absenceStartDate, setAbsenceStartDate] = useState('');
    const [absenceDescription, setAbsenceDescription] = useState('');
    const [absenceFile, setAbsenceFile] = useState(null);
    const [submittingAbsence, setSubmittingAbsence] = useState(false);

    const handleAddDate = () => {
        if (!dateToAdd) return;
        if (!selectedDates.includes(dateToAdd)) {
            setSelectedDates([...selectedDates, dateToAdd]);
        }
        setDateToAdd('');
    };

    const handleRemoveDate = (dateToRemove) => {
        setSelectedDates(selectedDates.filter(d => d !== dateToRemove));
    };

    const compressImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1000;
                    let scaleSize = 1;
                    if (img.width > MAX_WIDTH) {
                        scaleSize = MAX_WIDTH / img.width;
                    }
                    canvas.width = img.width * scaleSize;
                    canvas.height = img.height * scaleSize;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    canvas.toBlob((blob) => {
                        resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
                    }, 'image/jpeg', 0.7);
                };
            };
        });
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

        if (absenceFile && absenceFile.size > 5 * 1024 * 1024) {
            return alert("Error: Image is too large! Please upload a picture smaller than 5MB.");
        }

        setSubmittingAbsence(true);

        try {
            const finalDates = absenceType === 'Scheduled' ? selectedDates.join(', ') : absenceStartDate;
            const initialStatus = absenceType === 'Scheduled' ? 'Pending IC & HR Approval' : 'Pending Acknowledgment';

            let finalFile = absenceFile;

            let icEmailToUse = "robertjames.atienza@dualtech.edu.ph";
            let hrEmailToUse = "backup-hr@company.com";
            let icNameToUse = profile.assignedIC || "Assigned Coordinator";
            let hrNameToUse = "Company HR";

            try {
                const coordinatorsRef = collection(db, 'artifacts', appId, 'public', 'data', 'coordinators');
                if (profile.assignedIC) {
                    const icQuery = query(
                        coordinatorsRef,
                        where('role', '==', 'Industrial Coordinator'),
                        where('assignedIC', '==', profile.assignedIC)
                    );
                    const icSnap = await getDocs(icQuery);
                    if (!icSnap.empty) {
                        const icData = icSnap.docs[0].data();
                        if (icData.email) icEmailToUse = icData.email;
                        if (icData.name) icNameToUse = icData.name;
                    }
                }

                if (profile.companyName) {
                    const hrQuery = query(
                        coordinatorsRef,
                        where('role', '==', 'Company HR'),
                        where('company', '==', profile.companyName)
                    );
                    const hrSnap = await getDocs(hrQuery);
                    if (!hrSnap.empty) {
                        const hrData = hrSnap.docs[0].data();
                        if (hrData.email) hrEmailToUse = hrData.email;
                        if (hrData.name) hrNameToUse = hrData.name;
                    }
                }
            } catch (fetchErr) {
                console.warn("Could not fetch exact profiles from DB.", fetchErr);
            }

            const newRequestRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'requests'), {
                studentId: profile.studentId,
                studentName: `${profile.given} ${profile.family}`,
                companyName: profile.companyName || profile.company || "Unassigned",
                uid: user.uid,
                type: absenceType + ' Absence',
                category: absenceCat,
                date: finalDates,
                reason: absenceDescription,
                proofUrl: null,
                status: initialStatus,
                icStatus: 'Pending',
                hrStatus: 'Pending',
                createdAt: new Date().toISOString()
            });

            let fileData = null;
            if (finalFile) {
                if (finalFile.size > 500 * 1024) {
                    finalFile = await compressImage(finalFile);
                }
                const base64Str = await fileToBase64(finalFile);
                fileData = {
                    fileName: `${user.uid}_${Date.now()}_${finalFile.name}`,
                    fileBase64: base64Str,
                    mimeType: finalFile.type || 'image/jpeg'
                };
            }

            const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzD86pFVsipEnsOVHQxP8fiLjEv_2T2bWKSe10qM_dARlKwG2V1uCHpx1hcKJxgPRhBJg/exec";

            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8'
                },
                body: JSON.stringify({
                    action: 'submit',
                    requestId: newRequestRef.id,
                    studentName: `${profile.given} ${profile.family}`,
                    studentId: profile.studentId,
                    company: profile.companyName || "No Company Listed",
                    type: absenceType,
                    date: finalDates,
                    reason: absenceDescription,
                    icEmail: icEmailToUse,
                    hrEmail: hrEmailToUse,
                    icName: icNameToUse,
                    hrName: hrNameToUse,
                    fileObj: fileData
                })
            });

            if (finalFile) {
                const fileRef = ref(storage, `artifacts/${appId}/absences/${user.uid}/${Date.now()}_${finalFile.name}`);
                await uploadBytes(fileRef, finalFile);
                const fileUrl = await getDownloadURL(fileRef);

                await updateDoc(newRequestRef, { proofUrl: fileUrl });
            }

            alert("Absence request successfully submitted and logged!");
            setAbsenceType('Scheduled');
            setAbsenceCat('Health');
            setAbsenceStartDate('');
            setSelectedDates([]);
            setDateToAdd('');
            setAbsenceDescription('');
            setAbsenceFile(null);
            
            if (fetchLogs) {
                await fetchLogs();
            }

        } catch (error) {
            console.error("Error submitting request:", error);
            alert("Error submitting request: " + error.message);
        } finally {
            setSubmittingAbsence(false);
        }
    };

    const cancelAbsenceRequest = async (id) => {
        if (!confirm("Are you sure you want to cancel this pending absence request?")) return;
        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'requests', id));
            if (fetchLogs) {
                await fetchLogs();
            }
        } catch (error) {
            console.error("Error canceling request:", error);
            alert("Failed to cancel request.");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Absence Application</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Submit scheduled or emergency absences.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700">
                <form onSubmit={handleAbsenceSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Type</label>
                            <select value={absenceType} onChange={e => { setAbsenceType(e.target.value); setSelectedDates([]); setAbsenceStartDate(''); }} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500">
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
                            </select>
                        </div>
                    </div>

                    {absenceType === 'Scheduled' ? (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Select Specific Dates for Absence</label>
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
                                <p className="text-xs text-slate-400 italic">No dates added yet. Please add at least one date.</p>
                            )}
                            <p className="text-[10px] text-amber-600 font-bold mt-3">* Scheduled Absences require clearance from both your IC and HR.</p>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Date of Absence</label>
                            <input type="date" value={absenceStartDate} onChange={e => setAbsenceStartDate(e.target.value)} required className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500" />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Reason / Description</label>
                        <textarea
                            value={absenceDescription}
                            onChange={e => setAbsenceDescription(e.target.value)}
                            required
                            rows="3"
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none resize-none focus:border-blue-500"
                            placeholder="Briefly describe the reason for your absence..."
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Upload Proof (Optional)</label>
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
                                <p className="text-xs mt-1">PNG, JPG up to 5MB</p>
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={e => setAbsenceFile(e.target.files[0])} />
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
                                Uploading Picture & Submitting...
                            </>
                        ) : (
                            <>
                                <Upload size={18} />
                                Submit Request
                            </>
                        )}
                    </button>
                </form>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2"><FileText size={18} /> Absence History</h3>
                <div className="space-y-3">
                    {absenceLogs.map(l => {
                        const isPending = !l.status || l.status.toLowerCase().includes('pending');
                        const isCanceled = l.status?.toLowerCase().includes('canceled');

                        let statusColor = 'bg-amber-100 text-amber-700 border border-amber-200';
                        if (l.status?.toLowerCase() === 'approved') statusColor = 'bg-blue-100 text-blue-700 border border-blue-200';
                        else if (l.status?.toLowerCase().includes('denied') || l.status?.toLowerCase().includes('rejected')) statusColor = 'bg-rose-100 text-rose-700 border border-rose-200';
                        else if (l.status?.toLowerCase() === 'acknowledged') statusColor = 'bg-purple-100 text-purple-700 border border-purple-200';
                        else if (isCanceled) statusColor = 'bg-slate-200 text-slate-600 border border-slate-300';

                        return (
                            <div key={l.id} className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl flex flex-col md:flex-row justify-between md:items-start gap-3">
                                <div className="flex-1">
                                    <p className="font-bold text-sm text-slate-800 dark:text-slate-100 leading-tight">
                                        {l.date || 'Unknown Date'}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 mt-0.5">{l.type} - {l.category}</p>

                                    {l.reason && (
                                        <p className="text-xs text-slate-600 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700 mt-2 italic break-words">
                                            "{l.reason}"
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2 items-start md:items-end mt-2 md:mt-0 shrink-0">
                                    <span className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg whitespace-nowrap text-center ${statusColor}`}>
                                        {l.status || 'Pending'}
                                    </span>

                                    {!isCanceled && (
                                        <div className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 mt-1 bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                                            <span className={l.icStatus === 'Approved' || l.icStatus === 'Acknowledged' ? 'text-blue-600' : l.icStatus === 'Denied' ? 'text-red-600' : 'text-amber-500'}>
                                                IC: {l.icStatus || 'Pending'}
                                            </span>
                                            <span className="text-slate-300">|</span>
                                            <span className={l.hrStatus === 'Approved' || l.hrStatus === 'Acknowledged' ? 'text-blue-600' : l.hrStatus === 'Denied' ? 'text-red-600' : 'text-amber-500'}>
                                                HR: {l.hrStatus || 'Pending'}
                                            </span>
                                        </div>
                                    )}

                                    {isActive && isPending && (
                                        <button
                                            onClick={() => cancelAbsenceRequest(l.id)}
                                            className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 shadow-sm mt-1 w-full md:w-auto"
                                        >
                                            Cancel Request
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                    {absenceLogs.length === 0 && <p className="text-sm text-slate-400 italic">No absence applications yet.</p>}
                </div>
            </div>
        </div>
    );
}
