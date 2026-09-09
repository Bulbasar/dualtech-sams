import React, { useState } from 'react';
import ChatWidget from '../ChatWidget';
import { Home, AlertTriangle, History, FileText, BookOpen, Award, Settings, User, Search, RefreshCw, CalendarDays, MessageCircle, Bell, LogOut, MessageSquare } from 'lucide-react';
import ScheduleRequestModal from '../modals/ScheduleRequestModal';
import NotificationsPanel from '../modals/NotificationsPanel';
import MessageModal from '../modals/MessageModal';
import { signOut } from 'firebase/auth';
import { primaryAuth, primaryDb } from '../../firebase';
import { collection, query, where, getDocs, doc, getDoc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { useEffect } from 'react';

export default function BSTPLayout({ user, profile, activeTab, setActiveTab, allLogs = [], absenceLogs = [], onRefresh, children }) {
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [totalUnread, setTotalUnread] = useState(0);
    const [hasPendingScheduleRequest, setHasPendingScheduleRequest] = useState(false);
    
    
    const [enrichedUnacknowledged, setEnrichedUnacknowledged] = useState([]);
    const [enrichedAnnouncements, setEnrichedAnnouncements] = useState([]);
    const [hasAutoShownNotifications, setHasAutoShownNotifications] = useState(false);
    const [showMissingLogsPopup, setShowMissingLogsPopup] = useState(false);
    const [missingWorkingDays, setMissingWorkingDays] = useState(0);

    const isActive = profile?.status === 'Active';
    

    useEffect(() => {
        // Initialize Theme Based on LocalStorage or System Preference
        const currentTheme = localStorage.getItem('app-theme') || 'system';
        if (currentTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else if (currentTheme === 'light') {
            document.documentElement.classList.remove('dark');
        } else {
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
        
        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleThemeChange = (e) => {
            const storedTheme = localStorage.getItem('app-theme');
            if (!storedTheme || storedTheme === 'system') {
                if (e.matches) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            }
        };
        mediaQuery.addEventListener('change', handleThemeChange);
        return () => mediaQuery.removeEventListener('change', handleThemeChange);
    }, []);

    useEffect(() => {
        if (!user || !profile || !isActive) return;
        const APP_ID = "dualtech-ojt-portal";
        const traineeCompany = profile.companyName || profile.company || '';
        const userIdentifier = profile.email || user.email || user.uid;

        
        const fetchAnnouncements = async () => {
            try {
                const getLocalYYYYMMDD = (d) => {
                    return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                };

                const q = query(
                    collection(primaryDb, 'artifacts', APP_ID, 'public', 'data', 'announcements'),
                    where('status', '==', 'Active')
                );
                const snapshot = await getDocs(q);
                let matches = [];
                for (const docSnap of snapshot.docs) {
                    const data = docSnap.data();
                    let isTarget = false;
                    const target = data.targetGroup || data.targetAudience;
                    
                    // Explicitly reject Assigned IC announcements
                    if (target === 'Assigned IC' || target === 'IC') {
                        isTarget = false;
                    } else if (target === 'Trainees' || target === 'All') {
                        if (data.targetCompanies && (data.targetCompanies.includes('All') || data.targetCompanies.includes(traineeCompany))) {
                            isTarget = true;
                        } else if (data.targetCompany && (data.targetCompany === 'All' || data.targetCompany === traineeCompany)) {
                            isTarget = true;
                        } else if (!data.targetCompanies && !data.targetCompany) {
                            isTarget = true;
                        }
                    } else if (target === 'Specific Company' && data.targetCompany === traineeCompany) {
                        isTarget = true;
                    }
                    if (isTarget) {
                        matches.push({ id: docSnap.id, ...data });
                    }
                }

                // Sort newest first
                matches.sort((a, b) => new Date(b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt) - new Date(a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt));


                let holidaysStr = [];
                try {
                    const hSnap = await getDoc(doc(primaryDb, "artifacts", APP_ID, "public", "data", "settings", "globalHolidays"));
                    if (hSnap.exists()) {
                        holidaysStr = (hSnap.data().holidays || []).map(h => h.date);
                    }
                } catch(e) {}
                
                // Also get absence logs mapped to date strings
                const absenceDates = (absenceLogs || []).filter(l => l.icStatus !== "Denied").map(l => l.absenceDate || l.date);

                                // Calculate Missing Working Days
                let start = null;
                // Prefer initialRegisteredAt if it exists to count from the VERY first time they registered
                if (profile?.initialRegisteredAt) {
                    if (profile.initialRegisteredAt.toDate) start = profile.initialRegisteredAt.toDate();
                    else if (profile.initialRegisteredAt.seconds) start = new Date(profile.initialRegisteredAt.seconds * 1000);
                    else start = new Date(profile.initialRegisteredAt);
                } else if (profile?.registeredAt) {
                    if (profile.registeredAt.toDate) start = profile.registeredAt.toDate();
                    else if (profile.registeredAt.seconds) start = new Date(profile.registeredAt.seconds * 1000);
                    else start = new Date(profile.registeredAt);
                }
                
                if (!start || isNaN(start.getTime())) {
                    if (allLogs && allLogs.length > 0) {
                        const earliestLog = allLogs.reduce((min, l) => l.timestamp < min.timestamp ? l : min, allLogs[0]);
                        start = new Date(earliestLog.timestamp);
                    }
                }
                
                let missingWorkingDays = 0;
                let totalAbsences = 0;
                let uniqueDates = [];
                
                // Track deletion periods to exclude from AWOL
                let deletedAtDate = null;
                if (profile?.deletedAt) {
                    if (profile.deletedAt.toDate) deletedAtDate = profile.deletedAt.toDate();
                    else if (profile.deletedAt.seconds) deletedAtDate = new Date(profile.deletedAt.seconds * 1000);
                    else deletedAtDate = new Date(profile.deletedAt);
                    deletedAtDate.setHours(0,0,0,0);
                }
                
                let reRegisteredAtDate = null;
                if (profile?.registeredAt && profile?.initialRegisteredAt && profile.registeredAt !== profile.initialRegisteredAt) {
                    if (profile.registeredAt.toDate) reRegisteredAtDate = profile.registeredAt.toDate();
                    else if (profile.registeredAt.seconds) reRegisteredAtDate = new Date(profile.registeredAt.seconds * 1000);
                    else reRegisteredAtDate = new Date(profile.registeredAt);
                    reRegisteredAtDate.setHours(0,0,0,0);
                }
                
                if (start) {
                    start.setHours(0,0,0,0);
                    const end = new Date();
                    end.setHours(0,0,0,0);
                    
                    let tempDate = new Date(start);
                    const schoolingDayName = (profile?.schoolingDay || 'saturday').toLowerCase();
                    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                    
                    uniqueDates = [...new Set((allLogs || []).map(l => l.dateString))];

                    while (tempDate < end) {
                        const dayOfWeek = tempDate.getDay();
                        const dayName = dayNames[dayOfWeek];
                        const dStr = getLocalYYYYMMDD(tempDate);
                        
                        const isHoliday = holidaysStr.includes(dStr);
                        const isLeave = absenceDates.includes(dStr);
                        const hasLog = uniqueDates.includes(dStr);
                        
                        let isDeletedPeriod = false;
                        if (deletedAtDate && reRegisteredAtDate && deletedAtDate < reRegisteredAtDate) {
                            if (tempDate >= deletedAtDate && tempDate < reRegisteredAtDate) {
                                isDeletedPeriod = true;
                            }
                        }
                        
                        if (dayOfWeek !== 0 && dayName !== schoolingDayName) {
                            if (!hasLog && !isHoliday && !isLeave && !isDeletedPeriod) {
                                missingWorkingDays++;
                            }
                        }
                        
                        // Absences count logic (AWOL Only)
                        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !hasLog && !isHoliday && !isLeave && !isDeletedPeriod) {
                            totalAbsences++;
                        }

                        tempDate.setDate(tempDate.getDate() + 1);
                    }
                }

                setMissingWorkingDays(missingWorkingDays);
                let baseAnns = [...matches];
                
                // Absence Request Updates
                if (absenceLogs) {
                    absenceLogs.forEach(log => {
                        if (log.icStatus === 'Approved' || log.icStatus === 'Denied') {
                            baseAnns.unshift({
                                id: `absence_update_${log.id}`,
                                title: `Absence Request ${log.icStatus}`,
                                content: `Your absence request for ${log.absenceDate || log.date} was ${log.icStatus.toLowerCase()} by your IC. Remarks: ${log.icRemarks || 'None'}`,
                                authorIC: log.icName || 'Industrial Coordinator',
                                createdAt: log.updatedAt || log.createdAt || new Date().toISOString(),
                                isSystem: true
                            });
                        }
                    });
                }

                if (missingWorkingDays > 3) {
                    baseAnns.unshift({
                        id: "system_missing_logs",
                        title: "AWOL Warning (Missing Clock Records)",
                        content: `You have ${missingWorkingDays} AWOL/unrecorded absence(s) since your registration (excluding global holidays, requested leaves, and weekends). Please review your attendance history and submit any necessary disputes immediately to avoid disciplinary actions.`,
                        authorIC: "System Alert",
                        createdAt: new Date().toISOString(),
                        isSystem: true
                    });
                }

                if (isActive && totalAbsences >= 9) {
                    baseAnns.unshift({
                        id: 'system_absences_exceeded',
                        title: 'Warning: Allowable Absences Exceeded',
                        content: `You currently have ${totalAbsences} recorded absences since you registered in the portal, which is more than the allowable limit. Please go to the History tab to submit a dispute or schedule a make-up for unrecorded days.`,
                        authorIC: 'System Alert',
                        createdAt: new Date().toISOString(),
                        isSystem: true
                    });
                }

                const baseUnacked = [];

                for (const match of baseAnns) {
                    if (match.isSystem) {
                        if (!sessionStorage.getItem(`dismissed_ann_${match.id}`)) {
                            baseUnacked.push(match);
                        }
                    } else {
                        const ackRef = doc(primaryDb, 'artifacts', APP_ID, 'public', 'data', 'announcements', match.id, 'acknowledgments', userIdentifier);
                        const ackSnap = await getDoc(ackRef);
                        if (!ackSnap.exists() && !sessionStorage.getItem(`dismissed_ann_${match.id}`)) {
                            baseUnacked.push(match);
                        }
                    }
                }

                
                // Fetch Personal Notifications
                try {
                    const studentIdTarget = profile?.studentId || profile?.studentNo;
                    if (studentIdTarget) {
                        const nq = query(
                            collection(primaryDb, 'artifacts', APP_ID, 'public', 'data', 'notifications'),
                            where('targetStudentId', '==', studentIdTarget)
                        );
                        const nSnap = await getDocs(nq);
                        const nowMs = Date.now();
                        const ONE_DAY_MS = 24 * 60 * 60 * 1000;
                        
                        for (const nDoc of nSnap.docs) {
                            const nData = nDoc.data();
                            const notifTime = new Date(nData.timestamp || nData.createdAt).getTime();
                            
                            // Auto delete if older than 1 day
                            if (nowMs - notifTime > ONE_DAY_MS) {
                                await deleteDoc(nDoc.ref);
                            } else {
                                baseAnns.unshift({
                                    id: `notif_${nDoc.id}`,
                                    actualDocId: nDoc.id,
                                    title: nData.title || "Notification",
                                    content: nData.message || "",
                                    authorIC: 'LF Portal',
                                    createdAt: nData.timestamp || new Date().toISOString(),
                                    isSystem: true,
                                    isPersonal: true
                                });
                            }
                        }
                    }
                } catch(e) {
                    console.error("Error fetching notifications", e);
                }

                setEnrichedAnnouncements(baseAnns);
                setEnrichedUnacknowledged(baseUnacked);
                
                if (baseUnacked.length > 0 && !hasAutoShownNotifications) {
                    // Do not auto-show notifications upon login, as requested.
                    // setIsNotificationsOpen(true);
                    setHasAutoShownNotifications(true);
                }
            } catch (error) {
                console.error("Error fetching announcements:", error);
            }
        };
        fetchAnnouncements();
    }, [user, profile, isActive, hasAutoShownNotifications, allLogs, absenceLogs]);

    
    useEffect(() => {
        if (missingWorkingDays > 3) {
            const studentId = profile?.studentId || user?.uid;
            if (studentId) {
                const lastAckCount = parseInt(localStorage.getItem(`ack_missing_logs_${studentId}`) || '0');
                if (lastAckCount === 0 || (missingWorkingDays - lastAckCount >= 5)) {
                    setShowMissingLogsPopup(true);
                }
            }
        }
    }, [missingWorkingDays, profile, user]);

    const handleAcknowledgeMissingLogs = () => {
        const studentId = profile?.studentId || user?.uid;
        if (studentId) {
            localStorage.setItem(`ack_missing_logs_${studentId}`, missingWorkingDays.toString());
        }
        setShowMissingLogsPopup(false);
    };

    const handleAcknowledgeAll = async () => {

        if (!user || !profile || enrichedUnacknowledged.length === 0) {
            setIsNotificationsOpen(false);
            return;
        }
        const APP_ID = "dualtech-ojt-portal";
        const userIdentifier = profile.email || user.email || user.uid || 'unknown';
        const traineeName = profile.given && profile.family
            ? `${profile.given} ${profile.family}`
            : profile.name || 'Unknown Trainee';

        for (const ann of enrichedUnacknowledged) {
            if (ann.isSystem) {
                sessionStorage.setItem(`dismissed_ann_${ann.id}`, 'true');
                continue;
            }
            try {
                const ackRef = doc(primaryDb, 'artifacts', APP_ID, 'public', 'data', 'announcements', ann.id, 'acknowledgments', userIdentifier);
                await setDoc(ackRef, {
                    name: traineeName,
                    email: profile.email || user.email || 'No Email',
                    role: 'Trainee',
                    company: profile.companyName || profile.company || 'Unknown',
                    acknowledgedAt: serverTimestamp()
                });
            } catch (error) {
                console.error("Error acknowledging announcement:", error);
                sessionStorage.setItem(`dismissed_ann_${ann.id}`, 'true');
            }
        }
        
        sessionStorage.setItem('dismissed_missing_logs', 'true');
        sessionStorage.setItem('dismissed_absences_exceeded', 'true');
        
        setEnrichedUnacknowledged([]);
        setIsNotificationsOpen(false);
    };



    const handleLogout = async () => {
        try {
            await signOut(primaryAuth);
        } catch (error) {
            console.error("Logout Error:", error);
        }
    };

    if (!profile) return null;

    return (
        <div className="fixed inset-0 bg-slate-100 dark:bg-slate-950 flex flex-col font-sans overflow-hidden">
            {/* FB-Style Top Navigation */}
            <header className="shrink-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm h-14 flex items-center justify-between px-4">
                <div className="flex items-center gap-2 w-auto md:w-1/4">
                    <img src="./dualtech-logo.png" alt="Dualtech Logo" className="w-9 h-9 shrink-0 object-contain" />
                    <span className="font-bold text-slate-800 dark:text-slate-100 hidden lg:block text-lg">Dualtech</span>
                </div>
                
                <div className="flex-1 flex justify-center mx-2 max-w-2xl gap-4 items-center">
                    <div className="relative hidden md:block w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input type="text" placeholder="Search dualtech..." className="w-full bg-slate-100 dark:bg-slate-800 rounded-full py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-100" 
                            onChange={(e) => {
                                const val = e.target.value.toLowerCase();
                                if (val.includes('school')) setActiveTab('schooling');
                                else if (val.includes('absenc')) setActiveTab('absence');
                                else if (val.includes('dilig')) setActiveTab('diligence');
                                else if (val.includes('clock') || val.includes('home')) setActiveTab('home');
                                else if (val.includes('hist')) setActiveTab('history');
                                else if (val.includes('prof') || val.includes('set')) setActiveTab('profile');
                            }}
                        />
                    </div>
                </div>
                <div className="flex items-center justify-end gap-2 w-1/4">
                    <button onClick={() => onRefresh && onRefresh()} className="relative w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Refresh Data">
                        <RefreshCw size={20} />
                    </button>
                    
                    <button onClick={() => setIsChatOpen(!isChatOpen)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">
                        <MessageCircle size={20} className={activeTab === 'profile' ? 'fill-blue-500 text-blue-500' : ''} />
                    </button>
                    <button onClick={() => setIsNotificationsOpen(true)} className="relative w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors shrink-0">
                        <Bell size={20} />
                        {enrichedUnacknowledged.length > 0 && (
                            <span className="absolute top-0 right-0 flex h-3 w-3 mt-0.5 mr-0.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
                            </span>
                        )}
                    </button>
                    <button onClick={() => setActiveTab('profile')} className="w-10 h-10 ml-2 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 overflow-hidden border border-slate-200 hover:opacity-80 transition-opacity shrink-0">
                        {profile.profilePhotoUrl ? <img src={profile.profilePhotoUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <User size={20} />}
                    </button>
                </div>
            </header>

            {/* MAIN 3-COLUMN CONTENT */}
            <div className="flex-1 flex max-w-[1600px] mx-auto w-full pt-4 min-h-0 overflow-y-auto">

                {/* LEFT SIDEBAR (Desktop) */}
                <div className="hidden md:flex w-[280px] flex-col sticky top-[72px] h-[calc(100vh-80px)] overflow-y-auto px-2 pb-4">
                    <div className="flex items-center gap-3 p-2 mb-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200 overflow-hidden">
                            {profile.profilePhotoUrl ? <img src={profile.profilePhotoUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <User size={20} />}
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 leading-tight">{profile.given} {profile.family}</h3>
                            <p className="text-xs text-slate-500">{profile.studentId}</p>
                        </div>
                    </div>
                    <nav className="space-y-1">
                        <button onClick={() => setActiveTab('home')} className={`w-full flex items-center gap-3 p-3 rounded-lg font-medium transition-colors ${activeTab === 'home' ? 'bg-slate-200 dark:bg-slate-800' : 'text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'}`}><Home size={24} className={activeTab === 'home' ? 'text-blue-500 fill-blue-500/20' : 'text-slate-500'} /> Clock In/Out</button>
                        <button onClick={() => setActiveTab('history')} className={`w-full flex items-center gap-3 p-3 rounded-lg font-medium transition-colors ${activeTab === 'history' ? 'bg-slate-200 dark:bg-slate-800' : 'text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'}`}><History size={24} className={activeTab === 'history' ? 'text-blue-500' : 'text-slate-500'} /> Attendance History</button>
                        <button onClick={() => setActiveTab('absence')} className={`w-full flex items-center gap-3 p-3 rounded-lg font-medium transition-colors ${activeTab === 'absence' ? 'bg-slate-200 dark:bg-slate-800' : 'text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'}`}><FileText size={24} className={activeTab === 'absence' ? 'text-blue-500' : 'text-slate-500'} /> Absence Request</button>
                        <button onClick={() => setActiveTab('diligence')} className={`w-full flex items-center gap-3 p-3 rounded-lg font-medium transition-colors ${activeTab === 'diligence' ? 'bg-slate-200 dark:bg-slate-800' : 'text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'}`}><Award size={24} className={activeTab === 'diligence' ? 'text-blue-500' : 'text-slate-500'} /> Diligence Report</button>
                        <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 p-3 rounded-lg font-medium transition-colors ${activeTab === 'profile' ? 'bg-slate-200 dark:bg-slate-800' : 'text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
                            {profile.profilePhotoUrl ? <img src={profile.profilePhotoUrl} alt="" className="w-6 h-6 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" /> : <Settings size={24} className={activeTab === 'profile' ? 'text-slate-500 fill-slate-500/20' : 'text-slate-500'} />} Profile Settings
                        </button>
                    </nav>
                    <hr className="my-4 border-slate-300 dark:border-slate-700 mx-2" />
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 rounded-lg font-medium text-slate-700 hover:bg-slate-200 dark:text-slate-300 transition-colors"><LogOut size={24} className="text-slate-500" /> Sign Out</button>
                    <div className="mt-auto px-3 text-xs text-slate-400">
                        Privacy &middot; Terms &middot; Dualtech &copy; 2026
                    </div>
                </div>

                {/* CENTER FEED */}
                <div className="flex-1 max-w-[680px] mx-auto w-full px-2 md:px-6 pb-24 md:pb-8 shrink-0">
                    {children}
                </div>

                {/* RIGHT SIDEBAR (Desktop) */}
                <div className="hidden lg:block w-[320px] sticky top-[72px] h-[calc(100vh-80px)] overflow-y-auto px-2 pb-4">
                    
                </div>
            </div>

            {/* Floating Glassmorphic Mobile Bottom Nav */}
            <div className="md:hidden shrink-0 w-full z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around py-1 px-1 sm:px-2 shadow-lg">
                {[
                    { id: 'home', icon: Home, label: 'Clock' },
                    { id: 'history', icon: History, label: 'History' },
                    { id: 'absence', icon: FileText, label: 'Absence' },
                    { id: 'diligence', icon: Award, label: 'Diligence' }
                ].map(btn => (
                    <button key={btn.id} onClick={() => setActiveTab(btn.id)}
                        className={`flex flex-col items-center justify-center gap-1 p-2 w-full max-w-[64px]
                        ${activeTab === btn.id
                                ? 'text-blue-600'
                                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}>
                        {btn.id === 'profile' && profile.profilePhotoUrl ? (
                            <img src={profile.profilePhotoUrl} alt="" className="w-6 h-6 rounded-full object-cover border border-slate-200 dark:border-slate-700" referrerPolicy="no-referrer" />
                        ) : (
                            <btn.icon size={24} className={activeTab === btn.id ? 'fill-blue-500/20' : ''} />
                        )}
                        <span className="text-[10px] font-medium text-center truncate w-full">
                            {btn.label}
                        </span>
                    </button>
                ))}
            </div>
            
            {showScheduleModal && (
                <ScheduleRequestModal 
                    user={user} 
                    profile={profile} 
                    onClose={() => setShowScheduleModal(false)} 
                />
            )}
            {showMissingLogsPopup && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 flex flex-col text-center">
                        <div className="mx-auto bg-amber-100 dark:bg-amber-900/30 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                            <AlertTriangle className="text-amber-600 dark:text-amber-400" size={32} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">Missing Clock Records</h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                            You have <strong>{missingWorkingDays} AWOL/unrecorded absence(s)</strong> since your registration (excluding global holidays, requested leaves, and weekends). Please review your attendance history and submit any necessary disputes immediately to avoid disciplinary actions.
                        </p>
                        <button
                            onClick={handleAcknowledgeMissingLogs}
                            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-amber-500/30 transition-colors"
                        >
                            I Acknowledge
                        </button>
                    </div>
                </div>
            )}

            {isNotificationsOpen && (
                <NotificationsPanel 
                    user={user} 
                    profile={profile} 
                    onClose={handleAcknowledgeAll} 
                    enrichedAnnouncements={enrichedAnnouncements}
                    enrichedUnacknowledged={enrichedUnacknowledged}
                />
            )}
            
        
            <ChatWidget currentUser={{id: profile.studentId, name: profile.given + ' ' + profile.family, role: 'BSTP', profilePhotoUrl: profile.profilePhotoUrl, adviserInitial: profile.adviser}} db={primaryDb} isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} onUnreadChange={setTotalUnread} />
        </div>
    );
}

