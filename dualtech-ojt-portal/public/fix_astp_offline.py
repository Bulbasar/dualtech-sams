import sys

path = 'c:/Users/rober/dualtech-ojt-portal/trainee-portal/src/pages/tabs/ASTPHomeTab.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add handleOfflineUpload function inside the ASTPHomeTab component, let's say after fetchLogs
old_fetch = """    const fetchLogs = async () => {
        try {
            const logsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'attendanceLogs');
            const snap = await getDocs(logsRef);
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllLogs(data);
        } catch (err) {
            console.error("Failed to fetch logs:", err);
        }
    };"""

new_fetch = """    const fetchLogs = async () => {
        try {
            const logsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'attendanceLogs');
            const snap = await getDocs(logsRef);
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllLogs(data);
        } catch (err) {
            console.error("Failed to fetch logs:", err);
        }
    };

    const handleOfflineUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = event.target.result;
                const lines = text.split('\\n');
                const data = Object.fromEntries(lines.map(l => {
                    const [k, v] = l.split('=');
                    return [k?.trim(), v?.trim()];
                }));

                if (!data.type || !data.timestamp) {
                    throw new Error("Invalid file format");
                }

                const logsCollectionRef = collection(db, 'artifacts', appId, 'users', user.uid, 'attendanceLogs');
                
                const logPayload = { 
                    location: { lat: parseFloat(data.lat || 0), lon: parseFloat(data.lon || 0) }, 
                    deviceUsed: navigator.userAgent, 
                    statusRemark: data.notes || "Offline Upload", 
                    type: data.type === 'in' ? 'IN' : 'OUT' 
                };

                const dateString = getLocalYYYYMMDD(new Date(data.timestamp));
                const timestampNum = new Date(data.timestamp).getTime();

                if (data.type === 'in') {
                    const newLogRef = doc(logsCollectionRef);
                    await setDoc(newLogRef, {
                        dateString, timestamp: timestampNum, timeIn: timestampNum, clockInDetails: logPayload, type: 'IN'
                    });
                } else {
                    const outLogRef = doc(logsCollectionRef);
                    await setDoc(outLogRef, {
                        dateString, timestamp: timestampNum, timeOut: timestampNum, clockOutDetails: logPayload, type: 'OUT'
                    });
                }

                alert("✅ Offline attendance successfully synced to system!");
                fetchLogs();
            } catch (err) {
                console.error(err);
                alert("❌ Failed to process the file. Please ensure it's a valid attendance export.");
            }
        };
        reader.readAsText(file);
    };"""

content = content.replace(old_fetch, new_fetch)

# 2. Modify processAttendanceRecord
old_export = """                        if (isOfflineOrPoor) {
                            alert(`⚠️ TEMPORARY SAVE SUCCESSFUL\\n\\nYou clocked ${type.toUpperCase()}, but your internet connection is poor or offline.\\n\\nYour attendance has been temporarily saved to this phone. You MUST connect to a stable internet connection later and open this app to officially record your attendance to the system. Please do not log out of your account.`);
                        } else {
                            alert(`Successfully clocked ${type.toUpperCase()}!`);
                        }"""

new_export = """                        if (isOfflineOrPoor) {
                            // --- EXPORT TXT FILE FOR OFFLINE CLOCK IN/OUT ---
                            const exportTime = new Date().toISOString();
                            const txtLines = [
                                `type=${type}`,
                                `timestamp=${exportTime}`,
                                `lat=${lat}`,
                                `lon=${lon}`,
                                `notes=${extraNotes}`,
                            ];
                            const blob = new Blob([txtLines.join('\\n')], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `attendance_${type}_${Date.now()}.txt`;
                            a.click();
                            URL.revokeObjectURL(url);

                            alert(`⚠️ TEMPORARY SAVE SUCCESSFUL\\n\\nYou clocked ${type.toUpperCase()}, but your internet connection is poor or offline.\\n\\nA .txt file with your attendance details has been downloaded. When you regain a stable connection, please upload it via the "Upload Offline Logs" section to officially sync your attendance.`);
                        } else {
                            alert(`Successfully clocked ${type.toUpperCase()}!`);
                        }"""
content = content.replace(old_export, new_export)

# 3. Add the upload UI under "Today's Logs" block
old_ui = """                                            {allLogs.filter(l => l.dateString === getLocalYYYYMMDD(new Date())).length === 0 && <p className="text-sm text-slate-400 italic text-center py-2">No logs for today yet.</p>}
                                        </div>
                                    </div>
                                </div>"""

new_ui = """                                            {allLogs.filter(l => l.dateString === getLocalYYYYMMDD(new Date())).length === 0 && <p className="text-sm text-slate-400 italic text-center py-2">No logs for today yet.</p>}
                                        </div>
                                    </div>

                                    {/* --- OFFLINE LOG UPLOAD SECTION --- */}
                                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700 mt-4">
                                        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                                            <Globe size={18} className="text-amber-500"/> Sync Offline Logs
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                                            If you clocked in/out while offline and a .txt file was downloaded, you can upload it here to sync your attendance once your network is stable.
                                        </p>
                                        <input 
                                            type="file" 
                                            accept=".txt" 
                                            onChange={handleOfflineUpload}
                                            className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 dark:file:bg-amber-900/20 dark:file:text-amber-500 cursor-pointer"
                                        />
                                    </div>
                                </div>"""
content = content.replace(old_ui, new_ui)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated successfully')
