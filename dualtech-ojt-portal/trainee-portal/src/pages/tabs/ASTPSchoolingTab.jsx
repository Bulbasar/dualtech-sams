import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Camera, MapPin, UploadCloud, AlertTriangle, ShieldCheck, CheckCircle2, Copy, Link, History, Search, ArrowUpDown, ChevronDown, Check, Columns, FileText, Loader2, PlayCircle, PlusCircle, StopCircle, RefreshCw, Smartphone, QrCode , AlertCircle, Archive, Award, BookOpen, ClipboardList, List, Lock, X} from 'lucide-react';
import jsQR from 'jsqr';
import { Html5QrcodeScanner } from 'html5-qrcode';

import { QRCodeSVG } from 'qrcode.react';
import { collection, doc, query, where, getDocs, getDoc, onSnapshot, orderBy, setDoc, addDoc, updateDoc, serverTimestamp , or} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

const compressImage = (file, maxWidth = 1000) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                resolve(dataUrl);
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
};

export default function ASTPSchoolingTab({ user, profile, masterStatus, isActive, db, storage, appId, refreshTrigger, onRefresh }) {
              
            const [scannedData, setScannedData] = useState(null);
            const [scanError, setScanError] = useState("");
            const [loadingLoc, setLoadingLoc] = useState(false);
            const [submitting, setSubmitting] = useState(false);
            const [previewLoc, setPreviewLoc] = useState(null);
            const scannerRef = useRef(null);
            const [history, setHistory] = useState([]);

            // --- State for Trainee QR Generation ---
            const [showTraineeQR, setShowTraineeQR] = useState(false);
            const [traineeQRData, setTraineeQRData] = useState(null);
            const [generatingQR, setGeneratingQR] = useState(false);
            const [qrGenError, setQrGenError] = useState("");
            const [drEntryDriveUrl, setDrEntryDriveUrl] = useState("");
            // --------------------------------------------

            // --- NEW: Online Schooling States ---
            const [traineeRecord, setTraineeRecord] = useState(null);
            const traineeRecordRef = useRef(null);
            const [allSchedules, setAllSchedules] = useState([]);
            const [activeSchedules, setActiveSchedules] = useState([]);

            const [onlineForm, setOnlineForm] = useState({
                vflTopic: '',
                lsceTopic: '',
                notes: ''
            });
            const [vflFile, setVflFile] = useState(null);
            const [lsceFile, setLsceFile] = useState(null);
            const [drEntryFile, setDrEntryFile] = useState(null); // Added state for DR Entry
            const [submittingOnline, setSubmittingOnline] = useState(false);
            const [venues, setVenues] = useState([]);

            // --- NEW: Disputes States ---
            const [disputes, setDisputes] = useState([]);
            const [showDisputeModal, setShowDisputeModal] = useState(false);
            const [disputeWeek, setDisputeWeek] = useState(null);
            const [disputeReason, setDisputeReason] = useState("");
            const [disputeFile, setDisputeFile] = useState(null);
            const [disputeDate, setDisputeDate] = useState("");
            const [submittingDispute, setSubmittingDispute] = useState(false);

            // --- NEW: Schooling History Modal States ---
            const [showHistoryModal, setShowHistoryModal] = useState(false);
            const [sortConfig, setSortConfig] = useState({ key: 'weekNumber', direction: 'asc' });
            const [selectedWeekFilter, setSelectedWeekFilter] = useState("All");
            const [visibleColumns, setVisibleColumns] = useState({
                weekNumber: true,
                datePresent: true,
                venue: true,
                room: true,
                lsceTopic: true,
                vflTopic: true,
                validatedBy: true,
                remarks: true
            });
            const [showColumnDropdown, setShowColumnDropdown] = useState(false);

            // --- NEW: Extended Schooling States ---
            const [extendedReq, setExtendedReq] = useState(null);
            const [loadingExtReq, setLoadingExtReq] = useState(true);
            const [requestingExt, setRequestingExt] = useState(false);

            // --- NEW: Schooling Credit Application States ---
            const [showCreditForm, setShowCreditForm] = useState(false);
            const [creditType, setCreditType] = useState('');
            const [creditDate, setCreditDate] = useState('');
            const [creditFile, setCreditFile] = useState(null);
            const [creditDays, setCreditDays] = useState(1);
            const [submittingCredit, setSubmittingCredit] = useState(false);
            const [creditApplications, setCreditApplications] = useState([]);

            const CREDIT_TYPE_OPTIONS = [
                { label: 'EIM NC II', value: 'EIM NC II', credits: 2 },
                { label: 'Retreat', value: 'Retreat', credits: 4 },
                { label: 'PDS 9', value: 'PDS 9', credits: 2 },
                { label: 'PDS 18', value: 'PDS 18', credits: 2 },
                { label: 'Wadhwani Completion', value: 'Wadhwani Completion', credits: 3 },
                { label: 'Final Grade 85–89 (+1 Credit, Total: 4)', value: 'Final Grade 85-89', credits: 4 },
                { label: 'Final Grade 90–100 (+2 Credits, Total: 5)', value: 'Final Grade 90-100', credits: 5 },
                { label: 'Special Seminars (1 Credit per day)', value: 'Special Seminars', credits: 1 }
            ];

            // Filter out credit types that already have Approved or Pending applications
            const availableCreditTypes = useMemo(() => {
                const usedTypes = new Set(
                    creditApplications
                        .filter(app => app.status === 'Approved' || app.status === 'Pending')
                        .map(app => app.creditType)
                );
                return CREDIT_TYPE_OPTIONS.filter(opt =>
                    opt.value === 'Special Seminars' || !usedTypes.has(opt.value)
                );
            }, [creditApplications]);

            const getCreditsForType = (type, days = 1) => {
                const opt = CREDIT_TYPE_OPTIONS.find(o => o.value === type);
                if (!opt) return 0;
                if (type === 'Special Seminars') return days * 1;
                return opt.credits;
            };

            // --- HELPER FUNCTIONS FOR SCHOOLING TAB ---
            const getDistanceFromLatLonInM = (lat1, lon1, lat2, lon2) => {
                const R = 6371e3;
                const p1 = lat1 * Math.PI / 180;
                const p2 = lat2 * Math.PI / 180;
                const dp = (lat2 - lat1) * Math.PI / 180;
                const dl = (lon2 - lon1) * Math.PI / 180;
                const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                return R * c;
            };

            const getLocalYYYYMMDD = (date) => {
                const d = new Date(date);
                d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                return d.toISOString().split('T')[0];
            };

            // --- Extended Schooling Request Logic ---
            useEffect(() => {
                if (!user?.uid) {
                    setLoadingExtReq(false);
                    return;
                }
                const fetchExtendedReq = async () => {
                    const q = query(
                        collection(db, 'artifacts', appId, 'public', 'data', 'extended_schooling_requests'),
                        where('userId', '==', user.uid)
                    );
                    const snap = await getDocs(q);
                    if (!snap.empty) {
                        const reqData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                        reqData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                        setExtendedReq(reqData[0]);
                    } else {
                        setExtendedReq(null);
                    }
                    setLoadingExtReq(false);
                };
                fetchExtendedReq();
            }, [user?.uid, refreshTrigger]);

            const handleRequestExtendedSchooling = async () => {
                try {
                    setRequestingExt(true);
                    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'extended_schooling_requests'), {
                        userId: user.uid,
                        studentId: profile.studentId || profile["Student ID#"],
                        studentName: `${profile.given} ${profile.family}`.trim(),
                        companyName: profile.companyName || profile.company || "Unassigned",
                        status: 'Pending',
                        timestamp: new Date().toISOString()
                    });
                    alert("success" + ": " + "Extended Schooling Request submitted successfully.");
                } catch (error) {
                    console.error("Error requesting extended schooling:", error);
                    alert("error" + ": " + "Failed to submit request.");
                } finally {
                    setRequestingExt(false);
                }
            };
            // ----------------------------------------

            // --- NEW: Schooling Credit Application Logic ---
            useEffect(() => {
                const currentStudentId = profile.studentId || profile["Student ID#"];
                if (!currentStudentId) return;
                const fetchCreditApps = async () => {
                    const q = query(
                        collection(db, 'artifacts', appId, 'public', 'data', 'schooling_credit_applications'),
                        where('studentId', '==', currentStudentId)
                    );
                    const snap = await getDocs(q);
                    const apps = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    apps.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
                    setCreditApplications(apps);
                };
                fetchCreditApps();
            }, [profile.studentId, profile["Student ID#"], refreshTrigger]);

            const handleSubmitSchoolingCredit = async (e) => {
                e.preventDefault();
                if (!creditType) return alert("Please select a credit type.");
                if (!creditDate) return alert("Please select the date completed.");
                if (!creditFile) return alert("Please upload a screenshot or photo.");

                setSubmittingCredit(true);
                try {
                    const creditsRequested = getCreditsForType(creditType, creditDays);

                    // Compress and convert image to base64
                    const compressed = await compressImage(creditFile);
                    const dataUrl = await fileToBase64(compressed);
                    const base64 = dataUrl.split(',')[1];

                    // Send to Google Apps Script for Drive upload & Sheet logging
                    const SCHOOLING_CREDIT_GAS_URL = "https://script.google.com/macros/s/AKfycbwbwWRdZfQbZPa4_K7grVDunbZRwYlfIYk_MvPPyNDtlTlbiAhu7z-AB8jXdaMbHzST/exec";
                    let attachmentUrl = "";
                    try {
                        const gasResponse = await fetch(SCHOOLING_CREDIT_GAS_URL, {
                            method: "POST",
                            body: JSON.stringify({
                                action: "submitSchoolingCredit",
                                studentId: profile.studentId || profile["Student ID#"] || "",
                                studentName: `${profile.given} ${profile.family}`.trim(),
                                companyName: profile.companyName || profile.company || "Unassigned",
                                creditType: creditType,
                                creditsRequested: creditsRequested,
                                dateCompleted: creditDate,
                                file: {
                                    fileName: `${profile.studentId || user.uid}_${Date.now()}_${creditType.replace(/\s+/g, '_')}.jpg`,
                                    fileBase64: base64,
                                    mimeType: "image/jpeg"
                                }
                            })
                        });
                        const gasResult = await gasResponse.json();
                        if (gasResult.success) {
                            attachmentUrl = gasResult.attachmentUrl || "";
                        }
                    } catch (gasError) {
                        console.warn("GAS webhook failed, continuing with Firestore save:", gasError);
                    }

                    // Save to Firestore
                    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'schooling_credit_applications'), {
                        userId: user.uid,
                        studentId: profile.studentId || profile["Student ID#"] || "",
                        studentName: `${profile.given} ${profile.family}`.trim(),
                        companyName: profile.companyName || profile.company || "Unassigned",
                        creditType: creditType,
                        creditsRequested: creditsRequested,
                        dateCompleted: creditDate,
                        attachmentUrl: attachmentUrl,
                        status: 'Pending',
                        submittedAt: new Date().toISOString()
                    });

                    alert("success" + ": " + "Schooling Credit Application submitted successfully!");
                    // Reset form
                    setCreditType('');
                    setCreditDate('');
                    setCreditFile(null);
                    setCreditDays(1);
                    setShowCreditForm(false);
                } catch (error) {
                    console.error("Credit application error:", error);
                    alert("Failed to submit application: " + error.message);
                }
                setSubmittingCredit(false);
            };
            // ----------------------------------------

            // 1. Fetch Trainee Record to check assigned venue[cite: 3, 4]
            useEffect(() => {
                const targetStudentId = profile.studentId || profile["Student ID#"];
                if (!targetStudentId) return;

                const fetchTraineeRecord = async () => {
                    const q = query(
                        collection(db, 'artifacts', appId, 'public', 'data', 'trainees'),
                        or(
                            where('studentId', '==', targetStudentId),
                            where('Student ID#', '==', targetStudentId)
                        )
                    );
                    const snap = await getDocs(q);
                    if (!snap.empty) {
                        setTraineeRecord({ id: snap.docs[0].id, ...snap.docs[0].data() });
                    }
                };
                fetchTraineeRecord();
            }, [profile.studentId, profile["Student ID#"], refreshTrigger]);

            useEffect(() => {
                traineeRecordRef.current = traineeRecord;
            }, [traineeRecord]);

            useEffect(() => {
                const fetchVenues = async () => {
                    const snap = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'venues'));
                    setVenues(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                };
                fetchVenues();
            }, [refreshTrigger]);

            // Fetch Disputes for this Trainee
            useEffect(() => {
                if (!user?.uid) return;
                const fetchDisputes = async () => {
                    const q = query(
                        collection(db, 'artifacts', appId, 'public', 'data', 'schooling_disputes'),
                        where('traineeUid', '==', user.uid)
                    );
                    const snap = await getDocs(q);
                    setDisputes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                };
                fetchDisputes();
            }, [user?.uid, refreshTrigger]);

            // 2. Fetch Active Schedules from 'schooling_calendar' based on viewable dates[cite: 3, 4]
            useEffect(() => {
                const fetchCalendar = async () => {
                    const todayStr = getLocalYYYYMMDD(new Date());
                    // OPTIMIZED: Only fetch currently active or future events
                    const q = query(
                        collection(db, 'artifacts', appId, 'public', 'data', 'schooling_calendar'),
                        where('viewableUntil', '>=', todayStr)
                    );
                    const snap = await getDocs(q);
                    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    
                    setAllSchedules(docs);
                    
                    const active = docs.filter(act => act.activityType === 'Schooling' && act.viewableFrom <= todayStr && act.viewableUntil >= todayStr);
                    setActiveSchedules(active);
                };
                fetchCalendar();
            }, [refreshTrigger]);

            // 3. Fetch records from mentoring_attendance using Student ID[cite: 3, 4]
            useEffect(() => {
                const currentStudentId = profile.studentId || profile["Student ID#"];
                if (!currentStudentId) return;
                const fetchAttendance = async () => {
                    const q = query(
                        collection(db, 'artifacts', appId, 'public', 'data', 'mentoring_attendance'),
                        where('studentId', '==', currentStudentId)
                    );
                    const snap = await getDocs(q);
                    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));

                    data.sort((a, b) => {
                        let timeA = 0; let timeB = 0;
                        if (a.timestamp) timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : a.timestamp;
                        if (b.timestamp) timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : b.timestamp;
                        if (!timeA && a.date) timeA = new Date(a.date).getTime();
                        if (!timeB && b.date) timeB = new Date(b.date).getTime();
                        if (!timeA && a.importedAt) timeA = new Date(a.importedAt).getTime();
                        if (!timeB && b.importedAt) timeB = new Date(b.importedAt).getTime();
                        if (timeA === timeB) {
                            const tieA = a.importedAt ? new Date(a.importedAt).getTime() : 0;
                            const tieB = b.importedAt ? new Date(b.importedAt).getTime() : 0;
                            return tieB - tieA;
                        }
                        return timeB - timeA;
                    });
                    setHistory(data);
                };
                fetchAttendance();
            }, [profile.studentId, profile["Student ID#"], refreshTrigger]);

            // --- 4. Determine Current Pending Schedule ---
            const completedOnlineLogs = history.filter(h => h.activityType === 'Online Schooling' && h.status !== 'Rejected');
            const completedScheduleIds = completedOnlineLogs.map(h => h.scheduleId).filter(Boolean);
            const completedTopics = completedOnlineLogs.map(h => h.vflTopic).filter(Boolean);

            // Filter out any active schedules where the ID or the VFL Topic is already in the trainee's history
            const pendingSchedules = activeSchedules.filter(sch =>
                !completedScheduleIds.includes(sch.id) &&
                !completedTopics.includes(sch.vflTopic)
            );

            const currentSchedule = pendingSchedules.length > 0 ? pendingSchedules[0] : null;

            useEffect(() => {
                if (currentSchedule) {
                    setOnlineForm(prev => ({
                        ...prev,
                        vflTopic: currentSchedule.vflTopic || '',
                        lsceTopic: currentSchedule.lsceTopic || ''
                    }));
                }
            }, [currentSchedule]);


            // Initialize Camera Scanner (Only if not online)[cite: 3, 4]
            const isOnlineAssigned = useMemo(() => {
                // Check for hardcoded 'Online' venue
                if (traineeRecord?.assignedVenueName === 'Online' || traineeRecord?.assignedVenue === 'Online') {
                    return true;
                }

                // Check for temporary online override on a physical venue
                if (traineeRecord?.assignedVenue) {
                    const assignedVenueObj = venues.find(v => v.id === traineeRecord.assignedVenue);
                    
                    // Allow legacy tag by name directly (if they manually typed it)
                    if (traineeRecord.assignedVenue === 'Temporary Online Schooling Tag' || traineeRecord.assignedVenue === 'Temporary Online Schooling' || traineeRecord.assignedVenueName === 'Temporary Online Schooling Tag' || traineeRecord.assignedVenueName === 'Temporary Online Schooling') {
                        return true;
                    }

                    if (assignedVenueObj && assignedVenueObj.onlineOverride) {
                        const expiryDate = new Date(assignedVenueObj.onlineOverrideExpiry);
                        const todayStart = new Date(new Date().setHours(0, 0, 0, 0));

                        // Check if the override hasn't expired
                        if (expiryDate >= todayStart) {
                            const onlineDaysConfig = assignedVenueObj.onlineDays || [];
                            
                            // Check if the trainee's schooling day is authorized
                            let schoolingDay = (profile?.schoolingDay || traineeRecord?.schoolingDay || '').trim().toLowerCase();
                            if (!schoolingDay || schoolingDay === 'n/a') {
                                schoolingDay = 'saturday';
                            }
                            
                            if (onlineDaysConfig.length > 0) {
                                const allowedDays = onlineDaysConfig.map(d => d.toLowerCase());
                                if (allowedDays.includes(schoolingDay)) {
                                    return true;
                                }
                            }
                            // If onlineDaysConfig is empty, we restrict by default (return false)
                        }
                    }
                }
                return false;
            }, [traineeRecord, venues, profile]);

            const canSubmitOnline = useMemo(() => {
                // isOnlineAssigned now strictly checks both expiry and authorized schooling days!
                return isOnlineAssigned;
            }, [isOnlineAssigned]);

            // Initialize Camera Scanner (Only if not online)
            useEffect(() => {
                if (scannedData || isOnlineAssigned) return;
                const timer = setTimeout(() => {
                    if (!document.getElementById("trainee-qr-reader")) return;
                    try {
                        const scanner = new Html5QrcodeScanner("trainee-qr-reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
                        scannerRef.current = scanner;
                        scanner.render((decodedText) => {
                            try {
                                const data = JSON.parse(decodedText);
                                handleScan(data);
                            } catch (e) {
                                console.error("QR Parse/Handle Error:", e);
                                setScanError("QR Error: " + e.message);
                            }
                        }, () => { });
                    } catch (error) {
                        console.error("Scanner error:", error);
                    }
                }, 200);

                return () => {
                    clearTimeout(timer);
                    if (scannerRef.current) {
                        scannerRef.current.clear().catch(e => console.error(e));
                    }
                };
            }, [scannedData, isOnlineAssigned]);

            const handleScan = (data) => {
                setLoadingLoc(true);
                setScanError("");
                setPreviewLoc(null);

                if (data.type !== 'SchoolingVenue') {
                    setScanError("Invalid QR Code. Please scan a valid Schooling Venue QR.");
                    setLoadingLoc(false);
                    return;
                }

                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        const dist = getDistanceFromLatLonInM(pos.coords.latitude, pos.coords.longitude, data.lat, data.lng);
                        setPreviewLoc({ lat: pos.coords.latitude, lon: pos.coords.longitude });

                        if (dist > (data.radius || 200)) {
                            setScanError(`You are too far from the venue (${Math.round(dist)} meters away). You must be within ${data.radius || 200}m. Please inform your mentor in-charge for assistance.`);
                            setLoadingLoc(false);
                            return;
                        }

                        if (!traineeRecordRef.current) {
                            setScanError(`Error: Trainee record not found in the database. Please contact Admin.`);
                            setLoadingLoc(false);
                            return;
                        }

                        if (!traineeRecordRef.current.assignedVenue || traineeRecordRef.current.assignedVenue === 'Unassigned') {
                            setScanError(`You do not have an assigned venue. Please contact the Assigned IC or Mentoring Admin for Assistance.`);
                            setLoadingLoc(false);
                            return;
                        }

                        if (
                            data.venueId !== traineeRecordRef.current.assignedVenue && 
                            data.venueName !== traineeRecordRef.current.assignedVenue && 
                            data.venueName !== traineeRecordRef.current.assignedVenueName
                        ) {
                            setScanError(`Your submission will not push through since you are assigned to a different schooling venue (Assigned: ${traineeRecordRef.current.assignedVenueName || traineeRecordRef.current.assignedVenue}, Scanned: ${data.venueName}). Please contact the Assigned IC or Mentoring Admin for Assistance.`);
                            setLoadingLoc(false);
                            return;
                        }

                        setScannedData(data);
                        setLoadingLoc(false);
                    },
                    (err) => {
                        setScanError("Failed to get location. Please enable GPS/Location Services.");
                        setLoadingLoc(false);
                    },
                    { enableHighAccuracy: true }
                );
            };

            const handleSubmitAttendance = async () => {
                setSubmitting(true);
                const verified = await verifyBiometrics(user.uid);
                if (!verified) {
                    const enteredPin = window.prompt("Biometric verification failed or skipped. Please enter your 4-digit PIN to submit attendance:");
                    if (!enteredPin) {
                        setSubmitting(false);
                        return;
                    }
                    if (!profile.fallbackPin) {
                        alert("error" + ": " + "Biometric failed and no PIN is set up. Please set up a PIN in Profile & Settings.");
                        setSubmitting(false);
                        return;
                    }
                    if (String(enteredPin).trim() !== String(profile.fallbackPin).trim()) {
                        alert("error" + ": " + "Error: Incorrect PIN. Attendance submission cancelled.");
                        setSubmitting(false);
                        return;
                    }
                }

                try {
                    // Check for multiple attendance in current week
                    const currentDate = new Date();
                    const day = currentDate.getDay(); // 0 is Sunday, 1 is Monday
                    const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1); // Monday
                    const startOfWeek = new Date(currentDate.setDate(diff));
                    startOfWeek.setHours(0,0,0,0);
                    
                    const q = query(
                        collection(db, 'artifacts', appId, 'public', 'data', 'mentoring_attendance'),
                        where('studentId', '==', profile.studentId || profile["Student ID#"])
                    );
                    
                    const querySnapshot = await getDocs(q);
                    let hasExistingAttendance = false;
                    querySnapshot.forEach((doc) => {
                        const rec = doc.data();
                        if (rec.activityType === 'SchoolingVenue' || rec.type === 'SchoolingVenue' || rec.activityType === 'Schooling' || rec.type === 'Schooling') {
                            const recordDate = new Date(rec.timestamp);
                            if (recordDate >= startOfWeek) {
                                // Block if there is any attendance this week that is NOT denied
                                if (rec.status !== 'Denied') {
                                    hasExistingAttendance = true;
                                }
                            }
                        }
                    });

                    let initialStatus = 'Pending Validation';
                    let verifiedByMentor = '';
                    let activityScore = 0;

                    if (hasExistingAttendance) {
                        initialStatus = 'Denied';
                        verifiedByMentor = 'System (Auto-Denied: Duplicate)';
                    }

                    const payload = {
                        traineeUid: user.uid,
                        studentId: profile.studentId || profile["Student ID#"] || "",
                        traineeName: `${profile.given} ${profile.family}`,
                        company: profile.companyName || "",
                        venueId: scannedData.venueId,
                        venueName: scannedData.venueName,
                        roomName: scannedData.roomName,
                        date: getLocalYYYYMMDD(new Date()),
                        time: new Date().toLocaleTimeString(),
                        activityType: scannedData.type,
                        status: initialStatus,
                        verifiedByMentor: verifiedByMentor,
                        activityScore: activityScore,
                        multipleAttendanceWarning: hasExistingAttendance,
                        timestamp: new Date().getTime()
                    };
                    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'mentoring_attendance'), payload);
                    
                    if (hasExistingAttendance) {
                        alert("Submission Auto-Denied: You already have a Schooling Attendance record for this week. This duplicate scan has been recorded in your history but will not be counted.");
                    } else {
                        alert("Attendance submitted! Please ask your mentor to verify it on their screen.");
                    }
                    
                    setScannedData(null);
                    setPreviewLoc(null);
                } catch (e) {
                    alert("Database Error: " + e.message);
                }
                setSubmitting(false);
            };

            // Generate QR with Location & Time[cite: 3, 4]
            const handleGenerateTraineeQR = () => {
                setGeneratingQR(true);
                setQrGenError("");

                if (!navigator.geolocation) {
                    setQrGenError("Geolocation is not supported by your browser.");
                    setGeneratingQR(false);
                    return;
                }

                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        const now = new Date();
                        const dateString = now.toLocaleDateString('en-US');
                        const timeString = now.toLocaleTimeString('en-US', {
                            hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true
                        });

                        const payload = {
                            studentId: profile.studentId || profile["Student ID#"] || "",
                            traineeName: `${profile.given} ${profile.family}`,
                            companyName: profile.companyName || "",
                            lat: pos.coords.latitude,
                            lng: pos.coords.longitude,
                            date: dateString,
                            time: timeString
                        };

                        setTraineeQRData(payload);
                        setShowTraineeQR(true);
                        setGeneratingQR(false);
                    },
                    (err) => {
                        setQrGenError("Failed to get location. Please enable GPS/Location Services.");
                        setGeneratingQR(false);
                    },
                    { enableHighAccuracy: true }
                );
            };

            const fileToBase64 = (file) => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result.split(',')[1]);
                reader.onerror = error => reject(error);
            });

            const handleOnlineSubmit = async (e) => {
                e.preventDefault();
                if (!vflFile || !lsceFile || !drEntryFile) return alert("Please upload photos for VFL, LSCE, and DR Entry.");
                if (!currentSchedule) return alert("No active schedule found to submit against.");

                setSubmittingOnline(true);
                try {
                    const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwtohUYD5UCg1UNt0WoHJUbNlz1ySnssxbktJIc7Qi-9YCdD78RJ-eLSs7YLKIeq20MUQ/exec";

                    // compressImage returns a data URL string, so extract base64 directly
                    const [compressedVfl, compressedLsce, compressedDr] = await Promise.all([
                        compressImage(vflFile),
                        compressImage(lsceFile),
                        compressImage(drEntryFile)
                    ]);

                    const vflBase64 = compressedVfl.split(',')[1];
                    const lsceBase64 = compressedLsce.split(',')[1];
                    const drBase64 = compressedDr.split(',')[1];

                    const response = await fetch(WEB_APP_URL, {
                        method: "POST",
                        body: JSON.stringify({
                            studentId: profile.studentId || profile["Student ID#"] || "",
                            traineeName: `${profile.given} ${profile.family}`,
                            company: profile.companyName || "",
                            vflTopic: onlineForm.vflTopic,
                            lsceTopic: onlineForm.lsceTopic,
                            notes: onlineForm.notes,
                            vflFile: {
                                fileName: `${user.uid}_${Date.now()}_VFL_${vflFile.name}`,
                                fileBase64: vflBase64,
                                mimeType: "image/jpeg"
                            },
                            lsceFile: {
                                fileName: `${user.uid}_${Date.now()}_LSCE_${lsceFile.name}`,
                                fileBase64: lsceBase64,
                                mimeType: "image/jpeg"
                            },
                            drEntryFile: {
                                fileName: `${user.uid}_${Date.now()}_DR_${drEntryFile.name}`,
                                fileBase64: drBase64,
                                mimeType: "image/jpeg"
                            }
                        })
                    });

                    const result = await response.json();
                    if (!result.success) throw new Error(result.error);

                    const payload = {
                        scheduleId: currentSchedule.id,
                        traineeUid: user.uid,
                        studentId: profile.studentId || profile["Student ID#"] || "",
                        traineeName: `${profile.given} ${profile.family}`,
                        company: profile.companyName || "",
                        venue: 'Online',
                        date: getLocalYYYYMMDD(new Date()),
                        time: new Date().toLocaleTimeString(),
                        activityType: 'Online Schooling',
                        vflTopic: onlineForm.vflTopic,
                        lsceTopic: onlineForm.lsceTopic,
                        notes: onlineForm.notes,
                        vflDriveUrl: result.vflDriveUrl || "",
                        lsceDriveUrl: result.lsceDriveUrl || "",
                        drEntryDriveUrl: result.drEntryDriveUrl || "",
                        status: 'Pending Verification',
                        timestamp: new Date().getTime()
                    };

                    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'mentoring_attendance'), payload);

                    alert("Online Schooling submitted successfully via Google Apps Script!");
                    setVflFile(null);
                    setLsceFile(null);
                    setDrEntryFile(null);
                    setOnlineForm({ vflTopic: '', lsceTopic: '', notes: '' });
                    if (onRefresh) {
                        onRefresh();
                    }

                } catch (error) {
                    console.error("Upload Error:", error);
                    alert("Submission failed: " + error.message);
                }
                setSubmittingOnline(false);
            };

            // --- FILTER & WEIGHT LOGIC ---[cite: 3, 4]
            const getMeetingCredits = (record) => {
                const locationText = `${record.hub || ''} ${record.venue || ''} ${record.rawSheetData?.['Schooling / Mentoring Hub'] || ''}`;
                const combinedText = `${record.activityType || ''} ${record.type || ''} ${record.topic || ''} ${record.rawSheetData?.['Topic'] || ''} ${locationText}`.toUpperCase();

                if (combinedText.includes('RETREAT')) return 4;
                if (combinedText.includes('PDS9') || combinedText.includes('PDS 9') ||
                    combinedText.includes('PDS18') || combinedText.includes('PDS 18')) return 2;

                return 1;
            };

            const baseSchoolingRecords = history.filter(h => {
                const locationText = `${h.hub || ''} ${h.venue || ''} ${h.rawSheetData?.['Schooling / Mentoring Hub'] || ''}`;
                const combinedText = `${h.activityType || ''} ${h.type || ''} ${h.topic || ''} ${locationText}`.toUpperCase();

                const isSchooling = combinedText.includes('SCHOOLING') ||
                    combinedText.includes('PERSONAL DEVELOPMENT SEMINAR') ||
                    combinedText.includes('PDS') ||
                    combinedText.includes('RETREAT');

                if (!isSchooling) return false;
                return ['Present', 'Late', 'Verified', 'Pending Verification', 'Pending Attendance'].includes(h.status);
            });

            const approvedDisputes = disputes.filter(d => d.status === 'Approved').map(d => ({
                id: d.id,
                status: 'Verified',
                activityType: 'Schooling',
                topic: 'Disputed Absence Approved',
                timestamp: d.dateDisputed ? { seconds: new Date(d.dateDisputed + 'T00:00:00').getTime() / 1000 } : null,
                date: d.dateDisputed,
                hub: 'Approved Dispute',
                venue: 'Dualtech',
                isDispute: true
            }));
            
            const schoolingRecords = [...baseSchoolingRecords, ...approvedDisputes].sort((a, b) => {
                const timeA = a.timestamp?.seconds || a.timestamp?.toMillis?.() / 1000 || new Date(a.date).getTime() / 1000 || 0;
                const timeB = b.timestamp?.seconds || b.timestamp?.toMillis?.() / 1000 || new Date(b.date).getTime() / 1000 || 0;
                return timeB - timeA;
            });

            const attendedCount = schoolingRecords.reduce((total, h) => {
                if (['Present', 'Late', 'Verified'].includes(h.status)) {
                    return total + getMeetingCredits(h);
                }
                return total;
            }, 0);

            // Add approved schooling credit applications on top (Option B)
            const approvedCreditsTotal = creditApplications
                .filter(app => app.status === 'Approved')
                .reduce((sum, app) => sum + (app.creditsRequested || 0), 0);

            const totalAttendedWithCredits = attendedCount + approvedCreditsTotal;

            const attendanceWeeks = useMemo(() => {
                const startDateStr = profile['IPT Date Start'] || profile.iptDateStart || profile.startDate || '';
                if (!startDateStr) return { weeks: [], missing: [], otherRecords: [] };
                
                const iptStart = new Date(startDateStr);
                if (isNaN(iptStart.getTime())) return { weeks: [], missing: [], otherRecords: [] };
                
                // Find nearest Monday on or after IPT Date Start
                const day = iptStart.getDay(); // 0 = Sunday, 1 = Monday, etc.
                const daysToMonday = day === 0 ? 1 : (day === 1 ? 0 : 8 - day);
                const start = new Date(iptStart.getTime() + daysToMonday * 24 * 60 * 60 * 1000);
                start.setHours(0, 0, 0, 0);
                
                const stat = String(masterStatus || 'Unknown').trim().toLowerCase();
                const endDateStr = profile['IPT Date End'] || profile.iptDateEnd || profile.endDate || '';
                let endCalc = new Date();
                if (stat.includes('complete') && endDateStr) {
                    const parsedEnd = new Date(endDateStr);
                    if (!isNaN(parsedEnd.getTime())) endCalc = parsedEnd;
                }
                
                const totalWeeks = Math.max(0, Math.ceil((endCalc - start) / (1000 * 60 * 60 * 24 * 7)));
                const missing = [];
                const weeks = [];
                const otherRecords = [];
                const traineeVenue = profile.schoolingHub || profile.hub || profile.venue || profile['Company Name'] || profile.company || profile.Company || '';
                
                const endOfLastWeekTime = start.getTime() + totalWeeks * 7 * 24 * 60 * 60 * 1000 - 1;

                // First, separate other records
                schoolingRecords.forEach(l => {
                    let logDate;
                    if (l.timestamp) {
                        if (l.timestamp.toMillis) logDate = new Date(l.timestamp.toMillis());
                        else if (l.timestamp.seconds) logDate = new Date(l.timestamp.seconds * 1000);
                        else logDate = new Date(l.timestamp);
                    } else if (l.date) {
                        logDate = new Date(l.date);
                    }
                    if (logDate && !isNaN(logDate.getTime())) {
                        if (logDate < start || (totalWeeks > 0 && logDate.getTime() > endOfLastWeekTime) || totalWeeks === 0) {
                            otherRecords.push({ ...l, parsedDate: logDate });
                        }
                    }
                });

                for (let w = 1; w <= totalWeeks; w++) {
                    const weekStart = new Date(start.getTime() + (w - 1) * 7 * 24 * 60 * 60 * 1000);
                    const weekEnd = new Date(start.getTime() + w * 7 * 24 * 60 * 60 * 1000 - 1);
                    
                    const weekRecords = [];
                    schoolingRecords.forEach(l => {
                        let logDate;
                        if (l.timestamp) {
                            if (l.timestamp.toMillis) logDate = new Date(l.timestamp.toMillis());
                            else if (l.timestamp.seconds) logDate = new Date(l.timestamp.seconds * 1000);
                            else logDate = new Date(l.timestamp);
                        } else if (l.date) {
                            logDate = new Date(l.date);
                        }
                        if (logDate && !isNaN(logDate.getTime())) {
                            if (logDate >= weekStart && logDate <= weekEnd) {
                                weekRecords.push({ ...l, parsedDate: logDate });
                            }
                        }
                    });
                    
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

                    if (weekRecords.length === 0) {
                        if (!isExempted) {
                            missing.push({
                                weekNumber: w,
                                startStr: weekStart.toLocaleDateString(),
                                endStr: weekEnd.toLocaleDateString(),
                                startISO: weekStartISO,
                                endISO: weekEndISO
                            });
                        }
                        weeks.push({
                            weekNumber: w,
                            startStr: weekStart.toLocaleDateString(),
                            endStr: weekEnd.toLocaleDateString(),
                            records: [],
                            isMissing: !isExempted,
                            isExempted
                        });
                    } else {
                        weeks.push({
                            weekNumber: w,
                            startStr: weekStart.toLocaleDateString(),
                            endStr: weekEnd.toLocaleDateString(),
                            records: weekRecords,
                            isMissing: false,
                            isExempted: false
                        });
                    }
                }
                return { weeks, missing, otherRecords };
            }, [profile, masterStatus, schoolingRecords, allSchedules]);

            const submitDispute = async (e) => {
                e.preventDefault();
                if (!disputeWeek || !disputeReason.trim() || !disputeDate) return;
                
                setSubmittingDispute(true);
                try {
                    const SCHOOLING_CREDIT_GAS_URL = "https://script.google.com/macros/s/AKfycbwbwWRdZfQbZPa4_K7grVDunbZRwYlfIYk_MvPPyNDtlTlbiAhu7z-AB8jXdaMbHzST/exec";
                    
                    let attachmentUrl = "";
                    
                    // Build GAS payload
                    const gasPayload = {
                        action: "submitSchoolingDispute",
                        studentId: profile.studentId || profile["Student ID#"] || "",
                        studentName: `${profile.given} ${profile.family}`.trim(),
                        companyName: profile.companyName || profile.company || "Unassigned",
                        weekNumber: disputeWeek.weekNumber,
                        weekRange: `${disputeWeek.startStr} - ${disputeWeek.endStr}`,
                        dateDisputed: disputeDate,
                        reason: disputeReason
                    };

                    // If photo is provided, compress and include it
                    if (disputeFile) {
                        const compressed = await compressImage(disputeFile);
                        const dataUrl = await fileToBase64(compressed);
                        const base64 = dataUrl.split(',')[1];
                        gasPayload.file = {
                            fileName: `${profile.studentId || user.uid}_${Date.now()}_dispute.jpg`,
                            fileBase64: base64,
                            mimeType: "image/jpeg"
                        };
                    }

                    // Call GAS to save file to Drive and log to Sheet
                    try {
                        const gasResponse = await fetch(SCHOOLING_CREDIT_GAS_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'text/plain' },
                            body: JSON.stringify(gasPayload)
                        });
                        
                        const gasData = await gasResponse.json();
                        if (gasData && gasData.attachmentUrl) {
                            attachmentUrl = gasData.attachmentUrl;
                        }
                    } catch (gasErr) {
                        console.warn("GAS webhook failed (non-critical):", gasErr);
                    }

                    // Save to Firestore
                    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'schooling_disputes'), {
                        traineeUid: user.uid,
                        studentId: profile.studentId || profile["Student ID#"] || "",
                        fullName: `${profile.given} ${profile.family}`.trim(),
                        companyName: profile.companyName || profile.company || "Unassigned",
                        weekNumber: disputeWeek.weekNumber,
                        weekStartStr: disputeWeek.startStr,
                        weekEndStr: disputeWeek.endStr,
                        dateDisputed: disputeDate,
                        reason: disputeReason,
                        attachmentUrl: attachmentUrl,
                        status: 'Pending',
                        submittedAt: new Date().toISOString()
                    });

                    alert("success" + ": " + "Absence dispute submitted successfully!");
                    setShowDisputeModal(false);
                    setDisputeWeek(null);
                    setDisputeReason("");
                    setDisputeFile(null);
                    setDisputeDate("");
                } catch (error) {
                    console.error("Error submitting dispute:", error);
                    alert("error" + ": " + "Failed to submit dispute: " + error.message);
                }
                setSubmittingDispute(false);
            };

            // Check Access Permissions
            const rawStatus = (masterStatus || '').trim().toLowerCase();
            const isActiveOrPostBSTP = rawStatus === 'active' || rawStatus === 'post bstp' || rawStatus === 'floater';
            const isCompletedIPT = rawStatus === 'completed ipt';
            
            if (!isActiveOrPostBSTP && !isCompletedIPT) {
                return (
                    <div className="bg-rose-50 border border-rose-200 p-8 rounded-xl sm:rounded-2xl text-center shadow-sm pb-20 mt-8">
                        <Lock className="w-16 h-16 text-rose-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-rose-800 mb-2">Access Denied</h2>
                        <p className="text-rose-600 text-sm max-w-sm mx-auto">
                            The Schooling tab is only accessible to Active, Post BSTP, and Floater trainees. Your current status is <strong>{masterStatus}</strong>.
                        </p>
                    </div>
                );
            }

            if (isCompletedIPT && (!extendedReq || extendedReq.status !== 'Approved')) {
                return (
                    <div className="bg-amber-50 border border-amber-200 p-8 rounded-xl sm:rounded-2xl text-center shadow-sm pb-20 mt-8">
                        <Lock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-amber-800 mb-2">Extended Schooling Required</h2>
                        <p className="text-amber-700 text-sm max-w-sm mx-auto mb-6">
                            Your status is <strong>Completed IPT</strong>. You can no longer access materials and submit activities unless you apply for Extended Schooling and it is approved by a Mentoring Admin.
                        </p>
                        
                        {loadingExtReq ? (
                            <div className="flex justify-center items-center gap-2 text-amber-600 font-medium">
                                <Loader2 className="animate-spin" size={18} /> Checking request status...
                            </div>
                        ) : extendedReq && extendedReq.status === 'Pending' ? (
                            <div className="bg-amber-100 text-amber-800 p-4 rounded-xl inline-block font-medium shadow-sm">
                                Your request for Extended Schooling is <strong>Pending Approval</strong>. Please wait for a Mentoring Admin to review it.
                            </div>
                        ) : extendedReq && extendedReq.status === 'Rejected' ? (
                            <div className="bg-rose-100 text-rose-800 p-4 rounded-xl inline-block font-medium shadow-sm mb-4 block mx-auto max-w-sm">
                                Your previous request for Extended Schooling was <strong>Rejected</strong>.
                            </div>
                        ) : null}

                        {(!extendedReq || extendedReq.status === 'Rejected') && !loadingExtReq && (
                            <button 
                                onClick={handleRequestExtendedSchooling}
                                disabled={requestingExt}
                                className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
                            >
                                {requestingExt ? <><Loader2 className="animate-spin" size={18} /> Submitting...</> : 'Request Extended Schooling'}
                            </button>
                        )}
                    </div>
                );
            }

            return (
                <div className="space-y-6 pb-20">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2"><BookOpen className="text-blue-600" /> Schooling & PDS</h2>
                        
                        <div className="mt-4 mb-2 inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Venue:</span>
                            <span className="text-sm font-black text-blue-700 dark:text-blue-400">
                                {traineeRecord?.assignedVenue ? (venues.find(v => v.id === traineeRecord.assignedVenue)?.name || traineeRecord.assignedVenue) : 'Unassigned'}
                            </span>
                        </div>
                        
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                            {isOnlineAssigned
                                ? "Complete your online schooling activities and submit your output here."
                                : "Scan your mentor's QR code to log attendance or generate your own for them to scan."}
                        </p>
                    </div>

                    {isOnlineAssigned ? (
                        /* ================= ONLINE SCHOOLING VIEW ================= */
                        <div className="space-y-6 animate-fade-in">
                            {!currentSchedule ? (
                                <div className="bg-blue-50 border border-blue-200 p-8 rounded-xl sm:rounded-2xl text-center shadow-sm">
                                    <CheckCircle2 className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                                    <h2 className="text-xl font-bold text-blue-800 mb-2">All Caught Up!</h2>
                                    <p className="text-blue-600 text-sm max-w-sm mx-auto">
                                        {activeSchedules.length > 0
                                            ? "You have successfully submitted your outputs for all currently active online activities. Your mentor will verify your submissions."
                                            : "There are currently no active online schooling assignments scheduled for you."}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {canSubmitOnline ? (
                                        <>
                                            {/* Assignment Details Display */}
                                    <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl sm:rounded-2xl shadow-sm">
                                        <h3 className="font-black text-blue-900 mb-2 flex items-center gap-2">
                                            <BookOpen size={20} className="text-blue-600" /> Current Assignment
                                        </h3>
                                        <div className="space-y-3 mt-4">
                                            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-blue-100 shadow-sm">
                                                <div className="mb-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                                                    <p className="text-xs font-bold text-blue-600 uppercase">VFL: {currentSchedule.vflTopic}</p>
                                                    {currentSchedule.vflVideoLink && (
                                                        <a href={currentSchedule.vflVideoLink} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline font-medium mt-1 block">
                                                            Watch VFL Video
                                                        </a>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-blue-600 uppercase">LSCE: {currentSchedule.lsceTopic}</p>
                                                    {currentSchedule.lsceVideoLink && (
                                                        <a href={currentSchedule.lsceVideoLink} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline font-medium mt-1 block">
                                                            Watch LSCE Video
                                                        </a>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-wider text-right">
                                                    Due by: {new Date(currentSchedule.viewableUntil).toLocaleDateString('en-US')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                            {/* Submission Form */}
                                            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700">
                                            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
                                                <FileText size={20} className="text-blue-500" /> Submit Output
                                            </h3>
                                            <form onSubmit={handleOnlineSubmit} className="space-y-5">

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-blue-600 uppercase mb-1">VFL Title for the Week</label>
                                                    <input
                                                        type="text"
                                                        value={onlineForm.vflTopic}
                                                        onChange={e => setOnlineForm({ ...onlineForm, vflTopic: e.target.value })}
                                                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 text-sm"
                                                        required
                                                        placeholder="Enter VFL Title"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-blue-600 uppercase mb-1">LSCE Title for the Week</label>
                                                    <input
                                                        type="text"
                                                        value={onlineForm.lsceTopic}
                                                        onChange={e => setOnlineForm({ ...onlineForm, lsceTopic: e.target.value })}
                                                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 text-sm"
                                                        required
                                                        placeholder="Enter LSCE Title"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Additional Notes / Insights (Optional)</label>
                                                <textarea value={onlineForm.notes} onChange={e => setOnlineForm({ ...onlineForm, notes: e.target.value })} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 text-sm resize-none" rows="3" placeholder="Any additional insights or notes (optional)"></textarea>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-5 border-slate-100 dark:border-slate-800">
                                                {/* VFL PHOTO UPLOAD */}
                                                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-800">
                                                    <label className="block text-xs font-bold text-blue-600 uppercase mb-1">Upload VFL Output</label>
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-3">Attach a photo of your Value Formation activity.</p>
                                                    <input type="file" required accept="image/*" onChange={(e) => setVflFile(e.target.files[0])}
                                                        className="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                                                </div>

                                                {/* LSCE PHOTO UPLOAD */}
                                                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-800">
                                                    <label className="block text-xs font-bold text-blue-600 uppercase mb-1">Upload LSCE Output</label>
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-3">Attach a photo of your Life Skills / Tech activity.</p>
                                                    <input type="file" required accept="image/*" onChange={(e) => setLsceFile(e.target.files[0])}
                                                        className="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                                                </div>

                                                {/* DR ENTRY PHOTO UPLOAD */}
                                                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-800">
                                                    <label className="block text-xs font-bold text-purple-600 uppercase mb-1">Upload DR Entry</label>
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-3">Attach a photo of your DR Entry.</p>
                                                    <input type="file" required accept="image/*" onChange={(e) => setDrEntryFile(e.target.files[0])}
                                                        className="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" />
                                                </div>
                                            </div>

                                            <button disabled={submittingOnline} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-md disabled:opacity-50 transition-colors flex justify-center items-center gap-2 mt-4">
                                                {submittingOnline ? <><Loader2 size={18} className="animate-spin" /> Submitting Activities...</> : 'Submit Online Schooling'}
                                            </button>
                                            </form>
                                        </div>
                                        </>
                                    ) : (
                                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-6 rounded-xl sm:rounded-2xl shadow-sm text-center">
                                            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                                            <h3 className="font-bold text-amber-800 dark:text-amber-400 mb-2">Submission Locked</h3>
                                            <p className="text-amber-700 dark:text-amber-500 text-sm max-w-lg mx-auto leading-relaxed">
                                                online submission is only allowed to the Online Trainees and Venues temporarily marked online for today. please contact the mentoring admin
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ) : (
                        /* ================= OFFLINE/ONSITE QR VIEW ================= */
                        <>
                            {!scannedData ? (
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700">
                                    <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 text-center">Scan Schooling Venue QR</h3>
                                    {scanError && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4 text-sm font-bold text-center border border-red-100">{scanError}</div>}
                                    
                                    {previewLoc && scanError && (
                                        <div className="w-full h-48 bg-slate-100 rounded-2xl overflow-hidden mb-4 border-2 border-red-100 relative shadow-inner pointer-events-none">
                                            <iframe width="100%" height="100%" src={`https://www.openstreetmap.org/export/embed.html?bbox=${previewLoc.lon - 0.003},${previewLoc.lat - 0.003},${previewLoc.lon + 0.003},${previewLoc.lat + 0.003}&layer=mapnik&marker=${previewLoc.lat},${previewLoc.lon}`}></iframe>
                                        </div>
                                    )}

                                    {loadingLoc ? (
                                        <div className="flex flex-col items-center justify-center p-10 text-blue-600"><Loader2 className="animate-spin mb-3" size={40} /> <span className="font-bold">Verifying Location...</span></div>
                                    ) : (
                                        <div id="trainee-qr-reader" className="w-full max-w-sm mx-auto overflow-hidden rounded-2xl border-2 border-slate-100 dark:border-slate-800"></div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700 max-w-sm mx-auto text-center border-t-4 border-t-blue-500 animate-fade-in">
                                    <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><MapPin size={32} /></div>
                                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Location Verified</p>
                                    <h3 className="font-black text-slate-800 dark:text-slate-100 text-2xl mb-1">{scannedData.venueName}</h3>
                                    <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">{scannedData.roomName}</p>

                                    {previewLoc && (
                                        <div className="w-full h-48 bg-slate-100 rounded-2xl overflow-hidden mb-6 border-2 border-blue-100 relative shadow-inner pointer-events-none">
                                            <iframe width="100%" height="100%" src={`https://www.openstreetmap.org/export/embed.html?bbox=${previewLoc.lon - 0.003},${previewLoc.lat - 0.003},${previewLoc.lon + 0.003},${previewLoc.lat + 0.003}&layer=mapnik&marker=${previewLoc.lat},${previewLoc.lon}`}></iframe>
                                        </div>
                                    )}

                                    <button onClick={handleSubmitAttendance} disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700 transition-colors text-white font-bold py-4 rounded-2xl shadow-md disabled:opacity-50 flex items-center justify-center gap-2">
                                        {submitting ? <><Loader2 className="animate-spin" size={18} /> Submitting...</> : 'Submit Attendance'}
                                    </button>
                                    <button onClick={() => { setScannedData(null); setPreviewLoc(null); setScanError(""); }} disabled={submitting} className="mt-4 text-slate-400 hover:text-slate-600 text-sm font-bold">Cancel</button>
                                </div>
                            )}
                        </>
                    )}

                    {/* --- SUMMARY COUNTER & VIEW HISTORY BUTTON --- */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2"><History size={18} className="text-blue-600" /> Schooling History</h3>
                                <div className="flex items-center gap-2">
                                    {approvedCreditsTotal > 0 && (
                                        <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-blue-200 shadow-sm">
                                            +{approvedCreditsTotal} Credit{approvedCreditsTotal !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                    <div className="bg-blue-50 text-blue-800 px-4 py-1.5 rounded-xl text-sm font-black border border-blue-200 flex items-center gap-2 shadow-sm">
                                        Total Attended: <span className="text-lg">{totalAttendedWithCredits}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowHistoryModal(true)}
                                className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 text-sm"
                            >
                                <History size={16} />
                                View Schooling History
                            </button>
                        </div>
                    </div>

                    {/* =================== MY CREDIT APPLICATIONS =================== */}
                    {creditApplications.length > 0 && (
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700">
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4 text-sm">
                                <ClipboardList size={16} className="text-blue-600" /> My Credit Applications
                            </h3>
                            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                                {creditApplications.map(app => (
                                    <div key={app.id} className="p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{app.creditType}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                {new Date(app.dateCompleted).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {app.creditsRequested} credit{app.creditsRequested !== 1 ? 's' : ''}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-1">
                                                Submitted: {new Date(app.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border block text-center shrink-0 mt-1 ${
                                            app.status === 'Approved' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                            app.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                            'bg-amber-50 text-amber-600 border-amber-200'
                                        }`}>
                                            {app.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* =================== SCHOOLING CREDIT APPLICATION =================== */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700 overflow-hidden">
                        <button 
                            onClick={() => setShowCreditForm(!showCreditForm)}
                            className="w-full p-5 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                    <Award size={20} className="text-blue-600" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Apply for Schooling Credit</h3>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Submit your credentials for additional schooling credits</p>
                                </div>
                            </div>
                            <ChevronDown size={18} className={`text-slate-400 transition-transform ${showCreditForm ? 'rotate-180' : ''}`} />
                        </button>

                        {showCreditForm && (
                            <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-800 animate-fade-in">
                                <form onSubmit={handleSubmitSchoolingCredit} className="space-y-4 mt-4">
                                    {/* Credit Type Dropdown */}
                                    <div>
                                        <label className="block text-xs font-bold text-blue-600 uppercase mb-1.5">Type of Schooling Credit</label>
                                        <select
                                            value={creditType}
                                            onChange={(e) => setCreditType(e.target.value)}
                                            required
                                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 text-sm font-medium text-slate-700 dark:text-slate-200"
                                        >
                                            <option value="">— Select Credit Type —</option>
                                            {availableCreditTypes.length === 0 ? (
                                                <option value="" disabled>All credit types already applied</option>
                                            ) : availableCreditTypes.map(opt => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label} ({opt.value === 'Special Seminars' ? '1 credit/day' : `${opt.credits} credit${opt.credits !== 1 ? 's' : ''}`})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Number of Days (only for Special Seminars) */}
                                    {creditType === 'Special Seminars' && (
                                        <div className="animate-fade-in">
                                            <label className="block text-xs font-bold text-purple-600 uppercase mb-1.5">Number of Days</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="30"
                                                value={creditDays}
                                                onChange={(e) => setCreditDays(Math.max(1, parseInt(e.target.value) || 1))}
                                                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-purple-500 text-sm"
                                                required
                                            />
                                            <p className="text-[10px] text-slate-400 mt-1 font-medium">Total credits: {creditDays} day{creditDays !== 1 ? 's' : ''} × 1 = <strong className="text-purple-600">{creditDays} credit{creditDays !== 1 ? 's' : ''}</strong></p>
                                        </div>
                                    )}

                                    {/* Credits Preview */}
                                    {creditType && creditType !== 'Special Seminars' && (
                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30 animate-fade-in">
                                            <p className="text-xs font-bold text-blue-700 dark:text-blue-400">
                                                Credits to be applied: <span className="text-lg">{getCreditsForType(creditType)}</span>
                                            </p>
                                        </div>
                                    )}

                                    {/* Date Completed */}
                                    <div>
                                        <label className="block text-xs font-bold text-blue-600 uppercase mb-1.5">Date Completed / Accomplished</label>
                                        <input
                                            type="date"
                                            value={creditDate}
                                            onChange={(e) => setCreditDate(e.target.value)}
                                            max={new Date().toISOString().split('T')[0]}
                                            required
                                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 text-sm"
                                        />
                                    </div>

                                    {/* File Upload */}
                                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-800">
                                        <label className="block text-xs font-bold text-amber-600 uppercase mb-1">Upload Screenshot / Photo</label>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-3">Attach a screenshot or photo to supplement your application.</p>
                                        <input
                                            type="file"
                                            required
                                            accept="image/*"
                                            onChange={(e) => setCreditFile(e.target.files[0])}
                                            className="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                                        />
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={submittingCredit}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-md disabled:opacity-50 transition-colors flex justify-center items-center gap-2"
                                    >
                                        {submittingCredit ? <><Loader2 size={18} className="animate-spin" /> Submitting Application...</> : 'Submit Credit Application'}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                    {/* SCHOOLING HISTORY MODAL */}
                    {showHistoryModal && (
                        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setShowHistoryModal(false); }}>
                            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-7xl max-h-[90vh] shadow-2xl animate-scale-up border border-slate-200 dark:border-slate-700 flex flex-col">
                                
                                {/* Header */}
                                <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800 rounded-t-2xl shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600">
                                            <History size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Schooling History</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Attendance records by week</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                        {/* Week Filter Dropdown */}
                                        <div className="relative">
                                            <select 
                                                value={selectedWeekFilter}
                                                onChange={(e) => setSelectedWeekFilter(e.target.value)}
                                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer outline-none"
                                            >
                                                <option value="All">All Weeks</option>
                                                {attendanceWeeks.weeks.map(w => (
                                                    <option key={w.weekNumber} value={w.weekNumber.toString()}>Week {w.weekNumber}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Column Toggle Dropdown */}
                                        <div className="relative">
                                            <button 
                                                onClick={() => setShowColumnDropdown(!showColumnDropdown)}
                                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                                            >
                                                <List size={16} /> Columns
                                            </button>
                                            
                                            {showColumnDropdown && (
                                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 py-2">
                                                    {Object.keys(visibleColumns).map(col => (
                                                        <label key={col} className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={visibleColumns[col]} 
                                                                onChange={() => setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }))}
                                                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <span className="text-sm text-slate-700 dark:text-slate-300 capitalize">{col.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <button onClick={() => setShowHistoryModal(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors">
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Content Area */}
                                <div className="p-0 overflow-auto flex-1">
                                    <table className="w-full text-left border-collapse min-w-[800px]">
                                        <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 z-10 text-xs uppercase text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                                            <tr>
                                                {visibleColumns.weekNumber && (
                                                    <th className="p-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" onClick={() => setSortConfig({ key: 'weekNumber', direction: sortConfig.key === 'weekNumber' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                                                        <div className="flex items-center gap-1">Week No. <ArrowUpDown size={12} /></div>
                                                    </th>
                                                )}
                                                {visibleColumns.datePresent && (
                                                    <th className="p-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" onClick={() => setSortConfig({ key: 'datePresent', direction: sortConfig.key === 'datePresent' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                                                        <div className="flex items-center gap-1">Date Present <ArrowUpDown size={12} /></div>
                                                    </th>
                                                )}
                                                {visibleColumns.venue && (
                                                    <th className="p-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" onClick={() => setSortConfig({ key: 'venue', direction: sortConfig.key === 'venue' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                                                        <div className="flex items-center gap-1">Venue <ArrowUpDown size={12} /></div>
                                                    </th>
                                                )}
                                                {visibleColumns.room && (
                                                    <th className="p-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" onClick={() => setSortConfig({ key: 'room', direction: sortConfig.key === 'room' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                                                        <div className="flex items-center gap-1">Room <ArrowUpDown size={12} /></div>
                                                    </th>
                                                )}
                                                {visibleColumns.lsceTopic && (
                                                    <th className="p-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" onClick={() => setSortConfig({ key: 'lsceTopic', direction: sortConfig.key === 'lsceTopic' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                                                        <div className="flex items-center gap-1">LSCE Topic <ArrowUpDown size={12} /></div>
                                                    </th>
                                                )}
                                                {visibleColumns.vflTopic && (
                                                    <th className="p-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" onClick={() => setSortConfig({ key: 'vflTopic', direction: sortConfig.key === 'vflTopic' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                                                        <div className="flex items-center gap-1">VFL Topic <ArrowUpDown size={12} /></div>
                                                    </th>
                                                )}
                                                {visibleColumns.validatedBy && (
                                                    <th className="p-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" onClick={() => setSortConfig({ key: 'validatedBy', direction: sortConfig.key === 'validatedBy' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                                                        <div className="flex items-center gap-1">Validated By <ArrowUpDown size={12} /></div>
                                                    </th>
                                                )}
                                                {visibleColumns.remarks && (
                                                    <th className="p-3">Remarks / Mentor Feedback</th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {(() => {
                                                const sortedWeeks = [...attendanceWeeks.weeks].sort((a, b) => {
                                                    let valA, valB;
                                                    
                                                    // Since we group by week, if we sort by non-weekNumber, we grab the first record's data
                                                    const recA = a.records[0] || {};
                                                    const recB = b.records[0] || {};
                                                    
                                                    if (sortConfig.key === 'weekNumber') {
                                                        valA = a.weekNumber;
                                                        valB = b.weekNumber;
                                                    } else if (sortConfig.key === 'datePresent') {
                                                        valA = recA.parsedDate ? recA.parsedDate.getTime() : 0;
                                                        valB = recB.parsedDate ? recB.parsedDate.getTime() : 0;
                                                    } else if (sortConfig.key === 'venue') {
                                                        valA = recA.hub || recA.venue || recA.venueName || '';
                                                        valB = recB.hub || recB.venue || recB.venueName || '';
                                                    } else if (sortConfig.key === 'room') {
                                                        valA = recA.roomName || '';
                                                        valB = recB.roomName || '';
                                                    } else if (sortConfig.key === 'lsceTopic') {
                                                        valA = recA.lsceTopic || '';
                                                        valB = recB.lsceTopic || '';
                                                    } else if (sortConfig.key === 'vflTopic') {
                                                        valA = recA.vflTopic || '';
                                                        valB = recB.vflTopic || '';
                                                    } else if (sortConfig.key === 'validatedBy') {
                                                        valA = recA.verifiedByMentor || recA.mentorName || '';
                                                        valB = recB.verifiedByMentor || recB.mentorName || '';
                                                    }

                                                    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                                                    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                                                    return 0;
                                                });

                                                const filteredWeeks = sortedWeeks.filter(w => selectedWeekFilter === "All" || w.weekNumber.toString() === selectedWeekFilter);

                                                if (filteredWeeks.length === 0) {
                                                    return (
                                                        <tr>
                                                            <td colSpan="8" className="p-8 text-center text-slate-500 italic">No schooling weeks match the selected filter.</td>
                                                        </tr>
                                                    );
                                                }

                                                return filteredWeeks.map(w => {
                                                    if (w.isMissing) {
                                                        const dispute = disputes.find(d => d.weekNumber === w.weekNumber);
                                                        if (dispute?.status === 'Approved') return null;

                                                        return (
                                                            <tr key={`week-${w.weekNumber}`} className="bg-rose-50/50 dark:bg-rose-900/10 border-l-4 border-l-rose-500">
                                                                {visibleColumns.weekNumber && (
                                                                    <td className="p-3 text-sm font-bold text-slate-800 dark:text-slate-200">
                                                                        Week {w.weekNumber}<br/>
                                                                        <span className="text-[10px] font-normal text-slate-500">{w.startStr} - {w.endStr}</span>
                                                                    </td>
                                                                )}
                                                                <td colSpan={Object.values(visibleColumns).filter(Boolean).length - 1} className="p-3 text-sm">
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="text-rose-600 font-bold flex items-center gap-1.5"><AlertCircle size={14}/> Absent / Missing Record</span>
                                                                        {dispute ? (
                                                                            <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${
                                                                                dispute.status === 'Pending' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                                                                'bg-rose-100 text-rose-700 border border-rose-200'
                                                                            }`}>
                                                                                {dispute.status === 'Pending' ? 'Dispute Pending' : 'Dispute Rejected'}
                                                                            </span>
                                                                        ) : (
                                                                            <button 
                                                                                onClick={() => { setDisputeWeek(w); setShowDisputeModal(true); setShowHistoryModal(false); }}
                                                                                className="text-[10px] font-bold bg-white hover:bg-slate-50 text-rose-600 border border-rose-200 px-3 py-1 rounded shadow-sm transition-colors uppercase tracking-wider"
                                                                            >
                                                                                Submit Dispute
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    }

                                                    // Has records
                                                    return w.records.map((rec, idx) => {
                                                        const isMultiple = w.records.length > 1;
                                                        const rowBg = isMultiple ? "bg-red-50 dark:bg-red-900/20" : "hover:bg-slate-50 dark:hover:bg-slate-800/50";
                                                        const rowBorder = isMultiple ? "border-l-4 border-l-red-500" : "";
                                                        
                                                        const hubLocation = rec.hub || rec.venue || rec.venueName || rec.rawSheetData?.['Schooling / Mentoring Hub'] || traineeRecord?.assignedVenueName || traineeRecord?.assignedVenue || '--';
                                                        const validatorInfo = rec.rawSheetData?.['Email Address'] || rec.verifiedByMentor || rec.mentorName || '--';
                                                        
                                                        return (
                                                            <tr key={rec.id || `week-${w.weekNumber}-${idx}`} className={`border-b border-slate-100 dark:border-slate-800 transition-colors ${rowBg} ${rowBorder}`}>
                                                                {visibleColumns.weekNumber && (
                                                                    <td className="p-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                                                                        {idx === 0 ? (
                                                                            <>
                                                                                <span className="font-bold">Week {w.weekNumber}</span><br/>
                                                                                <span className="text-[10px] text-slate-500">{w.startStr} - {w.endStr}</span>
                                                                                {isMultiple && <span className="block text-[10px] text-red-600 font-bold uppercase mt-1">Multiple Records</span>}
                                                                            </>
                                                                        ) : (
                                                                            <span className="text-slate-400">↳</span>
                                                                        )}
                                                                    </td>
                                                                )}
                                                                {visibleColumns.datePresent && (
                                                                    <td className="p-3 text-sm text-slate-700 dark:text-slate-300">
                                                                        {rec.parsedDate ? rec.parsedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '--'}
                                                                    </td>
                                                                )}
                                                                {visibleColumns.venue && (
                                                                    <td className="p-3 text-sm text-slate-700 dark:text-slate-300">{hubLocation}</td>
                                                                )}
                                                                {visibleColumns.room && (
                                                                    <td className="p-3 text-sm text-slate-700 dark:text-slate-300">{rec.roomName || '--'}</td>
                                                                )}
                                                                {visibleColumns.lsceTopic && (
                                                                    <td className="p-3 text-sm text-slate-700 dark:text-slate-300">{rec.lsceTopic || '--'}</td>
                                                                )}
                                                                {visibleColumns.vflTopic && (
                                                                    <td className="p-3 text-sm text-slate-700 dark:text-slate-300">{rec.vflTopic || '--'}</td>
                                                                )}
                                                                {visibleColumns.validatedBy && (
                                                                    <td className="p-3 text-sm text-slate-700 dark:text-slate-300">{validatorInfo}</td>
                                                                )}
                                                                {visibleColumns.remarks && (
                                                                    <td className="p-3 text-xs text-slate-500 italic max-w-xs truncate">
                                                                        {rec.feedback || '--'}
                                                                    </td>
                                                                )}
                                                            </tr>
                                                        );
                                                    });
                                                });
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                                
                                {/* Other Records */}
                                {attendanceWeeks.otherRecords.length > 0 && (
                                    <div className="p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shrink-0">
                                        <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                                            <Archive size={16} className="text-slate-500" /> Other Records (Outside Training Period)
                                        </h4>
                                        <div className="max-h-48 overflow-y-auto">
                                            <table className="w-full text-left border-collapse min-w-[800px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                                                <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] uppercase text-slate-500 font-bold border-b border-slate-200 dark:border-slate-700">
                                                    <tr>
                                                        <th className="p-2">Date Present</th>
                                                        <th className="p-2">Venue</th>
                                                        <th className="p-2">Room</th>
                                                        <th className="p-2">LSCE Topic</th>
                                                        <th className="p-2">VFL Topic</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                    {attendanceWeeks.otherRecords.map(rec => (
                                                        <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                            <td className="p-2 text-xs">{rec.parsedDate ? rec.parsedDate.toLocaleDateString() : '--'}</td>
                                                            <td className="p-2 text-xs">{rec.hub || rec.venue || rec.venueName || '--'}</td>
                                                            <td className="p-2 text-xs">{rec.roomName || '--'}</td>
                                                            <td className="p-2 text-xs">{rec.lsceTopic || '--'}</td>
                                                            <td className="p-2 text-xs">{rec.vflTopic || '--'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* DISPUTE MODAL */}
                    {showDisputeModal && disputeWeek && (() => {
                        // Generate dates within the week range for the date picker
                        const weekStart = new Date(disputeWeek.startISO || disputeWeek.startStr);
                        const weekEnd = new Date(disputeWeek.endISO || disputeWeek.endStr);
                        if (isNaN(weekStart.getTime()) || isNaN(weekEnd.getTime())) return null;
                        const datesInRange = [];
                        for (let d = new Date(weekStart); d < weekEnd; d.setDate(d.getDate() + 1)) {
                            datesInRange.push(new Date(d).toISOString().split('T')[0]);
                        }
                        return (
                        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) { setShowDisputeModal(false); setDisputeReason(""); setDisputeWeek(null); setDisputeFile(null); setDisputeDate(""); } }}>
                            <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl max-w-lg w-full shadow-2xl animate-scale-up border border-slate-200 dark:border-slate-700 overflow-hidden">
                                {/* Header */}
                                <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white/20 p-2 rounded-xl"><AlertTriangle className="text-white" size={22} /></div>
                                        <div>
                                            <h3 className="font-black text-lg text-white">Absence Dispute</h3>
                                            <p className="text-xs text-white/80 font-medium">Week {disputeWeek.weekNumber} • {disputeWeek.startStr} – {disputeWeek.endStr}</p>
                                        </div>
                                    </div>
                                </div>

                                <form onSubmit={submitDispute} className="p-5 space-y-4">
                                    {/* Date Picker */}
                                    <div>
                                        <label className="block text-xs font-bold text-amber-600 uppercase mb-1.5">Date of Absence</label>
                                        <select
                                            value={disputeDate}
                                            onChange={e => setDisputeDate(e.target.value)}
                                            required
                                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-amber-500 text-sm font-medium text-slate-700 dark:text-slate-200"
                                        >
                                            <option value="">— Select Date —</option>
                                            {datesInRange.map(dateStr => (
                                                <option key={dateStr} value={dateStr}>
                                                    {new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Narrative */}
                                    <div>
                                        <label className="block text-xs font-bold text-amber-600 uppercase mb-1.5">Reason / Narrative Details</label>
                                        <textarea
                                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-amber-500 text-sm min-h-[120px] resize-none text-slate-700 dark:text-slate-200"
                                            placeholder="Please explain in detail the reason for your absence on this date..."
                                            value={disputeReason}
                                            onChange={e => setDisputeReason(e.target.value)}
                                            required
                                        ></textarea>
                                    </div>

                                    {/* Photo Upload (Optional) */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Supporting Document (Optional)</label>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={e => setDisputeFile(e.target.files[0] || null)}
                                                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-amber-100 file:text-amber-700 file:px-3 file:py-1 file:text-xs file:font-bold file:cursor-pointer"
                                            />
                                        </div>
                                        {disputeFile && (
                                            <div className="mt-2 flex items-center gap-2 text-xs text-blue-600 font-medium bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                                                <CheckCircle2 size={14} /> {disputeFile.name}
                                            </div>
                                        )}
                                        <p className="text-[10px] text-slate-400 mt-1">Upload a photo or screenshot to support your dispute (e.g., medical certificate, excuse letter).</p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <button
                                            type="button"
                                            className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                            onClick={() => { setShowDisputeModal(false); setDisputeReason(""); setDisputeWeek(null); setDisputeFile(null); setDisputeDate(""); }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submittingDispute || !disputeDate}
                                            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg disabled:opacity-50 transition-all flex items-center gap-2"
                                        >
                                            {submittingDispute ? (<><Loader2 className="animate-spin" size={14} /> Submitting...</>) : 'Submit Dispute'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                        );
                    })()}
                </div>
            );
        }

        const verifyBiometrics = async (uid) => {
            if (!window.PublicKeyCredential) {
                console.warn("Biometrics not supported on this browser.");
                return true;
            }

            try {
                // Notice it now uses 'uid' instead of 'user.uid'
                const profileRef = doc(db, 'artifacts', appId, 'users', uid, 'profile', 'main');
                const profileSnap = await getDoc(profileRef);

                if (!profileSnap.exists() || !profileSnap.data().biometricCredentialId) {
                    console.warn("No biometric credential found on this profile.");
                    alert("error" + ": " + "No biometric data found for this account. Proceeding with standard clock-in.");
                    return true;
                }

                const profileData = profileSnap.data();

                const binaryString = window.atob(profileData.biometricCredentialId);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }

                await navigator.credentials.get({
                    publicKey: {
                        challenge: window.crypto.getRandomValues(new Uint8Array(32)),
                        allowCredentials: [{
                            type: 'public-key',
                            id: bytes.buffer
                        }],
                        userVerification: "required",
                        timeout: 60000
                    }
                });

                return true;
            } catch (error) {
                console.error("Biometric error:", error);
                return false;
            }
        };

        // --- DILIGENCE REPORT TAB ---