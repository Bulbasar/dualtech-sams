path = 'c:/Users/rober/dualtech-ojt-portal/trainee-portal/src/pages/tabs/ASTPHomeTab.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add isOnline state after unsyncedLogsCount state
old_state = "    const [unsyncedLogsCount, setUnsyncedLogsCount] = useState(0);"
new_state = """    const [unsyncedLogsCount, setUnsyncedLogsCount] = useState(0);
    const [isOnline, setIsOnline] = useState(navigator.onLine);"""
content = content.replace(old_state, new_state, 1)

# 2. Add online/offline listener to the existing checkUnsynced useEffect
old_useeffect = """        checkUnsynced();
        window.addEventListener('online', checkUnsynced);
        const intervalId = setInterval(checkUnsynced, 3000);
        return () => {
            window.removeEventListener('online', checkUnsynced);
            clearInterval(intervalId);
        };"""
new_useeffect = """        checkUnsynced();
        const handleOnline = () => { setIsOnline(true); checkUnsynced(); };
        const handleOffline = () => { setIsOnline(false); checkUnsynced(); };
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        const intervalId = setInterval(checkUnsynced, 3000);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(intervalId);
        };"""
content = content.replace(old_useeffect, new_useeffect, 1)

# 3. Add crypto helpers before handleOfflineUpload
old_upload = "    const handleOfflineUpload = async (e) => {"
new_upload = """    // --- CRYPTO HELPERS (AES-GCM via Web Crypto API) ---
    const enc = new TextEncoder();
    const deriveKey = async (uid) => {
        const salt = enc.encode('dualtech-ojt-salt-v1');
        const baseKey = await crypto.subtle.importKey('raw', enc.encode(uid + '-dualtech'), { name: 'PBKDF2' }, false, ['deriveKey']);
        return crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
            baseKey,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    };
    const encryptPayload = async (plain, uid) => {
        const key = await deriveKey(uid);
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plain));
        const combined = new Uint8Array(iv.byteLength + cipher.byteLength);
        combined.set(iv, 0);
        combined.set(new Uint8Array(cipher), iv.byteLength);
        return combined;
    };
    const decryptPayload = async (buf, uid) => {
        const key = await deriveKey(uid);
        const iv = buf.slice(0, 12);
        const cipher = buf.slice(12);
        const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
        return new TextDecoder().decode(plain);
    };

    const handleOfflineUpload = async (e) => {"""
content = content.replace(old_upload, new_upload, 1)

# 4. Replace the handleOfflineUpload body - read as ArrayBuffer and decrypt
old_body = """        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = event.target.result;
                const lines = text.split('\\n');
                const data = Object.fromEntries(lines.map(l => {
                    const idx = l.indexOf('=');
                    return [l.slice(0, idx)?.trim(), l.slice(idx + 1)?.trim()];
                }));
                if (!data.type || !data.timestamp) throw new Error('Invalid file format');
                const logsCollectionRef = collection(db, 'artifacts', appId, 'users', user.uid, 'attendanceLogs');
                const logPayload = {
                    location: { lat: parseFloat(data.lat || 0), lon: parseFloat(data.lon || 0) },
                    deviceUsed: navigator.userAgent,
                    statusRemark: data.notes || 'Offline Upload',
                    type: data.type === 'in' ? 'IN' : 'OUT'
                };
                const dateString = getLocalYYYYMMDD(new Date(data.timestamp));
                const timestampNum = new Date(data.timestamp).getTime();
                if (data.type === 'in') {
                    const newLogRef = doc(logsCollectionRef);
                    await setDoc(newLogRef, { dateString, timestamp: timestampNum, timeIn: timestampNum, clockInDetails: logPayload, type: 'IN' });
                } else {
                    const outLogRef = doc(logsCollectionRef);
                    await setDoc(outLogRef, { dateString, timestamp: timestampNum, timeOut: timestampNum, clockOutDetails: logPayload, type: 'OUT' });
                }
                alert('Offline attendance successfully synced!');
                fetchLogs();
            } catch (err) {
                console.error(err);
                alert('Failed to process file. Ensure it is a valid attendance export.');
            }
        };
        reader.readAsText(file);"""
new_body = """        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const buf = event.target.result;
                const decrypted = await decryptPayload(buf, user.uid);
                const lines = decrypted.split('\\n');
                const data = Object.fromEntries(lines.map(l => {
                    const idx = l.indexOf('=');
                    return [l.slice(0, idx)?.trim(), l.slice(idx + 1)?.trim()];
                }));
                if (!data.type || !data.timestamp) throw new Error('Invalid file format');
                const logsCollectionRef = collection(db, 'artifacts', appId, 'users', user.uid, 'attendanceLogs');
                const logPayload = {
                    location: { lat: parseFloat(data.lat || 0), lon: parseFloat(data.lon || 0) },
                    deviceUsed: navigator.userAgent,
                    statusRemark: data.notes || 'Offline Upload',
                    type: data.type === 'in' ? 'IN' : 'OUT'
                };
                const dateString = getLocalYYYYMMDD(new Date(data.timestamp));
                const timestampNum = new Date(data.timestamp).getTime();
                if (data.type === 'in') {
                    const newLogRef = doc(logsCollectionRef);
                    await setDoc(newLogRef, { dateString, timestamp: timestampNum, timeIn: timestampNum, clockInDetails: logPayload, type: 'IN' });
                } else {
                    const outLogRef = doc(logsCollectionRef);
                    await setDoc(outLogRef, { dateString, timestamp: timestampNum, timeOut: timestampNum, clockOutDetails: logPayload, type: 'OUT' });
                }
                alert('Offline attendance successfully synced!');
                fetchLogs();
            } catch (err) {
                console.error(err);
                alert('Failed to process file. It may be corrupted or from a different account.');
            }
        };
        reader.readAsArrayBuffer(file);"""
content = content.replace(old_body, new_body, 1)

# 5. Replace offline txt export with encrypted binary export
old_export = """                        if (isOfflineOrPoor) {
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

                            alert(`⚠️ TEMPORARY SAVE SUCCESSFUL\\n\\nYou clocked ${type.toUpperCase()}, but your internet connection is poor or offline.\\n\\nA .txt file with your attendance details has been downloaded. When you regain a stable connection, please upload it via the "Upload Offline Logs" section to officially sync your attendance.`);"""
new_export = """                        if (isOfflineOrPoor) {
                            // --- EXPORT ENCRYPTED FILE FOR OFFLINE CLOCK IN/OUT ---
                            try {
                                const exportTime = new Date().toISOString();
                                const txtLines = [
                                    `type=${type}`,
                                    `timestamp=${exportTime}`,
                                    `lat=${lat}`,
                                    `lon=${lon}`,
                                    `notes=${extraNotes}`,
                                ];
                                const plain = txtLines.join('\\n');
                                const encrypted = await encryptPayload(plain, user.uid);
                                const blob = new Blob([encrypted], { type: 'application/octet-stream' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `attendance_${type}_${Date.now()}.enc`;
                                a.click();
                                URL.revokeObjectURL(url);
                                alert(`⚠️ TEMPORARY SAVE SUCCESSFUL\\n\\nYou clocked ${type.toUpperCase()}, but your internet connection is poor or offline.\\n\\nAn encrypted .enc file with your attendance details has been downloaded. When you regain a stable connection, the "Sync Offline Logs" section will appear — upload the file there to officially sync your attendance.`);
                            } catch (cryptoErr) {
                                console.error('Encryption failed:', cryptoErr);
                                alert(`⚠️ TEMPORARY SAVE SUCCESSFUL\\n\\nYou clocked ${type.toUpperCase()} offline. Note: File encryption failed — keep this tab open and sync when you reconnect.`);
                            }"""
content = content.replace(old_export, new_export, 1)

# 6. Update the sync section: accept .enc, wrap with !isOnline, update description
old_sync_section = """                                    {/* --- OFFLINE LOG UPLOAD SECTION --- */}
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
                                    </div>"""
new_sync_section = """                                    {/* --- OFFLINE LOG UPLOAD SECTION: only show when offline --- */}
                                    {!isOnline && (
                                        <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-xl sm:rounded-2xl shadow-sm border border-amber-200 dark:border-amber-800 mt-4">
                                            <h3 className="font-bold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
                                                <Globe size={18} className="text-amber-500"/> Sync Offline Logs
                                            </h3>
                                            <p className="text-xs text-amber-700 dark:text-amber-400 mb-4">
                                                You are currently offline. If you clocked in/out and an encrypted <strong>.enc</strong> file was downloaded, upload it here once you reconnect to sync your attendance.
                                            </p>
                                            <input 
                                                type="file" 
                                                accept=".enc" 
                                                onChange={handleOfflineUpload}
                                                className="w-full text-sm text-amber-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200 dark:file:bg-amber-900 dark:file:text-amber-300 cursor-pointer"
                                            />
                                        </div>
                                    )}"""
content = content.replace(old_sync_section, new_sync_section, 1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

# Quick verification
checks = [
    'isOnline',
    'encryptPayload',
    'decryptPayload',
    'deriveKey',
    'readAsArrayBuffer',
    '.enc',
    '!isOnline',
]
for c in checks:
    if c in content:
        print(f'OK: {c}')
    else:
        print(f'MISSING: {c}')
