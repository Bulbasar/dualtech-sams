const fs = require('fs');

const mentoringFile = 'c:\\Users\\rober\\dualtech-ojt-portal\\public\\mentoring.html';
const mentoringContent = fs.readFileSync(mentoringFile, 'utf8');

const schoolingFile = 'c:\\Users\\rober\\dualtech-ojt-portal\\public\\schooling.html';
const schoolingContent = fs.readFileSync(schoolingFile, 'utf8');

// The exact return statement of OnlineSchoolingSubmissionsTab in mentoring.html
const startStr = '            const allSelected = pendingIds.length > 0 && selectedRows.size === pendingIds.length;\\r\\n\\r\\n            return (\\r\\n                <div className="space-y-6 animate-in fade-in duration-300 flex flex-col h-full">';
// Wait, carriage returns might be different. Let's use substring manually using known unique strings.

const markerStart = "            const allSelected = pendingIds.length > 0 && selectedRows.size === pendingIds.length;";
const markerEnd = "        // --- SUBMITTED REQUESTS TAB ---";

let startIndex = mentoringContent.indexOf(markerStart);
let endIndex = mentoringContent.indexOf(markerEnd);

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find markers in mentoring.html");
    process.exit(1);
}

// Extract everything from return ( down to the end of the component
let tailBlock = mentoringContent.substring(startIndex + markerStart.length, endIndex);
// tailBlock looks like:
// \n\n            return (\n                <div ...\n            );\n        }\n

// We only want the inside of return ( ... );
const returnMatch = tailBlock.match(/return\s*\([\s\S]+?\);\s*\}$/);
if (!returnMatch) {
    // maybe there's no trailing whitespace
}
// Actually, we can just extract everything between `return (` and `);\n        }`
const returnStartStr = 'return (';
const returnEndStr = ');\r\n        }';
const returnEndStr2 = ');\n        }';

let rs = tailBlock.indexOf(returnStartStr);
let re = tailBlock.lastIndexOf(');');

if (rs === -1 || re === -1) {
    console.error("Could not find return block");
    process.exit(1);
}

let uiBody = tailBlock.substring(rs + returnStartStr.length, re);

console.log("Extracted uiBody length: " + uiBody.length);
if (uiBody.length < 1000) {
    console.error("uiBody is too small, extraction failed!");
    process.exit(1);
}

// Recreate the function but with schooling.html's optimized fetch logic and constraints
const newOnlineSubmissionsTab = `        // --- ONLINE SUBMISSIONS TAB ---
        function OnlineSubmissionsTab({ user }) {
            const [submissions, setSubmissions] = useState([]);
            const [loading, setLoading] = useState(true);
            const [selectedSub, setSelectedSub] = useState(null);
            const [feedback, setFeedback] = useState('');
            const [isUpdating, setIsUpdating] = useState(false);
            
            const [trainees, setTrainees] = useState([]);
            const [venues, setVenues] = useState([]);

            useEffect(() => {
                Promise.all([
                    getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'trainees')),
                    getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'venues'))
                ]).then(([tSnap, vSnap]) => {
                    const tData = tSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                    const vData = vSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                    setTrainees(tData);
                    setVenues(vData);
                });
            }, []);

            // Pagination & Selection
            const [queryLimit, setQueryLimit] = useState(50);
            const [selectedRows, setSelectedRows] = useState(new Set());

            // Filters & Search
            const [filterStatus, setFilterStatus] = useState('Pending Verification');
            const [searchQuery, setSearchQuery] = useState('');

            const fetchSubmissions = async () => {
                if (!user.assignedVenues || user.assignedVenues.length === 0 || trainees.length === 0 || venues.length === 0) {
                    setLoading(false);
                    return;
                }
                setLoading(true);
                try {
                    const q = query(
                        collection(db, 'artifacts', appId, 'public', 'data', 'mentoring_attendance'),
                        where('activityType', '==', 'Online Schooling'),
                        orderBy('timestamp', 'desc'),
                        limit(queryLimit)
                    );
                    const snap = await getDocs(q);
                    let allSubs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    
                    // Filter submissions by matching trainee's venue with user's assigned venues
                    let filtered = [];
                    allSubs.forEach(sub => {
                        const trainee = trainees.find(t => (t.studentId === sub.studentId || t['Student ID#'] === sub.studentId));
                        if (trainee && trainee.assignedVenue && user.assignedVenues.includes(trainee.assignedVenue)) {
                            filtered.push(sub);
                        }
                    });
                    
                    setSubmissions(filtered);
                } catch(e) { console.error(e); }
                setLoading(false);
            };

            // Call fetchSubmissions manually on mount or when limit/dependencies change
            useEffect(() => {
                if (trainees.length > 0 && venues.length > 0) {
                    fetchSubmissions();
                }
            }, [queryLimit, trainees, venues, user]);

            // Apply filters and dynamic search
            const filteredSubmissions = submissions.filter(sub => {
                const matchesStatus = filterStatus === 'All' ? true : sub.status === filterStatus;
                const queryStr = searchQuery.toLowerCase();
                const matchesSearch = queryStr === '' ||
                    (sub.traineeName || '').toLowerCase().includes(queryStr) ||
                    (sub.studentId || '').toLowerCase().includes(queryStr) ||
                    (sub.company || '').toLowerCase().includes(queryStr);

                return matchesStatus && matchesSearch;
            });

            const groupedSubmissions = useMemo(() => {
                const groups = {};
                filteredSubmissions.forEach(sub => {
                    const trainee = trainees.find(t => (t.studentId === sub.studentId || t['Student ID#'] === sub.studentId));
                    let venueId = trainee?.assignedVenue || 'Unassigned';
                    
                    if (!groups[venueId]) {
                        const vObj = venues.find(v => v.id === venueId);
                        groups[venueId] = {
                            venueId,
                            venueName: vObj ? vObj.name : (venueId === 'online' ? 'Online' : venueId),
                            subs: []
                        };
                    }
                    groups[venueId].subs.push(sub);
                });
                return Object.values(groups).sort((a,b) => a.venueName.localeCompare(b.venueName));
            }, [filteredSubmissions, trainees, venues]);

            const [deadlineDays, setDeadlineDays] = useState('');

            const handleValidate = async (statusToSet) => {
                if (!selectedSub) return;
                if (statusToSet === 'Rejected' && !feedback.trim()) {
                    return alert("Please provide a reason for rejecting this submission.");
                }

                setIsUpdating(true);
                try {
                    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'mentoring_attendance', selectedSub.id);
                    await updateDoc(docRef, {
                        status: statusToSet,
                        feedback: feedback,
                        verifiedByMentor: user.name || auth.currentUser?.email || 'Admin',
                        updatedAt: new Date().getTime()
                    });

                    if (statusToSet === 'Rejected') {
                        // Look up the trainee to send a notification message
                        const qTrainee = query(collection(db, 'artifacts', appId, 'public', 'data', 'trainees'), where('studentId', '==', selectedSub.studentId));
                        const traineeSnap = await getDocs(qTrainee);
                        
                        let traineeUid = selectedSub.studentId; // fallback
                        if (!traineeSnap.empty) {
                            const tData = traineeSnap.docs[0].data();
                            traineeUid = tData.userId || traineeSnap.docs[0].id;
                        }
                        
                        let deadlineText = "";
                        if (deadlineDays) {
                            deadlineText = \` You must resubmit within \${deadlineDays} days.\`;
                        }

                        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), {
                            senderId: 'Schooling Admin',
                            senderName: user.name || 'Schooling Admin',
                            senderRole: 'admin',
                            receiverId: traineeUid,
                            receiverName: selectedSub.traineeName,
                            receiverRole: 'trainee',
                            text: \`[SYSTEM] Your Online Schooling submission has been Rejected.\\n\\nReason: \${feedback}.\${deadlineText}\`,
                            timestamp: serverTimestamp(),
                            createdAtMs: Date.now(),
                            viewed: false
                        });
                    }

                    alert(\`Submission successfully marked as \${statusToSet}!\`);
                    setSelectedSub(null);
                    setFeedback('');
                    setDeadlineDays('');
                    
                    fetchSubmissions(); // refresh the view
                } catch (err) {
                    alert('Error updating status: ' + err.message);
                }
                setIsUpdating(false);
            };

            const handleBulkValidate = async () => {
                if (selectedRows.size === 0) return;
                if (!window.confirm(\`Are you sure you want to validate \${selectedRows.size} submissions?\`)) return;
                
                setIsUpdating(true);
                try {
                    const batch = writeBatch(db);
                    selectedRows.forEach(id => {
                        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'mentoring_attendance', id);
                        batch.update(docRef, {
                            status: 'Verified',
                            verifiedByMentor: user.name || auth.currentUser?.email || 'Admin',
                            updatedAt: new Date().getTime()
                        });
                    });
                    await batch.commit();
                    setSelectedRows(new Set());
                    
                    fetchSubmissions(); // refresh the view
                } catch (err) {
                    alert('Error bulk updating: ' + err.message);
                }
                setIsUpdating(false);
            };

            const toggleRow = (id) => {
                const newSet = new Set(selectedRows);
                if (newSet.has(id)) newSet.delete(id);
                else newSet.add(id);
                setSelectedRows(newSet);
            };

            const toggleAll = () => {
                const pendingIds = filteredSubmissions.filter(s => s.status === 'Pending Verification').map(s => s.id);
                if (selectedRows.size === pendingIds.length && pendingIds.length > 0) {
                    setSelectedRows(new Set());
                } else {
                    setSelectedRows(new Set(pendingIds));
                }
            };

            const handleDelete = async (id) => {
                if (window.confirm('Are you sure you want to permanently delete this submission record?')) {
                    try {
                        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'mentoring_attendance', id));
                        fetchSubmissions(); // refresh
                    } catch (err) {
                        alert('Error deleting record: ' + err.message);
                    }
                }
            };

            const openModal = (sub) => {
                setSelectedSub(sub);
                setFeedback(sub.feedback || '');
            };

            const getDriveThumb = (url) => {
                if (!url) return null;
                let match = url.match(/id=([a-zA-Z0-9_-]+)/) || url.match(/\\/d\\/([a-zA-Z0-9_-]+)/);
                return match ? \`https://drive.google.com/thumbnail?id=\${match[1]}&sz=w64\` : null;
            };

            const pendingIds = filteredSubmissions.filter(s => s.status === 'Pending Verification').map(s => s.id);
            const allSelected = pendingIds.length > 0 && selectedRows.size === pendingIds.length;

            return (
                ${uiBody}
            );
        }
`;

// Replace in schooling.html
const schoolingRegex = /\/\/ --- ONLINE SUBMISSIONS TAB ---[\s\S]*?function OnlineSubmissionsTab\(\{\s*user\s*\}\)\s*\{[\s\S]*?return\s*\([\s\S]*?\);\s*\}/;
const m = schoolingContent.match(schoolingRegex);
if (!m) {
    console.error("Could not find old OnlineSubmissionsTab in schooling.html");
} else {
    // Actually, wait, the previous copy script matched `return ( ... ); }` which matched prematurely in schooling.html!
    // I need to use replace with the exact string range from schooling.html!
}

let schoolingMarkerStart = "// --- ONLINE SUBMISSIONS TAB ---";
let schoolingMarkerEnd = "// --- LOGS TAB ---";

let sStart = schoolingContent.indexOf(schoolingMarkerStart);
let sEnd = schoolingContent.indexOf(schoolingMarkerEnd);

if (sStart !== -1 && sEnd !== -1) {
    let before = schoolingContent.substring(0, sStart);
    let after = schoolingContent.substring(sEnd);
    let finalContent = before + newOnlineSubmissionsTab + "\n\n        " + after;
    fs.writeFileSync(schoolingFile, finalContent);
    console.log("Successfully patched schooling.html! New length: " + finalContent.length);
} else {
    console.error("Could not find markers in schooling.html");
}
