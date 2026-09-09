path = 'c:/Users/rober/dualtech-ojt-portal/trainee-portal/src/pages/tabs/ASTPHomeTab.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old = '\n    const currentHour = currentTime.getHours();'
new = """
    const handleOfflineUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
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
        reader.readAsText(file);
    };

    const currentHour = currentTime.getHours();"""

if old in content:
    content = content.replace(old, new, 1)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Done')
else:
    print('ERROR: target not found')
