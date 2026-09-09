<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Learning Facilitator Portal</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                    },
                    animation: {
                        'spin-slow': 'spin 3s linear infinite',
                        'bounce-short': 'bounce 1s ease-in-out 3',
                    }
                }
            }
        }
    </script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <script type="importmap">
    {
        "imports": {
            "react": "https://esm.sh/react@18.2.0",
            "react-dom/client": "https://esm.sh/react-dom@18.2.0/client",
            "react/jsx-runtime": "https://esm.sh/react@18.2.0/jsx-runtime",
            "lucide-react": "https://esm.sh/lucide-react@0.294.0?external=react",
            "firebase/app": "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js",
            "firebase/auth": "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js",
            "firebase/firestore": "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js",
            "firebase/app-check": "https://www.gstatic.com/firebasejs/11.6.1/firebase-app-check.js"
        }
    }
    </script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; overflow: hidden; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 8px; }
        html.dark ::-webkit-scrollbar-thumb { background: #475569; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        html.dark ::-webkit-scrollbar-thumb:hover { background: #64748b; }
    </style>
    <script src="https://unpkg.com/html5-qrcode" type="text/javascript"></script>
</head>
<body class="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 h-screen w-screen transition-colors duration-200">
    <div id="root" class="h-full w-full"></div>
    <script type="text/babel" data-type="module">
        import React, { useState, useEffect, useRef } from 'react';
        import { createRoot } from 'react-dom/client';
        import * as Lucide from 'lucide-react';
        import { initializeApp } from 'firebase/app';
        import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
        import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
        import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';

        const { QrCode,  Users, LogOut, Loader2, Moon, Sun, Lock, Mail, Shield, AlertTriangle, CheckCircle2, UserPlus, FileText, ClipboardList, MapPin, Search , Menu, Globe, RefreshCw, History, X, Bell } = Lucide;

        // --- Firebase Configuration ---
        const firebaseConfig = {
            apiKey: "AIzaSyAPpy4VcR2uTIPmH01aJ3GvegSDzNNpM9U",
            authDomain: "dualtech-ojt-portal.firebaseapp.com",
            projectId: "dualtech-ojt-portal",
            storageBucket: "dualtech-ojt-portal.firebasestorage.app",
            messagingSenderId: "255242185978",
            appId: "1:255242185978:web:2f07c554fad2e3a78ead43"
        };
        const app = initializeApp(firebaseConfig);
        const appCheck = initializeAppCheck(app, {
            provider: new ReCaptchaEnterpriseProvider('6LeGUowtAAAAALQKvlwQ1T7UtdbAqcL47wPVBxff'),
            isTokenAutoRefreshEnabled: true
        });
        const auth = getAuth(app);
        const db = getFirestore(app);
        const APP_ID = "dualtech-ojt-portal";
        
        // --- Google Apps Script Webhook ---
        const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxl_hDEqFZ7mTuBvLsPwfs2l3nCHH2UonqaDGdrbKlJ-rg13F02WsjROINdf-3nHyjtTA/exec"; 

        function RegistrationForm({ onBack, showMessage }) {
            const [formData, setFormData] = useState({
                lastName: '', firstName: '', middleName: '', suffix: '', initials: '',
                contactNo: '', email: '', password: '', address: '',
                altEmail: '', fbMessenger: '', agreePrivacy: false
            });
            const [loading, setLoading] = useState(false);
            const [showPrivacy, setShowPrivacy] = useState(false);

            const handleSubmit = async (e) => {
                e.preventDefault();
                if (!formData.email.endsWith('@dualtech.edu.ph')) {
                    showMessage('Must use a @dualtech.edu.ph email address', 'error');
                    return;
                }
                if (!formData.agreePrivacy) {
                    showMessage('You must agree to the privacy policy', 'error');
                    return;
                }
                
                setLoading(true);
                window.isRegisteringFlow = true;
                try {
                    // 1. Create Auth Account
                    let user;
                    try {
                        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
                        user = userCredential.user;
                    } catch (err) {
                        if (err.code === 'auth/email-already-in-use') {
                            try {
                                const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
                                user = userCredential.user;
                                
                                // Check if they were deleted
                                const docRef = doc(db, 'bstpUsers', user.uid);
                                const docSnap = await getDoc(docRef);
                                if (docSnap.exists() && docSnap.data().status !== 'Deleted') {
                                    await signOut(auth);
                                    throw new Error("This email is already registered and active. Please login instead.");
                                }
                            } catch(signInErr) {
                                if (signInErr.message.includes('registered and active')) throw signInErr;
                                throw new Error("This email is already registered. If re-registering, use your original password.");
                            }
                        } else {
                            throw err;
                        }
                    }
                    
                    const fullName = `${formData.lastName}, ${formData.firstName} ${formData.middleName} ${formData.suffix}`.trim();

                    // 2. Write to bstpUsers with status Pending
                    const newDocRef = doc(db, 'bstpUsers', user.uid);
                    await setDoc(newDocRef, {
                        name: fullName,
                        email: formData.email,
                        role: 'Learning Facilitator',
                        status: 'Pending',
                        lastName: formData.lastName,
                        firstName: formData.firstName,
                        middleName: formData.middleName,
                        suffix: formData.suffix,
                        initials: formData.initials,
                        contactNo: formData.contactNo,
                        address: formData.address,
                        altEmail: formData.altEmail,
                        fbMessenger: formData.fbMessenger,
                        createdAt: new Date().toISOString()
                    });

                    // 3. Fetch Admin Emails
                    let targetAdminEmails = [];
                    try {
                        const adminQuery = query(collection(db, "admins"), where("allowedPortals", "array-contains", "bstp_admin_portal"));
                        const adminSnap = await getDocs(adminQuery);
                        targetAdminEmails = adminSnap.docs.map(d => d.data().email).filter(Boolean);
                        
                        if (targetAdminEmails.length === 0) {
                            alert("DEBUG: The query succeeded but found 0 admins with bstp_admin_portal permission. Check your adminsystem.html to ensure an admin is added with this portal checked.");
                        }
                    } catch(err) {
                        console.error("Failed to fetch admins", err);
                        alert("DEBUG: Permission Denied when reading admins. The Firestore rule is either missing, incorrect, or hasn't propagated yet. Error: " + err.message);
                    }

                    // 4. Send Email Notification via Apps Script
                    try {
                        if (APPS_SCRIPT_URL !== "YOUR_APPS_SCRIPT_URL_HERE") {
                            // Fire and forget, do not await to prevent blocking
                            fetch(APPS_SCRIPT_URL, {
                                method: "POST",
                                body: JSON.stringify({
                                    type: "lfRegistration",
                                    name: fullName,
                                    email: formData.email,
                                    contact: formData.contactNo,
                                    targetEmails: targetAdminEmails.concat([formData.email])
                                }),
                                headers: { "Content-Type": "text/plain;charset=utf-8" }
                            }).catch(err => console.error("Failed to send email", err));
                        }
                    } catch(err) {
                        console.error("Failed to send email block", err);
                    }

                    // 5. Sign out immediately so they wait for approval
                    await signOut(auth);
                    showMessage('Registration successful! Please wait for admin approval. An email has been sent to you.', 'success');
                    onBack();

                } catch (error) {
                    showMessage('Registration failed: ' + error.message, 'error');
                } finally {
                    window.isRegisteringFlow = false;
                    setLoading(false);
                }
            };

            return (
                <div className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 my-auto h-fit">
                    <div className="bg-blue-600 p-8 text-white text-center relative">
                        <button onClick={onBack} className="absolute left-6 top-8 text-blue-200 hover:text-white font-bold text-sm">← Back to Login</button>
                        <Shield size={48} className="mx-auto mb-4 opacity-90" />
                        <h2 className="text-3xl font-black mb-2">LF Registration</h2>
                        <p className="text-blue-100 font-medium">Register to manage BSTP trainees.</p>
                    </div>
                    <form onSubmit={handleSubmit} className="p-8 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Last Name *</label>
                                <input required type="text" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900" value={formData.lastName} onChange={e=>setFormData({...formData, lastName:e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">First Name *</label>
                                <input required type="text" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900" value={formData.firstName} onChange={e=>setFormData({...formData, firstName:e.target.value})} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Middle Name</label>
                                <input type="text" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900" value={formData.middleName} onChange={e=>setFormData({...formData, middleName:e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Suffix</label>
                                <input type="text" placeholder="e.g. Jr" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900" value={formData.suffix} onChange={e=>setFormData({...formData, suffix:e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Initials *</label>
                                <input required type="text" placeholder="e.g. RJRA" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 uppercase" value={formData.initials} onChange={e=>setFormData({...formData, initials:e.target.value.toUpperCase()})} />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Dualtech Email *</label>
                                <input required type="email" placeholder="@dualtech.edu.ph" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900" value={formData.email} onChange={e=>setFormData({...formData, email:e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Password *</label>
                                <input required type="password" minLength={6} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900" value={formData.password} onChange={e=>setFormData({...formData, password:e.target.value})} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Complete Address *</label>
                            <input required type="text" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900" value={formData.address} onChange={e=>setFormData({...formData, address:e.target.value})} />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Contact No. *</label>
                                <input required type="text" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900" value={formData.contactNo} onChange={e=>setFormData({...formData, contactNo:e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Alt Email</label>
                                <input type="email" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900" value={formData.altEmail} onChange={e=>setFormData({...formData, altEmail:e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">FB Messenger</label>
                                <input type="text" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900" value={formData.fbMessenger} onChange={e=>setFormData({...formData, fbMessenger:e.target.value})} />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100 dark:border-slate-700 flex flex-col gap-2">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input type="checkbox" className="mt-1 w-5 h-5" required checked={formData.agreePrivacy} onChange={e=>setFormData({...formData, agreePrivacy:e.target.checked})} />
                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                    I agree to the <span onClick={(e)=>{e.preventDefault(); setShowPrivacy(true);}} className="text-blue-600 dark:text-blue-400 font-bold hover:underline">Privacy Agreement</span> clause regarding data protection and confidentiality.
                                </span>
                            </label>
                            
                            <button disabled={loading} type="submit" className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black py-4 rounded-xl flex justify-center items-center gap-2 shadow-lg hover:shadow-xl transition-all">
                                {loading ? <Loader2 className="animate-spin" /> : <UserPlus />}
                                Register as LF
                            </button>
                        </div>
                    </form>

                    {showPrivacy && (
                        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[80vh]">
                                <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Privacy Agreement</h3>
                                </div>
                                <div className="p-6 overflow-y-auto text-sm text-slate-600 dark:text-slate-400 space-y-4">
                                    <p>By registering as a Learning Facilitator in the Dualtech BSTP Admin Portal, you agree to the following terms regarding data privacy and confidentiality:</p>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li>You acknowledge that you will have access to sensitive personal information of trainees.</li>
                                        <li>You agree to use this information strictly for advisory, attendance, and evaluation purposes only.</li>
                                        <li>You must not disclose, share, or distribute any trainee information to unauthorized third parties.</li>
                                        <li>Your account and actions within the portal are monitored and logged.</li>
                                        <li>Any violation of these terms may result in account termination and disciplinary actions according to Dualtech Center policies.</li>
                                    </ul>
                                </div>
                                <div className="p-6 border-t border-slate-100 dark:border-slate-700">
                                    <button onClick={() => setShowPrivacy(false)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors">I Understand</button>
                                </div>
                            </div>
                        </div>
                    )}
                    
                </div>
            );
        }

        
                        function ManageClassTab({ lfData, showMessage }) {
            const [isScanning, setIsScanning] = useState(false);
            const [roomId, setRoomId] = useState(null);
            const [roomName, setRoomName] = useState("");
            const [roomSkillset, setRoomSkillset] = useState("");
            const [roomCapacity, setRoomCapacity] = useState(0);
            
            const [pendingTrainees, setPendingTrainees] = useState([]);
            const [approvedTrainees, setApprovedTrainees] = useState([]);
            const [loading, setLoading] = useState(false);
            
            const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });
            const [selectedIds, setSelectedIds] = useState(new Set());
            
            // Modal state for override remarks
            const [overrideModal, setOverrideModal] = useState({ show: false, trainee: null, newRemarks: "" });
            const [promptModal, setPromptModal] = useState({ show: false, qrRoom: null });
            const [historyModal, setHistoryModal] = useState({ show: false });
            const [classHistory, setClassHistory] = useState([]);
            const scannerRef = useRef(null);

            // 1. Session Persistence
            useEffect(() => {
                const saved = localStorage.getItem('lfClassHistory');
                if (saved) {
                    try { setClassHistory(JSON.parse(saved)); } catch(e){}
                }
                const savedSession = localStorage.getItem('lfActiveRoom');
                if (savedSession) {
                    try {
                        const parsed = JSON.parse(savedSession);
                        if (parsed.roomId && parsed.timestamp) {
                            // Expire session after 12 hours
                            if (new Date() - new Date(parsed.timestamp) < 12 * 60 * 60 * 1000) {
                                setRoomId(parsed.roomId);
                                setRoomName(parsed.roomName);
                                setRoomSkillset(parsed.roomSkillset || "");
                                fetchClassRoster(parsed.roomId);
                            } else {
                                localStorage.removeItem('lfActiveRoom');
                            }
                        }
                    } catch (e) {
                        localStorage.removeItem('lfActiveRoom');
                    }
                }
            }, []);

            function haversine(lat1, lon1, lat2, lon2) {
                const R = 6371e3;
                const φ1 = lat1 * Math.PI/180;
                const φ2 = lat2 * Math.PI/180;
                const Δφ = (lat2-lat1) * Math.PI/180;
                const Δλ = (lon2-lon1) * Math.PI/180;
                const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                return R * c;
            }

            const getLiveLocation = () => {
                return new Promise((resolve, reject) => {
                    if (!navigator.geolocation) {
                        reject(new Error("Geolocation is not supported."));
                    } else {
                        navigator.geolocation.getCurrentPosition(
                            pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                            err => reject(err),
                            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                        );
                    }
                });
            };

            useEffect(() => {
                if (isScanning && !scannerRef.current) {
                    try {
                        const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 }, false);
                        scannerRef.current = scanner;
                        
                        scanner.render(async (decodedText) => {
                            scanner.clear();
                            setIsScanning(false);
                            try {
                                const qrRoom = JSON.parse(decodedText);
                                if (!qrRoom.roomId) {
                                    return showMessage("Invalid Room QR Code format.", "error");
                                }
                                
                                setLoading(true);
                                showMessage("Acquiring location...", "info");
                                
                                let livePos;
                                try {
                                    livePos = await getLiveLocation();
                                } catch (e) {
                                    setLoading(false);
                                    return showMessage("Could not acquire location. Please allow location access.", "error");
                                }
                                
                                const dist = haversine(livePos.lat, livePos.lng, qrRoom.lat, qrRoom.lng);
                                const radius = qrRoom.radiusMeters || 100;
                                
                                if (dist > radius) {
                                    setLoading(false);
                                    return showMessage(`Too far from room (${Math.round(dist)}m). Must be within ${radius}m.`, "error");
                                }
                                
                                const qSkill = query(collection(db, "artifacts", "dualtech-ojt-portal", "public", "data", "bstpSkillsets"), where("name", "==", qrRoom.skillset || ""));
                                const snapSkill = await getDocs(qSkill);
                                if (snapSkill.empty) {
                                    setLoading(false);
                                    return showMessage(`Skillset '${qrRoom.skillset}' not found in database.`, "error");
                                }
                                
                                const skillData = snapSkill.docs[0].data();
                                const assignedLFs = skillData.assignedLFs || [];
                                
                                const lfName = lfData.name || '';
                                let initials = lfData.initials;
                                if (!initials) {
                                    const parts = lfName.split(' ').filter(Boolean);
                                    initials = parts.map(p => p.charAt(0).toUpperCase()).join('');
                                }
                                if (!initials) initials = 'LF';
                                const formattedName = `${initials} (${lfName})`;
                                
                                if (!assignedLFs.includes(formattedName)) {
                                    setLoading(false);
                                    return showMessage(`You are not authorized for '${qrRoom.skillset}'.`, "error");
                                }
                                
                                setLoading(false);
                                setPromptModal({ show: true, qrRoom: qrRoom });
                                
                            } catch (e) {
                                setLoading(false);
                                console.error("Scan Error Details:", e);
                                showMessage("Scan Error: " + (e.message || "Unknown error"), "error");
                            }
                        }, (err) => {
                            // ignore continuous errors
                        });
                    } catch (e) {
                        console.error("Scanner error", e);
                    }
                }
                
                return () => {
                    if (scannerRef.current) {
                        try { scannerRef.current.clear(); } catch(e){}
                        scannerRef.current = null;
                    }
                };
            }, [isScanning]);

            async function fetchClassRoster(rId) {
                setLoading(true);
                setSelectedIds(new Set());
                try {
                    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
                    
                    // Fetch room capacity
                    try {
                        const venueDoc = await getDoc(doc(db, "artifacts", "dualtech-ojt-portal", "public", "data", "bstpVenues", rId));
                        if (venueDoc.exists()) {
                            setRoomCapacity(venueDoc.data().capacity || 0);
                        } else {
                            setRoomCapacity(0);
                        }
                    } catch (e) {
                        console.error("Error fetching room capacity:", e);
                    }

                    // Fetch by both roomId and venueId to be absolutely safe
                    const q1 = query(collection(db, "artifacts", "dualtech-ojt-portal", "public", "data", "bstpAttendance"), where("roomId", "==", rId));
                    const q2 = query(collection(db, "artifacts", "dualtech-ojt-portal", "public", "data", "bstpAttendance"), where("venueId", "==", rId));
                    
                    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
                    const uniqueDocs = new Map();
                    
                    snap1.forEach(d => uniqueDocs.set(d.id, d));
                    snap2.forEach(d => uniqueDocs.set(d.id, d));

                    const pend = [];
                    const appr = [];
                    const outSet = new Set();
                    
                    for (const [id, docSnap] of uniqueDocs.entries()) {
                        const data = docSnap.data();
                        const dStr = new Date(data.timestamp).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
                        if (dStr === todayStr) {
                            if (data.type === 'SKILLSET_IN') {
                                if (data.status === 'pending') pend.push({ id: id, ...data });
                                if (data.status === 'approved') appr.push({ id: id, ...data });
                            } else if (data.type === 'SKILLSET_OUT') {
                                outSet.add(data.studentNo || data.profileId || data.userEmail);
                            }
                        }
                    }
                    
                    const enrichWithProfiles = async (arr) => {
                        return await Promise.all(arr.map(async (t) => {
                            t.studentId = t.studentNo || "N/A";
                            t.section = "N/A";
                            t.profileName = t.name || t.userEmail;
                            t.isLate = (t.remarks || "").toLowerCase().includes("late");

                            let pRefId = t.profileId || t.studentNo || t.studentId;
                            if (pRefId && pRefId !== "N/A") {
                                try {
                                    const pDocRef = doc(db, "artifacts", "dualtech-ojt-portal", "public", "data", "profiles", String(pRefId));
                                    const pSnap = await getDoc(pDocRef);
                                    if (pSnap.exists()) {
                                        const pData = pSnap.data();
                                        t.profileName = pData.name || `${pData.firstName || pData.given || ''} ${pData.lastName || pData.family || ''}`.trim() || t.profileName;
                                        t.section = pData.section || pData.Section || "N/A";
                                        t.studentId = pData.studentId || pData.studentNo || t.studentId;
                                    }
                                } catch(e) { console.error("Error fetching profile", e); }
                            }
                            t.hasOut = outSet.has(t.studentNo) || outSet.has(t.profileId) || outSet.has(t.userEmail) || outSet.has(t.studentId);
                            return t;
                        }));
                    };
                    
                    setPendingTrainees(await enrichWithProfiles(pend));
                    setApprovedTrainees(await enrichWithProfiles(appr));

                } catch (e) {
                    console.error("fetch roster error", e);
                    showMessage("Error fetching roster: " + e.message, "error");
                }
                setLoading(false);
            }

            const handleLeaveRoom = () => {
                if (window.confirm("Are you sure you want to leave this room session?")) {
                    setRoomId(null);
                    setRoomName("");
                    setRoomSkillset("");
                    setPendingTrainees([]);
                    setApprovedTrainees([]);
                    localStorage.removeItem('lfActiveRoom');
                }
            };

            const toggleSelect = (id) => {
                const newSet = new Set(selectedIds);
                if (newSet.has(id)) newSet.delete(id);
                else newSet.add(id);
                setSelectedIds(newSet);
            };

            const toggleSelectAll = () => {
                if (selectedIds.size === pendingTrainees.length && pendingTrainees.length > 0) {
                    setSelectedIds(new Set());
                } else {
                    setSelectedIds(new Set(pendingTrainees.map(t => t.id)));
                }
            };

            async function verifySelected() {
                if (selectedIds.size === 0) return;
                
                if (roomCapacity > 0) {
                    if (approvedTrainees.length + selectedIds.size > roomCapacity) {
                        if (!window.confirm(`Warning: Verifying these ${selectedIds.size} trainee(s) will exceed the room capacity of ${roomCapacity} (Currently verified: ${approvedTrainees.length}). Do you want to proceed anyway?`)) {
                            return;
                        }
                    }
                }
                
                setLoading(true);
                try {
                    for (const id of selectedIds) {
                        await updateDoc(doc(db, "artifacts", "dualtech-ojt-portal", "public", "data", "bstpAttendance", id), {
                            status: 'approved',
                            verifiedBy: lfData.email,
                            verifiedAt: new Date().toISOString()
                        });
                        
                        const trainee = pendingTrainees.find(p => p.id === id);
                        if (trainee && trainee.studentId) {
                            await addDoc(collection(db, "artifacts", "dualtech-ojt-portal", "public", "data", "notifications"), {
                                targetStudentId: trainee.studentId,
                                title: "Skillset Verified",
                                message: `Your check-in for ${roomName} has been verified by ${lfData.name}.`,
                                timestamp: new Date().toISOString(),
                                read: false,
                                type: "SKILLSET_VERIFIED"
                            });
                        }
                    }
                    showMessage(`Verified ${selectedIds.size} trainees!`);
                    if (roomId) fetchClassRoster(roomId);
                } catch (e) {
                    showMessage("Error verifying trainees: " + e.message, "error");
                }
                setLoading(false);
            }

            async function skillsetOutTrainee(trainee) {
                if (!window.confirm(`Are you sure you want to skillset out ${trainee.profileName}?`)) return;
                setLoading(true);
                try {
                    await addDoc(collection(db, "artifacts", "dualtech-ojt-portal", "public", "data", "bstpAttendance"), {
                        type: 'SKILLSET_OUT',
                        studentNo: trainee.studentId || trainee.studentNo || "",
                        userEmail: trainee.userEmail || "",
                        profileId: trainee.profileId || "",
                        roomId: trainee.roomId || roomId,
                        venueId: trainee.venueId || trainee.roomId || roomId,
                        skillset: trainee.skillset || roomSkillset,
                        status: 'approved',
                        verifiedBy: lfData.email,
                        timestamp: new Date().toISOString(),
                        remarks: 'Skillset out by LF'
                    });
                    showMessage(`Skillset out successful for ${trainee.profileName}.`);
                    if (roomId) fetchClassRoster(roomId);
                } catch (e) {
                    showMessage("Error logging skillset out: " + e.message, "error");
                }
                setLoading(false);
            }

            async function submitOverrideRemarks() {
                if (!overrideModal.trainee) return;
                setLoading(true);
                try {
                    await updateDoc(doc(db, "artifacts", "dualtech-ojt-portal", "public", "data", "bstpAttendance", overrideModal.trainee.id), {
                        remarks: overrideModal.newRemarks
                    });
                    showMessage("Remarks overridden successfully.");
                    setOverrideModal({ show: false, trainee: null, newRemarks: "" });
                    if (roomId) fetchClassRoster(roomId);
                } catch(e) {
                    showMessage("Error saving remarks: " + e.message, "error");
                }
                setLoading(false);
            }

            const requestSort = (key) => {
                let direction = 'asc';
                if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
                setSortConfig({ key, direction });
            };

            const getSortedData = (data) => {
                return [...data].sort((a, b) => {
                    let valA = a[sortConfig.key] || "";
                    let valB = b[sortConfig.key] || "";
                    if (typeof valA === 'string') valA = valA.toLowerCase();
                    if (typeof valB === 'string') valB = valB.toLowerCase();
                    
                    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                    return 0;
                });
            };

            return (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <QrCode className="text-blue-500" /> Manage Class
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                                {roomId ? `Currently managing session for ${roomName}` : "Scan a room QR code to verify checked-in trainees."}
                            </p>
                        </div>
                        
                        {!roomId ? (
                            <div className="flex flex-wrap gap-2">
                                <button 
                                    onClick={async () => {
                                        setHistoryModal({ show: true });
                                        try {
                                            const q = query(collection(db, "artifacts", "dualtech-ojt-portal", "public", "data", "bstpAttendance"), where("verifiedBy", "==", lfData.email));
                                            const snap = await getDocs(q);
                                            const dbHistMap = new Map();
                                            snap.forEach(d => {
                                                const data = d.data();
                                                if (data.roomId && data.roomName) {
                                                    const ts = new Date(data.timestamp).getTime();
                                                    if (!dbHistMap.has(data.roomId) || dbHistMap.get(data.roomId).timestamp < ts) {
                                                        dbHistMap.set(data.roomId, {
                                                            roomId: data.roomId,
                                                            roomName: data.roomName,
                                                            roomSkillset: data.skillset || data.roomSkillset || '',
                                                            timestamp: ts
                                                        });
                                                    }
                                                }
                                            });
                                            const dbArr = Array.from(dbHistMap.values()).map(a => ({...a, timestamp: new Date(a.timestamp).toISOString()}));
                                            
                                            // Merge with local storage
                                            const existingHist = JSON.parse(localStorage.getItem('lfClassHistory') || '[]');
                                            const mergedMap = new Map();
                                            existingHist.forEach(h => mergedMap.set(h.roomId, h));
                                            dbArr.forEach(h => {
                                                if (!mergedMap.has(h.roomId) || new Date(h.timestamp) > new Date(mergedMap.get(h.roomId).timestamp)) {
                                                    mergedMap.set(h.roomId, h);
                                                }
                                            });
                                            
                                            const updatedHist = Array.from(mergedMap.values()).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 50);
                                            setClassHistory(updatedHist);
                                            localStorage.setItem('lfClassHistory', JSON.stringify(updatedHist));
                                        } catch (e) {
                                            console.error("Error fetching DB history:", e);
                                        }
                                    }}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-6 rounded-xl flex items-center gap-2 transition-colors dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200"
                                >
                                    <History size={18}/> History
                                </button>
                                <button 
                                    onClick={() => setIsScanning(!isScanning)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-xl flex items-center gap-2 transition-colors"
                                >
                                    <QrCode size={18}/> {isScanning ? "Cancel Scan" : "Scan Room QR Code"}
                                </button>
                            </div>
                        ) : (
                            <button 
                                onClick={handleLeaveRoom}
                                className="bg-rose-100 text-rose-600 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-400 font-bold py-2 px-6 rounded-xl flex items-center gap-2 transition-colors"
                            >
                                <LogOut size={18}/> Leave Room
                            </button>
                        )}
                    </div>

                    {isScanning && !roomId && (
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 max-w-md mx-auto">
                            <div id="reader" className="w-full rounded-xl overflow-hidden"></div>
                        </div>
                    )}

                    {roomId && (
                        <div className="space-y-6 animate-in fade-in zoom-in-95">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-lg dark:text-white flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                    <span>Room: <span className="text-blue-500">{roomName}</span></span>
                                    {roomSkillset && <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-500">{roomSkillset}</span>}
                                </h3>
                                <button onClick={() => fetchClassRoster(roomId)} className="text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1">
                                    Refresh <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                                </button>
                            </div>

                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center flex-wrap gap-4">
                                    <h4 className="font-bold text-slate-700 dark:text-slate-300">Pending Verification ({pendingTrainees.length})</h4>
                                    {pendingTrainees.length > 0 && (
                                        <button 
                                            onClick={verifySelected} 
                                            disabled={loading || selectedIds.size === 0} 
                                            className="text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-colors"
                                        >
                                            <CheckCircle2 size={16}/> Verify Selected ({selectedIds.size})
                                        </button>
                                    )}
                                </div>
                                
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left whitespace-nowrap min-w-[800px]">
                                        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-500 dark:text-slate-400">
                                            <tr>
                                                <th className="p-4 w-12 text-center">
                                                    <input 
                                                        type="checkbox" 
                                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                        checked={pendingTrainees.length > 0 && selectedIds.size === pendingTrainees.length}
                                                        onChange={toggleSelectAll}
                                                        disabled={pendingTrainees.length === 0}
                                                    />
                                                </th>
                                                <th className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => requestSort('studentId')}>ID {sortConfig.key === 'studentId' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                                                <th className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => requestSort('profileName')}>Name {sortConfig.key === 'profileName' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                                                <th className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => requestSort('section')}>Section {sortConfig.key === 'section' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                                                <th className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => requestSort('timestamp')}>Time In {sortConfig.key === 'timestamp' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                                                <th className="p-4">Status / Remarks</th>
                                                <th className="p-4 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                            {pendingTrainees.length === 0 ? (
                                                <tr>
                                                    <td colSpan="7" className="p-8 text-center text-slate-500 italic">No pending check-ins.</td>
                                                </tr>
                                            ) : (
                                                getSortedData(pendingTrainees).map(t => (
                                                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                                                        <td className="p-4 text-center">
                                                            <input 
                                                                type="checkbox" 
                                                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                                checked={selectedIds.has(t.id)}
                                                                onChange={() => toggleSelect(t.id)}
                                                            />
                                                        </td>
                                                        <td className="p-4 font-mono text-sm dark:text-slate-300">{t.studentId}</td>
                                                        <td className="p-4 font-bold text-slate-800 dark:text-white">{t.profileName}</td>
                                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{t.section}</td>
                                                        <td className="p-4 text-sm font-mono text-slate-600 dark:text-slate-400">{new Date(t.timestamp).toLocaleTimeString()}</td>
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-2">
                                                                {t.isLate ? (
                                                                    <span className="px-2 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-md text-xs font-bold">Late</span>
                                                                ) : (
                                                                    <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-md text-xs font-bold">In Time</span>
                                                                )}
                                                                <span className="text-xs text-slate-500 max-w-[150px] truncate" title={t.remarks}>{t.remarks || "-"}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            <button 
                                                                onClick={() => setOverrideModal({ show: true, trainee: t, newRemarks: t.remarks || "" })}
                                                                className="text-xs text-blue-600 hover:text-blue-800 font-bold underline underline-offset-2"
                                                            >
                                                                Override
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden opacity-80">
                                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                    <h4 className="font-bold text-slate-700 dark:text-slate-300">Verified / Approved ({approvedTrainees.length})</h4>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left whitespace-nowrap min-w-[800px]">
                                        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-500 dark:text-slate-400">
                                            <tr>
                                                <th className="p-4">ID</th>
                                                <th className="p-4">Name</th>
                                                <th className="p-4">Section</th>
                                                <th className="p-4">Time In</th>
                                                <th className="p-4">Status</th>
                                                <th className="p-4 text-center">Verified</th>
                                                <th className="p-4 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                            {approvedTrainees.length === 0 ? (
                                                <tr>
                                                    <td colSpan="7" className="p-6 text-center text-slate-500 italic text-sm">No verified check-ins yet.</td>
                                                </tr>
                                            ) : (
                                                getSortedData(approvedTrainees).map(t => (
                                                    <tr key={t.id}>
                                                        <td className="p-4 font-mono text-sm dark:text-slate-300">{t.studentId}</td>
                                                        <td className="p-4 font-bold text-slate-700 dark:text-slate-300">{t.profileName}</td>
                                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{t.section}</td>
                                                        <td className="p-4 text-sm font-mono text-slate-500">{new Date(t.timestamp).toLocaleTimeString()}</td>
                                                        <td className="p-4 text-xs text-slate-500 truncate max-w-[150px]">{t.remarks || "-"}</td>
                                                        <td className="p-4 text-center text-green-500 flex justify-center"><CheckCircle2 size={18} /></td>
                                                        <td className="p-4 text-center">
                                                            {t.hasOut ? (
                                                                <span className="text-xs text-slate-400 font-bold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">Clocked Out</span>
                                                            ) : (
                                                                <button 
                                                                    onClick={() => skillsetOutTrainee(t)}
                                                                    disabled={loading}
                                                                    className="text-xs bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400 font-bold px-3 py-1 rounded-lg transition-colors"
                                                                >
                                                                    Skillset Out
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {promptModal.show && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700">
                                <div className="p-6 text-center">
                                    <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                                        <QrCode size={32} className="text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Room Verified</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                        You are authorized for <strong>{promptModal.qrRoom.skillset}</strong> and within the geofence of <strong>{promptModal.qrRoom.name || promptModal.qrRoom.roomId}</strong>.
                                    </p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Continue to manage this class?</p>
                                    
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={() => setPromptModal({ show: false, qrRoom: null })}
                                            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={() => {
                                                const rmName = promptModal.qrRoom.name || promptModal.qrRoom.roomId;
                                                setRoomId(promptModal.qrRoom.roomId);
                                                setRoomName(rmName);
                                                setRoomSkillset(promptModal.qrRoom.skillset);
                                                
                                                // Save to History
                                                const historyEntry = {
                                                    roomId: promptModal.qrRoom.roomId,
                                                    roomName: rmName,
                                                    roomSkillset: promptModal.qrRoom.skillset,
                                                    timestamp: new Date().toISOString()
                                                };
                                                const existingHist = JSON.parse(localStorage.getItem('lfClassHistory') || '[]');
                                                const updatedHist = [historyEntry, ...existingHist.filter(h => h.roomId !== historyEntry.roomId)].slice(0, 50);
                                                localStorage.setItem('lfClassHistory', JSON.stringify(updatedHist));
                                                setClassHistory(updatedHist);
                                                
                                                // Save session
                                                localStorage.setItem('lfActiveRoom', JSON.stringify({
                                                    roomId: promptModal.qrRoom.roomId,
                                                    roomName: rmName,
                                                    roomSkillset: promptModal.qrRoom.skillset,
                                                    timestamp: new Date().toISOString()
                                                }));
                                                
                                                fetchClassRoster(promptModal.qrRoom.roomId);
                                                  setPromptModal({ show: false, qrRoom: null });
                                                  sendNotification("LF Scanned Room", `${lfData.firstName} ${lfData.lastName} started a class session in ${rmName} for ${promptModal.qrRoom.skillset}.`);
                                            }}
                                            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg transition-colors"
                                        >
                                            Continue
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {historyModal.show && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700 max-h-[80vh]">
                                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2"><History className="text-blue-500" /> Class History</h3>
                                    <button onClick={() => setHistoryModal({ show: false })} className="text-slate-500 hover:text-slate-800 dark:hover:text-white">
                                        <X size={24} />
                                    </button>
                                </div>
                                <div className="p-6 overflow-y-auto">
                                    {classHistory.length === 0 ? (
                                        <div className="text-center p-8 text-slate-500 italic">No class history found.</div>
                                    ) : (
                                        <div className="space-y-3">
                                            {classHistory.map((h, i) => (
                                                <div key={i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                                                    <div>
                                                        <h4 className="font-bold text-slate-800 dark:text-white">{h.roomName}</h4>
                                                        <p className="text-sm text-slate-500">{h.roomSkillset} &bull; {new Date(h.timestamp).toLocaleString()}</p>
                                                    </div>
                                                    <button 
                                                        onClick={() => {
                                                            setRoomId(h.roomId);
                                                            setRoomName(h.roomName);
                                                            setRoomSkillset(h.roomSkillset || "");
                                                            fetchClassRoster(h.roomId);
                                                            localStorage.setItem('lfActiveRoom', JSON.stringify({
                                                                roomId: h.roomId,
                                                                roomName: h.roomName,
                                                                roomSkillset: h.roomSkillset,
                                                                timestamp: new Date().toISOString()
                                                            }));
                                                            setHistoryModal({ show: false });
                                                        }}
                                                        className="mt-3 sm:mt-0 bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 font-bold px-4 py-2 rounded-xl text-sm transition-colors"
                                                    >
                                                        Resume Session
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {overrideModal.show && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700">
                                <div className="p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Override Remarks</h3>
                                            <p className="text-xs text-slate-500">{overrideModal.trainee?.profileName}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="mb-6">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">New Remarks / Status</label>
                                        <textarea
                                            value={overrideModal.newRemarks}
                                            onChange={(e) => setOverrideModal({...overrideModal, newRemarks: e.target.value})}
                                            className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                                            rows="3"
                                            placeholder="e.g. Excused, Late by 5 mins, etc."
                                        ></textarea>
                                    </div>
                                    
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={() => setOverrideModal({ show: false, trainee: null, newRemarks: "" })}
                                            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={submitOverrideRemarks}
                                            disabled={loading}
                                            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg transition-colors flex justify-center items-center gap-2"
                                        >
                                            {loading ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle2 size={16} />} Save
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        }


        function Dashboard(props) {
            const { user, lfData, showMessage, onLogout, isClockedIn, showClockInModal, schoolLocation, clockingIn, handleClockIn, setShowClockInModal, clockInTime, handleClockOut, showNotifications, setShowNotifications, notifications, dismissNotification, sendNotification } = props;
            
            const [elapsedTime, setElapsedTime] = useState('00:00:00');
            
            useEffect(() => {
                let interval;
                if (isClockedIn && clockInTime) {
                    interval = setInterval(() => {
                        const diff = Math.floor((new Date() - clockInTime) / 1000);
                        const hrs = String(Math.floor(diff / 3600)).padStart(2, '0');
                        const mins = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
                        const secs = String(diff % 60).padStart(2, '0');
                        setElapsedTime(`${hrs}:${mins}:${secs}`);
                    }, 1000);
                } else {
                    setElapsedTime('00:00:00');
                }
                return () => clearInterval(interval);
            }, [isClockedIn, clockInTime]);

            const [activeTab, setActiveTab] = useState('advisory');
            const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
            const [theme, setTheme] = useState(localStorage.getItem('theme') || 'system');

            useEffect(() => {
                const root = window.document.documentElement;
                root.classList.remove('light', 'dark');
                if (theme === 'system') {
                    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    root.classList.add(systemTheme);
                } else {
                    root.classList.add(theme);
                }
                localStorage.setItem('theme', theme);
            }, [theme]);

            return (
                <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
                    {/* Mobile Overlay */}
                    {!isSidebarCollapsed && (
                        <div className="md:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarCollapsed(true)} />
                    )}

                    {/* Sidebar */}
                    <div className={`fixed inset-y-0 left-0 z-50 md:static ${isSidebarCollapsed ? '-translate-x-full md:translate-x-0 md:w-20' : 'translate-x-0 w-64'} flex-shrink-0 bg-slate-50 dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300`}>
                        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700">
                            {!isSidebarCollapsed && <div className="font-bold text-lg text-blue-600 dark:text-blue-400 flex items-center gap-2">
                                <div className="bg-blue-600 p-1.5 rounded-lg"><Shield size={20} className="text-white"/></div>
                                LF Portal
                            </div>}
                            {isSidebarCollapsed && <div className="w-full flex justify-center">
                                <div className="bg-blue-600 p-1.5 rounded-lg"><Shield size={20} className="text-white"/></div>
                            </div>}
                            <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="hidden md:block p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md ml-auto">
                                <Menu size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
                            <ul className="space-y-1 px-3">
                                
                                <li className="mb-2">
                                    <button title={isSidebarCollapsed ? "Manage Class" : ""}
                                        onClick={() => {
                                            if (!isClockedIn) {
                                                showMessage("You must clock in first to manage classes.", "error");
                                                setShowClockInModal(true);
                                                return;
                                            }
                                            setActiveTab('manageClass');
                                        }}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-bold transition-all ${!isClockedIn ? 'opacity-50 cursor-not-allowed' : ''} ${activeTab === 'manageClass' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50'}`}>
                                        <QrCode size={18} className={activeTab === 'manageClass' ? 'text-blue-600 dark:text-blue-400' : ''} />
                                        {!isSidebarCollapsed && <span>Manage Class</span>}
                                        {!isClockedIn && !isSidebarCollapsed && <Lock size={14} className="ml-auto text-slate-400" />}
                                    </button>
                                </li>
                                <li className="mb-2">
                                    <button title={isSidebarCollapsed ? "My Advisory Class" : ""}
                                        onClick={() => setActiveTab('advisory')}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'advisory' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50'}`}>
                                        <Users size={18} className={activeTab === 'advisory' ? 'text-blue-600 dark:text-blue-400' : ''} />
                                        {!isSidebarCollapsed && <span>My Advisory Class</span>}
                                    </button>
                                </li>
                                <li className="mb-2">
                                    <button title={isSidebarCollapsed ? "Attendance" : ""}
                                        onClick={() => setActiveTab('attendance')}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'attendance' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50'}`}>
                                        <FileText size={18} className={activeTab === 'attendance' ? 'text-blue-600 dark:text-blue-400' : ''} />
                                        {!isSidebarCollapsed && <span>Attendance</span>}
                                    </button>
                                </li>
                                <li className="mb-2">
                                    <button title={isSidebarCollapsed ? "Merit Points" : ""}
                                        onClick={() => setActiveTab('merits')}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'merits' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50'}`}>
                                        <ClipboardList size={18} className={activeTab === 'merits' ? 'text-blue-600 dark:text-blue-400' : ''} />
                                        {!isSidebarCollapsed && <span>Merit Points</span>}
                                    </button>
                                </li>
                                <li className="mb-2">
                                    <button title={isSidebarCollapsed ? "Skillsets" : ""}
                                        onClick={() => setActiveTab('skillsets')}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'skillsets' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50'}`}>
                                        <MapPin size={18} className={activeTab === 'skillsets' ? 'text-blue-600 dark:text-blue-400' : ''} />
                                        {!isSidebarCollapsed && <span>Skillsets</span>}
                                    </button>
                                </li>
                            </ul>
                        </div>

                        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-2">
                            {!isSidebarCollapsed && (
                                <div className="px-2 pb-2 text-xs font-mono text-slate-500 break-words mb-2">Logged in as:<br/><span className="text-slate-700 dark:text-slate-300 font-bold">{lfData.email}</span></div>
                            )}
                            <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-900 p-1 rounded-full mb-2">
                                <button onClick={() => setTheme('light')} title="Light" className={`flex-1 flex justify-center p-1.5 rounded-full transition ${theme === 'light' ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}><Sun size={14} /></button>
                                <button onClick={() => setTheme('system')} title="System" className={`flex-1 flex justify-center p-1.5 rounded-full transition ${theme === 'system' ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}><Globe size={14} /></button>
                                <button onClick={() => setTheme('dark')} title="Dark" className={`flex-1 flex justify-center p-1.5 rounded-full transition ${theme === 'dark' ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}><Moon size={14} /></button>
                            </div>
                            <button onClick={onLogout} title={isSidebarCollapsed ? "Sign Out" : ""} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-2 px-3'} py-2 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 rounded-full font-bold transition-all text-sm`}>
                                <LogOut size={16} />
                                {!isSidebarCollapsed && <span>Sign Out</span>}
                            </button>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white dark:bg-slate-900 relative">
                        <header className="h-16 shrink-0 flex items-center justify-between px-4 md:px-6 border-b border-slate-200 dark:border-slate-700 relative z-50 bg-white dark:bg-slate-900">
                              <div className="flex items-center flex-1">
                                  <button onClick={() => setIsSidebarCollapsed(false)} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full mr-2">
                                      <Menu size={20} />
                                  </button>
                                  <h1 className="text-lg font-black text-slate-800 dark:text-slate-100 ml-2 hidden md:block">LF Portal</h1>
                              </div>
                              <div className="flex items-center gap-4 relative">
                                  {isClockedIn && (
                                      <div className="hidden sm:flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800/30 font-mono text-sm font-bold shadow-sm">
                                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                          {elapsedTime}
                                      </div>
                                  )}
                                  {isClockedIn && (
                                      <button onClick={handleClockOut} className="bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 dark:text-rose-400 px-3 py-1.5 rounded-lg font-bold text-sm transition-colors border border-rose-200 dark:border-rose-800 flex items-center gap-2">
                                          Clock Out
                                      </button>
                                  )}
                                  <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors" title="Notifications">
                                      <Bell size={20} />
                                      {notifications.length > 0 && (
                                          <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white dark:border-slate-900"></span>
                                          </span>
                                      )}
                                  </button>
                              {showNotifications && (
                              <div className="absolute top-12 right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-[100] overflow-hidden">
                                  <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                                      <h3 className="font-bold text-slate-800 dark:text-slate-200">Notifications</h3>
                                      {notifications.length > 0 && <span className="bg-blue-100 text-blue-600 text-xs font-bold px-2 py-0.5 rounded-full">{notifications.length}</span>}
                                  </div>
                                  <div className="max-h-80 overflow-y-auto">
                                      {notifications.length === 0 ? (
                                          <div className="p-6 text-center text-slate-500">
                                              <Bell size={24} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                                              <p className="text-sm">No new notifications</p>
                                          </div>
                                      ) : (
                                          notifications.map(n => (
                                              <div key={n.id} className="p-3 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-start gap-3 transition-colors relative group">
                                                  <div className="mt-1 flex-shrink-0">
                                                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                  </div>
                                                  <div className="flex-1 pr-6">
                                                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{n.title}</p>
                                                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                                                      <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>
                                                  </div>
                                                  <button onClick={() => dismissNotification(n.id)} className="absolute top-3 right-2 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all rounded-md">
                                                      <X size={14} />
                                                  </button>
                                              </div>
                                          ))
                                      )}
                                  </div>
                              </div>
                          )}
                        
                        {showClockInModal && (
                            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700">
                                    <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">Clock In Required</h3>
                                    <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
                                        You must clock in while physically at the Dualtech Campus to manage classes. We need to check your location.
                                    </p>
                                    <div className="flex flex-col gap-3">
                                        <button onClick={handleClockIn} disabled={clockingIn} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
                                            {clockingIn ? <Loader2 size={18} className="animate-spin" /> : <MapPin size={18} />}
                                            {clockingIn ? "Checking Location..." : "Clock In Now"}
                                        </button>
                                        <button onClick={() => setShowClockInModal(false)} disabled={clockingIn} className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-xl transition-colors">
                                            Skip / Continue Without Clocking In
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        </div>
                          </header>
                          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 dark:bg-slate-900 custom-scrollbar relative z-10">
                            {activeTab === 'manageClass' ? (
                                <ManageClassTab lfData={lfData} showMessage={showMessage} />
                            ) : (
                                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center h-[60vh]">
                                    <div className="bg-blue-50 dark:bg-slate-900 p-4 rounded-full mb-4">
                                        <Users size={48} className="text-blue-500" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Coming Soon</h2>
                                    <p className="text-slate-500 dark:text-slate-400 max-w-md">The <strong>{activeTab}</strong> management interface is currently under development. Here you will be able to manage your trainees, update attendance, assign merits, and track skillsets.</p>
                                </div>
                            )}
                        </main>
                    </div>
                </div>
            );
        }

        function App() {
            const [user, setUser] = useState(null);
            const [lfData, setLfData] = useState(null);
            const [loading, setLoading] = useState(true);
            const [isRegistering, setIsRegistering] = useState(false);
            
            const [email, setEmail] = useState('');
            const [password, setPassword] = useState('');
            const [loginLoading, setLoginLoading] = useState(false);
            const [darkMode, setDarkMode] = useState(false);
            
            // Geofence States
            
            const [showNotifications, setShowNotifications] = useState(false);
            const [notifications, setNotifications] = useState([
                { id: 1, title: 'Notification Placeholder', message: 'This is a placeholder for LF clock-ins or TSD announcements.', time: 'Just now' }
            ]);
            const dismissNotification = (id) => {
                setNotifications(prev => prev.filter(n => n.id !== id));
            };

              const [isClockedIn, setIsClockedIn] = useState(localStorage.getItem('lfClockedIn') === 'true');
              const [clockInTime, setClockInTime] = useState(() => {
                  const storedTime = localStorage.getItem('lfClockInTime');
                  return storedTime ? new Date(storedTime) : null;
              });
              
            const sendNotification = async (title, message) => {
                try {
                    await addDoc(collection(db, "bstpNotifications"), {
                        title,
                        message,
                        timestamp: serverTimestamp(),
                        sender: user.email,
                        lfName: lfData ? `${lfData.firstName} ${lfData.lastName}` : user.email
                    });
                } catch (e) {
                    console.error("Failed to send notification", e);
                }
            };

              const handleClockOut = () => {
                  setIsClockedIn(false);
                  setClockInTime(null);
                  localStorage.removeItem('lfClockedIn');
                  localStorage.removeItem('lfClockInTime');
                  showMessage("Clocked out successfully.", "success");
                  sendNotification("LF Clocked Out", `${lfData.firstName} ${lfData.lastName} has clocked out.`);
              };
            const [showClockInModal, setShowClockInModal] = useState(false);
            const [schoolLocation, setSchoolLocation] = useState(null);
            const [clockingIn, setClockingIn] = useState(false);

            useEffect(() => {
                const fetchSchoolLocation = async () => {
                    try {
                        const docRef = doc(db, "artifacts", APP_ID, "public", "data", "settings", "schoolLocation");
                        const docSnap = await getDoc(docRef);
                        if (docSnap.exists()) {
                            setSchoolLocation(docSnap.data());
                        }
                    } catch (e) {
                        console.error("Error fetching school location:", e);
                    }
                };
                fetchSchoolLocation();
            }, []);
            
            // Helper to calculate distance
            const calculateDistance = (lat1, lon1, lat2, lon2) => {
                const R = 6371e3; // Earth radius in meters
                const dLat = (lat2 - lat1) * Math.PI / 180;
                const dLon = (lon2 - lon1) * Math.PI / 180;
                const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                          Math.sin(dLon/2) * Math.sin(dLon/2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                return R * c; // Distance in meters
            };

            const handleClockIn = () => {
                if (!navigator.geolocation) {
                    showMessage("Geolocation is not supported by your browser.", "error");
                    return;
                }
                
                if (!schoolLocation) {
                    showMessage("School geofence data not loaded. Please try again.", "error");
                    return;
                }
                
                setClockingIn(true);
                navigator.geolocation.getCurrentPosition(async (pos) => {
                    const userLat = pos.coords.latitude;
                    const userLon = pos.coords.longitude;
                    const dist = calculateDistance(userLat, userLon, schoolLocation.latitude, schoolLocation.longitude);
                    
                    if (dist <= schoolLocation.radiusMeters) {
                        setIsClockedIn(true);
                          const now = new Date();
                          setClockInTime(now);
                          localStorage.setItem('lfClockedIn', 'true');
                          localStorage.setItem('lfClockInTime', now.toISOString());
                          sendNotification("LF Clocked In", `${lfData.firstName} ${lfData.lastName} has clocked in at Dualtech Campus.`);
                        setShowClockInModal(false);
                        showMessage("Clock In successful! You are within the campus.", "success");
                        
                        try {
                            const attRef = collection(db, "artifacts", APP_ID, "public", "data", "lfAttendance");
                            await addDoc(attRef, {
                                lfId: user.uid,
                                lfEmail: user.email,
                                lfName: lfData?.name || "Unknown",
                                timestamp: new Date(),
                                lat: userLat,
                                lng: userLon,
                                distanceMeters: dist
                            });
                        } catch(e) {
                            console.error("Failed to record attendance", e);
                        }
                    } else {
                        showMessage(`You are outside the Dualtech Campus geofence (Distance: ${Math.round(dist)}m). Clock in failed.`, "error");
                    }
                    setClockingIn(false);
                }, (err) => {
                    showMessage("Failed to get location. You must allow location access to clock in.", "error");
                    setClockingIn(false);
                }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
            };

            // Toast logic
            const [toast, setToast] = useState(null);
            const showMessage = (msg, type='success') => {
                setToast({ msg, type });
                setTimeout(() => setToast(null), 3000);
            };

            useEffect(() => {
                const unsub = onAuthStateChanged(auth, async (u) => {
                    if (u) {
                        if (window.isRegisteringFlow) return;
                        try {
                            const docRef = doc(db, "bstpUsers", u.uid);
                            const docSnap = await getDoc(docRef);
                            
                            if (docSnap.exists() && docSnap.data().role === 'Learning Facilitator') {
                                const data = docSnap.data();
                                if (data.status === 'Pending') {
                                    // Prevent pending login
                                    await signOut(auth);
                                    showMessage("Access Denied: Your account is pending approval by the BSTP Admin. Please try again later.", "error");
                                    setUser(null);
                                    setLfData(null);
                                } else if (data.status === 'Deleted') {
                                    await signOut(auth);
                                    showMessage("Access Denied: Your account has been deleted.", "error");
                                    setUser(null);
                                    setLfData(null);
                                } else {
                                    setUser(u);
                                    setLfData(data);
                                }
                            } else {
                                await signOut(auth);
                                showMessage("Access Denied: You are not a registered Learning Facilitator.", "error");
                            }
                        } catch (err) {
                            console.error(err);
                            await signOut(auth);
                            showMessage("Error verifying account status.", "error");
                        }
                    } else {
                        setUser(null);
                        setLfData(null);
                    }
                    setLoading(false);
                });
                return () => unsub();
            }, []);

            const handleLogin = async (e) => {
                e.preventDefault();
                setLoginLoading(true);
                try {
                    await signInWithEmailAndPassword(auth, email, password);
                } catch(err) {
                    showMessage("Login failed: " + err.message, "error");
                }
                setLoginLoading(false);
            };

            const handleLogout = async () => {
                await signOut(auth);
                setEmail('');
                setPassword('');
            };

            const toggleDarkMode = () => {
                setDarkMode(!darkMode);
                document.documentElement.classList.toggle('dark');
            };

            if (loading) {
                return <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900"><Loader2 className="animate-spin text-blue-500" size={48} /></div>;
            }

            if (user && lfData) {
                return (
                    <>
                        <Dashboard user={user} lfData={lfData} showMessage={showMessage} onLogout={handleLogout} isClockedIn={isClockedIn} showClockInModal={showClockInModal} schoolLocation={schoolLocation} clockingIn={clockingIn} handleClockIn={handleClockIn} setShowClockInModal={setShowClockInModal} clockInTime={clockInTime} handleClockOut={handleClockOut} showNotifications={showNotifications} setShowNotifications={setShowNotifications} notifications={notifications} dismissNotification={dismissNotification} sendNotification={sendNotification} />
                        {toast && (
                            <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 font-bold z-50 animate-bounce-short ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-500 text-white'}`}>
                                {toast.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
                                {toast.msg}
                            </div>
                        )}
                    </>
                );
            }

            return (
                <div className="h-full w-full flex justify-center py-10 bg-slate-50 dark:bg-slate-900 px-4 relative overflow-y-auto">
                    

                    {isRegistering ? (
                        <RegistrationForm onBack={() => setIsRegistering(false)} showMessage={showMessage} />
                    ) : (
                        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 my-auto h-fit">
                            <div className="bg-blue-600 p-10 text-white text-center">
                                <Shield size={48} className="mx-auto mb-4 opacity-90" />
                                <h2 className="text-3xl font-black mb-2">LF Portal</h2>
                                <p className="text-blue-100 font-medium">Learning Facilitator Access</p>
                            </div>
                            
                            <form onSubmit={handleLogin} className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                        <input required type="email" placeholder="Email Address" className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium" value={email} onChange={e => setEmail(e.target.value)}/>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                        <input required type="password" placeholder="Password" className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium" value={password} onChange={e => setPassword(e.target.value)}/>
                                    </div>
                                </div>
                                <button disabled={loginLoading} type="submit" className="w-full bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-black py-4 rounded-xl flex justify-center items-center gap-2 shadow-lg transition-all disabled:opacity-50">
                                    {loginLoading ? <Loader2 className="animate-spin" /> : 'Log In'}
                                </button>
                                <div className="text-center mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Don't have an account?</p>
                                    <button type="button" onClick={() => setIsRegistering(true)} className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-2 justify-center w-full">
                                        <UserPlus size={18} /> Register as Learning Facilitator
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {toast && (
                        <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 font-bold z-50 animate-bounce-short ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-500 text-white'}`}>
                            {toast.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
                            {toast.msg}
                        </div>
                    )}
                    
                </div>
            );
        }

        const root = createRoot(document.getElementById('root'));
        root.render(<App />);
    </script>
</body>
</html>

