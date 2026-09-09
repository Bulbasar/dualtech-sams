
        import React, { useState, useEffect, useMemo, useRef } from 'react';
        import { createRoot } from 'react-dom/client';
        import * as Lucide from 'lucide-react';
        import { initializeApp } from 'firebase/app';
        import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
        import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
        import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
        import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, doc, onSnapshot, getDocs, query, where, collectionGroup, orderBy, limit } from 'firebase/firestore';
        import { 
            Search, Filter, Download, User, Calendar, MapPin, CheckCircle2, Mail, AlertCircle,
            XCircle, Clock, AlertTriangle, FileText, ChevronDown, RefreshCw, Briefcase,
            LayoutDashboard, Users, LogOut, ChevronRight, Check, X, Shield, PlusCircle, Save,
            History, Send, Settings, CheckSquare, MessageSquare, Building2, Activity, UserCircle2,
            Phone, Plus, Trash2, Crosshair, Navigation, Building, CalendarCheck, Loader2, TrendingUp, Menu, FileUp, ArrowLeft, Presentation, Video, BarChart2, Edit3, Eye, EyeOff, Lock, Sun, Moon 
        } from "lucide-react";


        // Firebase Configuration (Same as your standard config)
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
            provider: new ReCaptchaEnterpriseProvider("6LeGUowtAAAAALQKvlwQ1T7UtdbAqcL47wPVBxff"),
            isTokenAutoRefreshEnabled: true
        });
        // ENABLE FIRESTORE CACHE HERE
        const db = initializeFirestore(app, {
        localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})
        });

        const auth = getAuth(app);
        const appId = 'dualtech-ojt-portal';

        // --- HELPER FUNCTIONS FOR DATES ---
        const getTodayString = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
        const getWeekString = () => { const d = new Date(); d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7); const w = Math.round(((d.getTime() - new Date(d.getFullYear(), 0, 4).getTime()) / 86400000 + 1) / 7); return `${d.getFullYear()}-W${String(w).padStart(2, '0')}`; };
        const getMonthString = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };

        const parseTime = (val) => {
            if (!val) return null;
            if (val.seconds) return new Date(val.seconds * 1000);
            return new Date(val);
        };

        // --- DATE FILTER HELPER FUNCTIONS ---
        const isDateInRange = (dateStr, mode, values) => {
            if (!dateStr) return false;
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return false;

            const y = d.getFullYear();
            const m = d.getMonth();

            const getWeekNumber = (date) => {
                const target = new Date(date.valueOf());
                const dayNr = (date.getDay() + 6) % 7;
                target.setDate(target.getDate() - dayNr + 3);
                const firstThursday = target.valueOf();
                target.setMonth(0, 1);
                if (target.getDay() !== 4) {
                    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
                }
                return 1 + Math.ceil((firstThursday - target) / 604800000);
            };

            const targetYear = parseInt(values.year) || new Date().getFullYear();

            switch (mode) {
                case 'Daily':
                    if (!values.daily) return true;
                    return d.toISOString().split('T')[0] === values.daily;
                case 'Weekly':
                    if (!values.weekly) return true;
                    const [wYear, wWeek] = values.weekly.split('-W');
                    return y === parseInt(wYear) && getWeekNumber(d) === parseInt(wWeek);
                case 'Monthly':
                    if (!values.monthly) return true;
                    const [mYear, mMonth] = values.monthly.split('-');
                    return y === parseInt(mYear) && (m + 1) === parseInt(mMonth);
                case 'Quarterly':
                    const q = Math.floor(m / 3) + 1;
                    return y === targetYear && q === parseInt(values.quarter);
                case 'Semestral':
                    const sem = m < 6 ? 1 : 2;
                    return y === targetYear && sem === parseInt(values.semester);
                case 'Yearly':
                    return y === targetYear;
                default:
                    return true;
            }
        };

        const DateRangeSelector = ({ mode, setMode, dateValues, setDateValues }) => {
            return (
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-center mb-6 w-full">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto w-full md:w-auto hide-scrollbar">
                        {['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Semestral', 'Yearly'].map(m => (
                            <button key={m} type="button" onClick={() => setMode(m)} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${mode === m ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-300'}`}>
                                {m}
                            </button>
                        ))}
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto ml-auto">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">Filter Range:</label>
                        {mode === 'Daily' && <input type="date" value={dateValues.daily} onChange={e => setDateValues({...dateValues, daily: e.target.value})} className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold w-full md:w-auto" />}
                        {mode === 'Weekly' && <input type="week" value={dateValues.weekly} onChange={e => setDateValues({...dateValues, weekly: e.target.value})} className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold w-full md:w-auto" />}
                        {mode === 'Monthly' && <input type="month" value={dateValues.monthly} onChange={e => setDateValues({...dateValues, monthly: e.target.value})} className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold w-full md:w-auto" />}
                        {mode === 'Quarterly' && (
                            <div className="flex gap-2 w-full md:w-auto">
                                <select value={dateValues.quarter} onChange={e => setDateValues({...dateValues, quarter: e.target.value})} className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold flex-1">
                                    <option value="1">Q1 (Jan-Mar)</option><option value="2">Q2 (Apr-Jun)</option><option value="3">Q3 (Jul-Sep)</option><option value="4">Q4 (Oct-Dec)</option>
                                </select>
                                <input type="number" value={dateValues.year} onChange={e => setDateValues({...dateValues, year: e.target.value})} className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold w-24" />
                            </div>
                        )}
                        {mode === 'Semestral' && (
                            <div className="flex gap-2 w-full md:w-auto">
                                <select value={dateValues.semester} onChange={e => setDateValues({...dateValues, semester: e.target.value})} className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold flex-1">
                                    <option value="1">1st Semester (Jan-Jun)</option><option value="2">2nd Semester (Jul-Dec)</option>
                                </select>
                                <input type="number" value={dateValues.year} onChange={e => setDateValues({...dateValues, year: e.target.value})} className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold w-24" />
                            </div>
                        )}
                        {mode === 'Yearly' && <input type="number" value={dateValues.year} onChange={e => setDateValues({...dateValues, year: e.target.value})} className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold w-32" />}
                    </div>
                </div>
            );
        };
        // ----------------------------------------

        function AllCompaniesTab({ allTraineesData, visits, contacts, companyProfiles, setCompanyProfiles, geofences }) {
            // UI States
            const [loading, setLoading] = useState(false);
            const [searchQuery, setSearchQuery] = useState('');
            
            // Collapsible View States
            const [showActive, setShowActive] = useState(true);
            const [showInactive, setShowInactive] = useState(false);
            
            // Export States
            const [startDate, setStartDate] = useState('');
            const [endDate, setEndDate] = useState('');
            const [showExportModal, setShowExportModal] = useState(false);
            const [exportConfig, setExportConfig] = useState({
                overview: true, contacts: false, trainees: false, visits: false
            });

            // Modal States
            const [historyModalCompany, setHistoryModalCompany] = useState(null);
            
            const [showContactsModal, setShowContactsModal] = useState(false);
            const [selectedCompany, setSelectedCompany] = useState(null);
            const [contactForm, setContactForm] = useState({ name: '', email: '', designation: '', phone: '' });
            const [savingContact, setSavingContact] = useState(false);

            const [showProfileModal, setShowProfileModal] = useState(false);
            const [profileForm, setProfileForm] = useState({ 
                moaStatus: 'Pending', hrContactName: '', hrContactEmail: '', hrContactPhone: '', 
                allowOvertime: false, notes: '', addresses: [{ text: '', geolocation: '' }], assignedICs: '' 
            });
            const [savingProfile, setSavingProfile] = useState(false);

            const [showGeofenceModal, setShowGeofenceModal] = useState(false);
            const [selectedGeofenceCompany, setSelectedGeofenceCompany] = useState(null);
            const [newLocation, setNewLocation] = useState({ label: '', latitude: '', longitude: '', radius: '500' });
            const [savingGeofence, setSavingGeofence] = useState(false);

            // Concerns/Issues Tracker States
            const [showConcernsModal, setShowConcernsModal] = useState(false);
            const [selectedCompanyConcerns, setSelectedCompanyConcerns] = useState(null);
            const [concernText, setConcernText] = useState('');
            const [concernFilter, setConcernFilter] = useState('Open');

            // Report View States
            const [reportMode, setReportMode] = useState('All');
            const getTodayString = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
            const [reportDate, setReportDate] = useState(getTodayString());
            const [reportMonth, setReportMonth] = useState(getTodayString().substring(0, 7));
            const [reportWeek, setReportWeek] = useState('');

            // Helper to get logged-in user name
            const getCurrentUserLabel = () => auth?.currentUser?.displayName || auth?.currentUser?.email || 'IC Manager';


            // --- 2. MASTER GLOBAL AGGREGATOR ---
            // Automatically rebuilds the companies directory whenever real-time data arrives
            const companiesList = useMemo(() => {
                const compMap = {};

                const addCompany = (cName) => {
                    if (!cName) return null;
                    const cleanName = cName.trim();
                    if (!compMap[cleanName]) {
                        compMap[cleanName] = { name: cleanName, statuses: { Active: 0, LOA: 0, Dropped: 0, Floater: 0, Other: 0 }, totalCount: 0 };
                    }
                    return cleanName;
                };

                // Build from Trainees
                allTraineesData.forEach(t => {
                    const cName = addCompany(t.company || 'Unassigned');
                    if (cName) {
                        compMap[cName].totalCount++;
                        const stat = (t.status || 'Other').trim().toUpperCase();
                        if (stat.includes('ACTIVE')) compMap[cName].statuses.Active++;
                        else if (stat.includes('LOA')) compMap[cName].statuses.LOA++;
                        else if (stat.includes('DROP')) compMap[cName].statuses.Dropped++;
                        else if (stat.includes('FLOAT')) compMap[cName].statuses.Floater++;
                        else compMap[cName].statuses.Other++;
                    }
                });

                // Build from Visits, Contacts, and Profiles to catch "Ghost" Companies
                visits.forEach(v => addCompany(v.company));
                contacts.forEach(c => addCompany(c.company));
                Object.keys(companyProfiles || {}).forEach(cName => addCompany(cName));

                return Object.values(compMap).sort((a, b) => a.name.localeCompare(b.name));
            }, [allTraineesData, visits, contacts, companyProfiles]);


            // --- Geofence Handlers ---
            const handleAddGeofence = async (e) => {
                e.preventDefault();
                setSavingGeofence(true);
                try {
                    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'geofences'), {
                        company: selectedGeofenceCompany,
                        label: newLocation.label,
                        latitude: parseFloat(newLocation.latitude),
                        longitude: parseFloat(newLocation.longitude),
                        radius: parseInt(newLocation.radius)
                    });
                    setNewLocation({ label: '', latitude: '', longitude: '', radius: '500' });
                } catch (err) { alert('Error adding geofence: ' + err.message); }
                setSavingGeofence(false);
            };

            const handleDeleteGeofence = async (locId) => {
                if (!window.confirm("Delete this geofence?")) return;
                try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'geofences', locId)); } 
                catch (err) { alert('Error deleting geofence: ' + err.message); }
            };

            // --- Concern Handlers ---
            const getOpenConcernsCount = (companyName) => {
                const profile = companyProfiles[companyName] || {};
                return (profile.concerns || []).filter(c => c.status === 'Open').length;
            };

            const handleAddConcern = async (e) => {
                e.preventDefault();
                if (!concernText.trim()) return;
                setSavingProfile(true);
                try {
                    const existing = companyProfiles[selectedCompanyConcerns];
                    const newConcern = {
                        date: new Date().toLocaleDateString(),
                        timestamp: Date.now(),
                        text: concernText,
                        status: 'Open',
                        addedBy: getCurrentUserLabel(),
                        updates: []
                    };

                    const docRef = existing ? doc(db, 'artifacts', appId, 'public', 'data', 'company_profiles', existing.id) : doc(collection(db, 'artifacts', appId, 'public', 'data', 'company_profiles'));
                    await (existing ? updateDoc(docRef, { concerns: [...(existing.concerns || []), newConcern] }) : setDoc(docRef, { companyName: selectedCompanyConcerns, concerns: [newConcern], updatedAt: new Date().toISOString() }));
                    
                    setConcernText('');
                    setConcernFilter('Open');
                } catch(err) { alert('Error logging issue: ' + err.message); }
                setSavingProfile(false);
            };

            const handleAddConcernUpdate = async (companyName, originalIndex) => {
                const updateText = window.prompt("Enter an update or progress note for this issue:");
                if (!updateText || !updateText.trim()) return;
                const existing = companyProfiles[companyName];
                if (!existing) return;
                
                const updatedConcerns = [...existing.concerns];
                const targetConcern = updatedConcerns[originalIndex];
                targetConcern.updates = [...(targetConcern.updates || []), {
                    date: new Date().toLocaleDateString(), timestamp: Date.now(), text: updateText.trim(), addedBy: getCurrentUserLabel()
                }];

                try {
                    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'company_profiles', existing.id), { concerns: updatedConcerns });
                } catch(err) { alert("Error adding update: " + err.message); }
            };

            const handleToggleConcernStatus = async (companyName, originalIndex, concern) => {
                const existing = companyProfiles[companyName];
                if (!existing) return;
                
                const updatedConcerns = [...existing.concerns];
                updatedConcerns[originalIndex].status = concern.status === 'Open' ? 'Resolved' : 'Open';

                try {
                    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'company_profiles', existing.id), { concerns: updatedConcerns });
                } catch(err) { alert("Error updating status: " + err.message); }
            };

            const handleDeleteConcern = async (companyName, originalIndex) => {
                if(!window.confirm('Are you sure you want to delete this issue log completely?')) return;
                const existing = companyProfiles[companyName];
                if (!existing) return;
                const updatedConcerns = existing.concerns.filter((_, idx) => idx !== originalIndex);

                try {
                    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'company_profiles', existing.id), { concerns: updatedConcerns });
                } catch(err) { alert("Error deleting issue: " + err.message); }
            };

            // --- Profile Address Handlers ---
            const handleAddAddressField = () => setProfileForm(prev => ({ ...prev, addresses: [...prev.addresses, { text: '', geolocation: '' }] }));
            const handleRemoveAddressField = (index) => setProfileForm(prev => ({ ...prev, addresses: prev.addresses.filter((_, i) => i !== index) }));
            const handleAddressChange = (index, field, value) => {
                const newAddresses = [...profileForm.addresses];
                newAddresses[index][field] = value;
                setProfileForm(prev => ({ ...prev, addresses: newAddresses }));
            };

            const openProfile = (compName) => {
                setSelectedCompany(compName);
                const existing = companyProfiles[compName];
                if (existing) {
                    setProfileForm({ 
                        moaStatus: existing.moaStatus || 'Pending', hrContactName: existing.hrContactName || '', 
                        hrContactEmail: existing.hrContactEmail || '', hrContactPhone: existing.hrContactPhone || '', 
                        allowOvertime: existing.allowOvertime || false, notes: existing.notes || '',
                        addresses: existing.addresses && existing.addresses.length > 0 ? existing.addresses : (existing.address ? [{ text: existing.address, geolocation: existing.geolocation || '' }] : [{ text: '', geolocation: '' }]),
                        assignedICs: existing.assignedICs || ''
                    });
                } else {
                    setProfileForm({ moaStatus: 'Pending', hrContactName: '', hrContactEmail: '', hrContactPhone: '', allowOvertime: false, notes: '', addresses: [{ text: '', geolocation: '' }], assignedICs: '' });
                }
                setShowProfileModal(true);
            };

            const handleSaveProfile = async (e) => {
                e.preventDefault();
                setSavingProfile(true);
                try {
                    const cleanedAddresses = profileForm.addresses.filter(a => a.text.trim() !== '' || a.geolocation.trim() !== '');
                    const existing = companyProfiles[selectedCompany];
                    const docRef = existing ? doc(db, 'artifacts', appId, 'public', 'data', 'company_profiles', existing.id) : doc(collection(db, 'artifacts', appId, 'public', 'data', 'company_profiles'));
                    const payload = { ...profileForm, addresses: cleanedAddresses, updatedAt: new Date().toISOString() };
                    
                    await (existing ? updateDoc(docRef, payload) : setDoc(docRef, { companyName: selectedCompany, ...payload, createdAt: new Date().toISOString() }));
                    setShowProfileModal(false);
                } catch (error) { alert("Failed to save profile: " + error.message); }
                setSavingProfile(false);
            };

            // --- Contact Handlers ---
            const handleSaveContact = async (e) => {
                e.preventDefault();
                setSavingContact(true);
                try {
                    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'contacts'), { company: selectedCompany, ...contactForm, createdAt: new Date().toISOString() });
                    setContactForm({ name: '', email: '', designation: '', phone: '' });
                } catch (error) { alert("Failed to add contact."); }
                setSavingContact(false);
            };

            const handleDeleteContact = async (id) => {
                if(window.confirm("Delete this contact?")) {
                    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'contacts', id));
                }
            };

            const filteredCompanies = companiesList.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
            
            // Group partners based on Active status
            const activePartners = filteredCompanies
                .filter(c => c.statuses.Active > 0)
                .sort((a, b) => getOpenConcernsCount(b.name) - getOpenConcernsCount(a.name));
            const inactivePartners = filteredCompanies.filter(c => c.statuses.Active === 0);

            // --- EXPORT LOGIC ---
            const executeExportXLS = () => {
                let combinedHTML = "";
                const validCompanies = filteredCompanies.map(c => c.name);

                if (exportConfig.overview) {
                    const headers = ["Company Name", "Active", "LOA", "Dropped", "Floater", "Total History", "MOA Status", "HR Contact Name", "HR Email", "HR Phone", "Assigned ICs", "Address / Notes"];
                    let content = `<tr><th colspan="${headers.length}" style="background-color: #334155; color: white; font-size: 16px; padding: 10px;">COMPANY OVERVIEW</th></tr>`;
                    content += `<tr>${headers.map(h => `<th style="background-color: #10b981; color: white; font-weight: bold;">${h}</th>`).join('')}</tr>`;

                    filteredCompanies.forEach((comp, index) => {
                        const profile = companyProfiles[comp.name] || {};
                        const addr = profile.addresses && profile.addresses.length > 0 ? profile.addresses.map(a=>a.text).join('; ') : (profile.address || 'N/A');
                        content += `
                            <tr style="background-color: ${index % 2 === 0 ? "#ffffff" : "#f8fafc"};">
                                <td>${comp.name}</td><td>${comp.statuses.Active}</td><td>${comp.statuses.LOA}</td><td>${comp.statuses.Dropped}</td><td>${comp.statuses.Floater}</td>
                                <td>${comp.totalCount}</td><td>${profile.moaStatus || 'No Profile'}</td><td>${profile.hrContactName || 'N/A'}</td><td>${profile.hrContactEmail || 'N/A'}</td>
                                <td style="mso-number-format:'\\@';">${profile.hrContactPhone || 'N/A'}</td><td>${profile.assignedICs || 'N/A'}</td><td>${addr} | ${profile.notes || ''}</td>
                            </tr>`;
                    });
                    combinedHTML += `<table>${content}</table><br><br>`;
                }

                if (exportConfig.contacts) {
                    const targetContacts = contacts.filter(c => validCompanies.includes(c.company));
                    const headers = ["Company", "Contact Name", "Designation", "Email", "Phone Number"];
                    let content = `<tr><th colspan="${headers.length}" style="background-color: #334155; color: white; font-size: 16px; padding: 10px;">COMPANY CONTACTS DIRECTORY</th></tr>`;
                    content += `<tr>${headers.map(h => `<th style="background-color: #3b82f6; color: white; font-weight: bold;">${h}</th>`).join('')}</tr>`;
                    targetContacts.forEach((c, index) => {
                        content += `<tr style="background-color: ${index % 2 === 0 ? "#ffffff" : "#f8fafc"};">
                            <td>${c.company}</td><td>${c.name}</td><td>${c.designation}</td><td>${c.email || 'N/A'}</td><td style="mso-number-format:'\\@';">${c.phone || 'N/A'}</td>
                        </tr>`;
                    });
                    if (targetContacts.length === 0) content += `<tr><td colspan="${headers.length}">No contacts found.</td></tr>`;
                    combinedHTML += `<table>${content}</table><br><br>`;
                }

                if (exportConfig.trainees) {
                    const targetTrainees = allTraineesData.filter(t => validCompanies.includes(t.company || 'Unassigned'));
                    const headers = ["Company", "Student Number", "First Name", "Last Name", "Status", "Assigned IC", "Program"];
                    let content = `<tr><th colspan="${headers.length}" style="background-color: #334155; color: white; font-size: 16px; padding: 10px;">TRAINEES MASTERLIST</th></tr>`;
                    content += `<tr>${headers.map(h => `<th style="background-color: #8b5cf6; color: white; font-weight: bold;">${h}</th>`).join('')}</tr>`;
                    targetTrainees.forEach((t, index) => {
                        content += `<tr style="background-color: ${index % 2 === 0 ? "#ffffff" : "#f8fafc"};">
                            <td>${t.company || 'Unassigned'}</td><td style="mso-number-format:'\\@';">${t.studentId || ''}</td><td>${t.firstName || ''}</td>
                            <td>${t.lastName || ''}</td><td>${t.status || 'Unknown'}</td><td>${t.assignedIC || 'Unassigned'}</td><td>${t.program || ''}</td>
                        </tr>`;
                    });
                    if (targetTrainees.length === 0) content += `<tr><td colspan="${headers.length}">No trainees found.</td></tr>`;
                    combinedHTML += `<table>${content}</table><br><br>`;
                }

                if (exportConfig.visits) {
                    let targetVisits = visits.filter(v => validCompanies.includes(v.company));
                    if (startDate) targetVisits = targetVisits.filter(v => v.visitDate >= startDate);
                    if (endDate) targetVisits = targetVisits.filter(v => v.visitDate <= endDate);

                    const headers = ["Company", "Visit Date", "Type", "Kamustahan?", "Logged By (IC)", "Notes"];
                    let content = `<tr><th colspan="${headers.length}" style="background-color: #334155; color: white; font-size: 16px; padding: 10px;">VISIT & INTERACTION HISTORY ${startDate && endDate ? `(${startDate} to ${endDate})` : ''}</th></tr>`;
                    content += `<tr>${headers.map(h => `<th style="background-color: #f59e0b; color: white; font-weight: bold;">${h}</th>`).join('')}</tr>`;
                    targetVisits.forEach((v, index) => {
                        content += `<tr style="background-color: ${index % 2 === 0 ? "#ffffff" : "#f8fafc"};">
                            <td>${v.company}</td><td>${v.visitDate}</td><td>${v.visitType}</td><td>${v.isKamustahan ? 'Yes' : 'No'}</td>
                            <td>${v.icName || 'Unknown'}</td><td>${v.notes || ''}</td>
                        </tr>`;
                    });
                    if (targetVisits.length === 0) content += `<tr><td colspan="${headers.length}">No visits found for the selected date range.</td></tr>`;
                    combinedHTML += `<table>${content}</table><br><br>`;
                }

                const xlsTemplate = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><style>table { border-collapse: collapse; font-family: Arial, sans-serif; margin-bottom: 30px; border: 1px solid #cccccc; } th { border: 1px solid #cccccc; padding: 8px; text-align: left; } td { border: 1px solid #cccccc; padding: 6px 8px; font-size: 13px; vertical-align: top; }</style></head><body>${combinedHTML}</body></html>`;
                const blob = new Blob([xlsTemplate], { type: 'application/vnd.ms-excel;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.setAttribute("href", url);
                const dateAppend = (startDate && endDate) ? `_${startDate}_to_${endDate}` : '';
                link.setAttribute("download", `Master_Company_Export${dateAppend}.xls`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setShowExportModal(false);
            };

            const getReportData = () => {
                let start = '', end = '';
                if (reportMode === 'Daily') { start = reportDate; end = reportDate; } 
                else if (reportMode === 'Monthly') {
                    start = `${reportMonth}-01`;
                    const d = new Date(start); d.setMonth(d.getMonth() + 1); d.setDate(0);
                    end = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                } else if (reportMode === 'Weekly') {
                    if (!reportWeek) return [];
                    const [y, w] = reportWeek.split('-W');
                    const d = new Date(y, 0, 1 + (w - 1) * 7);
                    const day = d.getDay();
                    const startObj = new Date(d.setDate(d.getDate() - day + (day === 0 ? -6 : 1)));
                    start = `${startObj.getFullYear()}-${String(startObj.getMonth() + 1).padStart(2, '0')}-${String(startObj.getDate()).padStart(2, '0')}`;
                    const endObj = new Date(startObj); endObj.setDate(endObj.getDate() + 6);
                    end = `${endObj.getFullYear()}-${String(endObj.getMonth() + 1).padStart(2, '0')}-${String(endObj.getDate()).padStart(2, '0')}`;
                } else { return visits; }
                return visits.filter(v => v.visitDate >= start && v.visitDate <= end).sort((a,b) => new Date(b.visitDate) - new Date(a.visitDate));
            };

            const reportVisits = getReportData();
            const sortedCompsByVisits = Object.entries(reportVisits.reduce((acc, v) => { acc[v.company] = (acc[v.company] || 0) + 1; return acc; }, {})).sort((a,b) => b[1] - a[1]);

            // --- RENDER COMPANY CARD UI ---
            const renderCompanyCard = (comp) => {
                const profile = companyProfiles[comp.name] || {};
                const compVisits = visits.filter(v => v.company === comp.name).sort((a,b) => new Date(b.visitDate) - new Date(a.visitDate));
                const lastVisit = compVisits.length > 0 ? compVisits[0].visitDate : 'No visits recorded';
                const compContacts = contacts.filter(c => c.company === comp.name);
                
                const openConcerns = (profile.concerns || []).filter(c => c.status === 'Open').length;
                const hasIssues = openConcerns > 0;
                const profileAddresses = profile.addresses && profile.addresses.length > 0 ? profile.addresses : (profile.address ? [{ text: profile.address, geolocation: profile.geolocation || '' }] : []);
                const assignedICs = Array.from(new Set(allTraineesData
                    .filter(t => (t.company || '').trim() === comp.name && (t.status || '').toLowerCase().includes('active'))
                    .map(t => t.assignedIC || t.icName || 'Unassigned')
                    .filter(name => name && name !== 'Unassigned'))).join(', ') || 'Unassigned';

                return (
                    <div key={comp.name} className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow ${hasIssues ? 'border-2 border-red-300 ring-2 ring-red-100 ring-offset-1' : ''}`}>
                        <div className={`absolute top-0 left-0 w-1.5 h-full ${hasIssues ? 'bg-red-500' : (comp.statuses.Active > 0 ? 'bg-blue-500' : 'bg-slate-300')}`}></div>
                        
                        <div>
                            <div className="flex justify-between items-start mb-2 pl-3">
                                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg leading-tight flex items-center gap-2">
                                    <Building2 className={hasIssues ? 'text-red-500' : (comp.statuses.Active > 0 ? 'text-blue-500' : 'text-slate-400')} size={20}/>
                                    {comp.name}
                                </h3>
                                {profile.moaStatus && (
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase whitespace-nowrap ${
                                        profile.moaStatus === 'Active' ? 'bg-primary-100 text-primary-700' : 
                                        profile.moaStatus === 'Expired' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                        MOA: {profile.moaStatus}
                                    </span>
                                )}
                            </div>

                            <div className="pl-3 mt-3 flex flex-wrap gap-1.5 mb-3">
                                {comp.statuses.Active > 0 && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm">Active: {comp.statuses.Active}</span>}
                                {comp.statuses.LOA > 0 && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 shadow-sm">LOA: {comp.statuses.LOA}</span>}
                                {comp.statuses.Dropped > 0 && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 shadow-sm">Drop: {comp.statuses.Dropped}</span>}
                                {comp.statuses.Floater > 0 && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200 shadow-sm">Float: {comp.statuses.Floater}</span>}
                                {comp.totalCount > 0 && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm">Total: {comp.totalCount}</span>}
                            </div>

                            <div className="pl-3 text-xs text-slate-500 space-y-1.5 mb-4">
                                <div className="flex items-center gap-2"><History size={14} className="text-slate-400"/> Last Visit: <span className="font-bold text-slate-700 dark:text-slate-300">{lastVisit}</span></div>
                                <div className="flex items-center gap-2"><Users size={14} className="text-slate-400"/> Assigned IC: <span className="font-bold text-slate-700 dark:text-slate-300">{assignedICs}</span></div>
                                {profileAddresses.length > 0 && profileAddresses[0].text && (
                                    <div className="flex gap-2 text-slate-600 dark:text-slate-400 items-start">
                                        <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5"/> 
                                        <span className="font-medium leading-snug line-clamp-2">{profileAddresses[0].text}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-auto pl-3 flex flex-wrap gap-2 pt-4 border-t border-slate-100">
                            <button onClick={() => openProfile(comp.name)} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-colors">
                                <Edit3 size={14}/> Details
                            </button>
                            <button onClick={() => { setSelectedCompanyConcerns(comp.name); setConcernFilter('Open'); setShowConcernsModal(true); }} className={`text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-colors ${hasIssues ? 'bg-red-600 text-white hover:bg-red-700 shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'}`}>
                                <AlertTriangle size={14}/> Issues {hasIssues && `(${openConcerns})`}
                            </button>
                            <button onClick={() => setHistoryModalCompany(comp.name)} className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-colors">
                                <History size={14} /> Visits
                            </button>
                            <button onClick={() => { setSelectedCompany(comp.name); setShowContactsModal(true); }} className="text-xs bg-amber-50 text-amber-600 hover:bg-amber-100 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-colors">
                                <Users size={14} /> Contacts ({compContacts.length})
                            </button>
                            <button onClick={() => { setSelectedGeofenceCompany(comp.name); setShowGeofenceModal(true); }} className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1 transition-colors">
                                <MapPin size={14} /> Geofences
                            </button>
                        </div>
                    </div>
                );
            };

            if (loading) return <div className="flex flex-col items-center justify-center h-64 text-slate-400"><Loader2 className="animate-spin mb-4" size={32} /> Loading Masterlist...</div>;

            return (
                <div className="space-y-6 animate-in fade-in duration-300 pb-20">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2"><Building2 className="text-primary-600" /> Master Company Directory</h2>
                            <p className="text-slate-500 text-sm mt-1">Manage global company profiles, contacts, issues, and track visit history.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input type="text" placeholder="Search companies..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all text-sm" />
                            </div>
                            <button onClick={() => setShowExportModal(true)} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl flex justify-center items-center gap-2 font-bold transition-colors shadow-sm whitespace-nowrap">
                                <Download size={18} /> Export
                            </button>
                        </div>
                    </div>

                    <div className="flex bg-slate-200/50 p-1 rounded-xl overflow-x-auto hide-scrollbar max-w-max">
                        {['All', 'Daily', 'Weekly', 'Monthly'].map(mode => (
                            <button key={mode} onClick={() => setReportMode(mode)} className={`px-5 py-2 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${reportMode === mode ? 'bg-white dark:bg-slate-800 text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-300'}`}>
                                {mode === 'All' ? 'Company Directory' : `${mode} Visits`}
                            </button>
                        ))}
                    </div>

                    {reportMode === 'All' ? (
                        <div className="space-y-6 mt-4">
                            
                            {/* Active Partners Section */}
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <button 
                                    onClick={() => setShowActive(!showActive)}
                                    className="w-full flex justify-between items-center p-5 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:bg-slate-800 transition-colors border-b border-slate-200"
                                >
                                    <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <CheckCircle2 className="text-blue-500" size={20}/> 
                                        Active Partners 
                                        <span className="bg-blue-100 text-blue-700 text-xs px-2.5 py-0.5 rounded-full ml-2">{activePartners.length}</span>
                                    </h3>
                                    <span className="text-slate-400">{showActive ? '▼' : '▲'}</span>
                                </button>
                                
                                {showActive && (
                                    <div className="p-6 bg-slate-50/50">
                                        {activePartners.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                                {activePartners.map(comp => renderCompanyCard(comp))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-10 text-slate-400 italic">No active partners found.</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Inactive Partners Section */}
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <button 
                                    onClick={() => setShowInactive(!showInactive)}
                                    className="w-full flex justify-between items-center p-5 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:bg-slate-800 transition-colors border-b border-slate-200"
                                >
                                    <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <Building2 className="text-slate-400" size={20}/> 
                                        Inactive Partners 
                                        <span className="bg-slate-200 text-slate-600 dark:text-slate-400 text-xs px-2.5 py-0.5 rounded-full ml-2">{inactivePartners.length}</span>
                                    </h3>
                                    <span className="text-slate-400">{showInactive ? '▼' : '▲'}</span>
                                </button>
                                
                                {showInactive && (
                                    <div className="p-6 bg-slate-50/50">
                                        {inactivePartners.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                                {inactivePartners.map(comp => renderCompanyCard(comp))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-10 text-slate-400 italic">No inactive partners found.</div>
                                        )}
                                    </div>
                                )}
                            </div>

                        </div>
                    ) : (
                        <div className="space-y-6 mt-4">
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                                <div className="w-full md:w-auto">
                                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Select Range ({reportMode})</label>
                                    {reportMode === 'Daily' && <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} className="w-full md:w-64 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-primary-400 outline-none text-sm bg-slate-50" />}
                                    {reportMode === 'Weekly' && <input type="week" value={reportWeek} onChange={e => setReportWeek(e.target.value)} className="w-full md:w-64 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-primary-400 outline-none text-sm bg-slate-50" />}
                                    {reportMode === 'Monthly' && <input type="month" value={reportMonth} onChange={e => setReportMonth(e.target.value)} className="w-full md:w-64 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-primary-400 outline-none text-sm bg-slate-50" />}
                                </div>
                                <div className="bg-primary-50 p-4 rounded-xl border border-primary-100 text-center w-full md:w-48 shrink-0">
                                    <div className="text-3xl font-black text-primary-700">{reportVisits.length}</div>
                                    <div className="text-xs font-bold text-primary-600/70 uppercase mt-1">Total Visits</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                                    <div className="p-4 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-900/50 font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2"><History size={18}/> Visit Logs in Range</div>
                                    <div className="p-0 overflow-x-auto">
                                        <table className="w-full text-left text-sm border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 text-xs uppercase tracking-wider">
                                                    <th className="p-4 font-bold">Date</th><th className="p-4 font-bold">Company</th><th className="p-4 font-bold">Type</th><th className="p-4 font-bold">Notes</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {reportVisits.map(v => (
                                                    <tr key={v.id} className="hover:bg-slate-50 dark:bg-slate-900/50 group">
                                                        <td className="p-4 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">{v.visitDate}</td>
                                                        <td className="p-4 font-bold text-primary-700">{v.company}</td>
                                                        <td className="p-4">
                                                            <div className="flex flex-col gap-1 items-start">
                                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${v.visitType === 'Face-to-Face' ? 'bg-primary-100 text-primary-700' : 'bg-emerald-100 text-emerald-700'}`}>{v.visitType}</span>
                                                                {v.isKamustahan && <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-700">Kamustahan</span>}
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-slate-600 dark:text-slate-400 truncate max-w-[200px]" title={v.notes}>{v.notes || '-'}</td>
                                                    </tr>
                                                ))}
                                                {reportVisits.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-slate-400 italic">No visits logged in this period.</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden h-max">
                                    <div className="p-4 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-900/50 font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2"><Activity size={18}/> Top Visited Companies</div>
                                    <div className="p-4 space-y-3">
                                        {sortedCompsByVisits.slice(0, 10).map(([comp, count], i) => (
                                            <div key={comp} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                                                <div className="flex items-center gap-2 overflow-hidden"><div className="font-bold text-slate-400 w-4">{i+1}.</div><div className="font-bold text-slate-700 dark:text-slate-300 truncate">{comp}</div></div>
                                                <div className="bg-primary-100 text-primary-700 font-bold px-2 py-0.5 rounded text-xs">{count}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MODAL: PROFILE */}
                    {showProfileModal && (
                        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
                            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95">
                                <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-center bg-slate-50">
                                    <div><h3 className="font-black text-xl text-slate-800 dark:text-slate-100 flex items-center gap-2"><Building2 className="text-primary-600"/> Company Profile</h3><p className="text-sm font-medium text-slate-500 mt-1">{selectedCompany}</p></div>
                                    <button onClick={() => setShowProfileModal(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 p-2 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 transition-all hover:scale-105"><X size={20}/></button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                    <form id="profileForm" onSubmit={handleSaveProfile} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">MOA Status</label>
                                                <select value={profileForm.moaStatus} onChange={e => setProfileForm({...profileForm, moaStatus: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-primary-500 font-medium text-sm">
                                                    <option>Active</option><option>Pending</option><option>Expired</option>
                                                </select>
                                            </div>
                                            <div className="flex flex-col justify-center">
                                                <label className="flex items-center gap-3 cursor-pointer mt-4 p-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:bg-slate-900/50 transition-colors">
                                                    <input type="checkbox" checked={profileForm.allowOvertime} onChange={e => setProfileForm({...profileForm, allowOvertime: e.target.checked})} className="w-5 h-5 accent-primary-600 rounded" />
                                                    <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">Allow Authorized Overtime</span>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100">
                                            <div className="md:col-span-2"><h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm flex items-center gap-2"><Users size={16}/> Primary HR Contact</h4></div>
                                            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name</label><input type="text" value={profileForm.hrContactName} onChange={e => setProfileForm({...profileForm, hrContactName: e.target.value})} className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-primary-500 text-sm" /></div>
                                            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label><input type="email" value={profileForm.hrContactEmail} onChange={e => setProfileForm({...profileForm, hrContactEmail: e.target.value})} className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-primary-500 text-sm" /></div>
                                            <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone / Mobile</label><input type="text" value={profileForm.hrContactPhone} onChange={e => setProfileForm({...profileForm, hrContactPhone: e.target.value})} className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-primary-500 text-sm" /></div>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Company Addresses & Locations</label>
                                            {profileForm.addresses.map((addr, idx) => (
                                                <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 relative group transition-all">
                                                    {profileForm.addresses.length > 1 && <button type="button" onClick={() => handleRemoveAddressField(idx)} className="absolute top-3 right-3 text-slate-400 hover:text-red-500 bg-white dark:bg-slate-800 p-1 rounded-md shadow-sm border border-slate-100"><X size={14}/></button>}
                                                    <div className="space-y-3 pr-8">
                                                        <input type="text" placeholder="Branch Name / Full Address" value={addr.text} onChange={e => handleAddressChange(idx, 'text', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:border-primary-400 outline-none text-sm bg-white" />
                                                        <input type="url" placeholder="Google Maps Link (Optional)" value={addr.geolocation} onChange={e => handleAddressChange(idx, 'geolocation', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:border-primary-400 outline-none text-sm bg-white" />
                                                    </div>
                                                </div>
                                            ))}
                                            <button type="button" onClick={handleAddAddressField} className="text-xs font-bold text-primary-600 bg-primary-50 hover:bg-primary-100 px-4 py-2.5 rounded-lg flex items-center gap-1 transition-colors border border-primary-100"><Plus size={14}/> Add Branch</button>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Assigned ICs & Status</label>
                                            <textarea value={profileForm.assignedICs} onChange={e => setProfileForm({...profileForm, assignedICs: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-primary-400 outline-none text-sm" rows="2" placeholder="e.g. Active: John Doe, Inactive: Jane Smith"></textarea>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Company Guidelines / Notes</label>
                                            <textarea value={profileForm.notes} onChange={e => setProfileForm({...profileForm, notes: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-primary-400 outline-none text-sm resize-none" rows="3" placeholder="Add specific uniform guidelines, restrictions, etc."></textarea>
                                        </div>
                                    </form>
                                </div>
                                <div className="p-5 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800/50 bg-white">
                                    <button onClick={() => setShowProfileModal(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 transition-colors">Cancel</button>
                                    <button type="submit" form="profileForm" disabled={savingProfile} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-6 rounded-xl transition-colors flex items-center gap-2 shadow-md disabled:opacity-50">
                                        {savingProfile ? <Loader2 className="animate-spin" size={18}/> : <Edit3 size={18}/>} Save Profile
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MODAL: CONCERNS & ISSUES */}
                    {showConcernsModal && (() => {
                        const existing = companyProfiles[selectedCompanyConcerns];
                        const concernsList = existing?.concerns || [];
                        const filteredConcerns = concernsList.map((c, i) => ({...c, originalIndex: i})).filter(c => c.status === concernFilter).sort((a,b) => b.timestamp - a.timestamp);

                        return (
                            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
                                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95">
                                    <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-white">
                                        <div><h3 className="font-black text-xl text-slate-800 dark:text-slate-100 flex items-center gap-2"><AlertTriangle className="text-red-500"/> Issues & Concerns</h3><p className="text-sm font-medium text-slate-500 mt-1">{selectedCompanyConcerns}</p></div>
                                        <button onClick={() => setShowConcernsModal(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 p-2 rounded-full shadow-sm transition-all hover:scale-105"><X size={20}/></button>
                                    </div>
                                    <div className="flex bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 pt-2 gap-4">
                                        <button onClick={() => setConcernFilter('Open')} className={`pb-3 text-sm font-bold border-b-2 transition-colors ${concernFilter === 'Open' ? 'border-red-500 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-300'}`}>Open Issues ({(concernsList).filter(c => c.status === 'Open').length})</button>
                                        <button onClick={() => setConcernFilter('Resolved')} className={`pb-3 text-sm font-bold border-b-2 transition-colors ${concernFilter === 'Resolved' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-300'}`}>Resolved History</button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                        {filteredConcerns.map((concern) => {
                                            const isOpen = concern.status === 'Open';
                                            return (
                                                <div key={concern.timestamp} className={`bg-white dark:bg-slate-800 border p-5 rounded-2xl shadow-sm relative group transition-colors ${isOpen ? 'border-red-200' : 'border-emerald-200 opacity-70 hover:opacity-100'}`}>
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div><span className="text-xs font-bold text-slate-400 block mb-0.5">{concern.date} • {concern.addedBy}</span><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isOpen ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{concern.status}</span></div>
                                                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {isOpen && <button onClick={() => handleAddConcernUpdate(selectedCompanyConcerns, concern.originalIndex)} className="text-[10px] px-2 py-1 rounded font-bold border bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200 transition-colors flex items-center gap-1"><Plus size={12}/> Update</button>}
                                                            <button onClick={() => handleToggleConcernStatus(selectedCompanyConcerns, concern.originalIndex, concern)} className={`text-[10px] px-2 py-1 rounded font-bold border transition-colors ${isOpen ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200' : 'bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200'}`}>Mark {isOpen ? 'Resolved' : 'Reopen'}</button>
                                                            <button onClick={() => handleDeleteConcern(selectedCompanyConcerns, concern.originalIndex)} className="text-[10px] px-2 py-1 rounded font-bold border bg-slate-50 dark:bg-slate-900/50 text-slate-400 hover:bg-red-50 hover:text-red-600 border-slate-200 dark:border-slate-700 transition-colors"><Trash2 size={12}/></button>
                                                        </div>
                                                    </div>
                                                    <div className="text-sm mb-4 text-slate-800 dark:text-slate-100 font-medium">{concern.text}</div>
                                                    {concern.updates && concern.updates.length > 0 && (
                                                        <div className="mt-4 space-y-2 border-l-2 border-slate-100 dark:border-slate-800/50 pl-3">
                                                            {concern.updates.map((upd, uIdx) => (
                                                                <div key={uIdx} className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100">
                                                                    <div className="text-[10px] font-bold text-slate-400 mb-1">{upd.date} • {upd.addedBy}</div>
                                                                    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">{upd.text}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                        {filteredConcerns.length === 0 && <div className="text-center py-10 text-slate-400 italic">No {concernFilter.toLowerCase()} issues found.</div>}
                                    </div>
                                    <div className="p-6 bg-white dark:bg-slate-800 border-t border-slate-200">
                                        <form onSubmit={handleAddConcern}>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Log New Issue or Concern</label>
                                            <div className="flex gap-3">
                                                <input type="text" value={concernText} onChange={(e) => setConcernText(e.target.value)} placeholder="Describe the issue affecting trainees or operations..." className="flex-1 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-red-400 text-sm" required />
                                                <button type="submit" disabled={savingProfile} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2">{savingProfile ? <Loader2 size={18} className="animate-spin" /> : 'Submit'}</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        )
                    })()}

                    {/* MODAL: CONTACTS (Slide-Out Side Drawer from ic-portal) */}
                    {showContactsModal && (() => {
                        const compContacts = contacts.filter(c => c.company === selectedCompany);
                        return (
                            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] flex justify-end">
                                <div className="bg-slate-50 dark:bg-slate-900/50 shadow-2xl w-full max-w-md h-full flex flex-col animate-in slide-in-from-right duration-300">
                                    <div className="p-6 bg-primary-600 text-white flex justify-between items-center shadow-md z-10">
                                        <div><h3 className="font-black text-xl flex items-center gap-2"><UserCircle2 className="text-primary-200"/> Contacts Directory</h3><p className="text-sm font-medium text-primary-200 mt-1">{selectedCompany}</p></div>
                                        <button onClick={() => setShowContactsModal(false)} className="text-primary-200 hover:text-white bg-primary-700/50 p-2 rounded-full transition-all hover:scale-105"><X size={20}/></button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                        {compContacts.length > 0 ? compContacts.map(c => (
                                            <div key={c.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex justify-between items-start shadow-sm group hover:border-primary-200 transition-colors">
                                                <div>
                                                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base">{c.name}</h4>
                                                    <span className="inline-block mt-1 px-2 py-0.5 bg-primary-50 text-primary-700 text-[10px] font-bold rounded uppercase tracking-wider">{c.designation}</span>
                                                    <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                                                        {c.email && <div className="flex items-center gap-2"><Mail size={14} className="text-slate-400"/> {c.email}</div>}
                                                        {c.phone && <div className="flex items-center gap-2"><Phone size={14} className="text-slate-400"/> {c.phone}</div>}
                                                    </div>
                                                </div>
                                                <button onClick={() => handleDeleteContact(c.id)} className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 p-2 rounded-xl transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                                            </div>
                                        )) : <div className="text-center py-10"><UserCircle2 size={40} className="mx-auto text-slate-300 mb-3"/><p className="text-slate-500 font-medium">No contacts saved yet.</p></div>}
                                    </div>
                                    <form onSubmit={handleSaveContact} className="p-6 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]">
                                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2"><PlusCircle size={16} className="text-primary-600"/> Add New Contact</h4>
                                        <div className="space-y-3">
                                            <input required type="text" placeholder="Full Name" value={contactForm.name} onChange={e => setContactForm({...contactForm, name: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:border-primary-400 outline-none text-sm bg-slate-50" />
                                            <input required type="text" placeholder="Designation / Role" value={contactForm.designation} onChange={e => setContactForm({...contactForm, designation: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:border-primary-400 outline-none text-sm bg-slate-50" />
                                            <input type="email" placeholder="Email Address" value={contactForm.email} onChange={e => setContactForm({...contactForm, email: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:border-primary-400 outline-none text-sm bg-slate-50" />
                                            <input type="text" placeholder="Phone Number" value={contactForm.phone} onChange={e => setContactForm({...contactForm, phone: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:border-primary-400 outline-none text-sm bg-slate-50" />
                                        </div>
                                        <button type="submit" disabled={savingContact} className="w-full mt-4 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-md">
                                            {savingContact ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Save Contact
                                        </button>
                                    </form>
                                </div>
                            </div>
                        );
                    })()}

                    {/* MODAL: GEOFENCES */}
                    {showGeofenceModal && (() => {
                        const compGeofences = geofences.filter(g => g.company === selectedGeofenceCompany);
                        return (
                            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
                                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95">
                                    <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-center bg-slate-50">
                                        <div><h3 className="font-black text-xl text-slate-800 dark:text-slate-100 flex items-center gap-2"><MapPin className="text-emerald-500"/> Authorized Geofences</h3><p className="text-sm font-medium text-slate-500 mt-1">{selectedGeofenceCompany}</p></div>
                                        <button onClick={() => setShowGeofenceModal(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 p-2 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 transition-all hover:scale-105"><X size={20}/></button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto flex flex-col md:flex-row bg-slate-50/50">
                                        <form onSubmit={handleAddGeofence} className="p-6 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 w-full md:w-80 shrink-0">
                                            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-4 uppercase tracking-wider flex items-center gap-2"><PlusCircle size={16} className="text-emerald-600"/> Add Location</h4>
                                            <div className="space-y-4">
                                                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Label</label><input required type="text" placeholder="e.g. Main Office" value={newLocation.label} onChange={e => setNewLocation({...newLocation, label: e.target.value})} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 text-sm" /></div>
                                                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Latitude</label><input required type="number" step="any" placeholder="14.12345" value={newLocation.latitude} onChange={e => setNewLocation({...newLocation, latitude: e.target.value})} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 text-sm font-mono" /></div>
                                                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Longitude</label><input required type="number" step="any" placeholder="121.12345" value={newLocation.longitude} onChange={e => setNewLocation({...newLocation, longitude: e.target.value})} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 text-sm font-mono" /></div>
                                                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex justify-between"><span>Radius (meters)</span><span className="text-emerald-600">{newLocation.radius}m</span></label><input required type="range" min="10" max="1000" step="10" value={newLocation.radius} onChange={e => setNewLocation({...newLocation, radius: e.target.value})} className="w-full accent-emerald-500" /></div>
                                            </div>
                                            <button type="submit" disabled={savingGeofence} className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors flex justify-center items-center gap-2 shadow-md">{savingGeofence ? <Loader2 className="animate-spin" size={18}/> : <Navigation size={18}/>} Save Coordinates</button>
                                        </form>
                                        <div className="flex-1 p-6 space-y-4">
                                            {compGeofences.length === 0 ? (
                                                <div className="text-center py-10 text-slate-400 italic text-sm bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200">No geofences set. Clock-ins are currently unrestricted.</div>
                                            ) : (
                                                compGeofences.map(loc => (
                                                    <div key={loc.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex justify-between items-center shadow-sm">
                                                        <div><div className="font-bold text-slate-800 dark:text-slate-100 text-sm">{loc.label}</div><div className="text-xs text-slate-500 font-mono mt-1">Lat: {loc.latitude} | Lng: {loc.longitude} | Rad: {loc.radius}m</div></div>
                                                        <button onClick={() => handleDeleteGeofence(loc.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors ml-4 shrink-0"><Trash2 size={18}/></button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* MODAL: EXPORT CONFIGURATION */}
                    {showExportModal && (
                        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                            <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
                                <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-center bg-emerald-50">
                                    <div><h3 className="text-xl font-black text-emerald-800 flex items-center gap-2"><Download className="text-emerald-600"/> Data Export Settings</h3><p className="text-sm text-emerald-600/80 mt-1">Select the tables to include in your Excel file.</p></div>
                                    <button onClick={() => setShowExportModal(false)} className="text-emerald-600 hover:text-emerald-800 transition-colors"><XCircle size={24}/></button>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="flex flex-col gap-3 mb-6 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Date Constraint (For Visits Export)</label>
                                        <div className="grid grid-cols-2 gap-3"><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 text-sm font-medium" /><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 text-sm font-medium" /></div>
                                    </div>
                                    <label className="flex items-start gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:bg-slate-900/50 transition-colors"><input type="checkbox" checked={exportConfig.overview} onChange={e => setExportConfig({...exportConfig, overview: e.target.checked})} className="mt-1 w-5 h-5 accent-emerald-600 rounded" /><div><p className="font-bold text-slate-800 dark:text-slate-100 text-sm">Company Overview</p><p className="text-xs text-slate-500">Masterlist with MOA Status, Trainee Counts, and HR details.</p></div></label>
                                    <label className="flex items-start gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:bg-slate-900/50 transition-colors"><input type="checkbox" checked={exportConfig.contacts} onChange={e => setExportConfig({...exportConfig, contacts: e.target.checked})} className="mt-1 w-5 h-5 accent-emerald-600 rounded" /><div><p className="font-bold text-slate-800 dark:text-slate-100 text-sm">Company Contacts</p><p className="text-xs text-slate-500">Full directory of saved names, emails, and phone numbers.</p></div></label>
                                    <label className="flex items-start gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:bg-slate-900/50 transition-colors"><input type="checkbox" checked={exportConfig.trainees} onChange={e => setExportConfig({...exportConfig, trainees: e.target.checked})} className="mt-1 w-5 h-5 accent-emerald-600 rounded" /><div><p className="font-bold text-slate-800 dark:text-slate-100 text-sm">Trainees Under Companies</p><p className="text-xs text-slate-500">List of individual trainees grouped by company.</p></div></label>
                                    <label className="flex items-start gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:bg-slate-900/50 transition-colors"><input type="checkbox" checked={exportConfig.visits} onChange={e => setExportConfig({...exportConfig, visits: e.target.checked})} className="mt-1 w-5 h-5 accent-emerald-600 rounded" /><div><p className="font-bold text-slate-800 dark:text-slate-100 text-sm">Visit & Interaction History</p><p className="text-xs text-slate-500">Logs constrained by the optional Date Pickers above.</p></div></label>
                                </div>
                                <div className="p-4 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3"><button onClick={() => setShowExportModal(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition-colors">Cancel</button><button onClick={executeExportXLS} disabled={!exportConfig.overview && !exportConfig.contacts && !exportConfig.trainees && !exportConfig.visits} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold transition-colors disabled:opacity-50">Download XLS File</button></div>
                            </div>
                        </div>
                    )}

                    {/* MODAL: HISTORY */}
                    {historyModalCompany && (() => {
                        const companyVisits = visits.filter(v => v.company === historyModalCompany).sort((a,b) => new Date(b.visitDate) - new Date(a.visitDate));
                        return (
                            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[90] flex items-center justify-center p-4 animate-fade-in">
                                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95">
                                    <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-center bg-slate-50">
                                        <div><h3 className="font-black text-xl text-slate-800 dark:text-slate-100 flex items-center gap-2"><History className="text-blue-500"/> Visit History</h3><p className="text-sm font-medium text-slate-500 mt-1">{historyModalCompany}</p></div>
                                        <button onClick={() => setHistoryModalCompany(null)} className="text-slate-400 hover:text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 p-2 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 transition-all hover:scale-105"><X size={20}/></button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                                        {companyVisits.length > 0 ? (
                                            <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 space-y-6">
                                                {companyVisits.map((v) => (
                                                    <div key={v.id} className="relative pl-6">
                                                        <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-1.5 ring-4 ring-slate-50"></div>
                                                        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                                            <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                                                                <div className="font-black text-slate-700 dark:text-slate-300 text-lg">{v.visitDate}</div>
                                                                <div className="flex gap-2">
                                                                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${v.visitType === 'Face-to-Face' ? 'bg-primary-100 text-primary-700' : 'bg-emerald-100 text-emerald-700'}`}>{v.visitType}</span>
                                                                    {v.isKamustahan && <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700">Kamustahan</span>}
                                                                </div>
                                                            </div>
                                                            <div className="text-sm text-slate-600 dark:text-slate-400 font-medium whitespace-pre-wrap bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100">{v.notes || 'No notes provided.'}</div>
                                                            <div className="mt-3 text-xs font-bold text-slate-400">Logged by: <span className="text-slate-600 dark:text-slate-400">{v.icName || v.assignedIC}</span></div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : <div className="text-center py-10"><History size={40} className="mx-auto text-slate-300 mb-3"/><p className="text-slate-500 font-medium">No visits recorded.</p></div>}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            );
        }

        // --- INTERACTIVE STATUS BAR ---
        const SyncStatusBar = ({ isVisible, message, type = 'loading' }) => {
            if (!isVisible) return null;
            return (
                <div className="fixed bottom-6 right-6 z-50 animate-bounce">
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-md border ${
                        type === 'loading' ? 'bg-blue-900/80 border-blue-500/50 text-blue-100' :
                        type === 'success' ? 'bg-emerald-900/80 border-emerald-500/50 text-emerald-100' :
                        'bg-red-900/80 border-red-500/50 text-red-100'
                    }`}>
                        {type === 'loading' && <Loader2 className="w-5 h-5 animate-spin" />}
                        {type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                        {type === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
                        <span className="font-medium text-sm">{message}</span>
                    </div>
                </div>
            );
        };

        // --- MAIN PORTAL COMPONENT ---
        const ICManagementPortal = ({ user, handleLogout }) => {
            const [activeTab, setActiveTab] = useState('dashboard');
            const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
            const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

            useEffect(() => {
                if (darkMode) {
                    document.documentElement.classList.add('dark');
                    localStorage.setItem('theme', 'dark');
                } else {
                    document.documentElement.classList.remove('dark');
                    localStorage.setItem('theme', 'light');
                }
            }, [darkMode]);

            // Global Data States
            const [trainees, setTrainees] = useState([]);
            const [visits, setVisits] = useState([]);
            const [meetings, setMeetings] = useState([]);
            const [contacts, setContacts] = useState([]);
            const [companyProfiles, setCompanyProfiles] = useState({});
            const [geofences, setGeofences] = useState([]);
            const [attendanceLogs, setAttendanceLogs] = useState([]);
            const [attendanceLogsFetched, setAttendanceLogsFetched] = useState(false);
            const [loadingData, setLoadingData] = useState(true);
            const [syncStatus, setSyncStatus] = useState({ visible: false, message: '', type: 'loading' });
            const [isRefreshing, setIsRefreshing] = useState(false);

            const handleRefreshData = () => {
                setIsRefreshing(true);
                localStorage.removeItem('astp_attendance_cache');
                localStorage.removeItem('astp_attendance_cache_time');
                setAttendanceLogsFetched(false);
                setTimeout(() => setIsRefreshing(false), 1500);
            };

            const showSyncStatus = (message, type = 'loading', duration = 0) => {
                setSyncStatus({ visible: true, message, type });
                if (duration > 0) {
                    setTimeout(() => {
                        setSyncStatus(prev => ({ ...prev, visible: false }));
                    }, duration);
                }
            };

            // Filter States
            const [dateMode, setDateMode] = useState('Monthly');
            const [dateValues, setDateValues] = useState({
                daily: getTodayString(),
                weekly: getWeekString(),
                monthly: getMonthString(),
                quarter: Math.floor(new Date().getMonth() / 3) + 1,
                semester: new Date().getMonth() < 6 ? 1 : 2,
                year: new Date().getFullYear()
            });

            // Calculate exact start/end dates based on filters
            const dateRange = useMemo(() => {
                let start, end;
                const year = parseInt(dateValues.year);
                
                if (dateMode === 'Daily') {
                    start = new Date(`${dateValues.daily}T00:00:00`);
                    end = new Date(`${dateValues.daily}T23:59:59`);
                } else if (dateMode === 'Weekly') {
                    const [y, w] = dateValues.weekly.split('-W');
                    const simple = new Date(y, 0, 1 + (w - 1) * 7);
                    const dow = simple.getDay();
                    start = new Date(simple);
                    start.setDate(simple.getDate() - dow + (dow === 0 ? -6 : 1));
                    start.setHours(0,0,0,0);
                    end = new Date(start);
                    end.setDate(start.getDate() + 6);
                    end.setHours(23,59,59,999);
                } else if (dateMode === 'Monthly') {
                    const [y, m] = dateValues.monthly.split('-');
                    start = new Date(y, m - 1, 1, 0,0,0,0);
                    end = new Date(y, m, 0, 23,59,59,999);
                } else if (dateMode === 'Quarterly') {
                    const q = parseInt(dateValues.quarter);
                    start = new Date(year, (q - 1) * 3, 1, 0,0,0,0);
                    end = new Date(year, q * 3, 0, 23,59,59,999);
                } else if (dateMode === 'Semestral') {
                    const s = parseInt(dateValues.semester);
                    start = new Date(year, (s - 1) * 6, 1, 0,0,0,0);
                    end = new Date(year, s * 6, 0, 23,59,59,999);
                } else if (dateMode === 'Yearly') {
                    start = new Date(year, 0, 1, 0,0,0,0);
                    end = new Date(year, 11, 31, 23,59,59,999);
                }
                return { start, end };
            }, [dateMode, dateValues]);

            // Data Fetching — single set of listeners for all shared collections
            useEffect(() => {
                const traineesRef = collection(db, 'artifacts', appId, 'public', 'data', 'trainees');
                const visitsRef = collection(db, 'artifacts', appId, 'public', 'data', 'visits');
                const meetingsRef = collection(db, 'artifacts', appId, 'public', 'data', 'meetings');
                const contactsRef = collection(db, 'artifacts', appId, 'public', 'data', 'contacts');
                const profilesRef = collection(db, 'artifacts', appId, 'public', 'data', 'company_profiles');
                const geofencesRef = collection(db, 'artifacts', appId, 'public', 'data', 'geofences');

                const unsubTrainees = onSnapshot(traineesRef, snap => {
                    setTrainees(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                    setLoadingData(false);
                });
                const unsubVisits = onSnapshot(visitsRef, snap => {
                    setVisits(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                });
                const unsubMeetings = onSnapshot(meetingsRef, snap => {
                    setMeetings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                });
                const unsubContacts = onSnapshot(contactsRef, snap => {
                    setContacts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                });
                const unsubProfiles = onSnapshot(profilesRef, snap => {
                    const profiles = {};
                    snap.docs.forEach(docItem => {
                        profiles[docItem.data().companyName] = { id: docItem.id, ...docItem.data() };
                    });
                    setCompanyProfiles(profiles);
                });
                const unsubGeofences = onSnapshot(geofencesRef, snap => {
                    setGeofences(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                });
                
                showSyncStatus('Live database synced', 'success', 2000);

                return () => { unsubTrainees(); unsubVisits(); unsubMeetings(); unsubContacts(); unsubProfiles(); unsubGeofences(); };
            }, []);

            // Lazy-load attendance logs only when dashboard or attendance tab is active
            useEffect(() => {
                if (attendanceLogsFetched) return;
                if (activeTab !== 'dashboard' && activeTab !== 'attendance') return;
                const fetchLogs = async () => {
                    try {
                        const cachedLogs = localStorage.getItem('astp_attendance_cache');
                        const cacheTime = localStorage.getItem('astp_attendance_cache_time');
                        
                        if (cachedLogs && cacheTime && (Date.now() - parseInt(cacheTime)) < 3600000) {
                            try {
                                setAttendanceLogs(JSON.parse(cachedLogs));
                                setAttendanceLogsFetched(true);
                                showSyncStatus('Loaded attendance from cache', 'success', 2000);
                                return;
                            } catch (e) { console.error('Cache parse error', e); }
                        }

                        showSyncStatus('Fetching ASTP attendance...', 'loading');
                        const astpTrainees = trainees.filter(t => String(t.level || t.Level || t.LEVEL || '').toUpperCase() === 'ASTP');
                        if (astpTrainees.length === 0) {
                            setAttendanceLogsFetched(true);
                            return;
                        }
                        const profilesSnap = await getDocs(query(collectionGroup(db, 'profile'), where('role', '==', 'trainee')));
                        const studentIdToUid = {};
                        const uidToStudentId = {};
                        profilesSnap.forEach(doc => {
                            const data = doc.data();
                            const uid = data.uid || (doc.ref.parent && doc.ref.parent.parent ? doc.ref.parent.parent.id : null);
                            const sid = String(data.studentId || data['Student ID#'] || '').trim();
                            if (uid && sid) {
                                studentIdToUid[sid] = uid;
                                uidToStudentId[uid] = sid;
                            }
                        });
                        const astpUids = astpTrainees.map(t => {
                            const sid = String(t.studentId || t['Student ID#'] || '').trim();
                            return studentIdToUid[sid];
                        }).filter(Boolean);
                        let allAstpLogs = [];
                        const chunkSize = 30;
                        for (let i = 0; i < astpUids.length; i += chunkSize) {
                            const chunk = astpUids.slice(i, i + chunkSize);
                            await Promise.all(chunk.map(async (uid) => {
                                const logsRef = collection(db, 'artifacts', appId, 'users', uid, 'attendanceLogs');
                                const snap = await getDocs(logsRef);
                                const sid = uidToStudentId[uid];
                                snap.forEach(d => { allAstpLogs.push({ id: d.id, studentId: sid, uid: uid, ...d.data() }); });
                            }));
                        }
                        setAttendanceLogs(allAstpLogs);
                        try {
                            localStorage.setItem('astp_attendance_cache', JSON.stringify(allAstpLogs));
                            localStorage.setItem('astp_attendance_cache_time', Date.now().toString());
                        } catch(e) { console.warn('Could not save to cache (limit exceeded?)', e); }
                        showSyncStatus('Attendance loaded successfully', 'success', 3000);
                    } catch (err) {
                        console.error("Error fetching logs:", err);
                        showSyncStatus('Error fetching attendance', 'error', 4000);
                    }
                    setAttendanceLogsFetched(true);
                };
                fetchLogs();
            }, [activeTab, attendanceLogsFetched]);

            // --- FILTERED DATA MEMOS ---
            const filterByDate = (dateString) => {
                if (!dateString) return false;
                const d = new Date(dateString);
                return d >= dateRange.start && d <= dateRange.end;
            };

            const periodVisits = useMemo(() => visits.filter(v => filterByDate(v.visitDate || v.createdAt)), [visits, dateRange]);
            const periodMeetings = useMemo(() => meetings.filter(m => filterByDate(m.meetingDate || m.createdAt)), [meetings, dateRange]);
            
            const activeTrainees = useMemo(() => trainees.filter(t => (t.status || 'Active').toLowerCase() === 'active'), [trainees]);
            const uniqueCompanies = useMemo(() => [...new Set(activeTrainees.map(t => t.company || 'Unassigned'))].sort(), [activeTrainees]);
            const uniqueICs = useMemo(() => [...new Set(activeTrainees.map(t => t.assignedIC || 'Unassigned'))].sort(), [activeTrainees]);

            // --- ATTENDANCE CALCULATIONS ---
            const calculateHours = (inTime, outTime) => {
                if (!inTime || !outTime) return 0;
                return (new Date(outTime) - new Date(inTime)) / (1000 * 60 * 60);
            };
            const isLate = (inTime) => {
                if (!inTime) return false;
                const d = new Date(inTime);
                return d.getHours() > 8 || (d.getHours() === 8 && d.getMinutes() > 0);
            };

            const attendanceMetrics = useMemo(() => {
                // Skip expensive computation if logs haven't been loaded yet
                if (attendanceLogs.length === 0) {
                    return {
                        traineeDetails: [],
                        summary: { present: 0, late: 0, undertime: 0, absent: 0, totalExpected: 0, pctPresent: 0, pctLate: 0, pctAbsent: 0, pctUndertime: 0 }
                    };
                }

                const logsInRange = attendanceLogs.filter(l => {
                    let t = parseTime(l.timestamp) || parseTime(l.timeIn) || parseTime(l.date);
                    if (!t) return false;
                    return t >= dateRange.start && t <= dateRange.end;
                });

                let totalExpectedDays = 0;
                let tempD = new Date(dateRange.start);
                let endD = new Date(dateRange.end);
                let today = new Date();
                if (endD > today) endD = today; 
                while(tempD <= endD) {
                    const dw = tempD.getDay();
                    if (dw !== 0 && dw !== 6) totalExpectedDays++;
                    tempD.setDate(tempD.getDate() + 1);
                }

                let totalPresent = 0;
                let totalLate = 0;
                let totalUndertime = 0;
                let totalAbsent = 0;
                let validTraineesCount = activeTrainees.length;

                // Process per trainee
                const traineeAttendance = activeTrainees.map(t => {
                    const tLogs = logsInRange.filter(l => String(l.extractedUserId || l.studentId) === String(t.id || t.studentId));
                    const dailyMap = {};
                    
                    tLogs.forEach(l => {
                        let inTime = parseTime(l.timeIn);
                        let outTime = parseTime(l.timeOut);
                        if (l.timestamp && !inTime && !outTime) {
                            const tTime = parseTime(l.timestamp);
                            const type = String(l.type).toUpperCase();
                            if (type.includes('IN')) inTime = tTime;
                            if (type.includes('OUT')) outTime = tTime;
                        }
                        if (inTime) {
                            const dStr = inTime.toLocaleDateString();
                            if (!dailyMap[dStr]) dailyMap[dStr] = { in: null, out: null };
                            if (!dailyMap[dStr].in || inTime < dailyMap[dStr].in) dailyMap[dStr].in = inTime;
                        }
                        if (outTime) {
                            const dStr = outTime.toLocaleDateString();
                            if (!dailyMap[dStr]) dailyMap[dStr] = { in: null, out: null };
                            if (!dailyMap[dStr].out || outTime > dailyMap[dStr].out) dailyMap[dStr].out = outTime;
                        }
                    });

                    let tPresent = 0, tLate = 0, tUndertime = 0;
                    Object.values(dailyMap).forEach(day => {
                        if (day.in && day.out) {
                            tPresent++;
                            const hrs = calculateHours(day.in, day.out);
                            if (isLate(day.in)) tLate++;
                            if (hrs < 8) tUndertime++;
                        } else if (day.in) {
                            tPresent++;
                            if (isLate(day.in)) tLate++;
                        }
                    });

                    let tAbsent = Math.max(0, totalExpectedDays - tPresent);
                    
                    totalPresent += tPresent;
                    totalLate += tLate;
                    totalUndertime += tUndertime;
                    totalAbsent += tAbsent;

                    return { ...t, tPresent, tLate, tUndertime, tAbsent, totalExpectedDays };
                });

                const totalPossibleRecords = validTraineesCount * totalExpectedDays;
                
                return {
                    traineeDetails: traineeAttendance,
                    summary: {
                        present: totalPresent,
                        late: totalLate,
                        undertime: totalUndertime,
                        absent: totalAbsent,
                        totalExpected: totalPossibleRecords,
                        pctPresent: totalPossibleRecords ? ((totalPresent / totalPossibleRecords) * 100).toFixed(1) : 0,
                        pctLate: totalPossibleRecords ? ((totalLate / totalPossibleRecords) * 100).toFixed(1) : 0,
                        pctAbsent: totalPossibleRecords ? ((totalAbsent / totalPossibleRecords) * 100).toFixed(1) : 0,
                        pctUndertime: totalPossibleRecords ? ((totalUndertime / totalPossibleRecords) * 100).toFixed(1) : 0,
                    }
                };
            }, [activeTrainees, attendanceLogs, dateRange]);


            // --- TAB COMPONENTS ---
            const DashboardTab = ({ allTrainees = [], attendanceLogs = [] }) => {
                const [activeSubTab, setActiveSubTab] = useState('overview'); 
                const [activeChart, setActiveChart] = useState('company'); 
                
                const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16', '#6366f1', '#14b8a6'];

                const astpTrainees = useMemo(() => {
                    return allTrainees.filter(t => String(t.level || t.Level || t.LEVEL || '').toUpperCase() === 'ASTP');
                }, [allTrainees]);

                const activeAstpTrainees = useMemo(() => {
                    return astpTrainees.filter(t => String(t.status || t.Status || '').toLowerCase() === 'active');
                }, [astpTrainees]);

                const processGroupings = (data, keyFunction, topLimit = 0) => {
                    const counts = {};
                    data.forEach(item => {
                        const key = keyFunction(item) || 'Unassigned / Unknown';
                        counts[key] = (counts[key] || 0) + 1;
                    });
                    let sorted = Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
                    if (topLimit > 0 && sorted.length > topLimit) {
                        const top = sorted.slice(0, topLimit);
                        const othersCount = sorted.slice(topLimit).reduce((sum, item) => sum + item.value, 0);
                        top.push({ name: 'Others', value: othersCount });
                        return top;
                    }
                    return sorted;
                };

                const getElapsedMonths = (dateStr) => {
                    if (!dateStr) return { label: "Unknown Date", sortValue: 999 };
                    const startDate = new Date(dateStr);
                    if (isNaN(startDate.getTime())) return { label: "Invalid Date", sortValue: 999 };
                    const now = new Date();
                    const totalMonthsElapsed = (now.getFullYear() - startDate.getFullYear()) * 12 + now.getMonth() - startDate.getMonth();
                    if (totalMonthsElapsed < 0) return { label: "Future Date", sortValue: -1 };
                    const currentMonth = totalMonthsElapsed + 1;
                    if (currentMonth <= 18) return { label: `${currentMonth} Month(s)`, sortValue: currentMonth };
                    return { label: "> 18 Months", sortValue: 99 };
                };

                const overviewChartData = useMemo(() => {
                    if (activeChart === 'company') return processGroupings(activeAstpTrainees, t => t.company || t.companyName || t['Company Name'], 10);
                    if (activeChart === 'ic') return processGroupings(activeAstpTrainees, t => t.assignedIC || t.icName || t['Assigned IC']);
                    if (activeChart === 'month') {
                        const counts = {};
                        activeAstpTrainees.forEach(t => {
                            const dateField = t['IPT Date Start'] || t.iptDateStart || t.startDate;
                            const monthInfo = getElapsedMonths(dateField);
                            const key = monthInfo.label;
                            if (!counts[key]) counts[key] = { value: 0, sortValue: monthInfo.sortValue };
                            counts[key].value += 1;
                        });
                        return Object.entries(counts).map(([name, data]) => ({ name, value: data.value, sortValue: data.sortValue })).sort((a, b) => a.sortValue - b.sortValue);
                    }
                    return [];
                }, [activeAstpTrainees, activeChart]);

                const dailyAttendanceMetrics = useMemo(() => {
                    const todayStr = getTodayString();
                    const todayLogs = attendanceLogs.filter(l => {
                        const t = parseTime(l.timestamp) || parseTime(l.timeIn) || parseTime(l.date);
                        if (!t) return false;
                        const tDateStr = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
                        return tDateStr === todayStr;
                    });
                    const logsByStudent = {};
                    todayLogs.forEach(log => {
                        let sid = log.studentId || log['Student ID#'];
                        if (!sid) return;
                        sid = String(sid).trim();
                        if (!logsByStudent[sid]) logsByStudent[sid] = { in: null, out: null };
                        if (log.type === 'IN') logsByStudent[sid].in = log.timestamp || log.timeIn;
                        if (log.type === 'OUT') logsByStudent[sid].out = log.timestamp || log.timeOut;
                    });
                    let clockedInCount = 0;
                    let completedShiftCount = 0;
                    let undertimeCount = 0;
                    activeAstpTrainees.forEach(t => {
                        const sid = String(t.studentId || t['Student ID#'] || '').trim();
                        const logs = logsByStudent[sid];
                        if (logs) {
                            if (logs.in && !logs.out) {
                                clockedInCount++;
                            } else if (logs.in && logs.out) {
                                completedShiftCount++;
                                const inTime = parseTime(logs.in).getTime();
                                const outTime = parseTime(logs.out).getTime();
                                const hours = (outTime - inTime) / (1000 * 60 * 60);
                                if (hours < 8) undertimeCount++;
                            }
                        }
                    });
                    const pctUndertime = completedShiftCount > 0 ? ((undertimeCount / completedShiftCount) * 100).toFixed(1) : 0;
                    return { clockedInCount, completedShiftCount, undertimeCount, pctUndertime };
                }, [attendanceLogs, activeAstpTrainees]);

                const attendanceChartData = [
                    { name: 'Currently Clocked In', value: dailyAttendanceMetrics.clockedInCount, fill: '#3b82f6' },
                    { name: 'Completed Full Shift', value: dailyAttendanceMetrics.completedShiftCount - dailyAttendanceMetrics.undertimeCount, fill: '#10b981' },
                    { name: 'Undertime', value: dailyAttendanceMetrics.undertimeCount, fill: '#f59e0b' }
                ].filter(d => d.value > 0);

                const CustomTooltip = ({ active, payload }) => {
                    if (active && payload && payload.length) {
                        const data = payload[0];
                        return (
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 dark:border-slate-800/50 min-w-[180px] z-50">
                                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800/50">
                                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: data.payload.fill || COLORS[data.name.length % COLORS.length] }}></div>
                                    <span className="font-bold text-slate-800 dark:text-slate-100">{data.name}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm mb-1">
                                    <span className="text-slate-500 font-medium">Count</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-100">{data.value}</span>
                                </div>
                            </div>
                        );

                    }
                    return null;
                };

                return (
                    <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl lg:text-4xl font-black text-slate-800 dark:text-white tracking-tight">Dashboard Overview</h1>
                                <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">ASTP Masterlist Insights & Daily Attendance</p>
                            </div>
                        </div>

                        {/* SUB-TABS */}
                        <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-slate-900/50 rounded-2xl w-fit">
                            <button onClick={() => setActiveSubTab('overview')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${activeSubTab === 'overview' ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'}`}>ASTP Overview</button>
                            <button onClick={() => setActiveSubTab('attendance')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${activeSubTab === 'attendance' ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'}`}>Today's Attendance</button>
                        </div>

                        {activeSubTab === 'overview' && (
                            <div className="space-y-6 animate-in fade-in duration-500">
                                {/* METRICS */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                                    <div className="bg-gradient-to-br from-blue-500 to-primary-600 rounded-3xl p-6 lg:p-8 text-white shadow-lg relative overflow-hidden group">
                                        <div className="absolute -right-6 -top-6 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                                        <div className="relative z-10">
                                            <p className="text-blue-100 font-bold tracking-wide uppercase text-xs mb-1">Total ASTP Masterlist</p>
                                            <div className="flex items-end gap-3">
                                                <h3 className="text-4xl lg:text-5xl font-black tracking-tight">{astpTrainees.length}</h3>
                                                <span className="text-blue-100 font-medium pb-1.5 flex items-center gap-1"><Users size={16}/> Sync Count</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden group">
                                        <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-500 opacity-5 dark:opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                                        <div className="relative z-10">
                                            <p className="text-slate-500 font-bold tracking-wide uppercase text-xs mb-1">Active ASTP Trainees</p>
                                            <div className="flex items-end gap-3">
                                                <h3 className="text-4xl lg:text-5xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{activeAstpTrainees.length}</h3>
                                                <span className="text-emerald-500 font-bold pb-1.5 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-md flex items-center gap-1"><Activity size={14}/> Active</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* GRAPH SECTION */}
                                <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col min-h-[500px]">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-slate-100 dark:border-slate-800/50 pb-4">
                                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                                            Active ASTP Trainees by <span className="text-primary-600">{activeChart.toUpperCase()}</span>
                                        </h3>
                                        <div className="flex flex-wrap gap-2 p-1.5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl w-fit">
                                            <button onClick={() => setActiveChart('company')} className={`px-4 py-2 rounded-xl font-bold text-xs transition-all duration-300 ${activeChart === 'company' ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50'}`}>COMPANY</button>
                                            <button onClick={() => setActiveChart('ic')} className={`px-4 py-2 rounded-xl font-bold text-xs transition-all duration-300 ${activeChart === 'ic' ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50'}`}>IC</button>
                                            <button onClick={() => setActiveChart('month')} className={`px-4 py-2 rounded-xl font-bold text-xs transition-all duration-300 ${activeChart === 'month' ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50'}`}>MONTHS SINCE IPT</button>
                                        </div>
                                    </div>

                                    {overviewChartData.length === 0 ? (
                                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 min-h-[300px]">
                                            <BarChart2 size={48} className="mb-4 opacity-20" />
                                            <p>No active ASTP trainees found</p>
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col lg:flex-row gap-8">
                                            <div className="w-full lg:w-[45%] h-[300px] lg:h-full min-h-[300px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie data={overviewChartData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={2} dataKey="value" stroke="none">
                                                            {overviewChartData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip content={<CustomTooltip />} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div className="w-full lg:w-[55%] h-[400px] lg:h-full overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-2xl shadow-inner bg-slate-50/50 dark:bg-slate-900/20">
                                                <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300 border-collapse">
                                                    <thead className="bg-slate-100/80 dark:bg-slate-800/80 sticky top-0 z-10 backdrop-blur-md shadow-sm">
                                                        <tr>
                                                            <th className="p-4 font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-xs">Grouping</th>
                                                            <th className="p-4 font-bold text-slate-800 dark:text-slate-100 text-right uppercase tracking-wider text-xs">Headcount</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/60 bg-white dark:bg-slate-800/30">
                                                        {overviewChartData.map((item, idx) => (
                                                            <tr key={idx} className="hover:bg-primary-50/40 dark:hover:bg-primary-900/10 transition-colors">
                                                                <td className="p-4 flex items-center gap-3">
                                                                    <div className="w-4 h-4 rounded-md shrink-0 shadow-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                                                    <span className="font-bold text-slate-700 dark:text-slate-300">{item.name}</span>
                                                                </td>
                                                                <td className="p-4 font-black text-right text-slate-800 dark:text-slate-100 text-base">{item.value}</td>
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

                        {activeSubTab === 'attendance' && (
                            <div className="space-y-6 animate-in fade-in duration-500">
                                {/* ATTENDANCE METRICS */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
                                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-blue-100 dark:border-blue-900/50 relative overflow-hidden">
                                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500 opacity-5 rounded-full blur-xl"></div>
                                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-wider mb-2 flex items-center gap-1"><History size={12} className="text-blue-500"/> Currently Clocked In</p>
                                        <h3 className="text-3xl font-black text-slate-800 dark:text-white">{dailyAttendanceMetrics.clockedInCount}</h3>
                                        <p className="text-xs text-slate-400 mt-2 font-medium">ASTP active shifts today</p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-emerald-100 dark:border-emerald-900/50 relative overflow-hidden">
                                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500 opacity-5 rounded-full blur-xl"></div>
                                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-wider mb-2 flex items-center gap-1"><CheckSquare size={12} className="text-emerald-500"/> Completed Shifts</p>
                                        <h3 className="text-3xl font-black text-slate-800 dark:text-white">{dailyAttendanceMetrics.completedShiftCount}</h3>
                                        <p className="text-xs text-slate-400 mt-2 font-medium">ASTP shifts finished today</p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-orange-100 dark:border-orange-900/50 relative overflow-hidden">
                                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-500 opacity-5 rounded-full blur-xl"></div>
                                        <div className="flex justify-between items-start">
                                            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-wider mb-2 flex items-center gap-1"><AlertTriangle size={12} className="text-orange-500"/> Undertime</p>
                                            <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-bold px-2 py-0.5 rounded-lg">{dailyAttendanceMetrics.pctUndertime}%</span>
                                        </div>
                                        <h3 className="text-3xl font-black text-slate-800 dark:text-white">{dailyAttendanceMetrics.undertimeCount}</h3>
                                        <p className="text-xs text-slate-400 mt-2 font-medium">Of completed shifts</p>
                                    </div>
                                </div>

                                {/* ATTENDANCE CHART */}
                                <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col min-h-[400px]">
                                    <div className="mb-8 border-b border-slate-100 dark:border-slate-800/50 pb-4">
                                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                            <CalendarCheck className="text-primary-500"/> Today's Attendance Breakdown
                                        </h3>
                                        <p className="text-slate-500 text-sm mt-1">ASTP active trainees attendance snapshot</p>
                                    </div>

                                    {attendanceChartData.length === 0 ? (
                                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 min-h-[250px]">
                                            <BarChart2 size={48} className="mb-4 opacity-20" />
                                            <p>No ASTP attendance logs recorded today.</p>
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16">
                                            <div className="w-full lg:w-[50%] h-[300px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie data={attendanceChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" stroke="none">
                                                            {attendanceChartData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip content={<CustomTooltip />} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div className="w-full lg:w-[40%] space-y-4">
                                                {attendanceChartData.map((item, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: item.fill }}></div>
                                                            <span className="font-bold text-slate-700 dark:text-slate-300">{item.name}</span>
                                                        </div>
                                                        <span className="font-black text-xl text-slate-800 dark:text-slate-100">{item.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                );
            };


            const CompanyMeetingsTab = ({ allVisits = [], allTrainees = [] }) => {
                // --- STATE ---
                const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear().toString());
                const [selectedMonth, setSelectedMonth] = useState(() => new Date().toLocaleString('en-US', { month: 'short' })); 
                const [selectedIC, setSelectedIC] = useState(null);

                const [sortConfig, setSortConfig] = useState({ key: 'activeTrainees', direction: 'desc' });
                // Static list of months
                const monthsList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

                // --- HELPER FUNCTIONS ---
                const parseDate = (dateInput) => {
                    if (!dateInput) return new Date(NaN);
                    
                    // Handle Firestore Timestamps safely if present
                    if (typeof dateInput === 'object') {
                        if (typeof dateInput.toDate === 'function') return dateInput.toDate();
                        if (dateInput.seconds !== undefined) return new Date(dateInput.seconds * 1000);
                    }
                    
                    if (typeof dateInput === 'string') {
                        const trimmed = dateInput.trim();

                        // FIXED: Handle YYYY-MM-DD exactly to prevent timezone offset bugs hiding new visits
                        const ymdRegex = /^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/;
                        const ymdMatch = trimmed.match(ymdRegex);
                        if (ymdMatch) {
                            const year = parseInt(ymdMatch[1], 10);
                            const month = parseInt(ymdMatch[2], 10);
                            const day = parseInt(ymdMatch[3], 10);
                            return new Date(year, month - 1, day);
                        }
                        
                        let nativeDate = new Date(trimmed);
                        if (!isNaN(nativeDate.getTime())) return nativeDate;
                        
                        // Handle DD/MM/YYYY variation
                        const dmyRegex = /^(\d{1,2})[-./](\d{1,2})[-./](\d{4})$/;
                        const match = trimmed.match(dmyRegex);
                        if (match) {
                            const day = parseInt(match[1], 10);
                            const month = parseInt(match[2], 10);
                            const year = parseInt(match[3], 10);
                            if (month >= 1 && month <= 12) {
                                return new Date(year, month - 1, day);
                            }
                        }
                    }
                    return new Date(dateInput);
                };

                const getYear = (dateStr) => {
                    const d = parseDate(dateStr);
                    return isNaN(d.getTime()) ? null : d.getFullYear().toString();
                };

                const getMonthName = (dateStr) => {
                    const d = parseDate(dateStr);
                    if (isNaN(d.getTime())) return 'Unknown';
                    return d.toLocaleString('default', { month: 'short' });
                };

                // Safely format dates for UI display to avoid "Invalid Date" crashes
                const formatDisplayDate = (dateInput) => {
                    const d = parseDate(dateInput);
                    if (isNaN(d.getTime())) return 'N/A';
                    return d.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                    });
                };

                // --- 1. EXTRACT AVAILABLE YEARS ---
                const availableYears = useMemo(() => {
                    const years = new Set();
                    (allVisits || []).forEach(v => {
                        const y = getYear(v.visitDate || v.createdAt || v.date || v.visit_date);
                        if (y) years.add(y);
                    });
                    (allTrainees || []).forEach(t => {
                        const yStart = getYear(t['IPT Date Start'] || t.iptDateStart || t.startDate || t.start_date);
                        if (yStart) years.add(yStart);
                    });
                    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
                }, [allVisits, allTrainees]);

                // --- 2. FILTER VISITS BY YEAR AND MONTH ---
                const filteredVisits = useMemo(() => {
                    let filtered = allVisits || [];
                    
                    if (selectedYear !== 'All') {
                        filtered = filtered.filter(v => {
                            const rawDate = v.visitDate || v.createdAt || v.date || v.visit_date;
                            const d = parseDate(rawDate);
                            if (isNaN(d.getTime())) return false;
                            return d.getFullYear().toString() === selectedYear;
                        });
                    }
                    
                    if (selectedMonth !== 'All') {
                        filtered = filtered.filter(v => {
                            const rawDate = v.visitDate || v.createdAt || v.date || v.visit_date;
                            const d = parseDate(rawDate);
                            if (isNaN(d.getTime())) return false;
                            
                            // Extracts standard short month (e.g. 'Jan', 'Feb') to match selectedMonth
                            const monthStr = d.toLocaleString('en-US', { month: 'short' });
                            return monthStr === selectedMonth;
                        });
                    }
                    
                    return filtered;
                }, [allVisits, selectedYear, selectedMonth]);

                // --- 3. CORE METRICS AGGREGATION ---
                const { monthlyData, icData, companyData, summaryMetrics } = useMemo(() => {
                    const monthsMap = { 'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5, 'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11 };
                    
                    const mData = Object.keys(monthsMap).reduce((acc, month) => {
                        acc[month] = { month, 'Face-to-Face': 0, 'Online': 0, total: 0 };
                        return acc;
                    }, {});

                    const iData = {};
                    const cData = {};
                    const metrics = { total: 0, f2f: 0, online: 0 };

                    filteredVisits.forEach(v => {
                        const rawType = (v.visitType || v.type || v.visit_type || '').toLowerCase();
                        const type = (rawType.includes('online') || rawType.includes('virtual') || rawType.includes('zoom') || rawType.includes('teams')) ? 'Online' : 'Face-to-Face';
                        const ic = v.assignedIC || v.icName || v.Coordinator || v.ic || v.industrialCoordinator || v.supervisorName || 'Unassigned';
                        const comp = v.company || v.companyName || v.company_name || 'Unknown Company';
                        const month = getMonthName(v.visitDate || v.createdAt || v.date || v.visit_date);

                        metrics.total++;
                        if (type === 'Face-to-Face') metrics.f2f++;
                        else metrics.online++;

                        if (mData[month]) {
                            mData[month][type]++;
                            mData[month].total++;
                        }

                        if (!iData[ic]) iData[ic] = { ic, 'Face-to-Face': 0, 'Online': 0, total: 0 };
                        iData[ic][type]++;
                        iData[ic].total++;

                        if (!cData[comp]) cData[comp] = { company: comp, total: 0, f2f: 0, online: 0, lastVisit: v.visitDate || v.createdAt || v.date || v.visit_date };
                        cData[comp].total++;
                        if (type === 'Face-to-Face') cData[comp].f2f++;
                        else cData[comp].online++;
                        
                        const currentDate = parseDate(v.visitDate || v.createdAt || v.date || v.visit_date);
                        if (!isNaN(currentDate.getTime()) && currentDate > parseDate(cData[comp].lastVisit)) {
                            cData[comp].lastVisit = v.visitDate || v.createdAt || v.date || v.visit_date;
                        }
                    });

                    return {
                        monthlyData: Object.values(mData),
                        icData: Object.values(iData).sort((a, b) => b.total - a.total),
                        companyData: Object.values(cData).sort((a, b) => b.total - a.total),
                        summaryMetrics: metrics
                    };
                }, [filteredVisits]);

                // --- 4. CALCULATE COVERAGE STATUS FOR TARGET TIME WINDOW ---
                const targetMonthName = selectedMonth !== 'All' ? selectedMonth : 'All Months';

                const { unvisitedCompanies, totalActiveCompanies, pieChartData } = useMemo(() => {
                    const companyVisitsMap = {};
                    const visitedInPeriodCompanies = new Set();
                    
                    allVisits.forEach(v => {
                        const d = parseDate(v.visitDate || v.createdAt || v.date || v.visit_date);
                        if (!isNaN(d.getTime())) {
                            const visitY = d.getFullYear().toString();
                            const visitM = monthsList[d.getMonth()];

                            const matchYear = selectedYear === 'All' || visitY === selectedYear;
                            const matchMonth = selectedMonth === 'All' || visitM === selectedMonth;

                            if (matchYear && matchMonth) {
                                const compName = v.company || v.companyName || v.company_name || 'Unknown Company';
                                if (!companyVisitsMap[compName]) {
                                    companyVisitsMap[compName] = [];
                                }
                                companyVisitsMap[compName].push((v.visitType || v.type || v.visit_type || '').toLowerCase());
                                visitedInPeriodCompanies.add(compName);
                            }
                        }
                    });

                    const activeComps = {};

                    let dynamicPeriodStart, dynamicPeriodEnd;
                    if (selectedYear === 'All') {
                        dynamicPeriodStart = new Date(1970, 0, 1);
                        dynamicPeriodEnd = new Date(2099, 11, 31);
                    } else {
                        const yearInt = parseInt(selectedYear);
                        if (selectedMonth === 'All') {
                            dynamicPeriodStart = new Date(yearInt, 0, 1);
                            dynamicPeriodEnd = new Date(yearInt, 11, 31);
                        } else {
                            const monthIdx = monthsList.indexOf(selectedMonth);
                            dynamicPeriodStart = new Date(yearInt, monthIdx, 1);
                            dynamicPeriodEnd = new Date(yearInt, monthIdx + 1, 0);
                        }
                    }

                    (allTrainees || []).forEach(t => {
                        const comp = t.company || t.companyName || t.company_name;
                        if (!comp) return;

                        const rawStatus = t.status || t.Status || t.traineeStatus || t.trainee_status || '';
                        const stat = rawStatus.toLowerCase().trim();

                        if (
                            stat === 'loa' || 
                            stat.includes('floater') || 
                            stat.includes('drop') || 
                            stat.includes('recall') ||
                            stat.includes('returnee')
                        ) {
                            return;
                        }

                        const startDate = parseDate(t['IPT Date Start'] || t.iptDateStart || t.startDate || t.start_date || t.ipt_start_date);
                        if (isNaN(startDate.getTime())) return;

                        let endDate = parseDate(t['IPT Date End'] || t.iptDateEnd || t.endDate || t.end_date || t.ipt_end_date);
                        if (stat.includes('complete') || stat.includes('graduat')) {
                            if (isNaN(endDate.getTime())) {
                                const rotsDate = parseDate(t['ROTS Approved Date'] || t.rotsDate || t.dateApproved || t.rots_approved_date || t.date_approved);
                                if (!isNaN(rotsDate.getTime())) {
                                    endDate = rotsDate;
                                } else {
                                    return;
                                }
                            }
                        } else {
                            if (isNaN(endDate.getTime())) {
                                endDate = new Date(2099, 0, 1);
                            }
                        }

                        if (startDate <= dynamicPeriodEnd && endDate >= dynamicPeriodStart) {
                            if (!activeComps[comp]) {
                                activeComps[comp] = { count: 0, activeIcs: new Set(), hasActiveTrainees: true };
                            }
                            activeComps[comp].count++;
                            
                            const icName = t.assignedIC || t.icName || t.Coordinator || t.ic || t.industrialCoordinator || t.supervisorName || 'Unassigned';
                            if (icName && icName !== 'Unassigned') {
                                activeComps[comp].activeIcs.add(icName);
                            }
                        }
                    });

                    visitedInPeriodCompanies.forEach(comp => {
                        if (!activeComps[comp]) {
                            activeComps[comp] = { count: 0, activeIcs: new Set(), hasActiveTrainees: false };
                        }
                    });

                    let f2fCount = 0;
                    let onlineCount = 0;
                    let notVisitedCount = 0;
                    const unvisited = [];

                    Object.keys(activeComps).forEach(comp => {
                        const logs = companyVisitsMap[comp] || [];
                        
                        const hasFaceToFace = logs.some(m => m.includes('face') || m.includes('f2f') || m.includes('physical') || m.includes('presentation') || m.includes('site'));
                        const hasOnline = logs.some(m => m.includes('online') || m.includes('virtual') || m.includes('zoom') || m.includes('teams'));

                        if (hasFaceToFace) {
                            f2fCount++;
                        } else if (hasOnline) {
                            onlineCount++;
                        } else {
                            if (activeComps[comp].hasActiveTrainees) {
                                notVisitedCount++;
                                const activeIcList = Array.from(activeComps[comp].activeIcs).sort().join(', ') || 'Unassigned';
                                unvisited.push({
                                    company: comp,
                                    activeTrainees: activeComps[comp].count,
                                    icName: activeIcList
                                });
                            }
                        }
                    });

                    return {
                        unvisitedCompanies: unvisited.sort((a, b) => b.activeTrainees - a.activeTrainees),
                        totalActiveCompanies: Object.keys(activeComps).length,
                        pieChartData: [
                            { name: 'Face-to-Face', value: f2fCount, fill: '#10b981' },
                            { name: 'Online', value: onlineCount, fill: '#3b82f6' },
                            { name: 'Not Visited', value: notVisitedCount, fill: '#f43f5e' }
                        ]
                    };
                }, [allVisits, allTrainees, selectedYear, selectedMonth]);

                // --- 5. SORTING ALGORITHM FOR UNVISITED COMPANIES ---
                const sortedUnvisited = useMemo(() => {
                    let sortable = [...unvisitedCompanies];
                    sortable.sort((a, b) => {
                        if (a[sortConfig.key] < b[sortConfig.key]) {
                            return sortConfig.direction === 'asc' ? -1 : 1;
                        }
                        if (a[sortConfig.key] > b[sortConfig.key]) {
                            return sortConfig.direction === 'asc' ? 1 : -1;
                        }
                        return 0;
                    });
                    return sortable;
                }, [unvisitedCompanies, sortConfig]);

                // --- 6. MEMOIZED & CHRONOLOGICALLY SORTED IC VISITS FOR DRILLDOWN ---
                const sortedICVisits = useMemo(() => {
                    if (!selectedIC) return [];
                    return filteredVisits
                        .filter(v => (v.assignedIC || v.icName || v.Coordinator || v.ic || v.industrialCoordinator || v.supervisorName || 'Unassigned') === selectedIC)
                        .sort((a, b) => {
                            const timeA = parseDate(a.visitDate || a.createdAt || a.date || a.visit_date).getTime() || 0;
                            const timeB = parseDate(b.visitDate || b.createdAt || b.date || b.visit_date).getTime() || 0;
                            return timeB - timeA; // Newest first
                        });
                }, [filteredVisits, selectedIC]);

                const handleSort = (key) => {
                    let direction = 'asc';
                    if (sortConfig.key === key && sortConfig.direction === 'asc') {
                        direction = 'desc';
                    }
                    setSortConfig({ key, direction });
                };

                // --- DETAILED VIEW ---
                if (selectedIC) {
                    return (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                <div>
                                    <h3 className="font-black text-2xl text-slate-800 dark:text-slate-100 flex items-center gap-3">
                                        <Users className="text-primary-600" />
                                        Meeting Report: {selectedIC}
                                    </h3>
                                    <p className="text-slate-500 text-sm mt-1">Detailed log of all company visits and meetings.</p>
                                </div>
                                <button 
                                    onClick={() => setSelectedIC(null)}
                                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-xl flex items-center gap-2 transition-colors"
                                >
                                    <ArrowLeft size={16} /> Back to Dashboard
                                </button>
                            </div>

                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-bold border-b border-slate-200">
                                            <tr>
                                                <th className="p-4">Date</th>
                                                <th className="p-4">Company Visited</th>
                                                <th className="p-4">Visit Type</th>
                                                <th className="p-4 w-1/2">Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {sortedICVisits.map((v, idx) => {
                                                const rawVisitType = v.visitType || v.type || v.visit_type || 'Face-to-Face';
                                                const isOnline = rawVisitType.toLowerCase().includes('online') || rawVisitType.toLowerCase().includes('virtual') || rawVisitType.toLowerCase().includes('zoom');
                                                return (
                                                    <tr key={v.id || idx} className="hover:bg-primary-50/50 transition-colors">
                                                        {/* Safely processed through formatting logic */}
                                                        <td className="p-4 font-medium text-slate-700 dark:text-slate-300">
                                                            {formatDisplayDate(v.visitDate || v.createdAt || v.date || v.visit_date)}
                                                        </td>
                                                        <td className="p-4 font-bold text-primary-700">{v.company || v.companyName || v.company_name || 'Unknown'}</td>
                                                        <td className="p-4">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max ${isOnline ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                                {isOnline ? <Video size={12}/> : <Presentation size={12}/>}
                                                                {rawVisitType}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-slate-600 dark:text-slate-400 whitespace-normal min-w-[300px]">
                                                            {v.notes || v.remarks || v.comments || <span className="italic text-slate-400">No notes provided.</span>}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {sortedICVisits.length === 0 && (
                                                <tr><td colSpan="4" className="p-8 text-center text-slate-400 italic">No meetings logged for this period.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    );
                }

                // --- MAIN DASHBOARD VIEW ---
                return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* TOP BAR & FILTERS */}
                        <div className="bg-slate-900 p-6 rounded-3xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
                            <div>
                                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                                    <Building2 className="text-primary-400" />
                                    Company Meetings Dashboard
                                </h2>
                                <p className="text-slate-400 text-sm mt-1">Track IC engagement and visit distributions.</p>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-4 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700">
                                <div className="flex items-center gap-2">
                                    <Filter size={16} className="text-slate-400" />
                                    <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">Year:</span>
                                    <select 
                                        value={selectedYear} 
                                        onChange={e => setSelectedYear(e.target.value)} 
                                        className="bg-transparent text-white font-bold text-base outline-none cursor-pointer"
                                    >
                                        <option value="All" className="bg-slate-800">All Time</option>
                                        {availableYears.map(y => <option key={y} value={y} className="bg-slate-800">{y}</option>)}
                                    </select>
                                </div>

                                <div className="w-px h-6 bg-slate-700 hidden md:block"></div>

                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">Month:</span>
                                    <select 
                                        value={selectedMonth} 
                                        onChange={e => setSelectedMonth(e.target.value)} 
                                        className="bg-transparent text-white font-bold text-base outline-none cursor-pointer"
                                    >
                                        <option value="All" className="bg-slate-800">All Months</option>
                                        {monthsList.map(m => <option key={m} value={m} className="bg-slate-800">{m}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* SUMMARY METRICS CARDS */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
                                <div className="bg-primary-100 p-3 rounded-xl text-primary-600"><Calendar size={24}/></div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase">Total Meetings</p>
                                    <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100">{summaryMetrics.total}</h4>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
                                <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600"><Presentation size={24}/></div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase">Face-to-Face</p>
                                    <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100">{summaryMetrics.f2f}</h4>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
                                <div className="bg-blue-100 p-3 rounded-xl text-blue-600"><Video size={24}/></div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase">Online Meetings</p>
                                    <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100">{summaryMetrics.online}</h4>
                                </div>
                            </div>
                        </div>

                        {/* CHARTS SECTION */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200">
                                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                                    <BarChart2 size={18} className="text-primary-600"/> Monthly Visit Trends
                                </h3>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                            <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            <Legend wrapperStyle={{ paddingTop: '10px' }} iconType="circle" />
                                            <Bar dataKey="Face-to-Face" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                                            <Bar dataKey="Online" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200">
                                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                                    <Users size={18} className="text-primary-600"/> Visits per Industrial Coordinator (IC)
                                </h3>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={icData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                            <YAxis dataKey="ic" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }} />
                                            <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            <Legend wrapperStyle={{ paddingTop: '10px' }} iconType="circle" />
                                            <Bar dataKey="Face-to-Face" stackId="b" fill="#10b981" />
                                            <Bar dataKey="Online" stackId="b" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* TABLES GRID */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-[400px]">
                                <div className="p-4 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50">
                                    <h3 className="font-bold text-slate-800 dark:text-slate-100">IC Performance (Click for Details)</h3>
                                </div>
                                <div className="overflow-y-auto flex-1">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-white dark:bg-slate-800 sticky top-0 z-10 shadow-sm">
                                            <tr>
                                                <th className="p-4 font-bold text-slate-500 uppercase text-xs">Coordinator Name</th>
                                                <th className="p-4 font-bold text-slate-500 uppercase text-xs text-right">Total Visits</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {icData.map((ic, idx) => (
                                                <tr key={idx} onClick={() => setSelectedIC(ic.ic)} className="hover:bg-primary-50 cursor-pointer transition-colors group">
                                                    <td className="p-4 font-bold text-slate-700 dark:text-slate-300 group-hover:text-primary-600 flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs">
                                                            {ic.ic.charAt(0)}
                                                        </div>
                                                        {ic.ic}
                                                    </td>
                                                    <td className="p-4 font-black text-right text-slate-800 dark:text-slate-100">{ic.total}</td>
                                                </tr>
                                            ))}
                                            {icData.length === 0 && (
                                                <tr><td colSpan="2" className="p-8 text-center text-slate-400">No data found.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-[400px]">
                                <div className="p-4 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50">
                                    <h3 className="font-bold text-slate-800 dark:text-slate-100">Companies Visited List</h3>
                                </div>
                                <div className="overflow-y-auto flex-1">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-white dark:bg-slate-800 sticky top-0 z-10 shadow-sm">
                                            <tr>
                                                <th className="p-4 font-bold text-slate-500 uppercase text-xs">Company Name</th>
                                                <th className="p-4 font-bold text-slate-500 uppercase text-xs text-center">Breakdown</th>
                                                <th className="p-4 font-bold text-slate-500 uppercase text-xs text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {companyData.map((comp, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50 dark:bg-slate-900/50 transition-colors">
                                                    <td className="p-4">
                                                        <p className="font-bold text-slate-700 dark:text-slate-300">{comp.company}</p>
                                                        {/* Standardized display format wrapper applied here */}
                                                        <p className="text-xs text-slate-400">Last visited: {formatDisplayDate(comp.lastVisit)}</p>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <div className="flex items-center justify-center gap-2 text-xs font-bold">
                                                            {comp.f2f > 0 && <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">F2F: {comp.f2f}</span>}
                                                            {comp.online > 0 && <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded">ONL: {comp.online}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 font-black text-right text-slate-800 dark:text-slate-100">{comp.total}</td>
                                                </tr>
                                            ))}
                                            {companyData.length === 0 && (
                                                <tr><td colSpan="3" className="p-8 text-center text-slate-400">No data found.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* COVERAGE DONUT AND ACTION REQUIRED GRID */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.05)] border border-slate-200 dark:border-slate-700 flex flex-col h-[400px] lg:col-span-1">
                                <div className="mb-2">
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Visit Coverage</h3>
                                    <p className="text-sm text-slate-500">
                                        Active or visited training partners verified in {targetMonthName} {selectedYear !== 'All' ? selectedYear : 'All Years'}.
                                    </p>
                                </div>

                                {totalActiveCompanies === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 italic bg-slate-50 dark:bg-slate-900/50 rounded-xl mt-4">
                                        <AlertTriangle size={32} className="mb-2 text-slate-300" />
                                        No active or visited partner companies found.
                                    </div>
                                ) : (
                                    <div className="flex-1 relative mt-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={pieChartData.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={5} dataKey="value" stroke="none">
                                                    {pieChartData.filter(d => d.value > 0).map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value) => [`${value} Companies (${((value / totalActiveCompanies) * 100).toFixed(1)}%)`, 'Status']} />
                                                <Legend verticalAlign="bottom" height={36} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                                            <span className="text-4xl font-black text-slate-800 dark:text-slate-100">{totalActiveCompanies}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center px-2 mt-1">Total Partner<br/>Companies</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.05)] border border-rose-200 overflow-hidden flex flex-col h-[400px] lg:col-span-2">
                                <div className="p-4 border-b border-rose-100 bg-rose-50 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-rose-800 flex items-center gap-2">
                                            <AlertTriangle size={18} /> Unvisited Companies (Action Required)
                                        </h3>
                                        <p className="text-xs text-rose-600 mt-1">
                                            Companies with active trainees but <strong>NO visits logged</strong> in {targetMonthName} {selectedYear !== 'All' ? selectedYear : 'All Years'}
                                        </p>
                                    </div>
                                    <span className="bg-rose-200 text-rose-800 text-xs font-black px-3 py-1 rounded-full">{unvisitedCompanies.length} Companies</span>
                                </div>
                                <div className="overflow-y-auto flex-1">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-white dark:bg-slate-800 sticky top-0 z-10 shadow-sm">
                                            <tr>
                                                <th onClick={() => handleSort('company')} className="p-4 font-bold text-slate-500 uppercase text-xs cursor-pointer select-none">
                                                    Company Name {sortConfig.key === 'company' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                                                </th>
                                                <th onClick={() => handleSort('icName')} className="p-4 font-bold text-slate-500 uppercase text-xs cursor-pointer select-none">
                                                    Active Assigned IC(s) {sortConfig.key === 'icName' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                                                </th>
                                                <th onClick={() => handleSort('activeTrainees')} className="p-4 font-bold text-slate-500 uppercase text-xs text-right cursor-pointer select-none">
                                                    Active Trainees {sortConfig.key === 'activeTrainees' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {sortedUnvisited.map((comp, idx) => (
                                                <tr key={idx} className="hover:bg-rose-50/50 transition-colors">
                                                    <td className="p-4 font-bold text-slate-700 dark:text-slate-300">{comp.company}</td>
                                                    <td className="p-4 text-slate-600 dark:text-slate-400 text-xs font-medium">{comp.icName}</td>
                                                    <td className="p-4 font-black text-right text-rose-600">{comp.activeTrainees}</td>
                                                </tr>
                                            ))}
                                            {unvisitedCompanies.length === 0 && (
                                                <tr>
                                                    <td colSpan="3" className="p-12 text-center text-emerald-600">
                                                        <div className="flex flex-col items-center gap-3">
                                                            <CheckCircle2 size={40} className="text-emerald-400" />
                                                            <p className="font-bold text-lg">All active companies visited!</p>
                                                            <p className="text-sm text-emerald-500/80">Every active partner company has a logged visit within this timeline choice.</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            };

            // --- COACHING TAB COMPONENT (ADMIN/MANAGEMENT VIEW) ---
            const CoachingTab = ({ records = [] }) => {
                const [searchTerm, setSearchTerm] = useState('');
                const [selectedCompany, setSelectedCompany] = useState('All');

                // Isolated Date Selector States
                const [mode, setMode] = useState('Monthly');
                const [dateValues, setDateValues] = useState({
                    daily: new Date().toISOString().split('T')[0],
                    weekly: '',
                    monthly: new Date().toISOString().slice(0, 7),
                    quarter: '1',
                    semester: '1',
                    year: new Date().getFullYear().toString()
                });

                const companies = ['All', ...new Set(records.map(r => r.company || r.companyName).filter(Boolean))];

                const filteredRecords = records.filter(record => {
                    const matchSearch = (record.traineeName || record.name || '').toLowerCase().includes(searchTerm.toLowerCase());
                    const matchCompany = selectedCompany === 'All' || (record.company || record.companyName) === selectedCompany;
                    const matchDate = isDateInRange(record.date || record.timestamp, mode, dateValues);
                    return matchSearch && matchCompany && matchDate;
                });

                return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200">
                            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
                                <Activity className="text-emerald-600" /> Coaching & Counseling
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">Log and track localized counseling entries by date range.</p>
                        </div>

                        {/* Localized Date Range Selector */}
                        <DateRangeSelector mode={mode} setMode={setMode} dateValues={dateValues} setDateValues={setDateValues} />

                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Search trainee name..." 
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                />
                            </div>
                            <select 
                                value={selectedCompany} 
                                onChange={e => setSelectedCompany(e.target.value)}
                                className="px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 min-w-[200px]"
                            >
                                {companies.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100">
                                        <tr>
                                            <th className="p-4">Date</th>
                                            <th className="p-4">Trainee Name</th>
                                            <th className="p-4">Company</th>
                                            <th className="p-4">Concern / Topic</th>
                                            <th className="p-4">Action Taken</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredRecords.length === 0 ? (
                                            <tr><td colSpan="5" className="p-8 text-center text-slate-400">No records found for the selected date range.</td></tr>
                                        ) : (
                                            filteredRecords.map((record, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50 dark:bg-slate-900/50 transition-colors">
                                                    <td className="p-4 whitespace-nowrap">{new Date(record.date || record.timestamp).toLocaleDateString()}</td>
                                                    <td className="p-4 font-bold text-emerald-700">{record.traineeName || record.name}</td>
                                                    <td className="p-4">{record.company || record.companyName}</td>
                                                    <td className="p-4">{record.concern || record.topic || '-'}</td>
                                                    <td className="p-4">{record.actionTaken || record.remarks || '-'}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
            };

            const AttendanceTab = ({ attendanceLogs = [], trainees = [] }) => {
                const [searchTerm, setSearchTerm] = useState('');
                const [selectedCompany, setSelectedCompany] = useState('All');
                const [viewMode, setViewMode] = useState('summary'); // 'summary', 'detailed', or 'daily'
                const [registrationFilter, setRegistrationFilter] = useState('All'); // 'All', 'Registered Only', 'Unregistered'
                
                // Date Selector States (Defaults to Daily to highlight grouping)
                const [mode, setMode] = useState('Daily');
                const [dateValues, setDateValues] = useState({
                    daily: new Date().toISOString().split('T')[0],
                    weekly: '',
                    monthly: new Date().toISOString().slice(0, 7),
                    quarter: '1',
                    semester: '1',
                    year: new Date().getFullYear().toString()
                });

                // Helper to safely parse Firebase timestamps or strings
                const parseLogDate = (val) => {
                    if (!val) return new Date(NaN);
                    if (val.toDate) return val.toDate();
                    if (val.seconds) return new Date(val.seconds * 1000);
                    return new Date(val);
                };

                // 1. Cross-reference logs with the trainees masterlist & apply ic-portal.txt variables
                const enrichedLogs = useMemo(() => {
                    return attendanceLogs.map(log => {
                        const logDateObj = parseLogDate(log.timestamp || log.date || log.timeIn);
                        
                        // Match trainee logic based on studentId or Name
                        const matchedTrainee = trainees.find(t => {
                            const dbStudentId = String(t.studentId || t['Student ID#'] || '').trim();
                            const logId = String(log.studentId || log.extractedUserId || log.userId || '').trim();
                            const dbGivenName = t.given || t.Given || t.firstName;
                            
                            const matchById = dbStudentId && logId && dbStudentId === logId;
                            const matchByName = dbGivenName && log.name && log.name.toLowerCase().includes(dbGivenName.toLowerCase());
                            
                            return matchById || matchByName;
                        });
                        
                        // Extract specific ic-portal.txt variables
                        const isOut = (log.type === 'OUT' || log.type === 'TIME OUT');
                        const details = isOut ? log.clockOutDetails : log.clockInDetails;
                        
                        const inGeofence = details?.inGeofence ?? log.inGeofence ?? false;
                        const statusRemark = details?.statusRemark || log.statusRemark || log.status || 'N/A';
                        const disputeRemark = details?.disputeRemark || log.disputeRemark || (statusRemark === 'Blocked' ? 'Location Blocked' : '');

                        return {
                            ...log,
                            logDateObj,
                            isRegistered: !!matchedTrainee,
                            enrichedName: matchedTrainee 
                                ? `${matchedTrainee.firstName || matchedTrainee.given} ${matchedTrainee.lastName || matchedTrainee.family}`.trim() 
                                : (log.name || log.traineeName || 'Unknown'),
                            enrichedCompany: matchedTrainee?.companyName || matchedTrainee?.['Company Name'] || matchedTrainee?.company || log.company || log.companyName || 'Unassigned',
                            studentId: matchedTrainee?.studentId || log.studentId || log.extractedUserId || log.userId,
                            isOut,
                            inGeofence,
                            statusRemark,
                            disputeRemark,
                            extractedTimeIn: log.timeIn || log.timestamp,
                            extractedTimeOut: log.timeOut || (isOut ? log.timestamp : null)
                        };
                    });
                }, [attendanceLogs, trainees]);

                // 2. Extract unique companies dynamically
                const companies = useMemo(() => {
                    return ['All', ...new Set(enrichedLogs.map(l => l.enrichedCompany).filter(Boolean))].sort();
                }, [enrichedLogs]);

                // 3. Apply Filters
                const filteredLogs = useMemo(() => {
                    return enrichedLogs.filter(log => {
                        const matchSearch = log.enrichedName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                            (log.studentId && String(log.studentId).includes(searchTerm));
                        const matchCompany = selectedCompany === 'All' || log.enrichedCompany === selectedCompany;
                        
                        // Check if log date falls within the selected DateRange
                        const logDateStr = !isNaN(log.logDateObj.getTime()) ? log.logDateObj.toISOString().split('T')[0] : null;
                        const matchDate = isDateInRange(logDateStr, mode, dateValues);
                        
                        let matchRegistration = true;
                        if (registrationFilter === 'Registered Only') matchRegistration = log.isRegistered;
                        if (registrationFilter === 'Unregistered') matchRegistration = !log.isRegistered;

                        return matchSearch && matchCompany && matchDate && matchRegistration;
                    }).sort((a, b) => b.logDateObj - a.logDateObj);
                }, [enrichedLogs, searchTerm, selectedCompany, mode, dateValues, registrationFilter]);

                // 4. Group data for the Summary View
                const summaryData = useMemo(() => {
                    const map = {};
                    filteredLogs.forEach(log => {
                        const id = log.studentId || log.enrichedName;
                        if (!map[id]) {
                            map[id] = {
                                id, name: log.enrichedName, company: log.enrichedCompany,
                                isRegistered: log.isRegistered, totalLogs: 0, lateCount: 0,
                                lastActive: log.logDateObj
                            };
                        }
                        map[id].totalLogs++;
                        if (log.logDateObj > map[id].lastActive) map[id].lastActive = log.logDateObj;
                        if (log.statusRemark.toLowerCase().includes('late')) map[id].lateCount++;
                    });
                    return Object.values(map).sort((a, b) => b.totalLogs - a.totalLogs);
                }, [filteredLogs]);

                // 5. Daily Groups Processing
                const dailyGroups = useMemo(() => {
                    const groups = { present: [], late: [], undertime: [], absent: [] };
                    if (viewMode !== 'daily' || mode !== 'Daily') return groups;

                    const calculateHours = (inTime, outTime) => {
                        if (!inTime || !outTime) return 0;
                        return (parseLogDate(outTime) - parseLogDate(inTime)) / (1000 * 60 * 60);
                    };

                    const isLateTime = (inTime) => {
                        if (!inTime) return false;
                        const d = parseLogDate(inTime);
                        return d.getHours() > 8 || (d.getHours() === 8 && d.getMinutes() > 0);
                    };

                    const targetTrainees = trainees.filter(t => {
                        const c = t.company || t.companyName || t['Company Name'] || 'Unassigned';
                        const matchSearch = (`${t.firstName || t.given} ${t.lastName || t.family}`).toLowerCase().includes(searchTerm.toLowerCase());
                        return (selectedCompany === 'All' || c === selectedCompany) && matchSearch;
                    });

                    targetTrainees.forEach(t => {
                        const cleanSimsId = String(t.studentId || t['Student ID#']).trim();
                        const todayLogs = filteredLogs.filter(l => l.studentId === cleanSimsId);
                        
                        let inLog = todayLogs.find(l => !l.isOut);
                        let outLog = todayLogs.find(l => l.isOut);
                        
                        const disputeRemark = (inLog?.disputeRemark) || (outLog?.disputeRemark) || '';
                        
                        const traineeRecord = { 
                            ...t,
                            id: cleanSimsId,
                            name: `${t.firstName || t.given} ${t.lastName || t.family}`.trim(),
                            company: t.company || t.companyName || t['Company Name'],
                            timeInVerified: inLog?.inGeofence ?? false,
                            timeOutVerified: outLog?.inGeofence ?? false,
                            timeInStr: inLog ? parseLogDate(inLog.extractedTimeIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-',
                            timeOutStr: outLog ? parseLogDate(outLog.extractedTimeOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-',
                            disputeRemark,
                            hours: 0,
                            isOvertime: false 
                        };

                        if (inLog && outLog) {
                            const hrs = calculateHours(inLog.extractedTimeIn, outLog.extractedTimeOut);
                            traineeRecord.hours = hrs.toFixed(1);
                            if (hrs > 8) traineeRecord.isOvertime = true;

                            if (isLateTime(inLog.extractedTimeIn)) groups.late.push(traineeRecord);
                            else if (hrs < 8) groups.undertime.push(traineeRecord);
                            else groups.present.push(traineeRecord);
                        } else if (inLog && !outLog) {
                            traineeRecord.hours = 'Ongoing';
                            if (isLateTime(inLog.extractedTimeIn)) groups.late.push(traineeRecord);
                            else groups.present.push(traineeRecord);
                        } else {
                            groups.absent.push(traineeRecord);
                        }
                    });
                    return groups;
                }, [filteredLogs, trainees, selectedCompany, viewMode, mode, searchTerm]);

                return (
                    <div className="space-y-6 animate-in fade-in duration-300 pb-10">
                        
                        {/* Header */}
                        <div className="bg-slate-900 p-6 rounded-3xl shadow-lg flex flex-col xl:flex-row justify-between items-center gap-4 text-white">
                            <div>
                                <h2 className="text-2xl font-black flex items-center gap-3">
                                    <CalendarCheck className="text-primary-400" /> Trainee Attendance Logs
                                </h2>
                                <p className="text-slate-400 text-sm mt-1">Cross-reference clock-ins with registered trainee data.</p>
                            </div>
                            
                            {/* View Toggle */}
                            <div className="flex bg-slate-800 p-1 rounded-xl w-full xl:w-auto overflow-x-auto hide-scrollbar">
                                <button onClick={() => setViewMode('summary')} className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${viewMode === 'summary' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                                    <Users size={16}/> Summary View
                                </button>
                                <button onClick={() => setViewMode('detailed')} className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${viewMode === 'detailed' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                                    <FileText size={16}/> Detailed Logs
                                </button>
                                <button onClick={() => { setViewMode('daily'); setMode('Daily'); }} className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${viewMode === 'daily' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                                    <Clock size={16}/> Daily Groups
                                </button>
                            </div>
                        </div>

                        {/* Metrics Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
                                <div className="bg-blue-100 p-3 rounded-xl text-blue-600"><Activity size={24}/></div>
                                <div><p className="text-xs font-bold text-slate-500 uppercase">Total Log Entries</p><h4 className="text-2xl font-black text-slate-800 dark:text-slate-100">{filteredLogs.length}</h4></div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
                                <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600"><CheckCircle2 size={24}/></div>
                                <div><p className="text-xs font-bold text-slate-500 uppercase">Registered Matches</p><h4 className="text-2xl font-black text-slate-800 dark:text-slate-100">{filteredLogs.filter(l => l.isRegistered).length}</h4></div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
                                <div className="bg-amber-100 p-3 rounded-xl text-amber-600"><AlertCircle size={24}/></div>
                                <div><p className="text-xs font-bold text-slate-500 uppercase">Unregistered / Unknown</p><h4 className="text-2xl font-black text-slate-800 dark:text-slate-100">{filteredLogs.filter(l => !l.isRegistered).length}</h4></div>
                            </div>
                        </div>

                        {/* Filters Section */}
                        <DateRangeSelector mode={mode} setMode={setMode} dateValues={dateValues} setDateValues={setDateValues} />

                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input type="text" placeholder="Search by trainee name or ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:border-primary-400 outline-none transition-colors" />
                            </div>
                            
                            <select value={selectedCompany} onChange={e => setSelectedCompany(e.target.value)} className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 min-w-[200px] outline-none focus:border-primary-400">
                                {companies.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>

                            <select value={registrationFilter} onChange={e => setRegistrationFilter(e.target.value)} className="px-4 py-2.5 bg-primary-50 border border-primary-200 text-primary-700 rounded-xl text-sm font-bold min-w-[180px] outline-none">
                                <option value="All">Show All Trainees</option>
                                <option value="Registered Only">Registered Only ✓</option>
                                <option value="Unregistered">Unregistered Only ⚠</option>
                            </select>
                        </div>

                        {/* Dynamic Tables Based on View Mode */}
                        {viewMode === 'daily' ? (
                            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                                {mode !== 'Daily' && (
                                    <div className="bg-amber-50 p-4 border border-amber-200 rounded-2xl text-amber-700 font-bold flex items-center gap-2">
                                        <AlertTriangle size={18}/> To use the Daily Groups view, please select the "Daily" filter range above.
                                    </div>
                                )}
                                
                                {['present', 'late', 'undertime', 'absent'].map(groupKey => {
                                    const groupRecords = dailyGroups[groupKey];
                                    if (groupRecords.length === 0) return null;
                                    
                                    const titles = { present: 'On Time & Present', late: 'Late Arrivals', undertime: 'Undertime / Incomplete', absent: 'Absent / No Logs' };
                                    const colors = { present: 'text-emerald-700 bg-emerald-50 border-emerald-200', late: 'text-amber-700 bg-amber-50 border-amber-200', undertime: 'text-blue-700 bg-blue-50 border-blue-200', absent: 'text-rose-700 bg-rose-50 border-rose-200' };

                                    return (
                                        <div key={groupKey} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden shadow-sm">
                                            <div className={`p-4 border-b font-bold text-lg flex justify-between items-center ${colors[groupKey]}`}>
                                                {titles[groupKey]} <span className="bg-white/50 px-3 py-1 rounded-full text-sm">{groupRecords.length} Trainees</span>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                                                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100">
                                                        <tr>
                                                            <th className="p-4 uppercase text-xs tracking-wider">Trainee</th>
                                                            <th className="p-4 uppercase text-xs tracking-wider text-center">Time In</th>
                                                            <th className="p-4 uppercase text-xs tracking-wider text-center">Time Out</th>
                                                            <th className="p-4 uppercase text-xs tracking-wider text-center">Hours</th>
                                                            <th className="p-4 uppercase text-xs tracking-wider text-right">Remarks</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {groupRecords.map((rec, i) => (
                                                            <tr key={i} className="hover:bg-slate-50">
                                                                <td className="p-4 font-bold text-slate-800 dark:text-slate-100">{rec.name}<div className="text-xs text-slate-500 font-medium mt-0.5">{rec.company}</div></td>
                                                                <td className="p-4 text-center">
                                                                    <div className="font-mono font-medium">{rec.timeInStr}</div>
                                                                    {rec.timeInStr !== '-' && <span className={`text-[10px] font-bold uppercase ${rec.timeInVerified ? 'text-emerald-600' : 'text-red-500'}`}>{rec.timeInVerified ? 'Geofenced' : 'Out of Bounds'}</span>}
                                                                </td>
                                                                <td className="p-4 text-center">
                                                                    <div className="font-mono font-medium">{rec.timeOutStr}</div>
                                                                    {rec.timeOutStr !== '-' && <span className={`text-[10px] font-bold uppercase ${rec.timeOutVerified ? 'text-emerald-600' : 'text-red-500'}`}>{rec.timeOutVerified ? 'Geofenced' : 'Out of Bounds'}</span>}
                                                                </td>
                                                                <td className="p-4 text-center font-black">{rec.hours}</td>
                                                                <td className="p-4 text-right text-xs text-rose-500 font-bold">{rec.disputeRemark || '-'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden shadow-sm">
                                {viewMode === 'summary' ? (
                                    /* SUMMARY VIEW TABLE */
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                                            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100">
                                                <tr>
                                                    <th className="p-4 uppercase text-xs tracking-wider">Trainee Profile</th>
                                                    <th className="p-4 uppercase text-xs tracking-wider">Company</th>
                                                    <th className="p-4 uppercase text-xs tracking-wider text-center">Total Logs</th>
                                                    <th className="p-4 uppercase text-xs tracking-wider text-center">Late Flagged</th>
                                                    <th className="p-4 uppercase text-xs tracking-wider text-right">Last Active</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {summaryData.length === 0 ? (
                                                    <tr><td colSpan="5" className="p-10 text-center text-slate-400 italic">No aggregated data for the selected filters.</td></tr>
                                                ) : (
                                                    summaryData.map((data, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50 dark:bg-slate-900/50 transition-colors group">
                                                            <td className="p-4">
                                                                <div className="font-black text-slate-800 dark:text-slate-100 text-base">{data.name}</div>
                                                                <div className="mt-1">
                                                                    {data.isRegistered 
                                                                        ? <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider"><CheckCircle2 size={10}/> Registered</span>
                                                                        : <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider"><AlertCircle size={10}/> Unregistered</span>
                                                                    }
                                                                </div>
                                                            </td>
                                                            <td className="p-4 font-bold text-primary-700">{data.company}</td>
                                                            <td className="p-4 text-center font-black text-slate-800 dark:text-slate-100">{data.totalLogs}</td>
                                                            <td className="p-4 text-center">
                                                                {data.lateCount > 0 ? <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-md font-bold">{data.lateCount}</span> : <span className="text-slate-300">-</span>}
                                                            </td>
                                                            <td className="p-4 text-right font-medium whitespace-nowrap">
                                                                {!isNaN(data.lastActive.getTime()) ? data.lastActive.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    /* DETAILED LOGS TABLE */
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                                            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100">
                                                <tr>
                                                    <th className="p-4 uppercase text-xs tracking-wider">Date & Time</th>
                                                    <th className="p-4 uppercase text-xs tracking-wider">Trainee Name</th>
                                                    <th className="p-4 uppercase text-xs tracking-wider">Event Type</th>
                                                    <th className="p-4 uppercase text-xs tracking-wider">Company</th>
                                                    <th className="p-4 uppercase text-xs tracking-wider">Status / Remarks</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {filteredLogs.length === 0 ? (
                                                    <tr><td colSpan="5" className="p-10 text-center text-slate-400 italic">No detailed logs found.</td></tr>
                                                ) : (
                                                    filteredLogs.map((log, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50 dark:bg-slate-900/50 transition-colors">
                                                            <td className="p-4 whitespace-nowrap">
                                                                <div className="font-bold text-slate-700 dark:text-slate-300">
                                                                    {!isNaN(log.logDateObj.getTime()) ? log.logDateObj.toLocaleDateString() : 'N/A'}
                                                                </div>
                                                                <div className="text-xs text-slate-500 font-mono mt-0.5">
                                                                    {!isNaN(log.logDateObj.getTime()) ? log.logDateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                                                                </div>
                                                            </td>
                                                            <td className="p-4">
                                                                <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                                                                    {log.enrichedName}
                                                                    {log.isRegistered && <CheckCircle2 size={14} className="text-emerald-500" title="Registered Trainee"/>}
                                                                </span>
                                                            </td>
                                                            <td className="p-4">
                                                                {log.isOut ? (
                                                                    <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded text-[10px] font-black uppercase">Clock Out</span>
                                                                ) : (
                                                                    <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded text-[10px] font-black uppercase">Clock In</span>
                                                                )}
                                                            </td>
                                                            <td className="p-4 text-slate-600 dark:text-slate-400 text-xs">{log.enrichedCompany}</td>
                                                            <td className="p-4">
                                                                <div className="font-bold flex items-center gap-2">
                                                                    <span className={log.inGeofence ? 'text-emerald-600' : 'text-red-500'}>{log.statusRemark}</span>
                                                                    {log.disputeRemark && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] uppercase">Flagged: {log.disputeRemark}</span>}
                                                                </div>
                                                                {log.remarks && <div className="text-xs text-slate-400 mt-1 truncate max-w-[200px]" title={log.remarks}>{log.remarks}</div>}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            };

            // --- EXPORT RECORDS TAB ---
            const ExportRecordsTab = ({ allTrainees = [] }) => {
                const [exporting, setExporting] = useState(false);
                const [selectedCompanies, setSelectedCompanies] = useState(['ALL']);
                const [startDate, setStartDate] = useState('');
                const [endDate, setEndDate] = useState('');

                const showMessage = (msg, type = 'info') => {
                    alert(msg); // Native browser alert fallback
                };

                // Derive unique companies from already-loaded trainees data
                const companies = useMemo(() => {
                    const companySet = new Set();
                    allTrainees.forEach(t => {
                        const comp = (t.company || t.companyName || '').trim();
                        if (comp) companySet.add(comp);
                    });
                    return Array.from(companySet).sort();
                }, [allTrainees]);

                // Set default dates on mount
                useEffect(() => {
                    const today = new Date();
                    const lastMonth = new Date();
                    lastMonth.setDate(today.getDate() - 30);
                    setEndDate(today.toISOString().split('T')[0]);
                    setStartDate(lastMonth.toISOString().split('T')[0]);
                }, []);

                const handleCompanyToggle = (comp) => {
                    if (comp === 'ALL') {
                        setSelectedCompanies(['ALL']);
                        return;
                    }
                    
                    let newSelection = selectedCompanies.filter(c => c !== 'ALL');
                    if (newSelection.includes(comp)) {
                        newSelection = newSelection.filter(c => c !== comp);
                    } else {
                        newSelection.push(comp);
                    }
                    
                    if (newSelection.length === 0) newSelection = ['ALL'];
                    setSelectedCompanies(newSelection);
                };

                const handleExport = async () => {
                if (!startDate || !endDate) {
                    showMessage("Please select both start and end dates.", "error");
                    return;
                }

                setExporting(true);
                try {
                    const startObj = new Date(`${startDate}T00:00:00`);
                    const endObj = new Date(`${endDate}T23:59:59.999`);

                    // 1. Fetch profiles to build mapping
                    const profilesSnap = await getDocs(query(collectionGroup(db, 'profile'), where('role', '==', 'trainee')));
                    const userMap = {};
                    
                    profilesSnap.forEach(doc => {
                        const data = doc.data();
                        const uid = data.uid || (doc.ref.parent && doc.ref.parent.parent ? doc.ref.parent.parent.id : null);
                        const comp = (data.companyName || data.company || 'Unassigned').trim();
                        
                        if (uid && (selectedCompanies.includes('ALL') || selectedCompanies.includes(comp))) {
                            userMap[uid] = {
                                name: `${data.given || data.firstName || ''} ${data.family || data.lastName || ''}`.trim(),
                                studentId: data.studentId || 'N/A',
                                company: comp
                            };
                        }
                    });

                    const uidsToFetch = Object.keys(userMap);
                    if (uidsToFetch.length === 0) {
                        showMessage("No trainees found for the selected companies.", "error");
                        setExporting(false);
                        return;
                    }

                    // 2. Fetch attendance logs for these trainees
                    const allLogs = [];
                    const chunkSize = 30; 
                    
                    for (let i = 0; i < uidsToFetch.length; i += chunkSize) {
                        const chunk = uidsToFetch.slice(i, i + chunkSize);
                        
                        await Promise.all(chunk.map(async (uid) => {
                            const logsRef = collection(db, 'artifacts', appId, 'users', uid, 'attendanceLogs');
                            const snap = await getDocs(logsRef);
                            
                            snap.forEach(docItem => {
                                const logData = docItem.data();
                                
                                let logTime = null;
                                if (logData.timestamp) {
                                    logTime = logData.timestamp.toDate ? logData.timestamp.toDate() : new Date(logData.timestamp);
                                }
                                
                                if (logTime && logTime >= startObj && logTime <= endObj) {
                                    
                                    // --- EXTRACT USING LOGIC FROM IC-PORTAL ATTENDANCETAB ---
                                    
                                    // Helper to accurately get the location array based on your portal's format
                                    const getLoc = (details) => { 
                                        if (!details) return null;
                                        if (details.location?.lat) return `${details.location.lat}, ${details.location.lon}`; 
                                        if (details.location?.latitude) return `${details.location.latitude}, ${details.location.longitude}`; 
                                        if (details.lat) return `${details.lat}, ${details.lon}`; 
                                        if (details.latitude) return `${details.latitude}, ${details.longitude}`; 
                                        return null; 
                                    };

                                    // Logs are typically nested under clockInDetails or clockOutDetails
                                    const isOut = logData.type === 'OUT';
                                    const details = isOut ? logData.clockOutDetails : logData.clockInDetails;

                                    // Smartly extract the specific values
                                    const locStr = getLoc(details) || getLoc(logData) || 'N/A';
                                    const statusStr = details?.statusRemark || logData.statusRemark || logData.status || 'N/A';
                                    const methodStr = details?.logMethod || logData.logMethod || details?.method || logData.method || 'N/A';
                                    const notesStr = details?.notes || logData.notes || logData.remarks || 'N/A';

                                    allLogs.push({
                                        studentId: userMap[uid].studentId,
                                        name: userMap[uid].name,
                                        company: userMap[uid].company,
                                        date: logTime.toLocaleDateString(),
                                        time: logTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'}),
                                        timestampObj: logTime,
                                        type: logData.type || 'N/A',
                                        method: methodStr,
                                        status: statusStr,
                                        location: locStr,
                                        notes: notesStr // Includes any remarks/notes submitted
                                    });
                                }
                            });
                        }));
                    }

                    if (allLogs.length === 0) {
                        showMessage("No attendance records found for the selected date range and companies.", "error");
                        setExporting(false);
                        return;
                    }

                    // Sort chronologically (Oldest to Newest)
                    allLogs.sort((a, b) => a.timestampObj - b.timestampObj);

                    // 3. Format strictly to CSV using PapaParse
                    const csvData = allLogs.map(log => ({
                        "Student ID": log.studentId,
                        "Full Name": log.name,
                        "Company": log.company,
                        "Date": log.date,
                        "Time": log.time,
                        "Type (IN/OUT)": log.type,
                        "Log Method": log.method,
                        "Status / Verification": log.status,
                        "GPS Coordinates": log.location,
                        "Notes / Remarks": log.notes
                    }));

                    const csv = Papa.unparse(csvData);
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    
                    const link = document.createElement("a");
                    link.setAttribute("href", url);
                    link.setAttribute("download", `Attendance_Export_${startDate}_to_${endDate}.csv`);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    showMessage(`Successfully exported ${allLogs.length} records to CSV!`);
                } catch (err) {
                    showMessage("Export failed: " + err.message, "error");
                    console.error(err);
                }
                setExporting(false);
            };
                if (companies.length === 0) return <div className="flex flex-col items-center justify-center py-12 text-slate-400">No companies found in master list.</div>;
                return (
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 md:p-8 shadow-sm border border-slate-200 dark:border-slate-700 relative animate-in fade-in zoom-in duration-300">
                        <div className="border-b border-slate-100 dark:border-slate-800/50 pb-4 md:pb-6 mb-6">
                            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2"><FileUp className="text-blue-600" /> Export Attendance Records</h2>
                            <p className="text-slate-500 text-sm mt-1">Export trainee clock-in and clock-out logs to a CSV file for a specific date range and company.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Filters Left Side */}
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2"><History className="text-slate-400" size={16} /> Select Date Range</h3>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Start Date</label>
                                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none text-sm font-medium" />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold text-slate-500 mb-1">End Date</label>
                                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none text-sm font-medium" />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2"><Briefcase className="text-slate-400" size={16} /> Select Companies</h3>
                                    <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50 dark:bg-slate-900/50 space-y-2">
                                        <label className="flex items-center gap-3 p-2 hover:bg-white dark:bg-slate-800 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-200">
                                            <input type="checkbox" checked={selectedCompanies.includes('ALL')} onChange={() => handleCompanyToggle('ALL')} className="w-4 h-4 text-blue-600 rounded" />
                                            <span className="text-sm font-black text-slate-800 dark:text-slate-100">ALL COMPANIES</span>
                                        </label>
                                        <hr className="border-slate-200" />
                                        {companies.map((comp, idx) => (
                                            <label key={idx} className="flex items-center gap-3 p-2 hover:bg-white dark:bg-slate-800 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-200">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedCompanies.includes(comp)} 
                                                    onChange={() => handleCompanyToggle(comp)} 
                                                    className="w-4 h-4 text-blue-600 rounded" 
                                                />
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{comp}</span>
                                            </label>
                                        ))}
                                        {companies.length === 0 && <p className="text-xs text-slate-400 italic p-2">No companies found.</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Export Action Right Side */}
                            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 flex flex-col items-center justify-center text-center h-full min-h-[250px]">
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-full text-blue-600 shadow-sm mb-4">
                                    <Download size={40} />
                                </div>
                                <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg mb-2">Ready to Export</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 max-w-xs">
                                    Click the button below to generate a CSV file containing all matching attendance records.
                                </p>
                                
                                <button 
                                    onClick={handleExport} 
                                    disabled={exporting} 
                                    className="w-full max-w-xs bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {exporting ? (
                                        <><Loader2 className="animate-spin" size={18} /> Generating File...</>
                                    ) : (
                                        <><Download size={18} /> Export to CSV</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            };

            if (loadingData) return (
                <div className="h-screen w-full flex items-center justify-center bg-slate-100">
                    <div className="bg-slate-900 p-10 rounded-2xl shadow-2xl border border-slate-800 flex flex-col items-center justify-center gap-6">
                        {/* Inner white tile for logo visibility */}
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-inner animate-[pulse_2s_ease-in-out_infinite]">
                            <img src="./dualtech-logo.png" alt="Dualtech" className="h-16 w-auto object-contain" />
                        </div>
                        
                        {/* Loading indicators & text */}
                        <div className="flex flex-col items-center gap-3 mt-2">
                            <div className="text-slate-300 text-xs font-bold tracking-[0.2em] uppercase">System Initializing</div>
                            <div className="flex gap-1.5 mt-1">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            );

            return (
                <div className="flex h-screen w-full bg-white dark:bg-slate-800 dark:bg-slate-900 transition-colors">
                    {/* Mobile Overlay */}
                    {!isSidebarCollapsed && (
                        <div className="md:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarCollapsed(true)} />
                    )}

                    {/* Gmail-Style Sidebar */}
                    <div className={`fixed inset-y-0 left-0 z-50 md:static ${isSidebarCollapsed ? '-translate-x-full md:translate-x-0 md:w-20' : 'translate-x-0 w-64'} flex-shrink-0 bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-700 dark:border-slate-700 flex flex-col transition-all duration-300`}>
                        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700 dark:border-slate-700">
                            {!isSidebarCollapsed && <div className="font-bold text-lg text-primary-600 dark:text-primary-400 flex items-center gap-2">
                                <img src="./dualtech-logo.png" alt="Dualtech" className="w-8 h-8 object-contain" />
                                IST Management
                            </div>}
                            {isSidebarCollapsed && <div className="w-full flex justify-center">
                                <img src="./dualtech-logo.png" alt="Dualtech" className="w-8 h-8 object-contain" />
                            </div>}
                            <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="hidden md:block p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md ml-auto">
                                <Menu size={20}/>
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
                            <ul className="space-y-1 px-3">
                                {[
                                    { id: 'dashboard', name: 'Dashboard Overview', icon: LayoutDashboard },
                                    { id: 'companies', name: 'Company Meetings', icon: Building },
                                    { id: 'all-companies', name: 'Master Company List', icon: Building2 },
                                    { id: 'coaching', name: 'Trainee Coaching', icon: Users },
                                    { id: 'attendance', name: 'Trainees\' Attendance', icon: CalendarCheck },
                                    { id: 'export', name: 'Export Records', icon: Download }
                                ].map(tab => {
                                    const Icon = tab.icon;
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <li key={tab.id}>
                                            <button onClick={() => { setActiveTab(tab.id); setIsSidebarCollapsed(true); }} title={isSidebarCollapsed ? tab.name : ''}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium transition-all ${isActive ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300 font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'}`}>
                                                <Icon size={18} className={isActive ? 'text-primary-600 dark:text-primary-400' : ''} />
                                                {!isSidebarCollapsed && <span>{tab.name}</span>}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                        <div className="p-4 border-t border-slate-200 dark:border-slate-700 dark:border-slate-700">
                            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-full text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                                <LogOut size={18} />
                                {!isSidebarCollapsed && <span>Sign Out</span>}
                            </button>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white dark:bg-slate-800 dark:bg-slate-900">
                        {/* Header */}
                        <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-slate-200 dark:border-slate-700 dark:border-slate-700 relative z-30">
                            <div className="flex items-center flex-1">
                                <button onClick={() => setIsSidebarCollapsed(false)} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full mr-2">
                                    <Menu size={20} />
                                </button>
                                {/* Search Bar placeholder */}
                                <div className="max-w-2xl w-full hidden md:flex flex-col relative z-50">
                                    <div className="flex-1 flex items-center bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2.5">
                                        <Search size={20} className="text-slate-400" />
                                        <input 
                                            type="text" 
                                            placeholder={`Search modules...`} 
                                            className="w-full bg-transparent border-none outline-none ml-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-500" 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 md:gap-4 pl-4">
                                <button onClick={() => setDarkMode(!darkMode)} className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors">
                                    {darkMode ? <Sun size={20}/> : <Moon size={20}/>}
                                </button>
                                {/* Avatar Circle */}
                                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 border border-primary-200 dark:border-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold uppercase shrink-0" title={user?.email}>
                                    {(user?.name && user.name !== 'Administrator') ? user.name.charAt(0) : (user?.email ? user.email.charAt(0) : 'A')}
                                </div>
                            </div>
                        </header>

                        {/* Content Scroll Area */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative custom-scrollbar">
                            <div className="max-w-6xl mx-auto pb-10">

                                {/* TABS ROUTING */}
                                {activeTab === 'dashboard' && <DashboardTab allTrainees={trainees} attendanceLogs={attendanceLogs} />}
                                {activeTab === 'companies' && <CompanyMeetingsTab allVisits={visits} allTrainees={trainees} />}
                                {activeTab === 'all-companies' && <AllCompaniesTab allTraineesData={trainees} visits={visits} contacts={contacts} companyProfiles={companyProfiles} setCompanyProfiles={setCompanyProfiles} geofences={geofences} />}
                                {activeTab === 'coaching' && <CoachingTab />}
                                {activeTab === 'attendance' && <AttendanceTab />}
                                {activeTab === 'export' && <ExportRecordsTab allTrainees={trainees} />}
                            </div>
                        </div>
                    </div>
                </div>
            );
        };

        // --- LOGIN SCREEN (Animated Glassmorphism Style) ---
        const ICPortalLogin = ({ onLoginSuccess, error }) => {
            const [email, setEmail] = useState('');
            const [password, setPassword] = useState('');
            const [showPassword, setShowPassword] = useState(false);
            const [rememberMe, setRememberMe] = useState(false);
            const [loading, setLoading] = useState(false);
            const [localError, setLocalError] = useState('');

            useEffect(() => {
                const savedRemember = localStorage.getItem('icportal_remember_me') === 'true';
                setRememberMe(savedRemember);
                if (savedRemember) {
                    const savedEmail = localStorage.getItem('icportal_email');
                    if (savedEmail) setEmail(savedEmail);
                }
            }, []);

            const handleSignIn = async (e) => {
                e.preventDefault();
                setLoading(true); setLocalError('');
                try {
                    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
                    if (rememberMe) {
                        localStorage.setItem('icportal_remember_me', 'true');
                        localStorage.setItem('icportal_email', email);
                    } else {
                        localStorage.removeItem('icportal_remember_me');
                        localStorage.removeItem('icportal_email');
                    }
                    
                    const userCredential = await signInWithEmailAndPassword(auth, email, password);
                    if (onLoginSuccess) onLoginSuccess(userCredential.user);
                } catch (err) {
                    setLocalError("Invalid credentials or authentication error. " + err.message.replace('Firebase: ', ''));
                }
                setLoading(false);
            };

            return (
                <div className="min-h-screen relative flex items-center justify-center p-4 bg-slate-900 overflow-hidden font-sans w-full">
                    {/* Professional Animated Background */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-900/30 blur-[120px] animate-[pulse_8s_ease-in-out_infinite_alternate]"></div>
                        <div className="absolute top-[60%] -right-[10%] w-[60%] h-[60%] rounded-full bg-primary-900/30 blur-[120px] animate-[pulse_10s_ease-in-out_infinite_alternate-reverse]"></div>
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgNDBoNDBWMEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDQwaDFWMEgweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIvPjxwYXRoIGQ9Ik0wIDQwaDQwdi0xSDB6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDIpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-50"></div>
                    </div>
                    
                    <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-700">
                        <div className="bg-white/10 dark:bg-slate-800/60 backdrop-blur-2xl p-10 rounded-3xl border border-white/10 shadow-2xl">
                            
                            <div className="text-center mb-10">
                                <div className="flex justify-center mb-6">
                                    <div className="relative group">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-primary-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                                        <div className="relative bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800/50 transform transition-transform duration-500 group-hover:-translate-y-1 group-hover:shadow-xl">
                                            <img src="dualtech-logo.png" alt="Dualtech Logo" className="w-20 h-20 object-contain" />
                                        </div>
                                    </div>
                                </div>
                                <h1 className="text-2xl font-bold text-slate-100 tracking-tight">IC Management Portal</h1>
                                <p className="text-sm text-slate-400 mt-2 font-medium">Secure access for IC managers</p>
                            </div>

                            {(error || localError) && (
                                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
                                    <AlertTriangle size={18} className="text-red-400" /> 
                                    <span className="text-red-400 text-sm font-medium">{error || localError}</span>
                                </div>
                            )}

                            <form onSubmit={handleSignIn} className="space-y-5">
                                <div className="space-y-2 group/input">
                                    <label className="block text-sm font-medium text-slate-300">Email Address</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within/input:text-blue-400 transition-colors">
                                            <Mail size={18} />
                                        </div>
                                        <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} 
                                            className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-slate-100 placeholder-slate-500 outline-none transition-all shadow-inner" 
                                            placeholder="manager@dualtech.edu.ph"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 group/input">
                                    <label className="block text-sm font-medium text-slate-300">Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within/input:text-blue-400 transition-colors">
                                            <Lock size={18} />
                                        </div>
                                        <input required type={showPassword ? "text" : "password"} value={password} onChange={e=>setPassword(e.target.value)} 
                                            className="w-full pl-10 pr-12 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-slate-100 placeholder-slate-500 outline-none transition-all shadow-inner" 
                                            placeholder="••••••••"
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-blue-400 transition-colors focus:outline-none"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center mt-2">
                                    <label className="flex items-center cursor-pointer group">
                                        <div className="relative flex items-center justify-center w-4 h-4 mr-2">
                                            <input 
                                                type="checkbox" 
                                                checked={rememberMe}
                                                onChange={(e) => setRememberMe(e.target.checked)}
                                                className="peer appearance-none w-4 h-4 border border-slate-600 rounded bg-slate-900/50 checked:bg-blue-600 checked:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer"
                                            />
                                            <Check size={12} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" strokeWidth={3} />
                                        </div>
                                        <span className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">Remember me</span>
                                    </label>
                                </div>

                                <button type="submit" disabled={loading} className="mt-8 relative w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-slate-900 transition-all shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group">
                                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out"></div>
                                    <span className="relative flex items-center gap-2">
                                        {loading ? <><Loader2 className="animate-spin" size={18} /> Authenticating...</> : "Sign In"}
                                    </span>
                                </button>
                            </form>
                        </div>
                        <div className="mt-8 text-center animate-in fade-in delay-300 duration-1000">
                            <p className="text-xs text-slate-500 font-medium">© {new Date().getFullYear()} Dualtech Training Center</p>
                        </div>
                    </div>
                </div>
            );
        };

        const App = () => {
            const [user, setUser] = useState(null);
            const [loading, setLoading] = useState(true);

            useEffect(() => {
                const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
                    if (currentUser) {
                        setUser({ id: currentUser.uid, email: currentUser.email, name: currentUser.displayName || 'Administrator' });
                    } else { setUser(null); }
                    setLoading(false);
                });
                return () => unsubscribe();
            }, []);

            if (loading) return (
                <div className="h-screen w-full flex items-center justify-center bg-slate-900">
                    <div className="relative flex items-center justify-center mb-6">
                        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
                        <img src="./dualtech-logo.png" alt="Dualtech" className="w-24 h-24 object-contain animate-pulse opacity-90 drop-shadow-lg relative z-10" />
                        <Loader2 className="absolute text-blue-500/80 animate-spin" size={140} strokeWidth={1.5} />
                    </div>
                </div>
            );

            if (!user) return <ICPortalLogin />;

            return <ICManagementPortal user={user} handleLogout={() => signOut(auth)} />;
        };

        const root = createRoot(document.getElementById('root'));
        root.render(<App />);
    