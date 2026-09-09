const fs = require('fs');
const file = 'c:/Users/rober/dualtech-ojt-portal/tsd-portal/src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

const logicTarget = `            // 2. LAZY FETCH: Only download attendance logs when a specific company is selected
            useEffect(() => {
                const fetchCompanyAttendance = async () => {
                    if (!selectedCompany) {
                        setAttendanceRecords([]);
                        return;
                    }

                    setLoadingLogs(true);
                    try {
                        const APP_ID = "dualtech-ojt-portal"; 
                        const traineesRef = db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('trainees');
                        
                        // Find trainees belonging to the selected company
                        const companyTrainees = allTrainees.filter(t => 
                            (t.company === selectedCompany || t.companyName === selectedCompany)
                        );

                        // Fetch subcollections ONLY for these specific trainees
                        const attendancePromises = companyTrainees.map(async (trainee) => {
                            const attSnapshot = await traineesRef.doc(trainee.id).collection('attendance').get();
                            return attSnapshot.docs.map(doc => ({
                                id: doc.id,
                                traineeId: trainee.id,
                                traineeName: \`\${trainee.firstName || ''} \${trainee.lastName || ''}\`.trim() || trainee.name || 'Unknown',
                                status: trainee.status || 'Unknown',
                                company: trainee.company || trainee.companyName || 'Unassigned',
                                ic: trainee.ic || trainee.coordinator || 'Unassigned',
                                ...doc.data()
                            }));
                        });

                        const allAttendanceArrays = await Promise.all(attendancePromises);
                        let fetchedAttendance = allAttendanceArrays.flat();
                        
                        fetchedAttendance.sort((a, b) => new Date(b.date) - new Date(a.date));
                        setAttendanceRecords(fetchedAttendance);
                        setLoadingLogs(false);

                    } catch (error) {
                        console.error("Error fetching company attendance:", error);
                        setLoadingLogs(false);
                    }
                };

                fetchCompanyAttendance();
            }, [selectedCompany, allTrainees]);`;

const logicNew = `            // 2. LAZY FETCH: Stream download attendance logs when a specific company is selected
            useEffect(() => {
                let isMounted = true;
                const fetchCompanyAttendance = async () => {
                    if (!selectedCompany) {
                        setAttendanceRecords([]);
                        setLoadingLogs(false);
                        return;
                    }

                    setLoadingLogs(true);
                    setAttendanceRecords([]);
                    try {
                        const APP_ID = "dualtech-ojt-portal"; 
                        const traineesRef = db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('trainees');
                        
                        const companyTrainees = allTrainees.filter(t => 
                            (t.company === selectedCompany || t.companyName === selectedCompany)
                        );

                        let currentFetched = [];

                        const attendancePromises = companyTrainees.map(async (trainee) => {
                            try {
                                const attSnapshot = await traineesRef.doc(trainee.id).collection('attendance').get();
                                const records = attSnapshot.docs.map(doc => ({
                                    id: doc.id,
                                    traineeId: trainee.id,
                                    traineeName: \`\${trainee.firstName || ''} \${trainee.lastName || ''}\`.trim() || trainee.name || 'Unknown',
                                    status: trainee.status || 'Unknown',
                                    company: trainee.company || trainee.companyName || 'Unassigned',
                                    ic: trainee.ic || trainee.coordinator || 'Unassigned',
                                    ...doc.data()
                                }));

                                if (isMounted && records.length > 0) {
                                    currentFetched = [...currentFetched, ...records];
                                    currentFetched.sort((a, b) => new Date(b.date) - new Date(a.date));
                                    setAttendanceRecords([...currentFetched]);
                                }
                            } catch (e) {
                                console.error("Error fetching attendance for trainee:", trainee.id, e);
                            }
                        });

                        await Promise.all(attendancePromises);
                        
                        if (isMounted) setLoadingLogs(false);

                    } catch (error) {
                        console.error("Error fetching company attendance:", error);
                        if (isMounted) setLoadingLogs(false);
                    }
                };

                fetchCompanyAttendance();
                return () => { isMounted = false; };
            }, [selectedCompany, allTrainees]);`;

const uiTarget = `                                <tbody>
                                    {loadingLogs ? (
                                        <tr><td colSpan="7" className="p-8 text-center text-emerald-600 font-bold">Fetching logs for {selectedCompany}...</td></tr>
                                    ) : !selectedCompany ? (
                                        <tr><td colSpan="7" className="p-8 text-center text-slate-400">Please select a company to view attendance records.</td></tr>
                                    ) : filteredRecords.length > 0 ? (
                                        filteredRecords.map(record => (
                                            <tr key={record.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                                <td className="p-3 md:p-4 font-semibold text-slate-800 text-sm">{record.traineeName}</td>
                                                <td className="p-3 md:p-4 text-xs font-bold text-slate-500">{record.status}</td>
                                                <td className="p-3 md:p-4 text-xs md:text-sm text-slate-600">{record.date}</td>
                                                <td className="p-3 md:p-4 text-xs md:text-sm font-mono text-slate-600">{record.timeIn || '--:--'}</td>
                                                <td className="p-3 md:p-4 text-xs md:text-sm font-mono text-slate-600">{record.timeOut || '--:--'}</td>
                                                <td className="p-4 text-center">
                                                    <span className={\`px-3 py-1 rounded-full text-xs font-black uppercase \${
                                                        record.status === 'Present' ? 'bg-emerald-100 text-emerald-700' :
                                                        record.status === 'Late' ? 'bg-amber-100 text-amber-700' :
                                                        record.status === 'Absent' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                                                    }\`}>{record.status || 'No Status'}</span>
                                                </td>
                                                <td className="p-4 text-sm text-slate-500 italic">{record.ic}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="7" className="p-8 text-center text-slate-400">No records found for this date.</td></tr>
                                    )}
                                </tbody>`;

const uiNew = `                                <tbody>
                                    {!selectedCompany ? (
                                        <tr><td colSpan="7" className="p-8 text-center text-slate-400">Please select a company to view attendance records.</td></tr>
                                    ) : loadingLogs && filteredRecords.length === 0 ? (
                                        <tr><td colSpan="7" className="p-8 text-center text-emerald-600 font-bold">Fetching logs for {selectedCompany}...</td></tr>
                                    ) : filteredRecords.length > 0 ? (
                                        <>
                                            {loadingLogs && (
                                                <tr><td colSpan="7" className="p-3 text-center bg-blue-50 text-blue-600 text-xs font-bold animate-pulse">Actively fetching records from the database... ({filteredRecords.length} loaded so far)</td></tr>
                                            )}
                                            {filteredRecords.slice(0, 50).map(record => (
                                                <tr key={record.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                                    <td className="p-3 md:p-4 font-semibold text-slate-800 text-sm">{record.traineeName}</td>
                                                    <td className="p-3 md:p-4 text-xs font-bold text-slate-500">{record.status}</td>
                                                    <td className="p-3 md:p-4 text-xs md:text-sm text-slate-600">{record.date}</td>
                                                    <td className="p-3 md:p-4 text-xs md:text-sm font-mono text-slate-600">{record.timeIn || '--:--'}</td>
                                                    <td className="p-3 md:p-4 text-xs md:text-sm font-mono text-slate-600">{record.timeOut || '--:--'}</td>
                                                    <td className="p-4 text-center">
                                                        <span className={\`px-3 py-1 rounded-full text-xs font-black uppercase \${
                                                            record.status === 'Present' ? 'bg-emerald-100 text-emerald-700' :
                                                            record.status === 'Late' ? 'bg-amber-100 text-amber-700' :
                                                            record.status === 'Absent' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                                                        }\`}>{record.status || 'No Status'}</span>
                                                    </td>
                                                    <td className="p-4 text-sm text-slate-500 italic">{record.ic}</td>
                                                </tr>
                                            ))}
                                            {filteredRecords.length > 50 && (
                                                <tr><td colSpan="7" className="p-4 text-center text-slate-500 font-medium bg-slate-50">Showing first 50 of {filteredRecords.length} records.</td></tr>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            {loadingLogs && (
                                                <tr><td colSpan="7" className="p-3 text-center bg-blue-50 text-blue-600 text-xs font-bold animate-pulse">Actively fetching records from the database...</td></tr>
                                            )}
                                            {!loadingLogs && (
                                                <tr><td colSpan="7" className="p-8 text-center text-slate-400">No records found for this date.</td></tr>
                                            )}
                                        </>
                                    )}
                                </tbody>`;

let modified = content;
const targets = [{old: logicTarget, new: logicNew, name: 'Logic'}, {old: uiTarget, new: uiNew, name: 'UI'}];

targets.forEach(t => {
    let replaced = modified.replace(t.old, t.new);
    if (replaced === modified) {
        replaced = modified.replace(t.old.replace(/\\n/g, '\\r\\n'), t.new);
    }
    if (replaced === modified) {
        console.log("Could not find string to replace for: " + t.name);
    } else {
        modified = replaced;
    }
});

fs.writeFileSync(file, modified);
console.log("Finished executing replacements.");
