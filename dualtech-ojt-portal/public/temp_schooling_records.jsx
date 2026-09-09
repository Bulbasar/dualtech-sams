function SchoolingRecordsTab({ profiles, attendance }) {
            const [allTrainees, setAllTrainees] = useState([]);
            const [loadingTrainees, setLoadingTrainees] = useState(true);
            const [errorMsg, setErrorMsg] = useState('');
            const [searchQuery, setSearchQuery] = useState('');
            const [activeCategory, setActiveCategory] = useState('All');
            const [selectedRows, setSelectedRows] = useState(new Set());
            const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

            // --- Approved Schooling Credit Applications ---
            const [approvedCreditApps, setApprovedCreditApps] = useState([]);
            
            // --- Calendar Schedules ---
            const [allSchedules, setAllSchedules] = useState([]);

            useEffect(() => {
                const q = query(
                    collection(db, 'artifacts', appId, 'public', 'data', 'schooling_credit_applications'),
                    where('status', '==', 'Approved')
                );
                const unsub = onSnapshot(q, snap => {
                    setApprovedCreditApps(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                });
                
                const qSchedules = query(collection(db, 'artifacts', appId, 'public', 'data', 'schooling_calendar'));
                const unsubSchedules = onSnapshot(qSchedules, snap => {
                    setAllSchedules(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                });
                
                return () => { unsub(); unsubSchedules(); };
            }, []);

            // Modal States
            const [selectedProfile, setSelectedProfile] = useState(null);
            const [modalData, setModalData] = useState(null);
            const [loadingModal, setLoadingModal] = useState(false);

            const safeFormatTime = (val) => {
                if (!val) return '--';
                let d = val;
                if (val.toMillis) d = val.toMillis();
                else if (val.seconds) d = val.seconds * 1000;
                const dateObj = new Date(d);
                if (isNaN(dateObj.getTime())) return typeof val === 'string' ? val : '--';
                return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            };

            const safeFormatDate = (val) => {
                if (!val) return '--';
                let d = val;
                if (val.toMillis) d = val.toMillis();
                else if (val.seconds) d = val.seconds * 1000;
                const dateObj = new Date(d);
                if (isNaN(dateObj.getTime())) return '--';
                return dateObj.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
            };

            const attendanceWeeks = useMemo(() => {
                if (!selectedProfile || !selectedProfile.rawTrainee) return { missing: [], multiple: [] };
                const trainee = selectedProfile.rawTrainee;
                const startDateStr = trainee['IPT Date Start'] || trainee.iptDateStart || trainee.startDate || '';
                if (!startDateStr) return { missing: [], multiple: [] };
                
                const start = new Date(startDateStr);
                if (isNaN(start.getTime())) return { missing: [], multiple: [] };
                
                const stat = String(trainee.Status || trainee.status || trainee.studentStatus || 'Unknown').trim().toLowerCase();
                const endDateStr = trainee['IPT Date End'] || trainee.iptDateEnd || trainee.endDate || '';
                let endCalc = new Date();
                if (stat.includes('complete') && endDateStr) {
                    const parsedEnd = new Date(endDateStr);
                    if (!isNaN(parsedEnd.getTime())) endCalc = parsedEnd;
                }
                
                const totalWeeks = Math.floor((endCalc - start) / (1000 * 60 * 60 * 24 * 7));
                const missing = [];
                const multiple = [];
                const traineeVenue = trainee.schoolingHub || trainee.hub || trainee.venue || trainee['Company Name'] || trainee.company || trainee.Company || '';
                
                for (let w = 1; w <= totalWeeks; w++) {
                    const weekStart = new Date(start.getTime() + (w - 1) * 7 * 24 * 60 * 60 * 1000);
                    const weekEnd = new Date(start.getTime() + w * 7 * 24 * 60 * 60 * 1000);
                    
                    let logCount = 0;
                    selectedProfile.rawLogs.forEach(l => {
                        let logDate;
                        if (l.timestamp) {
                            if (l.timestamp.toMillis) logDate = new Date(l.timestamp.toMillis());
                            else if (l.timestamp.seconds) logDate = new Date(l.timestamp.seconds * 1000);
                            else logDate = new Date(l.timestamp);
                        } else if (l.date) {
                            logDate = new Date(l.date);
                        }
                        if (logDate && !isNaN(logDate.getTime())) {
                            if (logDate >= weekStart && logDate < weekEnd) {
                                logCount++;
                            }
                        }
                    });
                    
                    if (logCount === 0) {
                        const weekStartISO = weekStart.toISOString().split('T')[0];
                        const weekEndISO = weekEnd.toISOString().split('T')[0];
                        
                        let isExempted = false;
                        if (traineeVenue) {
                            const relevantSchedules = allSchedules.filter(sch => 
                                (sch.viewableFrom <= weekEndISO && sch.viewableUntil >= weekStartISO) || 
                                (sch.meetingDates && sch.meetingDates.some(d => d >= weekStartISO && d <= weekEndISO))
                            );
                            if (relevantSchedules.some(sch => sch.exemptedVenues && sch.exemptedVenues.includes(traineeVenue))) {
                                isExempted = true;
                            }
                        }
                        
                        if (!isExempted) {
                            missing.push({
                                weekNumber: w,
                                startStr: weekStart.toLocaleDateString(),
                                endStr: weekEnd.toLocaleDateString()
                            });
                        }
                    } else if (logCount >= 2) {
                        multiple.push({
                            weekNumber: w,
                            startStr: weekStart.toLocaleDateString(),
                            endStr: weekEnd.toLocaleDateString(),
                            count: logCount
                        });
                    }
                }
                return { missing, multiple };
            }, [selectedProfile, allSchedules]);

            // Phase 1: Load Trainees
            useEffect(() => {
                const fetchTrainees = async () => {
                    if (globalSchoolingTraineesCache) {
                        setAllTrainees(globalSchoolingTraineesCache);
                        setLoadingTrainees(false);
                        return;
                    }

                    if (globalSchoolingTraineesPromise) {
                        setLoadingTrainees(true);
                        const data = await globalSchoolingTraineesPromise;
                        setAllTrainees(data);
                        setLoadingTrainees(false);
                        return;
                    }

                    setLoadingTrainees(true);
                    setErrorMsg('');
                    try {
                        const traineesRef = collection(db, 'artifacts', appId, 'public', 'data', 'trainees');
                        globalSchoolingTraineesPromise = getDocs(traineesRef);
                        const traineesSnap = await globalSchoolingTraineesPromise;
                        const rawTrainees = traineesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                        const processedTraineesBase = rawTrainees.map(trainee => {
                            const stat = String(trainee.Status || trainee.status || trainee.studentStatus || 'Unknown').trim().toLowerCase();
                            const startDateStr = trainee['IPT Date Start'] || trainee.iptDateStart || trainee.startDate || '';
                            const endDateStr = trainee['IPT Date End'] || trainee.iptDateEnd || trainee.endDate || '';
                            
                            let iptWTD = 0;
                            if (startDateStr) {
                                const start = new Date(startDateStr);
                                let endCalc = new Date();
                                if (stat.includes('complete') && endDateStr) {
                                    const parsedEnd = new Date(endDateStr);
                                    if (!isNaN(parsedEnd.getTime())) {
                                        endCalc = parsedEnd;
                                    }
                                }
                                if (!isNaN(start.getTime()) && start < endCalc) {
                                    iptWTD = Math.floor((endCalc - start) / (1000 * 60 * 60 * 24 * 7));
                                }
                            }
                            return { ...trainee, calculatedIptWTD: iptWTD, normalizedStatus: stat };
                        });
                        globalSchoolingTraineesCache = processedTraineesBase;
                        setAllTrainees(processedTraineesBase);
                    } catch (err) {
                        console.error("Fetch Error:", err);
                        setErrorMsg(`Failed fetching trainees: ${err.message}`);
                    }
                    setLoadingTrainees(false);
                    globalSchoolingTraineesPromise = null;
                };
                fetchTrainees();
            }, []);

            // Process Data with Attendance & Profiles
            const processedData = useMemo(() => {
                if (!allTrainees.length) return [];
                
                // Pre-group attendance by studentId for O(1) lookup
                const attendanceByStudent = {};
                attendance.forEach(l => {
                    const id1 = String(l.studentId || '').trim();
                    const id2 = String(l.traineeUid || '').trim();
                    if (id1) {
                        if (!attendanceByStudent[id1]) attendanceByStudent[id1] = [];
                        attendanceByStudent[id1].push(l);
                    }
                    if (id2 && id2 !== id1) {
                        if (!attendanceByStudent[id2]) attendanceByStudent[id2] = [];
                        attendanceByStudent[id2].push(l);
                    }
                });

                // Helper to get meeting credits
                const getMeetingCredits = (h) => {
                    const locationText = `${h.hub || ''} ${h.venue || ''} ${h.rawSheetData?.['Schooling / Mentoring Hub'] || ''}`;
                    const combinedText = `${h.activityType || ''} ${h.type || ''} ${h.topic || ''} ${h.rawSheetData?.['Topic'] || ''} ${locationText}`.toUpperCase();
                    if (combinedText.includes('RETREAT')) return 4;
                    if (combinedText.includes('PDS9') || combinedText.includes('PDS 9') || 
                        combinedText.includes('PDS18') || combinedText.includes('PDS 18')) return 2;
                    return 1; 
                };

                return allTrainees.map(trainee => {
                    const sId = String(trainee['Student ID#'] || trainee.