const fs = require('fs');
const file = 'c:/Users/rober/dualtech-ojt-portal/public/ic-management.html';
let content = fs.readFileSync(file, 'utf8');

// 1. Replace fetchLogs
const oldFetchLogs = 
                const fetchLogs = async () => {
                    try {
                        const logSnap = await getDocs(query(collectionGroup(db, 'attendanceLogs'), orderBy('timestamp', 'desc'), limit(5000)));
                        setAttendanceLogs(logSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                    } catch (err) {
                        console.error("Error fetching logs:", err);
                    }
                    setAttendanceLogsFetched(true);
                };
;

const newFetchLogs = 
                const fetchLogs = async () => {
                    try {
                        const astpTrainees = trainees.filter(t => String(t.level || t.Level || t.LEVEL || '').toUpperCase() === 'ASTP');
                        if (astpTrainees.length === 0) {
                            setAttendanceLogsFetched(true);
                            return;
                        }

                        // 1. Fetch profiles to map studentId to UID
                        const profilesSnap = await getDocs(query(collectionGroup(db, 'profile'), where('role', '==', 'trainee')));
                        const uidToStudentMap = {};
                        profilesSnap.forEach(doc => {
                            const data = doc.data();
                            const uid = data.uid || (doc.ref.parent && doc.ref.parent.parent ? doc.ref.parent.parent.id : null);
                            const sid = String(data.studentId || data['Student ID#'] || '').trim();
                            if (uid && sid) uidToStudentMap[sid] = uid;
                        });

                        // 2. Find UIDs of ASTP trainees
                        const astpUids = astpTrainees.map(t => {
                            const sid = String(t.studentId || t['Student ID#'] || '').trim();
                            return uidToStudentMap[sid];
                        }).filter(Boolean);

                        // 3. Fetch attendance logs in chunks
                        let allAstpLogs = [];
                        const chunkSize = 30;
                        for (let i = 0; i < astpUids.length; i += chunkSize) {
                            const chunk = astpUids.slice(i, i + chunkSize);
                            await Promise.all(chunk.map(async (uid) => {
                                const logsRef = collection(db, 'artifacts', appId, 'users', uid, 'attendanceLogs');
                                const snap = await getDocs(logsRef);
                                snap.forEach(d => {
                                    allAstpLogs.push({ id: d.id, ...d.data() });
                                });
                            }));
                        }
                        
                        setAttendanceLogs(allAstpLogs);
                    } catch (err) {
                        console.error("Error fetching logs:", err);
                    }
                    setAttendanceLogsFetched(true);
                };
;

content = content.replace(oldFetchLogs.trim(), newFetchLogs.trim());

// 2. Replace date logic in DashboardTab
const oldDateLogic = 
                    const todayLogs = attendanceLogs.filter(l => {
                        const t = parseTime(l.timestamp) || parseTime(l.timeIn) || parseTime(l.date);
                        if (!t) return false;
                        return t.toISOString().split('T')[0] === todayStr;
                    });
;

const newDateLogic = 
                    const todayLogs = attendanceLogs.filter(l => {
                        const t = parseTime(l.timestamp) || parseTime(l.timeIn) || parseTime(l.date);
                        if (!t) return false;
                        const tDateStr = \\-\-\\;
                        return tDateStr === todayStr;
                    });
;

content = content.replace(oldDateLogic.trim(), newDateLogic.trim());

fs.writeFileSync(file, content, 'utf8');
