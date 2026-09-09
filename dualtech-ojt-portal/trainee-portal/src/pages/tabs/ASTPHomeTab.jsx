import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet';
import { Clock, AlertTriangle, ShieldCheck, UserCheck, Search, Loader2, X, AlertCircle, MapPin, User, CheckCircle, CheckCircle2 , Globe } from "lucide-react";
import { QRCodeSVG } from 'qrcode.react';
import { collection, query, where, getDocs, doc, setDoc, addDoc, getDoc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';

export default function ASTPHomeTab({ profile, user, db, appId, allLogs, fetchLogs }) {

    const activeTab = 'home';

    /* STATES */
    const [currentTime, setCurrentTime] = useState(new Date());
    const [liveStatus, setLiveStatus] = useState('checking');
    const [isDisputed, setIsDisputed] = useState(false);
    const [requireTotp, setRequireTotp] = useState(false);
    const [totpCode, setTotpCode] = useState('');
    const [latestLoc, setLatestLoc] = useState(null);
    const [clockState, setClockState] = useState({ isClockedIn: false, activeDocId: null });
    const mapRef = useRef(null);
    const pinResolveRef = useRef(null);
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [loadingLoc, setLoadingLoc] = useState(false);
    const [processingClock, setProcessingClock] = useState(false);
    const setProcessingSafe = (val) => {
        setProcessingClock(val);
        if (val) {
            if (window.__procTimer) clearTimeout(window.__procTimer);
            window.__procTimer = setTimeout(() => {
                setProcessingSafe(false);
                setLoadingLoc(false);
            }, 8000);
        } else {
            if (window.__procTimer) clearTimeout(window.__procTimer);
        }
    };
    const [toastMsg, setToastMsg] = useState(null);
    const [locationMsg, setLocationMsg] = useState('');
    const [unsyncedLogsCount, setUnsyncedLogsCount] = useState(0);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [refreshGpsTrigger, setRefreshGpsTrigger] = useState(0);
    const [masterStatus, setMasterStatus] = useState('Active');
    const [previewLoc, setPreviewLoc] = useState(null);
    const [pendingAction, setPendingAction] = useState(null);
    const [disputeType, setDisputeType] = useState(null);
    const [showDisputeModal, setShowDisputeModal] = useState(false);
    const [disputeReason, setDisputeReason] = useState("");
    const [disputedLoc, setDisputedLoc] = useState(null);
    const [showClockMessengerWarning, setShowClockMessengerWarning] = useState(false);
    const [companyGeofences, setCompanyGeofences] = useState(null);
    const [attendanceType, setAttendanceType] = useState('Individual Mobile Phone');
    const [breakSettings, setBreakSettings] = useState({ applyBreak: false, breakMinutes: 0 });
    const [qrData, setQrData] = useState(null);
    const [verifying, setVerifying] = useState(false);

    const rawStatus = String(masterStatus).replace(/[\u200B-\u200D\uFEFF]/g, '').trim().toLowerCase();
    const isActive = rawStatus === 'active' || rawStatus === 'completed ipt' || rawStatus === 'post-bstp';

    const isSameDevice = useMemo(() => {
        const currentDevice = navigator.userAgent;
        const trustedList = profile?.trustedDevices || [];
        if (profile?.deviceUsedToRegister && !trustedList.includes(profile.deviceUsedToRegister)) {
            trustedList.push(profile.deviceUsedToRegister);
        }
        const getHardwareSignature = (ua) => {
            if (/iPhone|iPad|iPod/i.test(ua)) return "Apple Mobile Device";
            const androidMatch = ua.match(/Android[^;]*;([^)]+)/);
            if (androidMatch) return androidMatch[1].replace(/wv/ig, '').trim();
            return ua.split(' ')[0];
        };
        const currentHardware = getHardwareSignature(currentDevice);
        return trustedList.some(trusted => getHardwareSignature(trusted) === currentHardware) || trustedList.length === 0;
    }, [profile]);

    const isFBMessenger = useMemo(() => {
        const ua = navigator.userAgent || navigator.vendor || '';
        return /FBAN|FBAV|FB_IAB|FBIOS|FB4A/i.test(ua);
    }, []);

    const showToast = (message, type = 'info') => {
        setToastMsg({ message, type });
        setTimeout(() => setToastMsg(null), type === 'error' ? 5000 : 3500);
    };

    // Returns a Promise that resolves with the entered PIN (string) or null if cancelled.
    const requestPin = () => new Promise((resolve) => {
        pinResolveRef.current = resolve;
        setPinInput('');
        setShowPinModal(true);
    });

    const handlePinKey = (key) => {
        setPinInput(prev => {
            if (key === 'DEL') return prev.slice(0, -1);
            if (prev.length >= 4) return prev;
            return prev + key;
        });
    };

    const handlePinSubmit = () => {
        setShowPinModal(false);
        if (pinResolveRef.current) { pinResolveRef.current(pinInput); pinResolveRef.current = null; }
    };

    const handlePinCancel = () => {
        setShowPinModal(false);
        if (pinResolveRef.current) { pinResolveRef.current(null); pinResolveRef.current = null; }
    };

    const verifyBiometrics = async (uid) => {
        if (!window.PublicKeyCredential) {
            console.warn("Biometrics not supported on this browser.");
            return true;
        }
        try {
            const profileRef = doc(db, 'artifacts', appId, 'users', uid, 'profile', 'main');
            const profileSnap = await getDoc(profileRef);
            if (!profileSnap.exists() || !profileSnap.data().biometricCredentialId) {
                console.warn("No biometric credential found on this profile.");
                showToast("No biometric data found for this account. Proceeding with standard clock-in.", "error");
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

    /* UTILITY FUNCTIONS */
    function getLocalYYYYMMDD(dateObj) {
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
        const R = 6371e3;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /* CLOCK FUNCTIONS */
            const initiateClockFlow = async (actionType) => {
                if (!isActive) return showToast("Your account is not Active. Clocking functions are disabled.", "error");

                // Block clocking from Facebook Messenger in-app browser
                if (isFBMessenger) {
                    setShowClockMessengerWarning(true);
                    return;
                }

                // ── STEP 1: BIOMETRICS / FALLBACK PIN ──────────────────────
                // Run auth check before GPS so it applies to ALL paths
                // (Normal, Dispute, GPS-failure) and never gets skipped.
                let isVerified = await verifyBiometrics(user.uid);
                if (!isVerified) {
                    const enteredPin = await requestPin();
                    if (!enteredPin) return; // User cancelled — do nothing

                    if (profile.fallbackPin && String(enteredPin).trim() === String(profile.fallbackPin).trim()) {
                        isVerified = true;
                    } else {
                        showToast("Error: Incorrect PIN. Clock-in cancelled.", "error");
                        return;
                    }
                }

                // ── STEP 2: SHOW LOCATING SPINNER & GET GPS ────────────────
                setLoadingLoc(true);

                if (!navigator.geolocation) {
                    setLoadingLoc(false);
                    handleTimeAction(actionType, null, null, true);
                    return;
                }

                // Hard safety timeout — some mobile browsers never fire
                // the error callback for getCurrentPosition even with timeout set.
                let gpsCalled = false;
                const gpsInitTimeout = setTimeout(() => {
                    if (!gpsCalled) {
                        gpsCalled = true;
                        setLoadingLoc(false);
                        handleTimeAction(actionType, null, null, true);
                    }
                }, 7000); // 2s longer than GPS timeout as a safety net

                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        if (gpsCalled) return;
                        gpsCalled = true;
                        clearTimeout(gpsInitTimeout);
                        setPreviewLoc({ lat: pos.coords.latitude, lon: pos.coords.longitude, action: actionType });
                        setLoadingLoc(false);
                    },
                    (err) => {
                        if (gpsCalled) return;
                        gpsCalled = true;
                        clearTimeout(gpsInitTimeout);
                        setLoadingLoc(false);
                        handleTimeAction(actionType, null, null, true);
                    },
                    { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
                );
            };

            // --- ATTENDANCE DISPUTE LOGIC ---
            const handleTimeAction = async (actionType, preLat = null, preLon = null, gpsFailed = false) => {
                const action = actionType.toLowerCase();
                const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                const currentDay = String(today).trim().toLowerCase();

                // SET DEFAULTS: Saturday for Schooling, Sunday for Rest
                let foundSchooling = "saturday";
                let foundRest = "sunday";

                try {
                    // Quick check if schedule exists on profile first, otherwise fallback to query
                    if (profile?.schoolingDay && profile.schoolingDay.trim() !== '') {
                        foundSchooling = String(profile.schoolingDay).trim().toLowerCase();
                    }
                    if (profile?.restDay && profile.restDay.trim() !== '') {
                        foundRest = String(profile.restDay).trim().toLowerCase();
                    }

                    const targetId = profile.studentId || profile["Student ID#"] || user.uid;
                    if (targetId) {
                        const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'trainees'), where('studentId', '==', targetId));
                        const snap = await Promise.race([
                            getDocs(q),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500))
                        ]);

                        if (snap && !snap.empty) {
                            const traineeData = snap.docs[0].data();
                            if (traineeData.schoolingDay && traineeData.schoolingDay.trim() !== '') {
                                foundSchooling = String(traineeData.schoolingDay).trim().toLowerCase();
                            }
                            if (traineeData.restDay && traineeData.restDay.trim() !== '') {
                                foundRest = String(traineeData.restDay).trim().toLowerCase();
                            }
                        }
                    }
                } catch (err) {
                    console.warn("Schedule query skipped or timed out, using defaults:", err);
                    // Do NOT set gpsFailed = true! Schedule query is not GPS.
                }

                // Check if today matches the fetched schedule (or defaults)
                const isSchooling = (foundSchooling === currentDay);
                const isRest = (foundRest === currentDay);

                if (isSchooling || isRest) {
                    setPendingAction(action);
                    setDisputeType('Schedule');
                    if (preLat != null && preLon != null) {
                        setDisputedLoc({ lat: preLat, lon: preLon });
                    }
                    setProcessingSafe(false);
                    setShowDisputeModal(true);
                } else {
                    if (gpsFailed) {
                        setPendingAction(action);
                        setDisputeType('Connection/GPS Issue');
                        setDisputeReason('');
                        setProcessingSafe(false);
                        setShowDisputeModal(true);
                    } else {
                        // Pass the coordinates down to handleClock
                        await handleClock(action, 'Normal', '', preLat, preLon);
                    }
                }
            };


            // Notice we made this function 'async'
            const handleClock = async (rawType, overrideStatus = 'Normal', overrideReason = '', preLat = null, preLon = null) => {
                const type = rawType.toLowerCase();

                if (!isActive) {
                    setProcessingSafe(false);
                    setLoadingLoc(false);
                    return showToast("Your account is not Active. Clocking functions are disabled.", "error");
                }

                // NOTE: Biometrics/PIN check is now handled in initiateClockFlow
                // before GPS starts, so it covers all paths (Normal + Dispute).

                setLocationMsg('');
                // Only show LOCATING if coordinates were NOT already confirmed via map preview
                if (preLat == null || preLon == null) {
                    setLoadingLoc(true);
                } else {
                    setProcessingSafe(true);
                }
                setIsDisputed(false);

                // Helper function separated so it can run with or without GPS
                const processAttendanceRecord = async (lat, lon) => {
                    try {
                        const timestamp = serverTimestamp();
                    const dateString = getLocalYYYYMMDD(new Date());
                    let status = 'Normal';

                    if (overrideStatus === 'Normal') {
                        if (profile?.companyLat && profile?.companyLon) {
                            let allowedRadius = 500;
                            try {
                                if (navigator.onLine) {
                                    const sysRef = doc(db, 'artifacts', appId, 'public', 'system_settings');
                                    const sysSnap = await Promise.race([
                                        getDoc(sysRef),
                                        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
                                    ]).catch(() => null);

                                    if (sysSnap && sysSnap.exists() && sysSnap.data().geofenceRadius) {
                                        allowedRadius = Number(sysSnap.data().geofenceRadius);
                                    }
                                }
                            } catch (err) {
                                console.error("Error fetching system geofence radius.", err);
                            }

                            // FIX: Changed calculateDistance to getDistanceFromLatLonInM
                            const distance = getDistanceFromLatLonInM(lat, lon, profile.companyLat, profile.companyLon);
                            if (distance > allowedRadius) {
                                setPendingAction(type);
                                setDisputeType('Location'); // FIX: Ensure dispute type is set
                                setDisputeReason('');
                                setDisputedLoc({ lat, lon }); // FIX: Save coordinates for the override
                                setShowDisputeModal(true);
                                setLoadingLoc(false);
                                setProcessingSafe(false);
                                return;
                            }
                        }

                        // Device verification: flag as UnrecognizedDevice but proceed with saving
                        if (!isSameDevice) {
                            status = 'UnrecognizedDevice';
                        }
                    } else {
                        status = 'Disputed';
                    }

                    let extraNotes = "Routine Log";
                    if (overrideStatus === 'Disputed' && overrideReason) {
                        extraNotes = `Acknowledged - To be acknowledged by the HR/IC. Reason: ${overrideReason}`;
                    } else if (status === 'UnrecognizedDevice') {
                        extraNotes = 'Logged from new/unrecognized device (authenticated via biometric/PIN)';
                    }

                    const finalStatusRemark = overrideStatus === 'Disputed' ? extraNotes : status;
                    const logPayload = { location: { lat, lon }, deviceUsed: navigator.userAgent, statusRemark: finalStatusRemark, type: type === 'in' ? 'IN' : 'OUT' };
                        let activeLogForOutCheck = null;
                        const logsCollectionRef = collection(db, 'artifacts', appId, 'users', user.uid, 'attendanceLogs');

                        if (type === 'in') {
                            const newLogRef = doc(logsCollectionRef);
                            await setDoc(newLogRef, {
                                dateString,
                                timestamp: Date.now(),
                                timeIn: timestamp,
                                clockInDetails: logPayload,
                                type: 'IN'
                            });

                            setClockState({ isClockedIn: true, activeDocId: newLogRef.id });

                        } else if (type === 'out') {
                            let targetDocId = clockState.activeDocId;
                            if (!targetDocId && allLogs && allLogs.length > 0) {
                                const openIn = allLogs.find(l => l.type === 'IN' && !l.timeOut);
                                if (openIn) targetDocId = openIn.id;
                            }

                            if (targetDocId) {
                                activeLogForOutCheck = allLogs.find(l => l.id === targetDocId);
                                const logRef = doc(db, 'artifacts', appId, 'users', user.uid, 'attendanceLogs', targetDocId);
                                await setDoc(logRef, { timeOut: timestamp, clockOutDetails: logPayload }, { merge: true });
                            }

                            const outLogRef = doc(logsCollectionRef);
                            await setDoc(outLogRef, {
                                dateString,
                                timestamp: Date.now(),
                                timeOut: timestamp,
                                clockOutDetails: logPayload,
                                type: 'OUT'
                            });

                            setClockState({ isClockedIn: false, activeDocId: null });
                        }

                        if (overrideStatus === 'Disputed') {
                            // FIX 3: Push dispute reports to background sync
                            addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'requests'), {
                                type: 'Dispute',
                                title: `Action Override ${type.toUpperCase()}`,
                                traineeId: user.uid,
                                traineeName: `${profile.given || profile.firstName || ''} ${profile.family || profile.lastName || ''}`.trim(),
                                company: profile.company || profile.companyName || 'Unknown',
                                assignedIC: profile.assignedIC || 'Unassigned',
                                description: `Trainee logged ${type.toUpperCase()} with system override. Reason: "${overrideReason}"`,
                                status: 'Pending',
                                date: new Date().toLocaleDateString('en-us'),
                                createdAt: Date.now()
                            }); // No 'await'

                            const currentDayStr = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                            const dayType = (profile.schoolingDay?.toLowerCase() === currentDayStr) ? 'Schooling Day' : 'Rest Day';

                            addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'ic_reports'), {
                                date: new Date().toLocaleDateString('en-us'),
                                timestamp: Date.now(),
                                category: 'Attendance Issue',
                                details: `Trainee triggered a system override during ${type.toUpperCase()}.\n\nReason provided by trainee: "${overrideReason}"`,
                                reportedBy: 'System (Auto-Dispute)',
                                company: profile.company || profile.companyName || 'Unknown',
                                traineeId: user.uid,
                                traineeName: `${profile.given || profile.firstName || ''} ${profile.family || profile.lastName || ''}`.trim(),
                                assignedIC: profile.assignedIC || 'Unassigned',
                                status: 'Unread'
                            }); // No 'await'
                        }

                        // ... (Keep the rest of the try block, such as hoursElapsed checking and fetchLogs(), exactly the same)

                        if (type === 'out' && activeLogForOutCheck) {
                            let timeInMs;
                            if (activeLogForOutCheck.timestamp && activeLogForOutCheck.timestamp.toDate) {
                                timeInMs = activeLogForOutCheck.timestamp.toDate().getTime();
                            } else if (activeLogForOutCheck.timestamp) {
                                timeInMs = new Date(activeLogForOutCheck.timestamp).getTime();
                            }
                            if (timeInMs) {
                                const timeOutMs = Date.now();
                                const hoursElapsed = (timeOutMs - timeInMs) / (1000 * 60 * 60);
                                if (hoursElapsed > 15) {
                                    extraNotes += ` | [WARNING: Exceeded 15 hours (${hoursElapsed.toFixed(1)} hrs)]`;
                                }
                            }
                        }

                        const sheetPayload = {
                            studentId: profile.studentId || profile["Student ID#"] || "N/A",
                            fullName: `${profile.given || profile.firstName || ''} ${profile.family || profile.lastName || ''}`.trim(),
                            company: profile.companyName || profile.company || "Unassigned",
                            date: new Date().toLocaleDateString('en-us'),
                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                            type: type === 'in' ? 'IN' : 'OUT',
                            logMethod: typeof attendanceType !== 'undefined' ? attendanceType : "Web App",
                            status: status,
                            gpsCoordinates: `${lat}, ${lon}`,
                            notes: extraNotes
                        };

                        if (typeof sendToGoogleSheet === 'function') sendToGoogleSheet(sheetPayload);

                        if (typeof fetchLogs === 'function') await fetchLogs();

                        setShowDisputeModal(false);
                        setDisputeReason('');
                        setPendingAction(null);

                        // Check if offline, blocked by spotty network, OR if there's data waiting in the offline queue to be synced
                        const pendingQueue = JSON.parse(localStorage.getItem('offlineSheetQueue') || '[]');
                        const isOfflineOrPoor = !navigator.onLine || status.includes('unavailable') || status.includes('Offline') || pendingQueue.length > 0;

                        if (isOfflineOrPoor) {
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
                                const plain = txtLines.join('\n');
                                const encrypted = await encryptPayload(plain, user.uid);
                                const blob = new Blob([encrypted], { type: 'application/octet-stream' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `attendance_${type}_${Date.now()}.enc`;
                                a.click();
                                URL.revokeObjectURL(url);
                                showToast(`⚠️ Clocked ${type.toUpperCase()} offline. An encrypted file has been downloaded for later sync.`, 'error');
                            } catch (cryptoErr) {
                                console.error('Encryption failed:', cryptoErr);
                                showToast(`⚠️ Clocked ${type.toUpperCase()} offline. Keep this tab open to sync when reconnected.`, 'error');
                            }
                        } else {
                            showToast(`\u2705 Successfully clocked ${type.toUpperCase()}!`, 'success');
                        }

                    } catch (err) { showToast("Error saving attendance: " + err.message, 'error'); }
                    finally { setLoadingLoc(false); setProcessingSafe(false); }
                };

                // --- NEW: Use Pre-Fetched Coordinates from Map Preview ---
                if (preLat != null && preLon != null && !isNaN(preLat) && !isNaN(preLon)) {
                    return await processAttendanceRecord(Number(preLat), Number(preLon));
                }

                // --- UPDATED GPS BYPASS LOGIC ---
                // For ALL dispute submissions, skip trying to fetch GPS again to prevent the "Locating..." freeze on poor networks.
                if (overrideStatus === 'Disputed') {
                    return await processAttendanceRecord(0, 0);
                }

                // Trigger modal if GPS is outright not supported
                if (!navigator.geolocation) {

                    setPendingAction(type);
                    setDisputeType('Location Disabled');
                    setDisputeReason('');
                    setShowDisputeModal(true);
                    setLoadingLoc(false);
                    setProcessingSafe(false);
                    return;
                }

                // Attempt to get location with a hard safety timeout
                // so loadingLoc never gets stuck on mobile.
                let gpsDone = false;
                const gpsTimeout = setTimeout(() => {
                    if (!gpsDone) {
                        gpsDone = true;
                        setPendingAction(type);
                        setDisputeType('Location Disabled');
                        setDisputeReason('');
                        setShowDisputeModal(true);
                        setLoadingLoc(false);
                        setProcessingSafe(false);
                    }
                }, 6000); // 1s longer than the GPS timeout as a safety net

                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        if (gpsDone) return;
                        gpsDone = true;
                        clearTimeout(gpsTimeout);
                        processAttendanceRecord(position.coords.latitude, position.coords.longitude);
                    },
                    (err) => {
                        if (gpsDone) return;
                        gpsDone = true;
                        clearTimeout(gpsTimeout);
                        // Allow the dispute bypass to temporarily save data if GPS fails
                        setPendingAction(type);
                        setDisputeType('Location Disabled');
                        setDisputeReason('');
                        setShowDisputeModal(true);
                        setLoadingLoc(false);
                        setProcessingSafe(false);
                    },
                    { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
                );
            };

            // --- PASTE THIS NEW FUNCTION BELOW handleClock ---
            const handleGenerateQR = async (type) => {
                // Block QR generation from Facebook Messenger in-app browser
                if (isFBMessenger) {
                    setShowClockMessengerWarning(true);
                    return;
                }

                setVerifying(true);

                try {
                    // 1. DEVICE CHECK: Verify current device against trusted devices
                    const currentDevice = navigator.userAgent;
                    const trustedList = profile.trustedDevices || [];

                    if (!trustedList.includes(currentDevice)) {
                        alert("Security Alert: Unrecognized device. You can only generate a QR code from your registered device.");
                        setVerifying(false);
                        return;
                    }

                    // 2. BIOMETRIC CHECK: Using your existing verifyBiometrics helper
                    const isVerified = await verifyBiometrics(user.uid);
                    if (!isVerified) {
                        alert("Biometric verification failed or was cancelled. Cannot generate QR.");
                        setVerifying(false);
                        return;
                    }

                    // 3. GENERATE PAYLOAD FOR HR SCANNER
                    const payload = {
                        traineeId: user.uid,
                        name: `${profile.given} ${profile.family}`,
                        company: profile.companyName,
                        type: type === 'IN' ? 'IN' : 'OUT',
                        dateString: getLocalYYYYMMDD(new Date()),
                        timestamp: new Date().toISOString()
                    };

                    setQrData(payload);
                } catch (error) {
                    console.error(error);
                    alert("An error occurred during verification.");
                }

                setVerifying(false);
            };
            // -------------------------------------------------

    // Fetch master status from trainees collection
    useEffect(() => {
        if (!profile?.studentId && !user?.uid) return;
        const fetchStatus = async () => {
            try {
                const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'trainees'), where('studentId', '==', profile.studentId || profile["Student ID#"] || user.uid));
                const snap = await getDocs(q);
                if (!snap.empty) {
                    const data = snap.docs[0].data();
                    if (data.status) setMasterStatus(data.status);
                    if (data.attendanceType) setAttendanceType(data.attendanceType);
                }
            } catch (err) { console.error("Failed to fetch master status:", err); }
        };
        fetchStatus();
    }, [profile, user, db, appId]);

    // Fetch company settings
    useEffect(() => {
        const compName = profile?.companyName || profile?.company;
        if (!compName) return;
        const fetchSettings = async () => {
            const settingRef = doc(db, 'artifacts', appId, 'public', 'data', 'company_settings', compName);
            const snap = await getDoc(settingRef);
            if (snap.exists()) {
                const data = snap.data();
                setAttendanceType(data.type || 'Individual Mobile Phone');
                setBreakSettings({
                    applyBreak: data.applyBreak || false,
                    breakMinutes: data.breakMinutes || 0
                });
            }
        };
        fetchSettings();
    }, [profile, db, appId]);

    // 1. Fetch Geofences
    useEffect(() => {
        const compName = profile?.companyName;
        if (!compName) return;
        const geofencesRef = collection(db, 'artifacts', appId, 'public', 'data', 'geofences');
        const q = query(geofencesRef, where('company', '==', compName));
        const unsub = onSnapshot(q, (snap) => {
            if (snap.empty) {
                setCompanyGeofences([]);
            } else {
                setCompanyGeofences(snap.docs.map(doc => doc.data()));
            }
        });
        return () => unsub();
    }, [profile, db, appId]);

    // 2. Track GPS and compare against the fetched geofences
    useEffect(() => {
        if (!navigator.geolocation) {
            setLiveStatus('error');
            return;
        }
        if (companyGeofences === null) {
            setLiveStatus('checking');
            return;
        }
        if (companyGeofences.length === 0) {
            setLiveStatus('no-coords');
            return;
        }
        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                const accuracy = position.coords.accuracy;
                if (accuracy === 150) {
                    setLiveStatus('spoofing');
                    return;
                }
                let isWithinAnyBranch = false;
                companyGeofences.forEach(fence => {
                    const dist = getDistanceFromLatLonInM(lat, lon, fence.latitude, fence.longitude);
                    if (dist <= (fence.radius || 500)) {
                        isWithinAnyBranch = true;
                    }
                });
                if (isWithinAnyBranch) {
                    setLiveStatus('in-zone');
                } else {
                    setLiveStatus('out-zone');
                }
            },
            (error) => {
                console.warn("Live Ping Warning:", error);
                if (error.code !== 3) {
                    setLiveStatus('error');
                }
            },
            { enableHighAccuracy: true, maximumAge: 15000, timeout: 30000 }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, [companyGeofences]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const checkUnsynced = () => {
            const queue = JSON.parse(localStorage.getItem('offlineSheetQueue') || '[]');
            setUnsyncedLogsCount(queue.length);
        };
        checkUnsynced();
        const handleOnline = () => { setIsOnline(true); checkUnsynced(); };
        const handleOffline = () => { setIsOnline(false); checkUnsynced(); };
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        const intervalId = setInterval(checkUnsynced, 3000);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(intervalId);
        };
    }, []);

    useEffect(() => {
        if (activeTab !== 'home') return;
        const intervalId = setInterval(() => {
            console.log("Auto-refreshing Home Tab...");
            setQrData(null);
            setVerifying(false);
        }, 60000);
        return () => clearInterval(intervalId);
    }, [activeTab]);

    useEffect(() => {
        if (!user || !profile) return;
        const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main');
        const publicUserRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
        const updatePresence = () => {
            const now = Date.now();
            setDoc(profileRef, { lastActive: now }, { merge: true }).catch(() => {});
            setDoc(publicUserRef, { lastActive: now, studentId: profile.studentId || profile['Student ID#'] || '' }, { merge: true }).catch(() => {});
        };
        updatePresence();
        const interval = setInterval(updatePresence, 2 * 60 * 1000);
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') updatePresence();
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [user, profile]);

    // Calculate active log
    useEffect(() => {
        const todayStr = getLocalYYYYMMDD(new Date());
        const todaysLogs = allLogs.filter(l => l.dateString === todayStr);

        // Sort by timestamp descending to find the most recent action
        const sorted = [...todaysLogs].sort((a, b) => {
            const tA = typeof a.timestamp === 'number' ? a.timestamp : (a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0);
            const tB = typeof b.timestamp === 'number' ? b.timestamp : (b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0);
            return tB - tA;
        });

        let isClockedIn = false;
        let activeDocId = null;

        // If the most recent log for today is an OUT, user is clocked out
        if (sorted.length > 0 && sorted[0].type === 'OUT') {
            isClockedIn = false;
            activeDocId = null;
        } else {
            // Otherwise check for an IN log without a matching OUT
            for (let i = 0; i < todaysLogs.length; i++) {
                if (todaysLogs[i].type === 'IN' && !todaysLogs[i].timeOut) {
                    isClockedIn = true;
                    activeDocId = todaysLogs[i].id;
                    break;
                }
            }
        }

        setClockState({ isClockedIn, activeDocId });
    }, [allLogs]);

    // --- CRYPTO HELPERS (AES-GCM via Web Crypto API) ---
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

    const handleOfflineUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const buf = event.target.result;
                const decrypted = await decryptPayload(buf, user.uid);
                const lines = decrypted.split('\n');
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
        reader.readAsArrayBuffer(file);
    };

    const currentHour = currentTime.getHours();
    let greeting = "Good Evening,";
    if (currentHour < 12) greeting = "Good Morning,";
    else if (currentHour < 18) greeting = "Good Afternoon,";

    const firstName = profile?.firstName || profile?.given || (profile?.name ? profile.name.split(' ')[0] : "Trainee");

    return (
<>
                                <div className="space-y-6 animate-fade-in">
                                    <div><h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Hi, {profile.given}!</h1><p className="text-slate-500 dark:text-slate-400 font-medium">Record your daily attendance.</p></div>

                                    {/* NEW: UNSYNCED DATA WARNING BADGE */}
                                    {unsyncedLogsCount > 0 && (
                                        <div className="bg-amber-50 border-2 border-dashed border-amber-400 p-5 rounded-xl sm:rounded-2xl shadow-sm flex items-start gap-4 text-amber-900 animate-pulse">
                                            <AlertTriangle className="shrink-0 mt-1 text-amber-600" size={28} />
                                            <div>
                                                <p className="font-black text-lg text-amber-800">Action Required: Unsynced Attendance ({unsyncedLogsCount})</p>
                                                <p className="text-sm mt-1 font-medium text-amber-700 leading-relaxed">
                                                    You have attendance records temporarily saved on this device due to a poor connection. <strong>They have not been submitted to HR yet.</strong>
                                                    <br /><br />
                                                    Please connect to a stable Wi-Fi or cellular network and wait on this screen until this message disappears to ensure your attendance is officially recorded.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700">
                                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2"><Clock className="text-blue-500" /> Live Attendance</h2>

                                        {/* CONDITIONAL RENDER BASED ON ATTENDANCE TYPE */}
                                        {attendanceType === 'Individual Mobile Phone' && (
                                            <div className="space-y-4 animate-fade-in mt-4 mb-4">
                                                <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl mb-4 text-center">
                                                    <p className="text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">
                                                        {profile.companyName || profile.company || "Company Not Assigned"}
                                                    </p>

                                                    <div className="flex items-center justify-center shrink-0 mb-3">
                                                        {liveStatus === 'checking' && (
                                                            <span className="flex items-center gap-2 px-3 py-1.5 bg-slate-200 text-slate-600 rounded-full text-xs font-bold animate-pulse w-fit">
                                                                <div className="w-2 h-2 rounded-full bg-slate-400"></div> Acquiring GPS Ping...
                                                            </span>
                                                        )}
                                                        {liveStatus === 'no-coords' && (
                                                            <span className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold shadow-sm border border-blue-200 w-fit">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg> Acknowledged (No Geofence Set)
                                                            </span>
                                                        )}
                                                        {liveStatus === 'in-zone' && (
                                                            <span className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold shadow-sm border border-emerald-200 w-fit">
                                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                                                Verified: Inside Plant
                                                            </span>
                                                        )}
                                                        {liveStatus === 'out-zone' && (
                                                            <span className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-700 rounded-full text-xs font-bold shadow-sm border border-rose-200 w-fit">
                                                                <AlertTriangle size={14} />
                                                                Warning: Outside Radius
                                                            </span>
                                                        )}
                                                        {liveStatus === 'spoofing' && (
                                                            <span className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-xs font-bold shadow-sm border border-purple-200 w-fit">
                                                                ⚠️ Fake GPS Detected
                                                            </span>
                                                        )}
                                                        {liveStatus === 'error' && (
                                                            <span className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold shadow-sm border border-amber-200 w-fit">
                                                                GPS Signal Lost
                                                            </span>
                                                        )}
                                                    </div>

                                                    {locationMsg && (
                                                        <div className={`w-full mb-3 p-3 rounded-xl flex flex-col gap-2 border relative pr-8 text-left ${locationMsg.includes('BLOCKED') ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                                                            <button onClick={() => setLocationMsg('')} className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/5 transition-colors text-current opacity-70 hover:opacity-100">
                                                                <X size={16} />
                                                            </button>

                                                            <div className="flex items-start gap-2">
                                                                {locationMsg.includes('BLOCKED') ? <AlertTriangle className="shrink-0 mt-0.5" size={16} /> : <AlertTriangle className="shrink-0 mt-0.5" size={16} />}
                                                                <p className="font-bold text-xs leading-tight">{locationMsg}</p>
                                                            </div>

                                                            {isActive && isDisputed && (
                                                                <div className="bg-red-100 text-red-800 text-xs font-bold py-2 px-3 rounded-lg w-full text-center border border-red-200">
                                                                    Unrecognized Device Detected. Please authenticate this device using Google Authenticator in the "Profile & Settings" tab.
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">
                                                        {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                    </p>
                                                    <p className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight font-mono">
                                                        {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                    </p>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-2">
                                                    <button
                                                        onClick={() => initiateClockFlow('in')}
                                                        disabled={!isActive || clockState.isClockedIn || loadingLoc}
                                                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 hover:border-amber-400 transition-colors shadow-sm disabled:opacity-50"
                                                    >
                                                        <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                                                            {loadingLoc && !clockState.isClockedIn ? (
                                                                <Loader2 size={24} className="text-amber-500 animate-spin" />
                                                            ) : (
                                                                <Clock size={24} className="text-amber-500" />
                                                            )}
                                                        </div>
                                                        <span className="font-bold text-slate-700 dark:text-slate-300 text-xs text-center">
                                                            {loadingLoc && !clockState.isClockedIn ? 'LOCATING...' : 'CLOCK IN'}
                                                        </span>
                                                    </button>
                                                    <button
                                                        onClick={() => initiateClockFlow('out')}
                                                        disabled={!isActive || !clockState.isClockedIn || loadingLoc}
                                                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 hover:border-red-400 transition-colors shadow-sm disabled:opacity-50"
                                                    >
                                                        <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                                                            {loadingLoc && clockState.isClockedIn ? (
                                                                <Loader2 size={24} className="text-red-500 animate-spin" />
                                                            ) : (
                                                                <Clock size={24} className="text-red-500" />
                                                            )}
                                                        </div>
                                                        <span className="font-bold text-slate-700 dark:text-slate-300 text-xs text-center">
                                                            {loadingLoc && clockState.isClockedIn ? 'LOCATING...' : 'CLOCK OUT'}
                                                        </span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {attendanceType === 'Advanced QR Code' && (
                                            <div className="animate-fade-in">
                                                {!qrData ? (
                                                    <div className="flex gap-3 mt-4">
                                                        <button onClick={() => handleGenerateQR('IN')} disabled={!isActive || clockState.isClockedIn || verifying} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all border-2 ${!isActive || clockState.isClockedIn ? 'border-slate-100 dark:border-slate-800 text-slate-400 bg-slate-50 dark:bg-slate-800' : 'border-green-500 text-green-600 hover:bg-green-50 active:scale-95'}`}>
                                                            {verifying ? 'Verifying...' : 'Generate HR Scan (IN)'}
                                                        </button>
                                                        <button onClick={() => handleGenerateQR('OUT')} disabled={!isActive || !clockState.isClockedIn || verifying} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all border-2 ${!isActive || !clockState.isClockedIn ? 'border-slate-100 dark:border-slate-800 text-slate-400 bg-slate-50 dark:bg-slate-800' : 'border-blue-500 text-blue-600 hover:bg-blue-50 active:scale-95'}`}>
                                                            {verifying ? 'Verifying...' : 'Generate HR Scan (OUT)'}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="mt-4 p-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center animate-fade-in">
                                                        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 text-center">Present this QR to your HR</h3>
                                                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200/60 dark:border-slate-700 mb-4">
                                                            <QRCodeSVG value={JSON.stringify(qrData)} size={200} level="H" />
                                                        </div>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mb-4">{new Date(qrData.timestamp).toLocaleTimeString()}</p>
                                                        <button onClick={() => setQrData(null)} className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:text-slate-200 font-bold rounded-lg transition-colors text-sm">Cancel / Close QR</button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {attendanceType === 'Basic QR Code' && (
                                            <div className="mt-4 p-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center animate-fade-in">
                                                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 text-center">Your Attendance ID Card</h3>
                                                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200/60 dark:border-slate-700 mb-4">
                                                    <QRCodeSVG value={JSON.stringify({
                                                        traineeId: user.uid,
                                                        studentId: profile.studentId,
                                                        name: `${profile.given} ${profile.family}`,
                                                        company: profile.companyName || profile.company,
                                                        isBasicQR: true
                                                    })} size={200} level="H" />
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-4 uppercase tracking-wider text-center">Show to HR Scanner<br />to Clock IN/OUT</p>
                                            </div>
                                        )}
                                        {/* ---------------------------------------------------- */}
                                    </div>

                                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700">
                                        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4">Today's Logs</h3>
                                        <div className="space-y-3">
                                            {allLogs.filter(l => l.dateString === getLocalYYYYMMDD(new Date())).map((log, i) => {
                                                const remark = log.type === 'IN' ? log.clockInDetails?.statusRemark : log.clockOutDetails?.statusRemark;
                                                const isAuto = remark && (remark.includes('Auto-Clock Out') || remark.includes('Auto-System'));

                                                return (
                                                    <div key={i} className={`flex justify-between items-center p-3 rounded-xl border ${isAuto ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800'}`}>
                                                        <div className="flex items-center gap-3 shrink-0">
                                                            <span className={`px-2 py-1 rounded text-xs font-black ${log.type === 'IN' ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>{log.type}</span>
                                                            <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>

                                                        <span className={`text-[11px] sm:text-xs text-right leading-tight ml-4 ${isAuto ? 'text-rose-600 font-bold' : 'text-slate-400 truncate max-w-[150px]'}`}>
                                                            {remark || 'Verified'}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                            {allLogs.filter(l => l.dateString === getLocalYYYYMMDD(new Date())).length === 0 && <p className="text-sm text-slate-400 italic text-center py-2">No logs for today yet.</p>}
                                        </div>
                                    </div>

                                    {/* --- OFFLINE LOG UPLOAD SECTION: only show when offline --- */}
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
                                    )}
                                </div>
                        {/* ── CUSTOM PIN ENTRY MODAL ── */}
                        {showPinModal && (
                            <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden animate-in zoom-in-95 duration-200">
                                    {/* Header */}
                                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-6 pt-6 pb-8 text-center">
                                        <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                                            <ShieldCheck size={28} className="text-white" />
                                        </div>
                                        <h3 className="text-white font-black text-lg">Enter Your PIN</h3>
                                        <p className="text-blue-100 text-xs mt-1">4-digit Clock-In PIN required</p>
                                        {/* PIN dots */}
                                        <div className="flex justify-center gap-4 mt-5">
                                            {[0,1,2,3].map(i => (
                                                <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${pinInput.length > i ? 'bg-white border-white scale-110' : 'bg-transparent border-blue-300'}`} />
                                            ))}
                                        </div>
                                    </div>
                                    {/* Number pad */}
                                    <div className="p-4 grid grid-cols-3 gap-2">
                                        {['1','2','3','4','5','6','7','8','9'].map(k => (
                                            <button key={k} onClick={() => handlePinKey(k)}
                                                className="py-3 rounded-xl text-xl font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 active:scale-95 transition-all">
                                                {k}
                                            </button>
                                        ))}
                                        <button onClick={handlePinCancel}
                                            className="py-3 rounded-xl text-sm font-bold text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 active:scale-95 transition-all">
                                            Cancel
                                        </button>
                                        <button onClick={() => handlePinKey('0')}
                                            className="py-3 rounded-xl text-xl font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 active:scale-95 transition-all">
                                            0
                                        </button>
                                        <button onClick={() => handlePinKey('DEL')}
                                            className="py-3 rounded-xl text-sm font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 active:scale-95 transition-all">
                                            ⌫
                                        </button>
                                    </div>
                                    {/* Confirm */}
                                    <div className="px-4 pb-4">
                                        <button onClick={handlePinSubmit} disabled={pinInput.length < 4}
                                            className="w-full py-3 rounded-xl font-black text-white bg-gradient-to-r from-blue-600 to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2">
                                            <CheckCircle2 size={18}/> Confirm
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {previewLoc && (
                            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                                <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col">
                                    <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                                        <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                            <MapPin className="text-blue-500" /> Confirm Location
                                        </h3>
                                        <button onClick={() => setPreviewLoc(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 text-center">
                                        Please verify your location on the map before officially clocking <strong>{previewLoc.action.toUpperCase()}</strong>.
                                    </p>

                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                                        <p className="text-xs text-amber-800 font-medium text-center">
                                            By proceeding, you explicitly authorize the system to process your device's real-time geographic location solely to verify your physical presence.
                                        </p>
                                    </div>

                                    <div className="w-full h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden mb-6 border-2 border-blue-100 dark:border-blue-900 relative shadow-inner">
                                        <MapContainer 
                                            key={`preview-map-${previewLoc.lat}-${previewLoc.lon}`}
                                            center={[previewLoc.lat, previewLoc.lon]} 
                                            zoom={16} 
                                            zoomControl={false} 
                                            style={{ height: '100%', width: '100%' }}
                                        >
                                            <TileLayer
                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                attribution='&copy; OpenStreetMap contributors'
                                            />
                                            <Marker position={[previewLoc.lat, previewLoc.lon]} />
                                        </MapContainer>
                                    </div>

                                    <div className="flex gap-3 mt-auto">
                                        <button onClick={() => setPreviewLoc(null)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                            Cancel
                                        </button>
                                        <button
                                            disabled={processingClock}
                                            onClick={async () => {
                                                const { action, lat, lon } = previewLoc;
                                                setPreviewLoc(null);
                                                setProcessingSafe(true);
                                                try {
                                                    await handleTimeAction(action, lat, lon);
                                                } catch (e) {
                                                    console.error('handleTimeAction error:', e);
                                                    setProcessingSafe(false);
                                                }
                                            }}
                                            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-200 transition-all active:scale-95 flex justify-center items-center gap-2"
                                        >
                                            <CheckCircle2 size={18} /> Confirm
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- UNIFIED DISPUTE MODAL (Handles both Location and Schedule) --- */}
                        {showDisputeModal && (
                            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                                <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                                    <div className="p-5 border-b border-amber-100 bg-amber-50 flex justify-between items-center shrink-0">
                                        <h3 className="font-black text-amber-900 flex items-center gap-2">
                                            <AlertCircle size={20} />
                                            {disputeType === 'Location' ? 'Out of Bounds Warning' : disputeType === 'Location Disabled' ? 'GPS Disabled Warning' : disputeType === 'Connection/GPS Issue' ? 'Connection or GPS Issue' : 'Action Restricted'}
                                        </h3>
                                        <button onClick={() => setShowDisputeModal(false)} className="p-1.5 text-amber-400 hover:bg-amber-200 rounded-lg"><X size={20} /></button>
                                    </div>

                                    <div className="p-6 overflow-y-auto">
                                        {/* NEW: Map Preview for Location Dispute */}
                                        {disputedLoc && (
                                            <div className="w-full h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden mb-4 border-2 border-amber-100 dark:border-amber-900 relative shadow-inner">
                                                <MapContainer 
                                                    key={`disp-map-${disputedLoc.lat}-${disputedLoc.lon}`}
                                                    center={[disputedLoc.lat, disputedLoc.lon]} 
                                                    zoom={16} 
                                                    zoomControl={false} 
                                                    style={{ height: '100%', width: '100%' }}
                                                >
                                                    <TileLayer
                                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                        attribution='&copy; OpenStreetMap contributors'
                                                    />
                                                    <Marker position={[disputedLoc.lat, disputedLoc.lon]} />
                                                </MapContainer>
                                            </div>
                                        )}

                                        <p className="text-sm text-slate-600 mb-4">
                                            {disputeType === 'Location' ? (
                                                <>
                                                    You are currently outside your assigned company location geofence.
                                                    <br /><br />
                                                    If you are authorized to work offsite today, you may still clock {pendingAction?.toLowerCase()}, but you must provide a valid reason.
                                                </>
                                            ) : disputeType === 'Location Disabled' ? (
                                                <>
                                                    We could not access your device's location (GPS is turned off or permission was denied).
                                                    <br /><br />
                                                    You may still proceed to clock {pendingAction?.toLowerCase()}, but you must provide an explanation for your missing location data.
                                                </>
                                            ) : disputeType === 'Connection/GPS Issue' ? (
                                                <>
                                                    We experienced a connection or GPS problem while fetching your data.
                                                    <br /><br />
                                                    You may still proceed to clock {pendingAction?.toLowerCase()}, but you must provide an explanation.
                                                </>
                                            ) : (
                                                <>
                                                    You are attempting to clock <strong>{pendingAction?.toUpperCase()}</strong> on your scheduled
                                                    <strong> Schooling/Rest Day</strong>.
                                                    <br /><br />
                                                    If you have authorized make-up duty or overtime, you may proceed, but you must state your reason.
                                                </>
                                            )}
                                            <strong> This will be marked as "Acknowledged" and will automatically send a dispute ticket to HR and your Industry Coordinator.</strong>
                                        </p>

                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                                            Reason for {disputeType === 'Location' ? `remote clock ${pendingAction?.toLowerCase()}` : (disputeType === 'Location Disabled' || disputeType === 'Connection/GPS Issue') ? `missing GPS data` : `clocking ${pendingAction?.toLowerCase()} today`}
                                        </label>
                                        <textarea
                                            value={disputeReason}
                                            onChange={e => setDisputeReason(e.target.value)}
                                            placeholder={disputeType === 'Location' ? "e.g., Assigned to field work, client meeting..." : (disputeType === 'Location Disabled' || disputeType === 'Connection/GPS Issue') ? "e.g., Phone GPS is broken, poor signal..." : "e.g., Approved overtime, Make-up duty..."}
                                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-amber-500 text-sm bg-white dark:bg-slate-900 min-h-[100px] resize-none mb-4"
                                        ></textarea>

                                        <div className="flex gap-3">
                                            <button onClick={() => setShowDisputeModal(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-700">Cancel</button>
                                            <button
                                                onClick={async () => {
                                                    if (!disputeReason.trim()) return showToast("You must provide a dispute reason.", "error");

                                                    setShowDisputeModal(false);
                                                    setProcessingSafe(true);
                                                    await handleClock(
                                                        pendingAction,
                                                        'Disputed',
                                                        `[${disputeType} Override] ${disputeReason}`,
                                                        disputedLoc?.lat ?? 0,
                                                        disputedLoc?.lon ?? 0
                                                    );
                                                    setDisputedLoc(null);
                                                }}
                                                className="flex-1 py-3 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-md"
                                            >
                                                Submit & Clock {pendingAction?.toUpperCase()}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PROCESSING CLOCK OVERLAY */}
                        {processingClock && !previewLoc && !showDisputeModal && (
                            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
                                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col items-center gap-3 animate-in zoom-in-95 duration-200 max-w-xs w-full text-center">
                                    <Loader2 size={36} className="animate-spin text-blue-500" />
                                    <div>
                                        <p className="text-slate-700 dark:text-slate-200 font-bold text-sm">Processing attendance...</p>
                                        <p className="text-slate-400 text-xs mt-1">Please wait while your record is being saved.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { setProcessingSafe(false); setLoadingLoc(false); }}
                                        className="mt-2 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* IN-APP TOAST NOTIFICATION */}
                        {toastMsg && (
                            <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-6 py-4 rounded-2xl shadow-2xl font-bold text-sm max-w-[90vw] text-center animate-in slide-in-from-bottom-4 duration-300 ${
                                toastMsg.type === 'success' ? 'bg-emerald-600 text-white' :
                                toastMsg.type === 'error' ? 'bg-red-600 text-white' :
                                'bg-slate-800 text-white'
                            }`}>
                                {toastMsg.message}
                            </div>
                        )}

</>
);
}
