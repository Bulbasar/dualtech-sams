import React, { useState, useEffect, useRef, useMemo } from "react";
import { primaryDb as db } from "../../firebase";
import { collection, getDocs, getDoc, doc, query, where, limit, deleteDoc, addDoc, orderBy, updateDoc } from "firebase/firestore";
import { Clock, MapPin, UserCheck, ShieldCheck, CheckCircle2, AlertCircle, X, Loader2, QrCode } from "lucide-react";
import { haversine, logAttendance, computeAndSaveSummary, verifyBiometrics } from "../../utils/bstpLogic";
import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Html5QrcodeScanner } from 'html5-qrcode';

// Fix Leaflet's default icon path issues with Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

export default function BSTPHomeTab({ user, profile, onRefresh }) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [todayRecords, setTodayRecords] = useState([]);
    const [schoolLocation, setSchoolLocation] = useState(null);
    
    // Geolocation state
    const [livePos, setLivePos] = useState(null);
    const [locSamples, setLocSamples] = useState([]);
    const [lfAccounts, setLfAccounts] = useState({});
    
    // UI state
    const [confirmModalState, setConfirmModalState] = useState(null); // { type, title, desc, icon }
    const [remarks, setRemarks] = useState("");
    const [deviceExpl, setDeviceExpl] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // QR Scanner State
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const scannerRef = useRef(null);

    const watchIdRef = useRef(null);
    const mapRef = useRef(null);

    // Derived Statuses
    const hasTimedIn = todayRecords.some(r => r.type === 'IN');
    const hasTimedOut = todayRecords.some(r => r.type === 'OUT');
    const isClockInPending = todayRecords.some(r => r.type === 'IN' && r.status === 'pending');

    // Geo calculations
    const schoolGeoResult = useMemo(() => {
        if (!livePos || !schoolLocation || !schoolLocation.latitude || !schoolLocation.longitude) return null;
        const dist = haversine(livePos.lat, livePos.lng, schoolLocation.latitude, schoolLocation.longitude);
        return {
            venueName: "Dualtech Main Campus",
            distanceM: Math.round(dist),
            insideGeofence: dist <= (schoolLocation.radiusMeters || 500)
        };
    }, [livePos, schoolLocation]);

    // Active Geo Result dictates the current display on the Live Geo Strip
    const activeGeoResult = schoolGeoResult;
    
    let geoStatus = "Waiting for location...";
    if (!livePos) {
        geoStatus = "Acquiring location...";
    } else if (activeGeoResult) {
        if (activeGeoResult.insideGeofence) {
            geoStatus = "On-Site (Within Geofence)";
        } else {
            geoStatus = `Off-Site (${activeGeoResult.distanceM}m away)`;
        }
    } else if (!hasTimedIn && !schoolLocation) {
         geoStatus = "School location not configured.";
    }

    // Load initial data
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        fetchSchoolLocation();
        fetchTodayRecords();
        fetchLFAccounts();
        return () => clearInterval(timer);
    }, []);

    // Watch position
    useEffect(() => {
        if (!navigator.geolocation) {
            console.warn("Geolocation is not supported by your browser.");
            return;
        }

        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                const newPos = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                    timestamp: new Date().toISOString()
                };
                setLivePos(newPos);
                
                // Add to samples ring buffer (keep last 3)
                setLocSamples(prev => {
                    const newSamples = [...prev, newPos].slice(-3);
                    return newSamples;
                });
            },
            (err) => {
                console.warn(err);
            },
            { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
        );

        return () => {
            if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
        };
    }, []);

    const fetchLFAccounts = async () => {
        try {
            const snap = await getDocs(query(collection(db, "bstpUsers"), where("role", "==", "Learning Facilitator")));
            const accounts = {};
            snap.forEach(doc => {
                const data = doc.data();
                if (data.email) {
                    accounts[data.email] = data.initials || data.email.split('@')[0].toUpperCase();
                }
            });
            setLfAccounts(accounts);
        } catch (error) {
            console.error("Error fetching LF accounts:", error);
        }
    };

    const fetchSchoolLocation = async () => {
        try {
            const docRef = doc(db, "artifacts", "dualtech-ojt-portal", "public", "data", "settings", "schoolLocation");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setSchoolLocation(docSnap.data());
            }
        } catch (error) {
            console.error("Error fetching school location:", error);
        }
    };

    const skillsetSessions = useMemo(() => {
        const sessions = [];
        const skillIns = todayRecords.filter(r => r.type === 'SKILLSET_IN').sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));
        const skillOuts = todayRecords.filter(r => r.type === 'SKILLSET_OUT').sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));

        let outIdx = 0;
        skillIns.forEach(inRec => {
            let outRec = null;
            while (outIdx < skillOuts.length) {
                if (new Date(skillOuts[outIdx].timestamp) > new Date(inRec.timestamp)) {
                    outRec = skillOuts[outIdx];
                    outIdx++;
                    break;
                }
                outIdx++;
            }
            
            let durationStr = null;
            if (outRec) {
                const diffMs = new Date(outRec.timestamp) - new Date(inRec.timestamp);
                const hrs = Math.floor(diffMs / 3600000);
                const mins = Math.floor((diffMs % 3600000) / 60000);
                durationStr = `${hrs}h ${mins}m`;
            }
            
            sessions.push({
                inRec,
                outRec,
                durationStr
            });
        });
        return sessions;
    }, [todayRecords]);

    const activeSkillsetIn = skillsetSessions.find(s => !s.outRec && (s.inRec.status === 'pending' || s.inRec.status === 'approved'))?.inRec;

    const cancelSkillsetCheckIn = async (id) => {
        if (!window.confirm("Are you sure you want to cancel this pending skillset check-in?")) return;
        try {
            await deleteDoc(doc(db, "artifacts", "dualtech-ojt-portal", "public", "data", "bstpAttendance", id));
            alert("Skillset check-in cancelled.");
            fetchTodayRecords();
            if (onRefresh) onRefresh();
        } catch (e) {
            console.error(e);
            alert("Failed to cancel check-in.");
        }
    };
    
    const clockOutSkillset = async (inRecord) => {
        if (!window.confirm(`Are you sure you want to clock out of ${inRecord.roomName || 'this skillset'}?`)) return;
        setIsSubmitting(true);
        try {
            await logAttendance(
                'SKILLSET_OUT', 
                inRecord.skillset || '', 
                { venueId: inRecord.roomId, venueName: inRecord.roomName }, 
                livePos, 
                'Skillset out manually', 
                locSamples, 
                '', 
                profile, 
                'approved'
            );
            alert(`Successfully clocked out of ${inRecord.roomName || 'this skillset'}!`);
            fetchTodayRecords();
            if (onRefresh) onRefresh();
        } catch (e) {
            console.error("Skillset out error:", e);
            alert("Failed to clock out of skillset.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const fetchTodayRecords = async () => {
        if (!profile?.studentId) return;
        const todayDate = new Date();
        const startOfDay = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate()).toISOString();
        
        try {
            const q = query(
                collection(db, "artifacts", "dualtech-ojt-portal", "public", "data", "bstpAttendance"),
                where("studentNo", "==", profile.studentNo || profile.studentId),
                where("timestamp", ">=", startOfDay),
                limit(50)
            );
            const snap = await getDocs(q);
            setTodayRecords(snap.docs.map(d => ({ docId: d.id, id: d.id, ...d.data() })));
            
            // Check Auto Clock out (15 hours)
            const inRecs = snap.docs.map(d => ({ docId: d.id, ...d.data() })).filter(r => r.type === 'IN').sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
            const outRecs = snap.docs.map(d => d.data()).filter(r => r.type === 'OUT');
            
            if (inRecs.length > 0 && outRecs.length === 0) {
                const lastIn = inRecs[0];
                const diffHours = (Date.now() - new Date(lastIn.timestamp).getTime()) / (1000 * 60 * 60);
                if (diffHours > 15) {
                    const autoOutTime = new Date(new Date(lastIn.timestamp).getTime() + 15 * 60 * 60 * 1000).toISOString();
                    try {
                        await addDoc(collection(db, "artifacts", "dualtech-ojt-portal", "public", "data", "bstpAttendance"), {
                            studentNo: profile.studentId,
                            name: profile.name,
                            type: 'OUT',
                            timestamp: autoOutTime,
                            remarks: "Auto-clocked out by system after 15 hours",
                            roomName: lastIn.roomName || ''
                        });
                        // re-fetch after auto clockout
                        const q2 = query(collection(db, "artifacts", "dualtech-ojt-portal", "public", "data", "bstpAttendance"), where("studentNo", "==", profile.studentNo || profile.studentId), where("timestamp", ">=", startOfDay), limit(50));
                        const snap2 = await getDocs(q2);
                        setTodayRecords(snap2.docs.map(d => ({ docId: d.id, id: d.id, ...d.data() })));
                    } catch(e) {}
                }
            }
        } catch (error) {
            console.error("Error fetching today records:", error);
        }
    };

    const handleActionClick = async (type) => {
        if (window._isProcessingClockBSTP) return;
        window._isProcessingClockBSTP = true;
        setTimeout(() => { window._isProcessingClockBSTP = false; }, 3000);
        if (!livePos) return alert("Location not yet acquired. Please wait.");

        if (type === 'IN' || type === 'OUT') {
            if (!schoolLocation) return alert("School location is not configured by the admin.");
            const targetGeoResult = schoolGeoResult;
            const locationName = "Dualtech Main Campus";
            const isOffSite = targetGeoResult?.insideGeofence === false;
            
            // --- GPS ACCURACY CHECK ---
            let isLowAccuracy = false;
            if (livePos.accuracy > 150) {
                const proceed = window.confirm(`GPS accuracy is too low (± ${Math.round(livePos.accuracy)}m). Your clock in/out will be flagged as a dispute and reviewed by your adviser. Do you want to proceed anyway?`);
                if (!proceed) return;
                isLowAccuracy = true;
            }
            
            // --- DEVICE RECOGNITION CHECK ---
            if (!profile?.deviceId || profile.deviceId.startsWith('dev_')) {
                const confirmed = window.confirm("You have not registered a device yet. Do you want to register this device as your official device for attendance? You will be required to use this device every time you clock in or out.");
                if (!confirmed) {
                    alert("Attendance submission cancelled. You must register a device to continue.");
                    return;
                }
                try {
                    const profileRef = doc(db, "artifacts", "dualtech-ojt-portal", "users", user.uid, "profile", "main");
                    await updateDoc(profileRef, { deviceId: navigator.userAgent });
                    profile.deviceId = navigator.userAgent; // Update local state to proceed
                    alert("Device successfully registered!");
                } catch (err) {
                    console.error("Error registering device:", err);
                    alert("Failed to register device. Please try again.");
                    return;
                }
            } else if (profile.deviceId !== navigator.userAgent) {
                const getHardwareSignature = (ua) => {
                    if (/iPhone|iPad|iPod/i.test(ua)) return "Apple Mobile Device";
                    const androidMatch = ua.match(/Android[^;]*;([^)]+)/);
                    if (androidMatch) return androidMatch[1].replace(/wv/ig, '').trim();
                    return ua.split(' ')[0];
                };
                
                const trustedList = profile.trustedDevices || [];
                const currentHardware = getHardwareSignature(navigator.userAgent);
                const isTrusted = trustedList.some(trusted => getHardwareSignature(trusted) === currentHardware);
                
                if (!isTrusted) {
                    alert("Unrecognized Device. You are not allowed to clock in/out using this device. Please use your registered device.");
                    return;
                }
            }
            
            // --- BIOMETRIC / PIN AUTHENTICATION (For Time IN & OUT) ---
            const verified = await verifyBiometrics(profile?.biometricCredentialId);
            if (!verified) {
                const enteredPin = window.prompt("Biometric verification failed or skipped. Please enter your 4-digit PIN to submit attendance:");
                if (!enteredPin) {
                    alert("Attendance submission cancelled.");
                    return;
                }
                if (!profile.fallbackPin) {
                    alert("Biometric failed and no PIN is set up. Please set up a PIN in Profile & Settings.");
                    return;
                }
                if (String(enteredPin).trim() !== String(profile.fallbackPin).trim()) {
                    alert("Error: Incorrect PIN. Attendance submission cancelled.");
                    return;
                }
            }
            
            const config = {
                IN: { title: "Record Clock In", desc: `Logging arrival at ${locationName}.`, icon: CheckCircle2, color: 'amber' },
                OUT: { title: "Record Clock Out", desc: `Logging departure from ${locationName}.`, icon: AlertCircle, color: 'red' }
            };

            setConfirmModalState({ type, targetGeoResult, ...config[type], isOffSite, isLowAccuracy });
            setRemarks("");
            setDeviceExpl("");
        }
    };

    const handleConfirmSubmit = async () => {
        if (confirmModalState.isOffSite && remarks.trim().length < 5) {
            return alert("Remarks are required when off-site (min 5 chars).");
        }

        const isUnregisteredDevice = !!profile.registeredDeviceId && profile.registeredDeviceId !== localStorage.getItem('ams_device_id');
        if (isUnregisteredDevice && deviceExpl.trim().length < 20) {
            return alert("Please explain why you are using a different device (min 20 chars).");
        }
        
        // Undertime check
        if (confirmModalState.type === 'OUT' && activeSkillsetIn) {
            if (activeSkillsetIn.status === 'pending') {
                if (!window.confirm("You have a pending skillset check-in. Clocking out will cancel it. Proceed?")) {
                    setIsSubmitting(false);
                    return;
                }
                try {
                    await deleteDoc(doc(db, "artifacts", "dualtech-ojt-portal", "public", "data", "bstpAttendance", activeSkillsetIn.id || activeSkillsetIn.docId));
                } catch(e) {}
            } else if (activeSkillsetIn.status === 'approved') {
                try {
                    await logAttendance('SKILLSET_OUT', activeSkillsetIn.skillset || '', confirmModalState.targetGeoResult, livePos, 'Clocked out of skillset via main clock out', locSamples, '', profile, 'approved');
                } catch(e) {}
            }
        }
        
        if (confirmModalState.type === 'OUT' && profile.bstpshiftId) {
            try {
                const shiftDoc = await getDoc(doc(db, "artifacts", "dualtech-ojt-portal", "public", "data", "bstpShifts", profile.bstpshiftId));
                if (shiftDoc.exists()) {
                    const sData = shiftDoc.data();
                    const now = new Date();
                    
                    // Simple week number calc
                    const startOfYear = new Date(now.getFullYear(), 0, 1);
                    const diff = now - startOfYear;
                    const oneWeek = 1000 * 60 * 60 * 24 * 7;
                    const weekNum = Math.ceil(diff / oneWeek);
                    
                    let shiftTimeOut = null;
                    if (sData.isSameForAllWeeks) {
                        shiftTimeOut = sData.evenWeekEndTime || sData.endTime;
                    } else if (weekNum % 2 === 0) {
                        shiftTimeOut = sData.evenWeekEndTime;
                    } else {
                        shiftTimeOut = sData.oddWeekEndTime;
                    }
                    
                    if (!shiftTimeOut && sData.endTime) shiftTimeOut = sData.endTime;
                    
                    if (shiftTimeOut) {
                        const m = shiftTimeOut.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
                        if (m) {
                            let hrs = parseInt(m[1]);
                            let mins = parseInt(m[2]);
                            if (m[3]) {
                                const ap = m[3].toUpperCase();
                                if (ap === 'PM' && hrs < 12) hrs += 12;
                                if (ap === 'AM' && hrs === 12) hrs = 0;
                            }
                            const endTime = new Date();
                            endTime.setHours(hrs, mins, 0, 0);
                            
                            if (now < endTime) {
                                if (!window.confirm(`Warning: Your shift ends at ${shiftTimeOut}. You are clocking out early (Undertime). Are you sure you want to proceed?`)) {
                                    setIsSubmitting(false);
                                    return;
                                }
                            }
                        }
                    }
                }
            } catch (e) {
                console.warn("Could not check undertime", e);
            }
        }

        setIsSubmitting(true);
        try {
            // 1. Log attendance 
            let finalRemarks = remarks || '';
            if (confirmModalState.isLowAccuracy) {
                finalRemarks = (finalRemarks ? finalRemarks + " | " : "") + `System Flag: Low GPS Accuracy (${Math.round(livePos.accuracy)}m)`;
            }
            if (confirmModalState.isOffSite) {
                finalRemarks = (finalRemarks ? finalRemarks + " | " : "") + `System Flag: Off-site Clock In/Out`;
            }

            await logAttendance(
                confirmModalState.type, 
                '', 
                confirmModalState.targetGeoResult, 
                livePos, 
                finalRemarks, 
                locSamples, 
                deviceExpl, 
                profile,
                (confirmModalState.isOffSite || confirmModalState.isLowAccuracy) ? 'pending' : 'active'
            );
            
            // 2. Refresh local records 
            const newRecord = { 
                type: confirmModalState.type, 
                timestamp: new Date().toISOString(),
                insideGeofence: confirmModalState.targetGeoResult?.insideGeofence
            };
            const updatedRecs = [...todayRecords, newRecord];
            setTodayRecords(updatedRecs);
            
            // 3. Compute and save summary
            const newStatus = await computeAndSaveSummary(profile, updatedRecs);
            
            // 4. Send notification to LF (Adviser)
            try {
                const initials = profile.adviser || profile.Adviser || profile.assignedIC || "LF";
                const isOffSite = confirmModalState.isOffSite;
                const isLowAccuracy = confirmModalState.isLowAccuracy;
                const title = isLowAccuracy ? "Clock In/Out Dispute (Low GPS Accuracy)" : (isOffSite ? "Off-site Clock In/Out" : "Trainee Clock In/Out");
                const message = `${profile.name || profile.given || 'Trainee'} clocked ${confirmModalState.type.toLowerCase()}${isOffSite ? ' off-site' : ''}${isLowAccuracy ? ' with low GPS accuracy (' + Math.round(livePos.accuracy) + 'm)' : ''}.${remarks ? ' Remarks: ' + remarks : ''}`;
                await addDoc(collection(db, "bstpNotifications"), {
                    title: title,
                    message: message,
                    targetInitials: initials,
                    timestamp: new Date(),
                    studentNo: profile.studentId,
                    type: isLowAccuracy ? 'dispute_attendance' : (isOffSite ? 'offsite_attendance' : 'regular_attendance')
                });
            } catch(e) {
                console.error("Failed to send clock in/out notification:", e);
            }
            
            alert(`Successfully logged ${confirmModalState.type}! Status: ${newStatus}`);
            setConfirmModalState(null);
            if (onRefresh) onRefresh();

        } catch (e) {
            console.error(e);
            alert("Failed to log attendance. Check connection.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- QR SCANNER LOGIC ---
    useEffect(() => {
        if (isScannerOpen) {
            const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 }, false);
            scannerRef.current = scanner;
            
            scanner.render(async (decodedText) => {
                scanner.clear();
                setIsScannerOpen(false);
                
                try {
                    const qrRoom = JSON.parse(decodedText);
                    if (!qrRoom.lat || !qrRoom.lng || !qrRoom.roomId) {
                        return alert("Invalid Room QR Code format.");
                    }
                    
                    if (!livePos) {
                        return alert("Live location not acquired yet. Cannot verify geofence.");
                    }
                    
                    const dist = haversine(livePos.lat, livePos.lng, qrRoom.lat, qrRoom.lng);
                    const isInside = dist <= (qrRoom.radiusMeters || 100);
                    
                    if (!isInside) {
                        return alert(`You are ${Math.round(dist)}m away from ${qrRoom.name}. You must be within ${qrRoom.radiusMeters}m to clock in to this skillset room.`);
                    }
                    
                    const targetGeoResult = {
                        venueId: qrRoom.roomId,
                        venueName: qrRoom.name,
                        distanceM: Math.round(dist),
                        insideGeofence: isInside
                    };
                    
                    setIsSubmitting(true);
                    
                    try {
                        const venueDoc = await getDoc(doc(db, "artifacts", "dualtech-ojt-portal", "public", "data", "bstpVenues", qrRoom.roomId));
                        if (venueDoc.exists()) {
                            const vData = venueDoc.data();
                            const capacity = vData.capacity || 0;
                            if (capacity > 0) {
                                const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
                                const q1 = query(collection(db, "artifacts", "dualtech-ojt-portal", "public", "data", "bstpAttendance"), where("roomId", "==", qrRoom.roomId));
                                const q2 = query(collection(db, "artifacts", "dualtech-ojt-portal", "public", "data", "bstpAttendance"), where("venueId", "==", qrRoom.roomId));
                                
                                const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
                                const uniqueDocs = new Map();
                                snap1.forEach(d => uniqueDocs.set(d.id, d.data()));
                                snap2.forEach(d => uniqueDocs.set(d.id, d.data()));
                                
                                const appr = [];
                                const outSet = new Set();
                                
                                for (const data of uniqueDocs.values()) {
                                    const dStr = new Date(data.timestamp).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
                                    if (dStr === todayStr) {
                                        if (data.type === 'SKILLSET_IN' && data.status === 'approved') appr.push(data);
                                        else if (data.type === 'SKILLSET_OUT') outSet.add(data.studentNo || data.profileId || data.userEmail);
                                    }
                                }
                                
                                let activeVerified = 0;
                                for (const t of appr) {
                                    const sid = t.studentNo || t.profileId || t.userEmail;
                                    if (!outSet.has(sid)) activeVerified++;
                                }
                                
                                if (activeVerified >= capacity) {
                                    setIsSubmitting(false);
                                    return alert(`Cannot clock in. Room ${qrRoom.name} is full (${activeVerified}/${capacity} verified trainees).`);
                                }
                            }
                        }
                    } catch (e) {
                        console.error("Capacity check error:", e);
                    }

                    await logAttendance(
                        'SKILLSET_IN',
                        qrRoom.skillset || '',
                        targetGeoResult,
                        livePos,
                        '',
                        locSamples,
                        '',
                        profile,
                        'pending'
                    );
                    
                    alert(`Successfully clocked in to ${qrRoom.name} (Pending)!`);
                    fetchTodayRecords();
                    if (onRefresh) onRefresh();
                    
                } catch (e) {
                    console.error("QR Parse or Log Error:", e);
                    alert("Error processing QR Code. Please ensure it's a valid Dualtech Room QR.");
                } finally {
                    setIsSubmitting(false);
                }
            }, (error) => {
                // Ignore scan errors, they happen continuously until a QR is found
            });
            
            return () => {
                if (scannerRef.current) {
                    scannerRef.current.clear().catch(e => console.error(e));
                }
            };
        }
    }, [isScannerOpen, livePos, locSamples, profile, onRefresh]);

    const currentHour = new Date().getHours();
    let greeting = "Good Evening,";
    if (currentHour < 12) greeting = "Good Morning,";
    else if (currentHour < 18) greeting = "Good Afternoon,";

    const firstName = profile?.firstName || profile?.given || (profile?.name ? profile.name.split(' ')[0] : "Trainee");

    return (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
            
            {/* Clock & Greeting Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 flex justify-between items-center relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{greeting}</p>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{firstName}</h2>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {profile?.skillset && (
                            <span className="px-3 py-1 bg-amber-100/50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-200">
                                {profile.skillset}
                            </span>
                        )}
                        {profile?.group && (
                            <span className="px-3 py-1 bg-blue-100/50 text-blue-700 text-[10px] font-bold rounded-full border border-blue-200">
                                {profile.group}
                            </span>
                        )}
                    </div>
                </div>
                <div className="text-right relative z-10">
                    <div className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight font-mono">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                    <div className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
                        {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                </div>
            </div>

            {/* DEVICE RECOGNITION WARNING */}
            {profile?.deviceId && profile.deviceId !== navigator.userAgent && 
             !(profile.trustedDevices || []).some(trusted => {
                 const getHardwareSignature = (ua) => {
                     if (/iPhone|iPad|iPod/i.test(ua)) return "Apple Mobile Device";
                     const androidMatch = ua.match(/Android[^;]*;([^)]+)/);
                     if (androidMatch) return androidMatch[1].replace(/wv/ig, '').trim();
                     return ua.split(' ')[0];
                 };
                 return getHardwareSignature(trusted) === getHardwareSignature(navigator.userAgent);
             }) && (
                <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-xl shadow-sm">
                    <div className="flex items-start">
                        <AlertCircle className="text-red-500 mt-0.5 mr-3" size={20} />
                        <div>
                            <h3 className="text-red-800 dark:text-red-400 font-bold text-sm">Unrecognized Device</h3>
                            <p className="text-red-700 dark:text-red-300 text-xs mt-1">
                                You are using an unrecognized device. For security reasons, attendance tracking is disabled. Please use your registered device.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* MAP PREVIEW & GEOFENCE NOTIFICATION */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <MapPin size={16} className="text-blue-500" /> Current Location
                        {livePos && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${livePos.accuracy <= 150 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                ± {Math.round(livePos.accuracy)}m
                            </span>
                        )}
                    </h3>
                    {schoolGeoResult && (
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${schoolGeoResult.insideGeofence ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {schoolGeoResult.insideGeofence ? 'On Campus' : 'Off Campus'}
                        </div>
                    )}
                </div>
                
                <div className="h-48 w-full bg-slate-100 relative">
                    {!livePos && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                            <Loader2 className="animate-spin mb-2" size={24} />
                            <p className="text-xs font-bold">Acquiring GPS...</p>
                        </div>
                    )}
                    {livePos && schoolLocation && (
                        <MapContainer 
                            ref={mapRef}
                            className="z-0"
                            center={[livePos.lat, livePos.lng]} 
                            zoom={16} 
                            style={{ height: '100%', width: '100%' }}
                            zoomControl={false}
                        >
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            />
                            
                            {/* Campus Geofence Circle */}
                            {schoolLocation.latitude && schoolLocation.longitude && (
                                <Circle 
                                    center={[schoolLocation.latitude, schoolLocation.longitude]}
                                    radius={schoolLocation.radiusMeters || 500}
                                    pathOptions={{ color: 'green', fillColor: 'green', fillOpacity: 0.1, weight: 2 }}
                                />
                            )}
                            
                            {/* User Live Position */}
                            <Marker position={[livePos.lat, livePos.lng]}>
                                <Popup>You are here (Acc: {Math.round(livePos.accuracy)}m)</Popup>
                            </Marker>
                        </MapContainer>
                    )}
                    
                    {livePos && (
                        <button 
                            onClick={() => mapRef.current?.flyTo([livePos.lat, livePos.lng], 16)}
                            className="absolute bottom-4 right-4 z-[1000] bg-white text-slate-700 p-2.5 rounded-full shadow-md border border-slate-200 hover:bg-slate-50 transition-colors"
                            title="Recenter Map"
                        >
                            <MapPin size={20} className="text-blue-600" />
                        </button>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-2">
                <button 
                    onClick={() => handleActionClick('IN')} 
                    disabled={hasTimedIn || hasTimedOut}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 hover:border-amber-400 transition-colors shadow-sm disabled:opacity-50">
                    <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                        <Clock size={24} className="text-amber-500" />
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-300 text-xs text-center">CLOCK IN</span>
                </button>
                <button 
                    onClick={() => handleActionClick('OUT')} 
                    disabled={!hasTimedIn || hasTimedOut}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 hover:border-red-400 transition-colors shadow-sm disabled:opacity-50">
                    <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                        <Clock size={24} className="text-red-500" />
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-300 text-xs text-center">CLOCK OUT</span>
                </button>
                
                {hasTimedIn && !hasTimedOut && !activeSkillsetIn && !isClockInPending && (
                    <button 
                        onClick={() => setIsScannerOpen(true)}
                        className="col-span-2 bg-blue-600 hover:bg-blue-700 border border-blue-500 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 transition-colors shadow-sm text-white mt-2">
                        <QrCode size={32} />
                        <span className="font-bold text-sm text-center">Scan Room QR Code</span>
                        <span className="text-xs text-blue-200 text-center">Clock into a skillset room</span>
                    </button>
                )}

                {hasTimedIn && !hasTimedOut && !activeSkillsetIn && isClockInPending && (
                    <div className="col-span-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-start gap-3 mt-2">
                        <AlertCircle size={20} className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <span className="block font-bold text-sm text-amber-800 dark:text-amber-400">Pending Approval</span>
                            <span className="block text-xs text-amber-700 dark:text-amber-500 mt-1">Your off-site clock-in is pending approval from your Learning Facilitator. You cannot scan into a skillset until it is approved.</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Skillset Check-ins Display */}
            {skillsetSessions.length > 0 && (
                <div className="mt-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                    <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                        <h4 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 text-sm">
                            <MapPin size={16} className="text-blue-500" /> Skillset History
                        </h4>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {skillsetSessions.map((session, idx) => (
                            <div key={idx} className="p-3 flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-sm dark:text-slate-300">
                                        {session.inRec.skillset || profile?.skillset || 'Skillset'} - {session.inRec.roomName || 'Unknown Room'}
                                        {session.inRec.verifiedBy && <span className="text-xs text-slate-500 font-normal"> (verified by {session.inRec.verifiedByInitials || lfAccounts[session.inRec.verifiedBy] || session.inRec.verifiedBy.split('@')[0].toUpperCase()})</span>}
                                    </p>
                                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                                        In: {new Date(session.inRec.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        {session.outRec && ` | Out: ${new Date(session.outRec.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                                    </p>
                                    {session.durationStr && (
                                        <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-1">Duration: {session.durationStr}</p>
                                    )}
                                </div>
                                <div>
                                    {session.outRec ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
                                            Completed
                                        </span>
                                    ) : (
                                        session.inRec.status === 'approved' ? (
                                            <button 
                                                onClick={() => clockOutSkillset(session.inRec)}
                                                disabled={isSubmitting}
                                                className="bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
                                            >
                                                Clock Out
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                                    <Loader2 size={12} className="animate-spin"/> Pending
                                                </span>
                                                <button onClick={() => cancelSkillsetCheckIn(session.inRec.docId || session.inRec.id)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500" title="Cancel">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* QR Scanner Modal */}
            {isScannerOpen && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                            <h2 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <QrCode className="text-blue-500" size={20}/> Scan QR Code
                            </h2>
                            <button onClick={() => setIsScannerOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-4">
                            <div id="reader" className="w-full rounded-2xl overflow-hidden bg-black"></div>
                            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">Point your camera at the Room QR Code to automatically clock in.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Modal */}
            {confirmModalState && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md animate-in slide-in-from-bottom-8">
                        <div className="p-6">
                            <div className={`w-16 h-16 rounded-full bg-${confirmModalState.color}-50 dark:bg-${confirmModalState.color}-900/20 text-${confirmModalState.color}-500 flex items-center justify-center mb-4 mx-auto`}>
                                <confirmModalState.icon size={32} />
                            </div>
                            <h2 className="text-xl font-bold text-center text-slate-800 dark:text-slate-100 mb-2">{confirmModalState.title}</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-6">{confirmModalState.desc}</p>

                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800 mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-slate-500">Location Status</span>
                                    {confirmModalState.isOffSite ? (
                                        <span className="text-xs font-bold px-2 py-1 bg-amber-100 text-amber-700 rounded-full">Off-Site ({confirmModalState.targetGeoResult?.distanceM}m)</span>
                                    ) : (
                                        <span className="text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded-full">On-Site</span>
                                    )}
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-500">Accuracy</span>
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{Math.round(livePos.accuracy)}m</span>
                                </div>
                            </div>

                            <div className="space-y-4 mb-6">
                                {confirmModalState.isOffSite && (
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Remarks (Required because off-site) *</label>
                                        <textarea value={remarks} onChange={e=>setRemarks(e.target.value)} placeholder="Explain why you are off-site..." className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" rows={2} required />
                                    </div>
                                )}
                                
                                {!!profile.registeredDeviceId && profile.registeredDeviceId !== localStorage.getItem('ams_device_id') && (
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Unregistered Device Explanation *</label>
                                        <textarea value={deviceExpl} onChange={e=>setDeviceExpl(e.target.value)} placeholder="Explain why you are using a different device..." className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" rows={2} required />
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => setConfirmModalState(null)} disabled={isSubmitting} className="py-3 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl">Cancel</button>
                                <button onClick={handleConfirmSubmit} disabled={isSubmitting} className={`py-3 font-bold text-white rounded-xl flex items-center justify-center gap-2 bg-${confirmModalState.color}-500 hover:bg-${confirmModalState.color}-600 disabled:opacity-50`}>
                                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Confirm'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

