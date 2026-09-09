const fs = require('fs');
const file = 'c:\\Users\\rober\\dualtech-ojt-portal\\public\\schooling.html';
let content = fs.readFileSync(file, 'utf8');

// Replace nested onSnapshot in AttendanceHistoryTab (which somehow survived the first pass)
content = content.replace(
  /            \/\/ Fetch assigned venues[\s\S]*?}, \[user\.email\]\);[\s\S]*?\/\/ Fetch records for the selected date[\s\S]*?}, \[selectedDate\]\);/g,
  `            const [historyLoading, setHistoryLoading] = useState(false);

            // Fetch assigned venues (one-time)
            useEffect(() => {
                const fetchVenues = async () => {
                    const mentorsQuery = query(collection(db, 'artifacts', appId, 'public', 'data', 'mentors'), where('email', '==', user.email));
                    const mentorSnap = await getDocs(mentorsQuery);
                    if (!mentorSnap.empty) {
                        const assignedVenueIds = mentorSnap.docs[0].data().assignedVenues || [];
                        const venuesSnap = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'venues'));
                        const allVenues = venuesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                        const allowed = allVenues.filter(v => assignedVenueIds.includes(v.id));
                        setMyVenues(allowed);
                    }
                };
                fetchVenues();
            }, [user.email]);

            // Fetch records for the selected date (one-time per date change)
            const fetchHistory = async () => {
                setHistoryLoading(true);
                try {
                    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'mentoring_attendance'), where('date', '==', selectedDate));
                    const snapshot = await getDocs(q);
                    let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setRecords(data);
                } catch (err) { console.error('Error fetching history:', err); }
                setHistoryLoading(false);
            };
            useEffect(() => { fetchHistory(); }, [selectedDate]);`
);


// Replace nested onSnapshot in ClockInTab
content = content.replace(
  /            \/\/ Fetch assigned venues[\s\S]*?const mentorsQuery = query\([\s\S]*?collection\(db, 'artifacts', appId, 'public', 'data', 'mentors'\),[\s\S]*?where\('email', '==', user\.email\)[\s\S]*?\);[\s\S]*?let unsubVenues = \(\) => {};[\s\S]*?const unsubMentor = onSnapshot\(mentorsQuery, \(mentorSnap\) => {[\s\S]*?unsubVenues\(\); \/\/ Clean up previous listener to prevent memory leak \/ quota exhaustion[\s\S]*?if \(!mentorSnap\.empty\) {[\s\S]*?const assignedVenueIds = mentorSnap\.docs\[0\]\.data\(\)\.assignedVenues \|\| \[\];[\s\S]*?unsubVenues = onSnapshot\(collection\(db, 'artifacts', appId, 'public', 'data', 'venues'\), \(venuesSnap\) => {[\s\S]*?const allVenues = venuesSnap\.docs\.map\(d => \(\{ id: d\.id, \.\.\.d\.data\(\) \}\)\);[\s\S]*?const allowed = allVenues\.filter\(v => assignedVenueIds\.includes\(v\.id\)\);[\s\S]*?setMyVenues\(allowed\);[\s\S]*?}\);[\s\S]*?}[\s\S]*?}\);[\s\S]*?return \(\) => { unsubMentor\(\); unsubVenues\(\); };[\s\S]*?}, \[user\.email\]\);/g,
  `            // Fetch assigned venues (one-time)
            useEffect(() => {
                const fetchVenues = async () => {
                    const mentorsQuery = query(collection(db, 'artifacts', appId, 'public', 'data', 'mentors'), where('email', '==', user.email));
                    const mentorSnap = await getDocs(mentorsQuery);
                    if (!mentorSnap.empty) {
                        const assignedVenueIds = mentorSnap.docs[0].data().assignedVenues || [];
                        const venuesSnap = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'venues'));
                        const allVenues = venuesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                        const allowed = allVenues.filter(v => assignedVenueIds.includes(v.id));
                        setMyVenues(allowed);
                    }
                };
                fetchVenues();
            }, [user.email]);`
);


fs.writeFileSync(file, content);
console.log('Pass 2 optimization complete!');
console.log('New file size:', content.length, 'bytes');
