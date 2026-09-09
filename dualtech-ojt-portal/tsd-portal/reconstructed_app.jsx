import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import React, { useState, useEffect, useMemo, useRef } from "react";
- `[/]` 1. Provide Google Apps Script code for the user to deploy.
This plan details copying the "Company Attendance" function from `ic-portal.html` into `tsd-portal/src/App.jsx` and modifying it to fetch all trainees regardless of "Assigned IC".
- `[ ]` 3. Implement Notification Fetching & Dismiss logic.
- `[ ]` 4. Create `VisitScheduleView` custom Calendar component.
- `[ ]` 5. Implement dynamic company fetching (prioritize 'Active' trainees).
- `[ ]` 6. Create Add Schedule Modal (Company Dropdown, Date, Agenda).
- `[ ]` 7. Implement Saving Logic (Firestore `visitSchedules`, `notifications`, & Google Apps Script Fetch).
- `[ ]` 8. Rebuild and test the application.
## Proposed Changes
} from "lucide-react"; import NotificationBell from "./components/NotificationBell"; import VisitScheduleView from "./components/VisitScheduleView"; const APP_ID = "dualtech-ojt-portal";
import { initializeApp } from "firebase/app";
        import {
#### [MODIFY] [App.jsx](file:///c:/Users/rober/dualtech-ojt-portal/tsd-portal/src/App.jsx)
            collection,
1. **Import Icons:**
   - Add missing Lucide React icons (`CheckCircle`, `ChevronUp`, `Columns`, `ListChecks`, `Loader`) used by the Company Attendance UI to the existing `lucide-react` import statement.
            where,
2. **Add Component Logic (`CompanyAttendanceView`):**
   - Extract the `AttendanceSchoolingTab` component from `ic-portal.html` and inject it into `App.jsx` as `CompanyAttendanceView`.
   - In `CompanyAttendanceView`, locate the data fetching logic for trainees.
   - Remove the `.where('assignedIC', '==', ...)` clause from the trainee Firestore query, allowing the component to fetch all trainee records.
            getDocs
3. **Update Sidebar:**
   - Add a new navigation button in the `Sidebar` component for "Company Attendance" (e.g., `setActiveView('company_attendance')`).

4. **Update Main View Router:**
   - In the main `App` component's `switch (activeView)` block, add a case for `'company_attendance'` that returns `<CompanyAttendanceView currentUser={user} />`.

## Verification Plan
            apiKey: "AIzaSyAPpy4VcR2uTIPmH01aJ3GvegSDzNNpM9U",
### Automated Tests
- `npm run build` within `tsd-portal` to ensure all JSX syntax and imports are valid.
            storageBucket: "dualtech-ojt-portal.firebasestorage.app",
### Manual Verification
- Log in to the TSD portal.
- Verify the presence of the new "Company Attendance" tab in the sidebar.
- Click the tab and ensure the attendance dashboard loads correctly.
- Verify that it displays records for *all* trainees, not just a specific subset.
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
--- TOOL CALL: Writing to file ---
const firebaseApp = firebase.initializeApp(firebaseConfig);
      const menuItems = [
        const db = firebase.firestore();
          { id: 'company_attendance', name: 'Company Attendance', icon: ListChecks },
        // 2. Initialize Modular SDK (used by OjtAttendanceView for collections)
        const modularApp = initializeApp(firebaseConfig);
        const firestore = getFirestore(modularApp);
        const appId = firebaseConfig.projectId;
      ];
--- CHUNK END ---
--- TOOL CALL: Editing file ---
--- TOOL CALL: Updating UI part of Company Attendance ---
            if (!name) return null;
            // Convert 'shield-check' to 'ShieldCheck'
            const IconName = name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
            const LucideIcon = Icons[IconName] || Icons.Circle;
            return <LucideIcon size={size} className={className} />;
        };
                                            {loadingLogs && (
        const LoginScreen = ({ onLogin, error }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(error || '');
                                                    <td className="p-3 md:p-4 text-xs md:text-sm font-mono text-slate-600">{record.timeIn || '--:--'}</td>
    useEffect(() => {
        setErrorMessage(error);
    }, [error]);
                                                            record.status === 'Present' ? 'bg-emerald-100 text-emerald-700' :
    useEffect(() => {
        const savedRemember = localStorage.getItem('tsd_remember_me') === 'true';
        setRememberMe(savedRemember);
        if (savedRemember) {
            const savedEmail = localStorage.getItem('tsd_email');
            if (savedEmail) setEmail(savedEmail);
        }
    }, []);
                                                <tr><td colSpan="7" className="p-4 text-center text-slate-500 font-medium bg-slate-50">Showing first 50 of {filteredRecords.length} records.</td></tr>
    const handleSignIn = async (e) => {
        e.preventDefault();
        setLoading(true);
        if (rememberMe) {
            localStorage.setItem('tsd_remember_me', 'true');
            localStorage.setItem('tsd_email', email);
        } else {
            localStorage.removeItem('tsd_remember_me');
            localStorage.removeItem('tsd_email');
        }
        await onLogin(email, password);
        setLoading(false);
--- CHUNK END ---
--- TOOL CALL: Modifying Export UI for All Companies scope ---
    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 bg-slate-900 overflow-hidden font-sans">
            {/* Professional Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-900/30 blur-[120px] animate-[pulse_8s_ease-in-out_infinite_alternate]"></div>
                <div className="absolute top-[60%] -right-[10%] w-[60%] h-[60%] rounded-full bg-indigo-900/30 blur-[120px] animate-[pulse_10s_ease-in-out_infinite_alternate-reverse]"></div>
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgNDBoNDBWMEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDQwaDFWMEgweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIvPjxwYXRoIGQ9Ik0wIDQwaDQwdi0xSDB6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDIpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-50"></div>
--- CHUNK END ---
                            {/* Row 2: Search */}
            <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-700">
                <div className="bg-white/10 dark:bg-slate-800/60 backdrop-blur-2xl p-10 rounded-3xl border border-white/10 shadow-2xl">
                                    <label className={labelClass}>{exportScope === 'trainee' ? 'Search Trainee' : 'Search Company'}</label>
                    <div className="text-center mb-10">
                        <div className="flex justify-center mb-6">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                                <div className="relative bg-white p-3 rounded-2xl shadow-lg border border-slate-100 transform transition-transform duration-500 group-hover:-translate-y-1 group-hover:shadow-xl">
                                    <img src="/dualtech-logo.png" alt="Dualtech Logo" className="w-20 h-20 object-contain" />
                                </div>
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">TSD Portal</h1>
                        <p className="text-sm text-slate-400 mt-2 font-medium">Secure access for administrators</p>
                    </div>
                                    {/* Selected indicator */}
                    {errorMessage && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
                            <AlertCircle size={18} className="text-red-400" />
                            <span className="text-red-400 text-sm font-medium">{errorMessage}</span>
                        </div>
                    )}
                                        </div>
                    <form onSubmit={handleSignIn} className="space-y-5">
                        <div className="space-y-2 group/input">
                            <label className="block text-sm font-medium text-slate-300">Email Address</label>
--- CHUNK END ---
--- TOOL CALL: Editing file ---
--- TOOL CALL: Editing file ---
--- TOOL CALL: Editing file ---
                                <input required type="email" value={email} onChange={e=>setEmail(e.target.value)}
--- CHUNK END ---
--- TOOL CALL: Editing file ---
--- TOOL CALL: Editing file ---
      const menuItems = [
          { id: 'performance', name: 'ASTP Performance', icon: Activity },
          { id: 'company_attendance', name: 'Company Attendance', icon: ListChecks },
          { id: 'ojtAttendance', name: 'OJT Attendance', icon: ClipboardList },
          { id: 'visitSchedule', name: 'Visit Schedule', icon: Calendar },
        const AstpPerformanceView = () => {
          { id: 'settings', name: 'Settings', icon: Settings },
      ];
--- CHUNK END ---
--- TOOL CALL: Fixing broken dualtech-logo.png in OJT Attendance tab ---
                    {loading ? (
            const [traineeStats, setTraineeStats] = useState({});
            const [totalTrainees, setTotalTrainees] = useState(0);
            const [activeCompanyCount, setActiveCompanyCount] = useState(0);
            const [loading, setLoading] = useState(true);
                            </div>
            useEffect(() => {
                const fetchPerformanceData = async () => {
--- CHUNK END ---
                        const APP_ID = "dualtech-ojt-portal";
                        const traineesRef = db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('trainees');
                        const traineesSnapshot = await traineesRef.get();
                                    type="button"
                        <div className="flex items-center mt-2">
                        const profilesQuery = query(collectionGroup(firestore, 'profile'), where('role', '==', 'trainee'));
                        const profilesSnap = await getDocs(profilesQuery);
                        const registeredStudentIds = new Set();
                        profilesSnap.forEach(pDoc => {
                            const pData = pDoc.data();
                        </div>
                                registeredStudentIds.add(String(pData.studentId).trim());
                        <div className="flex items-center mt-2">
                        });
                                <div className="relative flex items-center justify-center w-4 h-4 mr-2">
                        let fetchedTrainees = [];
                        let stats = {};
                        let activeCompanies = new Set();
                        let total = 0;
                        <button disabled={loading} className="mt-8 relative w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-slate-900 transition-all shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group">
                        traineesSnapshot.forEach(doc => {
                            const data = doc.data();
                            total++;
                            </span>
                        </button>
                    </form>
                </div>
                <div className="mt-8 text-center animate-in fade-in delay-300 duration-1000">
                    <p className="text-xs text-slate-500 font-medium">Â© {new Date().getFullYear()} Dualtech Training Center</p>
                </div>
            </div>
        </div>
    );
        };
                </div>
        const AstpPerformanceView = () => {
            const [allTrainees, setAllTrainees] = useState([]);
            const [selectedStatus, setSelectedStatus] = useState(null);
            const [activeFilter, setActiveFilter] = useState('all');
        </div>
    );
};) => {
            const [totalTrainees, setTotalTrainees] = useState(0);
            const [password, setPassword] = useState('');
            const [loading, setLoading] = useState(true);

            useEffect(() => {
                e.preventDefault();
                setLoading(true);
                await onLogin(email, password);
                setLoading(false);
            };

            return (
                <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
                    {/* Animated Background Elements */}
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                        profilesSnap.forEach(pDoc => {
                        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-primary-400/20 dark:bg-primary-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                    </div>
                                registeredStudentIds.add(String(pData.studentId).trim());
                    <div className="relative z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-2xl w-full max-w-md border border-white/40 dark:border-slate-700/50 transition-colors duration-300">
                        });
                            <div className="bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 rounded-2xl p-4 shadow-inner">
                        let fetchedTrainees = [];
                        let stats = {};
                        let activeCompanies = new Set();
                        let total = 0;
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-8">Use an account created from the Admin System portal.</p>
                        traineesSnapshot.forEach(doc => {
                        {error && (
                            total++;
                                <Icon name="alert-circle" size={18} />
                            // Check registration dynamically
                            const sId = String(data.studentId || data['Student ID#'] || '').trim();
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                            const status = data.status || data.Status || 'Unknown';
                            stats[status] = (stats[status] || 0) + 1;
                                    <Icon name="mail" size={18} className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-500 group-focus-within:text-primary-500 transition-colors" />
                            if (status === 'Active' && (data.company || data.companyName)) {
                                activeCompanies.add(data.company || data.companyName);
                            }
                        });
                                        placeholder="name@dualtech.edu.ph"
                        setAllTrainees(fetchedTrainees);
                        setTotalTrainees(total);
                        setTraineeStats(stats);
                        setActiveCompanyCount(activeCompanies.size);
                        setLoading(false);
                            <div>
                    } catch (error) {
                        console.error("Error fetching ASTP global data:", error);
                        setLoading(false);
                    }
                };
                                        value={password}
                fetchPerformanceData();
            }, []);
                                        required
            const handleSort = (key) => {
                let direction = 'asc';
                if (sortConfig.key === key && sortConfig.direction === 'asc') {
                    direction = 'desc';
                }
                setSortConfig({ key, direction });
            };
                                className="w-full rounded-2xl bg-primary-600 hover:bg-primary-500 text-white font-bold py-3.5 shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:hover:translate-y-0"
            const exportToExcel = () => {
                const headers = ['Student ID#', 'Name', 'Assigned Company', 'Assigned IC', 'IPT Date Start', 'IPT Date End', 'Registration Status', 'Date Registered'];
                const csvRows = [headers.join(',')];
                        </form>
                allTrainees.forEach(t => {
                </div>
            );
        };
                    const assignedIC = t.assignedIC || t.icName || t.Coordinator || t.ic || t.industrialCoordinator || t.supervisorName || 'Unassigned';
        const AstpPerformanceView = () => {
            const [allTrainees, setAllTrainees] = useState([]);
            const [selectedStatus, setSelectedStatus] = useState(null);
            const [activeFilter, setActiveFilter] = useState('all');
            const [sortConfig, setSortConfig] = useState({ key: 'computedName', direction: 'asc' });
                    const dateRegistered = dateRegRaw?.toDate ? dateRegRaw.toDate().toLocaleDateString() : (dateRegRaw ? new Date(dateRegRaw).toLocaleDateString() : 'N/A');
            const [traineeStats, setTraineeStats] = useState({});
            const [totalTrainees, setTotalTrainees] = useState(0);
            const [activeCompanyCount, setActiveCompanyCount] = useState(0);
            const [loading, setLoading] = useState(true);
                        `"${company.replace(/"/g, '""')}"`,
            useEffect(() => {
                const fetchPerformanceData = async () => {
                    try {
                        const APP_ID = "dualtech-ojt-portal";
                        const traineesRef = db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('trainees');
                    ];

                    csvRows.push(row.join(','));
                });
                        const profilesSnap = await getDocs(profilesQuery);
                const csvString = '\ufeff' + csvRows.join('\n');
                const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'ASTP_Performance_Export.csv');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            };

            const renderTableView = () => {
                let processedTrainees = allTrainees.map(t => {
                    const dateRegRaw = t.dateRegistered || t.createdAt;
                    const computedDateReg = dateRegRaw?.toDate ? dateRegRaw.toDate().toLocaleDateString() : (dateRegRaw ? new Date(dateRegRaw).toLocaleDateString() : 'N/A');
                    const rawDateReg = dateRegRaw?.toDate ? dateRegRaw.toDate().getTime() : (dateRegRaw ? new Date(dateRegRaw).getTime() : 0);

                    return {
                        ...t,
                        computedStudentId: t.studentId || 'No ID',
                        computedName: `${t.firstName || t.given || t.Given || ''} ${t.lastName || t.family || t.Family || ''}`.trim() || t.name || 'Unknown',
                        computedCompany: t.company || t.companyName || 'Unassigned',
                        computedIC: t.assignedIC || t.icName || t.Coordinator || t.ic || t.industrialCoordinator || t.supervisorName || 'Unassigned',
                        computedIptStart: t['IPT Date Start'] || t.iptDateStart || t.startDate || 'N/A',
                        computedIptEnd: t['IPT Date End'] || t.iptDateEnd || t.endDate || 'N/A',
                        computedRegStatus: t.isRegistered ? 'Registered' : 'Pending Setup',
                        computedDateReg,
                        rawDateReg
                    };
                });

                if (selectedStatus) {
                    processedTrainees = processedTrainees.filter(t => (t.status || t.Status || 'Unknown') === selectedStatus);
                }

                if (activeFilter === 'registered') {
                    processedTrainees = processedTrainees.filter(t => t.isRegistered);
                }

                processedTrainees.sort((a, b) => {
                    let valA = a[sortConfig.key];
                    let valB = b[sortConfig.key];

                    if (sortConfig.key === 'computedDateReg') {
                        valA = a.rawDateReg;
                        valB = b.rawDateReg;
                    } else {
                        if (typeof valA === 'string') valA = valA.toLowerCase();
                        if (typeof valB === 'string') valB = valB.toLowerCase();
                    }

                    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                    return 0;
                });

                const SortIndicator = ({ colKey }) => (
                    <span className={`inline-block w-3 ml-1 text-[10px] ${sortConfig.key === colKey ? 'text-slate-600' : 'text-slate-300'}`}>
                        {sortConfig.key === colKey ? (sortConfig.direction === 'asc' ? 'â–²' : 'â–¼') : 'â†•'}
                    </span>
                );

                return (
                    <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden transition-colors">
                        {/* Deployment Tracker Banner (Only shows when Active is selected) */}
                        {selectedStatus === 'Active' && (
                            <div className="bg-slate-50/80 dark:bg-slate-800/50 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 p-4 flex flex-col md:flex-row items-center justify-between gap-4 transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm text-primary-600 dark:text-primary-400">
                                        <Activity size={18} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight">Portal Deployment Tracking</h4>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1" style={{marginTop: '2px'}}>Monitor portal adoption across active trainees.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <div className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                                            {processedTrainees.filter(t => t.isRegistered).length} <span className="text-sm text-slate-400 dark:text-slate-500 font-bold">/ {allTrainees.filter(t => (t.status || t.Status) === 'Active').length}</span>
                                        </div>
                                        <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400">Registered Trainees</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Toolbar Header */}
                        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-800 transition-colors">
                            <div>
                                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <Users size={18} className="text-primary-500 dark:text-primary-400" />
                                    {selectedStatus ? `${selectedStatus} Trainees Database` : 'Global Trainees Database'}
                                    <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-lg ml-2 shadow-sm">
                                        {processedTrainees.length} records
                                    </span>
                                </h3>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                {/* Deployment Filter Toggle */}
                                {selectedStatus === 'Active' && (
                                    <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner transition-colors">
                                        <button
                                            onClick={() => setActiveFilter('all')}
                                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${activeFilter === 'all' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200 dark:border-slate-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                        >
                                            All Active
                                        </button>
                                        <button
                                            onClick={() => setActiveFilter('registered')}
                                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${activeFilter === 'registered' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200 dark:border-slate-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                        >
                                            Registered Only
                                        </button>
                                    </div>
                                )}

                                {selectedStatus && (
                                    <button onClick={() => { setSelectedStatus(null); setActiveFilter('all'); }} className="px-4 py-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-1.5">
                                        <X size={14} /> Clear Status
                                    </button>
                                )}
                                <button onClick={exportToExcel} className="px-4 py-2 bg-slate-800 dark:bg-primary-600 text-white font-bold text-xs rounded-xl hover:bg-slate-700 dark:hover:bg-primary-500 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-1.5 shadow-sm">
                                    <Download size={14} /> Export to Excel
                                </button>
                            </div>
                        </div>

                        {/* Table Area */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead className="select-none">
                                    <tr>
                                        <th className="table-header cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" onClick={() => handleSort('computedStudentId')}>
                                            Student ID# <SortIndicator colKey="computedStudentId" />
                                        </th>
                                        <th className="table-header cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" onClick={() => handleSort('computedName')}>
                                            Name <SortIndicator colKey="computedName" />
                                        </th>
                                        <th className="table-header cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" onClick={() => handleSort('computedCompany')}>
                                            Assigned Company <SortIndicator colKey="computedCompany" />
                                        </th>
                                        <th className="table-header cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" onClick={() => handleSort('computedIC')}>
                                            Assigned IC <SortIndicator colKey="computedIC" />
                                        </th>
                                        <th className="table-header cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" onClick={() => handleSort('computedIptStart')}>
                                            IPT Start <SortIndicator colKey="computedIptStart" />
                                        </th>
                                        <th className="table-header cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" onClick={() => handleSort('computedIptEnd')}>
                                            IPT End <SortIndicator colKey="computedIptEnd" />
                                        </th>
                                        <th className="table-header text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" onClick={() => handleSort('computedRegStatus')}>
                                            Status <SortIndicator colKey="computedRegStatus" />
                                        </th>
                                        <th className="table-header cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" onClick={() => handleSort('computedDateReg')}>
                                            Date Reg. <SortIndicator colKey="computedDateReg" />
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {processedTrainees.map(t => (
                                        <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group">
                                            <td className="table-cell font-mono text-xs">{t.computedStudentId}</td>
                                            <td className="table-cell font-bold text-slate-800 dark:text-slate-100">{t.computedName}</td>
                                            <td className="table-cell">{t.computedCompany}</td>
                                            <td className="table-cell">{t.computedIC}</td>
                                            <td className="table-cell">{t.computedIptStart}</td>
                                            <td className="table-cell">{t.computedIptEnd}</td>
                                            <td className="table-cell text-center">
                                                {t.isRegistered ? (
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50 px-2.5 py-1 rounded-md shadow-sm">
                                                        Registered
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 px-2.5 py-1 rounded-md shadow-sm">
                                                        Pending Setup
                                                    </span>
                                                )}
                                            </td>
                                            <td className="table-cell">{t.computedDateReg}</td>
                                        </tr>
                                    ))}
                                    {processedTrainees.length === 0 && (
                                        <tr>
                                            <td colSpan="8" className="p-12 text-center">
                                                <div className="flex flex-col items-center justify-center text-slate-400">
                                                    <Search size={24} className="mb-3 opacity-50" />
                                                    <p className="font-medium text-sm">No trainees match the selected filters.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            };

            if (loading) {
                return (
                    <div className="flex flex-col items-center justify-center p-20 text-slate-400">
                        <Loader2 className="animate-spin mb-4 text-slate-600" size={28} />
                        <p className="font-medium text-sm">Aggregating ASTP Performance Data...</p>
                    </div>
                );
            }

            return (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="mb-6">
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white">ASTP Performance</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Global overview and deployment tracking.</p>
                    </div>

                    {/* Professional KPI Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary-500/10 dark:bg-primary-400/10 rounded-full blur-xl group-hover:bg-primary-500/20 dark:group-hover:bg-primary-400/20 transition-colors"></div>
                            <div className="flex justify-between items-start mb-3 relative z-10">
                                <div className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Registered</div>
                                <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                    <Users size={16} className="text-primary-500 dark:text-primary-400" />
                                </div>
                            </div>
                            <div className="text-3xl font-black text-slate-800 dark:text-white relative z-10">{totalTrainees}</div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-500/10 dark:bg-blue-400/10 rounded-full blur-xl group-hover:bg-blue-500/20 dark:group-hover:bg-blue-400/20 transition-colors"></div>
                            <div className="flex justify-between items-start mb-3 relative z-10">
                                <div className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Active Partner Cos.</div>
                                <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                    <Building2 size={16} className="text-blue-500 dark:text-blue-400" />
                                </div>
                            </div>
                            <div className="text-3xl font-black text-slate-800 dark:text-white relative z-10">{activeCompanyCount}</div>
                        </div>

                        {Object.entries(traineeStats)
                            .filter(([status]) => status === 'Active' || status === 'LOA' || status === 'Dropped')
                            .map(([status, count]) => {
                                const isSelected = selectedStatus === status;

                                return (
                                    <div
                                        key={status}
                                        onClick={() => { setSelectedStatus(status); setActiveFilter('all'); }}
                                        className={`p-5 rounded-2xl border cursor-pointer transition-all duration-300 relative overflow-hidden group ${isSelected ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md transform -translate-y-1' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md'}`}
                                    >
                                        <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full blur-xl transition-colors ${isSelected ? 'bg-primary-500/20 dark:bg-primary-400/20' : 'bg-slate-500/10 dark:bg-slate-400/10 group-hover:bg-slate-500/20 dark:group-hover:bg-slate-400/20'}`}></div>
                                        <div className="flex justify-between items-start mb-3 relative z-10">
                                            <div className={`text-[10px] font-bold uppercase tracking-widest ${isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-slate-500 dark:text-slate-400'}`}>{status} Trainees</div>
                                            <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-primary-100 dark:bg-primary-800/50' : 'bg-slate-50 dark:bg-slate-800'}`}>
                                                <TrendingUp size={16} className={`${isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500'}`} />
                                            </div>
                                        </div>
                                        <div className={`text-3xl font-black tracking-tight relative z-10 ${isSelected ? 'text-primary-900 dark:text-white' : 'text-slate-800 dark:text-white'}`}>
                                            {count}
                                        </div>
                                    </div>
                                );
                            })}
                    </div>

                    {renderTableView()}
                </div>
            );
        };

        const CompanyEngagementView = () => {
            // --- DATA FETCHING STATE (Explicitly using React. hook syntax for CDN compatibility) ---
            const [allVisits, setAllVisits] = React.useState([]);
            const [allTrainees, setAllTrainees] = React.useState([]);
            const [loading, setLoading] = React.useState(true);

            // --- UI FILTER STATE ---
            const [selectedYear, setSelectedYear] = React.useState(() => new Date().getFullYear().toString());
            const [selectedMonth, setSelectedMonth] = React.useState(() => new Date().toLocaleString('en-US', { month: 'short' }));
            const [selectedIC, setSelectedIC] = React.useState(null);
            const [sortConfig, setSortConfig] = React.useState({ key: 'activeTrainees', direction: 'desc' });

            // Static list of months
            const monthsList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

            // --- FETCH DATA FROM FIREBASE ---
            React.useEffect(() => {
                const fetchEngagementData = async () => {
                    try {
                        const APP_ID = "dualtech-ojt-portal";
                        const dataRef = db.collection('artifacts').doc(APP_ID).collection('public').doc('data');

                        // 1. Fetch Trainees
                        const traineesSnapshot = await dataRef.collection('trainees').get();
                        let fetchedTrainees = [];
                        traineesSnapshot.forEach(doc => {
                            fetchedTrainees.push({ id: doc.id, ...doc.data() });
                        });

                        // 2. Fetch Visits
                        const visitsSnapshot = await dataRef.collection('visits').get();
                        let fetchedVisits = [];
                        visitsSnapshot.forEach(doc => {
                            fetchedVisits.push({ id: doc.id, ...doc.data() });
                        });

                        setAllTrainees(fetchedTrainees);
                        setAllVisits(fetchedVisits);
                        setLoading(false);

                    } catch (error) {
                        console.error("Error fetching engagement data:", error);
                        setLoading(false);
                    }
                };

                fetchEngagementData();
            }, []); // Empty dependency array means this runs once when component mounts

            // --- HELPER FUNCTIONS ---
            const parseDate = (dateInput) => {
                if (!dateInput) return new Date(NaN);

                if (typeof dateInput === 'object') {
                    if (typeof dateInput.toDate === 'function') return dateInput.toDate();
                    if (dateInput.seconds !== undefined) return new Date(dateInput.seconds * 1000);
                }

                if (typeof dateInput === 'string') {
                    const trimmed = dateInput.trim();

                    // Handle YYYY-MM-DD exactly to prevent timezone offset bugs
                    const ymdRegex = /^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/;
                    const ymdMatch = trimmed.match(ymdRegex);
                    if (ymdMatch) {
                        const year = parseInt(ymdMatch[1], 10);
                        const month = parseInt(ymdMatch[2], 10);
                        const day = parseInt(ymdMatch[3], 10);
                        return new Date(year, month - 1, day);
                    }

                    let nativeDate = new Date(trimmed.replace(/-/g, '/'));
                    if (!isNaN(nativeDate.getTime())) return nativeDate;

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
                const monthsList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                return monthsList[d.getMonth()];
            };

            // --- 1. EXTRACT AVAILABLE YEARS ---
            const availableY
// MISSING LINE 674
// MISSING LINE 675
// MISSING LINE 676
// MISSING LINE 677
// MISSING LINE 678
// MISSING LINE 679
// MISSING LINE 680
// MISSING LINE 681
// MISSING LINE 682
// MISSING LINE 683
// MISSING LINE 684
// MISSING LINE 685
// MISSING LINE 686
// MISSING LINE 687
// MISSING LINE 688
// MISSING LINE 689
// MISSING LINE 690
// MISSING LINE 691
// MISSING LINE 692
// MISSING LINE 693
// MISSING LINE 694
// MISSING LINE 695
// MISSING LINE 696
// MISSING LINE 697
// MISSING LINE 698
// MISSING LINE 699
// MISSING LINE 700
// MISSING LINE 701
// MISSING LINE 702
// MISSING LINE 703
// MISSING LINE 704
// MISSING LINE 705
// MISSING LINE 706
// MISSING LINE 707
// MISSING LINE 708
// MISSING LINE 709
// MISSING LINE 710
// MISSING LINE 711
// MISSING LINE 712
// MISSING LINE 713
// MISSING LINE 714
// MISSING LINE 715
// MISSING LINE 716
// MISSING LINE 717
// MISSING LINE 718
// MISSING LINE 719
// MISSING LINE 720
// MISSING LINE 721
// MISSING LINE 722
// MISSING LINE 723
// MISSING LINE 724
// MISSING LINE 725
// MISSING LINE 726
// MISSING LINE 727
// MISSING LINE 728
// MISSING LINE 729
// MISSING LINE 730
// MISSING LINE 731
// MISSING LINE 732
// MISSING LINE 733
// MISSING LINE 734
// MISSING LINE 735
// MISSING LINE 736
// MISSING LINE 737
// MISSING LINE 738
// MISSING LINE 739
// MISSING LINE 740
// MISSING LINE 741
// MISSING LINE 742
// MISSING LINE 743
// MISSING LINE 744
// MISSING LINE 745
// MISSING LINE 746
// MISSING LINE 747
// MISSING LINE 748
// MISSING LINE 749
// MISSING LINE 750
// MISSING LINE 751
// MISSING LINE 752
// MISSING LINE 753
// MISSING LINE 754
// MISSING LINE 755
// MISSING LINE 756
// MISSING LINE 757
// MISSING LINE 758
// MISSING LINE 759
// MISSING LINE 760
// MISSING LINE 761
// MISSING LINE 762
// MISSING LINE 763
// MISSING LINE 764
// MISSING LINE 765
// MISSING LINE 766
// MISSING LINE 767
// MISSING LINE 768
// MISSING LINE 769
// MISSING LINE 770
// MISSING LINE 771
// MISSING LINE 772
// MISSING LINE 773
// MISSING LINE 774
// MISSING LINE 775
// MISSING LINE 776
// MISSING LINE 777
// MISSING LINE 778
// MISSING LINE 779
// MISSING LINE 780
// MISSING LINE 781
// MISSING LINE 782
// MISSING LINE 783
// MISSING LINE 784
// MISSING LINE 785
// MISSING LINE 786
// MISSING LINE 787
// MISSING LINE 788
// MISSING LINE 789
// MISSING LINE 790
// MISSING LINE 791
// MISSING LINE 792
// MISSING LINE 793
// MISSING LINE 794
// MISSING LINE 795
// MISSING LINE 796
// MISSING LINE 797
// MISSING LINE 798
// MISSING LINE 799
// MISSING LINE 800
// MISSING LINE 801
// MISSING LINE 802
// MISSING LINE 803
// MISSING LINE 804
// MISSING LINE 805
// MISSING LINE 806
// MISSING LINE 807
// MISSING LINE 808
// MISSING LINE 809
// MISSING LINE 810
// MISSING LINE 811
// MISSING LINE 812
// MISSING LINE 813
// MISSING LINE 814
// MISSING LINE 815
// MISSING LINE 816
// MISSING LINE 817
// MISSING LINE 818
// MISSING LINE 819
// MISSING LINE 820
// MISSING LINE 821
// MISSING LINE 822
// MISSING LINE 823
// MISSING LINE 824
// MISSING LINE 825
// MISSING LINE 826
// MISSING LINE 827
// MISSING LINE 828
// MISSING LINE 829
// MISSING LINE 830
// MISSING LINE 831
// MISSING LINE 832
// MISSING LINE 833
// MISSING LINE 834
// MISSING LINE 835
// MISSING LINE 836
// MISSING LINE 837
// MISSING LINE 838
// MISSING LINE 839
// MISSING LINE 840
// MISSING LINE 841
// MISSING LINE 842
// MISSING LINE 843
// MISSING LINE 844
// MISSING LINE 845
// MISSING LINE 846
// MISSING LINE 847
// MISSING LINE 848
// MISSING LINE 849
// MISSING LINE 850
// MISSING LINE 851
// MISSING LINE 852
// MISSING LINE 853
// MISSING LINE 854
// MISSING LINE 855
// MISSING LINE 856
// MISSING LINE 857
// MISSING LINE 858
// MISSING LINE 859
// MISSING LINE 860
// MISSING LINE 861
// MISSING LINE 862
// MISSING LINE 863
// MISSING LINE 864
// MISSING LINE 865
// MISSING LINE 866
// MISSING LINE 867
// MISSING LINE 868
// MISSING LINE 869
// MISSING LINE 870
// MISSING LINE 871
// MISSING LINE 872
// MISSING LINE 873
// MISSING LINE 874
// MISSING LINE 875
// MISSING LINE 876
// MISSING LINE 877
// MISSING LINE 878
// MISSING LINE 879
// MISSING LINE 880
// MISSING LINE 881
// MISSING LINE 882
// MISSING LINE 883
// MISSING LINE 884
// MISSING LINE 885
// MISSING LINE 886
// MISSING LINE 887
// MISSING LINE 888
// MISSING LINE 889
// MISSING LINE 890
// MISSING LINE 891
// MISSING LINE 892
// MISSING LINE 893
// MISSING LINE 894
// MISSING LINE 895
// MISSING LINE 896
// MISSING LINE 897
// MISSING LINE 898
// MISSING LINE 899
// MISSING LINE 900
// MISSING LINE 901
// MISSING LINE 902
// MISSING LINE 903
// MISSING LINE 904
// MISSING LINE 905
// MISSING LINE 906
// MISSING LINE 907
// MISSING LINE 908
// MISSING LINE 909
// MISSING LINE 910
// MISSING LINE 911
// MISSING LINE 912
// MISSING LINE 913
// MISSING LINE 914
// MISSING LINE 915
// MISSING LINE 916
// MISSING LINE 917
// MISSING LINE 918
// MISSING LINE 919
// MISSING LINE 920
// MISSING LINE 921
// MISSING LINE 922
// MISSING LINE 923
// MISSING LINE 924
// MISSING LINE 925
// MISSING LINE 926
// MISSING LINE 927
// MISSING LINE 928
// MISSING LINE 929
// MISSING LINE 930
// MISSING LINE 931
// MISSING LINE 932
// MISSING LINE 933
// MISSING LINE 934
// MISSING LINE 935
// MISSING LINE 936
// MISSING LINE 937
// MISSING LINE 938
// MISSING LINE 939
// MISSING LINE 940
// MISSING LINE 941
// MISSING LINE 942
// MISSING LINE 943
// MISSING LINE 944
// MISSING LINE 945
// MISSING LINE 946
// MISSING LINE 947
// MISSING LINE 948
// MISSING LINE 949
// MISSING LINE 950
// MISSING LINE 951
// MISSING LINE 952
// MISSING LINE 953
// MISSING LINE 954
// MISSING LINE 955
// MISSING LINE 956
// MISSING LINE 957
// MISSING LINE 958
// MISSING LINE 959
// MISSING LINE 960
// MISSING LINE 961
// MISSING LINE 962
// MISSING LINE 963
// MISSING LINE 964
// MISSING LINE 965
// MISSING LINE 966
// MISSING LINE 967
// MISSING LINE 968
// MISSING LINE 969
// MISSING LINE 970
// MISSING LINE 971
// MISSING LINE 972
// MISSING LINE 973
// MISSING LINE 974
// MISSING LINE 975
// MISSING LINE 976
// MISSING LINE 977
// MISSING LINE 978
// MISSING LINE 979
// MISSING LINE 980
// MISSING LINE 981
// MISSING LINE 982
// MISSING LINE 983
// MISSING LINE 984
// MISSING LINE 985
// MISSING LINE 986
// MISSING LINE 987
// MISSING LINE 988
// MISSING LINE 989
// MISSING LINE 990
// MISSING LINE 991
// MISSING LINE 992
// MISSING LINE 993
// MISSING LINE 994
// MISSING LINE 995
// MISSING LINE 996
// MISSING LINE 997
// MISSING LINE 998
// MISSING LINE 999
// MISSING LINE 1000
// MISSING LINE 1001
// MISSING LINE 1002
// MISSING LINE 1003
// MISSING LINE 1004
// MISSING LINE 1005
// MISSING LINE 1006
// MISSING LINE 1007
// MISSING LINE 1008
// MISSING LINE 1009
// MISSING LINE 1010
// MISSING LINE 1011
// MISSING LINE 1012
// MISSING LINE 1013
// MISSING LINE 1014
// MISSING LINE 1015
// MISSING LINE 1016
// MISSING LINE 1017
// MISSING LINE 1018
// MISSING LINE 1019
// MISSING LINE 1020
// MISSING LINE 1021
// MISSING LINE 1022
// MISSING LINE 1023
// MISSING LINE 1024
// MISSING LINE 1025
// MISSING LINE 1026
// MISSING LINE 1027
// MISSING LINE 1028
// MISSING LINE 1029
// MISSING LINE 1030
// MISSING LINE 1031
// MISSING LINE 1032
// MISSING LINE 1033
// MISSING LINE 1034
// MISSING LINE 1035
// MISSING LINE 1036
// MISSING LINE 1037
// MISSING LINE 1038
// MISSING LINE 1039
// MISSING LINE 1040
// MISSING LINE 1041
// MISSING LINE 1042
// MISSING LINE 1043
// MISSING LINE 1044
// MISSING LINE 1045
// MISSING LINE 1046
// MISSING LINE 1047
// MISSING LINE 1048
// MISSING LINE 1049
// MISSING LINE 1050
// MISSING LINE 1051
// MISSING LINE 1052
// MISSING LINE 1053
// MISSING LINE 1054
// MISSING LINE 1055
// MISSING LINE 1056
// MISSING LINE 1057
// MISSING LINE 1058
// MISSING LINE 1059
// MISSING LINE 1060
// MISSING LINE 1061
// MISSING LINE 1062
// MISSING LINE 1063
// MISSING LINE 1064
// MISSING LINE 1065
// MISSING LINE 1066
// MISSING LINE 1067
// MISSING LINE 1068
// MISSING LINE 1069
// MISSING LINE 1070
// MISSING LINE 1071
// MISSING LINE 1072
// MISSING LINE 1073
// MISSING LINE 1074
// MISSING LINE 1075
// MISSING LINE 1076
// MISSING LINE 1077
// MISSING LINE 1078
// MISSING LINE 1079
// MISSING LINE 1080
// MISSING LINE 1081
// MISSING LINE 1082
// MISSING LINE 1083
// MISSING LINE 1084
// MISSING LINE 1085
// MISSING LINE 1086
// MISSING LINE 1087
// MISSING LINE 1088
// MISSING LINE 1089
// MISSING LINE 1090
// MISSING LINE 1091
// MISSING LINE 1092
// MISSING LINE 1093
// MISSING LINE 1094
// MISSING LINE 1095
// MISSING LINE 1096
// MISSING LINE 1097
// MISSING LINE 1098
// MISSING LINE 1099
// MISSING LINE 1100
// MISSING LINE 1101
// MISSING LINE 1102
// MISSING LINE 1103
// MISSING LINE 1104
// MISSING LINE 1105
// MISSING LINE 1106
// MISSING LINE 1107
// MISSING LINE 1108
// MISSING LINE 1109
// MISSING LINE 1110
// MISSING LINE 1111
// MISSING LINE 1112
// MISSING LINE 1113
// MISSING LINE 1114
// MISSING LINE 1115
// MISSING LINE 1116
// MISSING LINE 1117
// MISSING LINE 1118
// MISSING LINE 1119
// MISSING LINE 1120
// MISSING LINE 1121
// MISSING LINE 1122
// MISSING LINE 1123
// MISSING LINE 1124
// MISSING LINE 1125
// MISSING LINE 1126
// MISSING LINE 1127
// MISSING LINE 1128
// MISSING LINE 1129
// MISSING LINE 1130
// MISSING LINE 1131
// MISSING LINE 1132
// MISSING LINE 1133
// MISSING LINE 1134
// MISSING LINE 1135
// MISSING LINE 1136
// MISSING LINE 1137
// MISSING LINE 1138
// MISSING LINE 1139
// MISSING LINE 1140
// MISSING LINE 1141
// MISSING LINE 1142
// MISSING LINE 1143
// MISSING LINE 1144
// MISSING LINE 1145
// MISSING LINE 1146
// MISSING LINE 1147
// MISSING LINE 1148
// MISSING LINE 1149
// MISSING LINE 1150
// MISSING LINE 1151
// MISSING LINE 1152
// MISSING LINE 1153
// MISSING LINE 1154
// MISSING LINE 1155
// MISSING LINE 1156
// MISSING LINE 1157
// MISSING LINE 1158
// MISSING LINE 1159
// MISSING LINE 1160
// MISSING LINE 1161
// MISSING LINE 1162
// MISSING LINE 1163
// MISSING LINE 1164
// MISSING LINE 1165
// MISSING LINE 1166
// MISSING LINE 1167
// MISSING LINE 1168
// MISSING LINE 1169
// MISSING LINE 1170
// MISSING LINE 1171
// MISSING LINE 1172
// MISSING LINE 1173
// MISSING LINE 1174
// MISSING LINE 1175
// MISSING LINE 1176
// MISSING LINE 1177
// MISSING LINE 1178
// MISSING LINE 1179
// MISSING LINE 1180
// MISSING LINE 1181
// MISSING LINE 1182
// MISSING LINE 1183
// MISSING LINE 1184
// MISSING LINE 1185
// MISSING LINE 1186
// MISSING LINE 1187
// MISSING LINE 1188
// MISSING LINE 1189
// MISSING LINE 1190
// MISSING LINE 1191
// MISSING LINE 1192
// MISSING LINE 1193
// MISSING LINE 1194
// MISSING LINE 1195
// MISSING LINE 1196
// MISSING LINE 1197
// MISSING LINE 1198
// MISSING LINE 1199
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.05)] border border-rose-200 overflow-hidden flex flex-col h-[400px] lg:col-span-2">
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
                                    <thead className="bg-white sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <th onClick={() => handleSort('company')} className="p-4 font-bold text-slate-500 uppercase text-xs cursor-pointer select-none">
                                                Company Name {sortConfig.key === 'company' ? (sortConfig.direction === 'asc' ? 'â–²' : 'â–¼') : ''}
                                            </th>
                                            <th onClick={() => handleSort('icName')} className="p-4 font-bold text-slate-500 uppercase text-xs cursor-pointer select-none">
                                                Active Assigned IC(s) {sortConfig.key === 'icName' ? (sortConfig.direction === 'asc' ? 'â–²' : 'â–¼') : ''}
                                            </th>
                                            <th onClick={() => handleSort('activeTrainees')} className="p-4 font-bold text-slate-500 uppercase text-xs text-right cursor-pointer select-none">
                                                Active Trainees {sortConfig.key === 'activeTrainees' ? (sortConfig.direction === 'asc' ? 'â–²' : 'â–¼') : ''}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {sortedUnvisited.map((comp, idx) => (
                                            <tr key={idx} className="hover:bg-rose-50/50 transition-colors">
                                                <td className="p-4 font-bold text-slate-700">{comp.company}</td>
                                                <td className="p-4 text-slate-600 text-xs font-medium">{comp.icName}</td>
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

        const AttendanceTab = () => {
            const [allTrainees, setAllTrainees] = useState([]);
            const [companies, setCompanies] = useState([]);
            const [selectedCompany, setSelectedCompany] = useState('');
            const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

            const [attendanceRecords, setAttendanceRecords] = useState([]);
            const [loadingInitial, setLoadingInitial] = useState(true);
            const [loadingLogs, setLoadingLogs] = useState(false);

            // 1. Initial Load: Fetch ONLY Trainee Data to build the dropdowns
            useEffect(() => {
                const fetchTraineesList = async () => {
                    try {
                        const APP_ID = "dualtech-ojt-portal";
                        const traineesRef = db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('trainees');
                        const traineesSnapshot = await traineesRef.get();

                        let fetchedTrainees = [];
                        let activeCompanySet = new Set();

                        traineesSnapshot.forEach(doc => {
                            const data = doc.data();
                            fetchedTrainees.push({ id: doc.id, ...data });

                            // Populating companies WITH ACTIVE TRAINEES ONLY
                            if (data.status === 'Active' && (data.company || data.companyName)) {
                                activeCompanySet.add(data.company || data.companyName);
                            }
                        });

                        setAllTrainees(fetchedTrainees);
                        setCompanies(Array.from(activeCompanySet).sort());
                        setLoadingInitial(false);

                    } catch (error) {
                        console.error("Error fetching trainees:", error);
                        setLoadingInitial(false);
                    }
                };
                fetchTraineesList();
            }, []);

            // 2. LAZY FETCH: Only download attendance logs when a specific company is selected
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
                                traineeName: `${trainee.firstName || ''} ${trainee.lastName || ''}`.trim() || trainee.name || 'Unknown',
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
            }, [selectedCompany, allTrainees]);

            // 3. Apply Date Filter
            const filteredRecords = attendanceRecords.filter(record => !dateFilter || record.date === dateFilter);

            if (loadingInitial) {
                return (
                    <div className="flex flex-col items-center justify-center p-20 text-slate-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-4"></div>
                        <p>Preparing Global Database...</p>
                    </div>
                );
            }

            return (
                <div className="space-y-6">
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white">Global Attendance Logs</h2>

                    <div className="flex flex-col md:flex-row gap-4 bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Active Company</label>
                            <select
                                value={selectedCompany}
            // 3. Apply Date Filter
            const filteredRecords = attendanceRecords.filter(record => !dateFilter || record.date === dateFilter);
                            >
            if (loadingInitial) {
                return (
                    <div className="flex flex-col items-center justify-center p-20 text-slate-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-4"></div>
                        <p>Preparing Global Database...</p>
                    </div>
                );
            }
                                value={dateFilter}
            return (
                <div className="space-y-6">
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white">Global Attendance Logs</h2>
                        </div>
                    <div className="flex flex-col md:flex-row gap-4 bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex-1">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                onChange={e => setSelectedCompany(e.target.value)}
                                className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500 text-base"
                            >
                                <option value="">-- Choose a company to view logs --</option>
                                {companies.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Filter by Date</label>
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={e => setDateFilter(e.target.value)}
                                className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500 text-base"
                            />
                        </div>
                    </div>
                                </thead>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 text-xs md:text-sm border-b border-slate-200">
                                    ) : filteredRecords.length > 0 ? (
                                        filteredRecords.map(record => (
                                        <th className="p-3 md:p-4 font-bold">Date</th>
                                        <th className="p-3 md:p-4 font-bold">Time In</th>
                                        <th className="p-3 md:p-4 font-bold">Time Out</th>
                                        <th className="p-3 md:p-4 font-bold text-center">Log Status</th>
                                        <th className="p-3 md:p-4 font-bold">Assigned IC</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                    ) : (
                                        <tr><td colSpan="7" className="p-8 text-center text-slate-400">No records found for this date.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            );
        };
                                </tbody>
        const SurveysView = () => {
            const [surveys, setSurveys] = useState([]);
            const [companies, setCompanies] = useState([]);
            const [loading, setLoading] = useState(true);
                                                            <td className="p-3 md:p-4 text-xs font-bold text-slate-500">{record.status}</td>
            // Form States
            const [isFormOpen, setIsFormOpen] = useState(false);
            const [editingId, setEditingId] = useState(null);
            const [title, setTitle] = useState('');
            const [description, setDescription] = useState('');
            const [questions, setQuestions] = useState([]);
            const [viewableFrom, setViewableFrom] = useState('');
            const [viewableUntil, setViewableUntil] = useState('');
            const [targetCompanies, setTargetCompanies] = useState(['All']);
            const [companySearchTerm, setCompanySearchTerm] = useState('');
                                                            <td className="p-4 text-sm text-slate-500 italic">{record.ic}</td>
            // --- NEW: Submissions State ---
            const [viewingSubmissions, setViewingSubmissions] = useState(null);
            const [submissions, setSubmissions] = useState([]);
            const [loadingSubmissions, setLoadingSubmissions] = useState(false);
                                                    )}
            useEffect(() => {
                const APP_ID = "dualtech-ojt-portal";
                                        }
// MISSING LINE 1461
// MISSING LINE 1462
// MISSING LINE 1463
// MISSING LINE 1464
// MISSING LINE 1465
// MISSING LINE 1466
// MISSING LINE 1467
// MISSING LINE 1468
// MISSING LINE 1469
// MISSING LINE 1470
// MISSING LINE 1471
// MISSING LINE 1472
// MISSING LINE 1473
// MISSING LINE 1474
// MISSING LINE 1475
// MISSING LINE 1476
// MISSING LINE 1477
// MISSING LINE 1478
// MISSING LINE 1479
// MISSING LINE 1480
// MISSING LINE 1481
// MISSING LINE 1482
// MISSING LINE 1483
// MISSING LINE 1484
// MISSING LINE 1485
// MISSING LINE 1486
// MISSING LINE 1487
// MISSING LINE 1488
// MISSING LINE 1489
            const [viewableFrom, setViewableFrom] = useState('');
            const [viewableUntil, setViewableUntil] = useState('');
            const [targetCompanies, setTargetCompanies] = useState(['All']);
            const [companySearchTerm, setCompanySearchTerm] = useState('');

            // --- NEW: Submissions State ---
            const [viewingSubmissions, setViewingSubmissions] = useState(null);
            const [submissions, setSubmissions] = useState([]);
            const [loadingSubmissions, setLoadingSubmissions] = useState(false);

            useEffect(() => {
                const APP_ID = "dualtech-ojt-portal";

                // 1. Fetch Surveys
                const unsubscribe = db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('surveys')
                    .orderBy('createdAt', 'desc')
                    .onSnapshot(snapshot => {
                        const surveyData = [];
                        snapshot.forEach(doc => surveyData.push({ id: doc.id, ...doc.data() }));
                        setSurveys(surveyData);
                        setLoading(false);
                    });

                // 2. Fetch Companies for Dropdown
                db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('trainees').get()
                    .then(snap => {
                        let activeCompanySet = new Set();
                        snap.forEach(doc => {
                            const data = doc.data();
                            if (data.status === 'Active' && (data.company || data.companyName)) {
                                activeCompanySet.add(data.company || data.companyName);
                            }
                        });
                        setCompanies(Array.from(activeCompanySet).sort());
                    });

                return () => unsubscribe();
            }, []);

            // --- NEW: Fetch & Delete Submissions Logic ---
            const openSubmissions = async (survey) => {
// MISSING LINE 1531
// MISSING LINE 1532
// MISSING LINE 1533
// MISSING LINE 1534
// MISSING LINE 1535
// MISSING LINE 1536
// MISSING LINE 1537
// MISSING LINE 1538
// MISSING LINE 1539
// MISSING LINE 1540
// MISSING LINE 1541
// MISSING LINE 1542
// MISSING LINE 1543
// MISSING LINE 1544
// MISSING LINE 1545
// MISSING LINE 1546
// MISSING LINE 1547
// MISSING LINE 1548
// MISSING LINE 1549
// MISSING LINE 1550
// MISSING LINE 1551
// MISSING LINE 1552
// MISSING LINE 1553
// MISSING LINE 1554
// MISSING LINE 1555
// MISSING LINE 1556
// MISSING LINE 1557
// MISSING LINE 1558
// MISSING LINE 1559
// MISSING LINE 1560
// MISSING LINE 1561
// MISSING LINE 1562
// MISSING LINE 1563
// MISSING LINE 1564
// MISSING LINE 1565
// MISSING LINE 1566
// MISSING LINE 1567
// MISSING LINE 1568
// MISSING LINE 1569
// MISSING LINE 1570
// MISSING LINE 1571
// MISSING LINE 1572
// MISSING LINE 1573
// MISSING LINE 1574
// MISSING LINE 1575
// MISSING LINE 1576
// MISSING LINE 1577
// MISSING LINE 1578
// MISSING LINE 1579
// MISSING LINE 1580
// MISSING LINE 1581
// MISSING LINE 1582
// MISSING LINE 1583
// MISSING LINE 1584
// MISSING LINE 1585
// MISSING LINE 1586
// MISSING LINE 1587
// MISSING LINE 1588
// MISSING LINE 1589
// MISSING LINE 1590
// MISSING LINE 1591
// MISSING LINE 1592
// MISSING LINE 1593
// MISSING LINE 1594
// MISSING LINE 1595
// MISSING LINE 1596
// MISSING LINE 1597
// MISSING LINE 1598
// MISSING LINE 1599
// MISSING LINE 1600
// MISSING LINE 1601
// MISSING LINE 1602
// MISSING LINE 1603
// MISSING LINE 1604
// MISSING LINE 1605
// MISSING LINE 1606
// MISSING LINE 1607
// MISSING LINE 1608
// MISSING LINE 1609
// MISSING LINE 1610
// MISSING LINE 1611
// MISSING LINE 1612
// MISSING LINE 1613
// MISSING LINE 1614
// MISSING LINE 1615
// MISSING LINE 1616
// MISSING LINE 1617
// MISSING LINE 1618
// MISSING LINE 1619
// MISSING LINE 1620
// MISSING LINE 1621
// MISSING LINE 1622
// MISSING LINE 1623
// MISSING LINE 1624
// MISSING LINE 1625
// MISSING LINE 1626
// MISSING LINE 1627
// MISSING LINE 1628
// MISSING LINE 1629
// MISSING LINE 1630
// MISSING LINE 1631
// MISSING LINE 1632
// MISSING LINE 1633
// MISSING LINE 1634
// MISSING LINE 1635
// MISSING LINE 1636
// MISSING LINE 1637
// MISSING LINE 1638
// MISSING LINE 1639
// MISSING LINE 1640
// MISSING LINE 1641
// MISSING LINE 1642
// MISSING LINE 1643
// MISSING LINE 1644
// MISSING LINE 1645
// MISSING LINE 1646
// MISSING LINE 1647
// MISSING LINE 1648
// MISSING LINE 1649
// MISSING LINE 1650
// MISSING LINE 1651
// MISSING LINE 1652
// MISSING LINE 1653
// MISSING LINE 1654
// MISSING LINE 1655
// MISSING LINE 1656
// MISSING LINE 1657
// MISSING LINE 1658
// MISSING LINE 1659
// MISSING LINE 1660
// MISSING LINE 1661
// MISSING LINE 1662
// MISSING LINE 1663
// MISSING LINE 1664
// MISSING LINE 1665
// MISSING LINE 1666
// MISSING LINE 1667
// MISSING LINE 1668
// MISSING LINE 1669
// MISSING LINE 1670
// MISSING LINE 1671
// MISSING LINE 1672
// MISSING LINE 1673
// MISSING LINE 1674
// MISSING LINE 1675
// MISSING LINE 1676
// MISSING LINE 1677
// MISSING LINE 1678
// MISSING LINE 1679
// MISSING LINE 1680
// MISSING LINE 1681
// MISSING LINE 1682
// MISSING LINE 1683
// MISSING LINE 1684
// MISSING LINE 1685
// MISSING LINE 1686
// MISSING LINE 1687
// MISSING LINE 1688
// MISSING LINE 1689
// MISSING LINE 1690
// MISSING LINE 1691
// MISSING LINE 1692
// MISSING LINE 1693
// MISSING LINE 1694
// MISSING LINE 1695
// MISSING LINE 1696
// MISSING LINE 1697
// MISSING LINE 1698
// MISSING LINE 1699
// MISSING LINE 1700
// MISSING LINE 1701
// MISSING LINE 1702
// MISSING LINE 1703
// MISSING LINE 1704
// MISSING LINE 1705
// MISSING LINE 1706
// MISSING LINE 1707
// MISSING LINE 1708
// MISSING LINE 1709
// MISSING LINE 1710
// MISSING LINE 1711
// MISSING LINE 1712
// MISSING LINE 1713
// MISSING LINE 1714
// MISSING LINE 1715
// MISSING LINE 1716
// MISSING LINE 1717
// MISSING LINE 1718
// MISSING LINE 1719
// MISSING LINE 1720
// MISSING LINE 1721
// MISSING LINE 1722
// MISSING LINE 1723
// MISSING LINE 1724
// MISSING LINE 1725
// MISSING LINE 1726
// MISSING LINE 1727
// MISSING LINE 1728
// MISSING LINE 1729
// MISSING LINE 1730
// MISSING LINE 1731
// MISSING LINE 1732
// MISSING LINE 1733
// MISSING LINE 1734
// MISSING LINE 1735
// MISSING LINE 1736
// MISSING LINE 1737
// MISSING LINE 1738
// MISSING LINE 1739
// MISSING LINE 1740
// MISSING LINE 1741
// MISSING LINE 1742
// MISSING LINE 1743
// MISSING LINE 1744
// MISSING LINE 1745
// MISSING LINE 1746
// MISSING LINE 1747
// MISSING LINE 1748
// MISSING LINE 1749
// MISSING LINE 1750
// MISSING LINE 1751
// MISSING LINE 1752
// MISSING LINE 1753
// MISSING LINE 1754
// MISSING LINE 1755
// MISSING LINE 1756
// MISSING LINE 1757
// MISSING LINE 1758
// MISSING LINE 1759
// MISSING LINE 1760
// MISSING LINE 1761
// MISSING LINE 1762
// MISSING LINE 1763
// MISSING LINE 1764
// MISSING LINE 1765
// MISSING LINE 1766
// MISSING LINE 1767
// MISSING LINE 1768
// MISSING LINE 1769
// MISSING LINE 1770
// MISSING LINE 1771
// MISSING LINE 1772
// MISSING LINE 1773
// MISSING LINE 1774
// MISSING LINE 1775
// MISSING LINE 1776
// MISSING LINE 1777
// MISSING LINE 1778
// MISSING LINE 1779
// MISSING LINE 1780
// MISSING LINE 1781
// MISSING LINE 1782
// MISSING LINE 1783
// MISSING LINE 1784
// MISSING LINE 1785
// MISSING LINE 1786
// MISSING LINE 1787
// MISSING LINE 1788
// MISSING LINE 1789
// MISSING LINE 1790
// MISSING LINE 1791
// MISSING LINE 1792
// MISSING LINE 1793
// MISSING LINE 1794
// MISSING LINE 1795
// MISSING LINE 1796
// MISSING LINE 1797
// MISSING LINE 1798
// MISSING LINE 1799
// MISSING LINE 1800
// MISSING LINE 1801
// MISSING LINE 1802
// MISSING LINE 1803
// MISSING LINE 1804
// MISSING LINE 1805
// MISSING LINE 1806
// MISSING LINE 1807
// MISSING LINE 1808
// MISSING LINE 1809
// MISSING LINE 1810
// MISSING LINE 1811
// MISSING LINE 1812
// MISSING LINE 1813
// MISSING LINE 1814
// MISSING LINE 1815
// MISSING LINE 1816
// MISSING LINE 1817
// MISSING LINE 1818
// MISSING LINE 1819
// MISSING LINE 1820
// MISSING LINE 1821
// MISSING LINE 1822
// MISSING LINE 1823
// MISSING LINE 1824
// MISSING LINE 1825
// MISSING LINE 1826
// MISSING LINE 1827
// MISSING LINE 1828
// MISSING LINE 1829
// MISSING LINE 1830
// MISSING LINE 1831
// MISSING LINE 1832
// MISSING LINE 1833
// MISSING LINE 1834
// MISSING LINE 1835
// MISSING LINE 1836
// MISSING LINE 1837
// MISSING LINE 1838
// MISSING LINE 1839
// MISSING LINE 1840
// MISSING LINE 1841
// MISSING LINE 1842
// MISSING LINE 1843
// MISSING LINE 1844
// MISSING LINE 1845
// MISSING LINE 1846
// MISSING LINE 1847
// MISSING LINE 1848
// MISSING LINE 1849
// MISSING LINE 1850
// MISSING LINE 1851
// MISSING LINE 1852
// MISSING LINE 1853
// MISSING LINE 1854
// MISSING LINE 1855
// MISSING LINE 1856
// MISSING LINE 1857
// MISSING LINE 1858
// MISSING LINE 1859
// MISSING LINE 1860
// MISSING LINE 1861
// MISSING LINE 1862
// MISSING LINE 1863
// MISSING LINE 1864
// MISSING LINE 1865
// MISSING LINE 1866
// MISSING LINE 1867
// MISSING LINE 1868
// MISSING LINE 1869
// MISSING LINE 1870
// MISSING LINE 1871
// MISSING LINE 1872
// MISSING LINE 1873
// MISSING LINE 1874
// MISSING LINE 1875
// MISSING LINE 1876
// MISSING LINE 1877
// MISSING LINE 1878
// MISSING LINE 1879
// MISSING LINE 1880
// MISSING LINE 1881
// MISSING LINE 1882
// MISSING LINE 1883
// MISSING LINE 1884
// MISSING LINE 1885
// MISSING LINE 1886
// MISSING LINE 1887
// MISSING LINE 1888
// MISSING LINE 1889
// MISSING LINE 1890
// MISSING LINE 1891
// MISSING LINE 1892
// MISSING LINE 1893
// MISSING LINE 1894
// MISSING LINE 1895
// MISSING LINE 1896
// MISSING LINE 1897
// MISSING LINE 1898
// MISSING LINE 1899
// MISSING LINE 1900
// MISSING LINE 1901
// MISSING LINE 1902
// MISSING LINE 1903
// MISSING LINE 1904
// MISSING LINE 1905
// MISSING LINE 1906
// MISSING LINE 1907
// MISSING LINE 1908
// MISSING LINE 1909
// MISSING LINE 1910
// MISSING LINE 1911
// MISSING LINE 1912
// MISSING LINE 1913
// MISSING LINE 1914
// MISSING LINE 1915
// MISSING LINE 1916
// MISSING LINE 1917
// MISSING LINE 1918
// MISSING LINE 1919
// MISSING LINE 1920
// MISSING LINE 1921
// MISSING LINE 1922
// MISSING LINE 1923
// MISSING LINE 1924
// MISSING LINE 1925
// MISSING LINE 1926
// MISSING LINE 1927
// MISSING LINE 1928
// MISSING LINE 1929
            };

            const [statusUpdate, setStatusUpdate] = useState('');
            const [adminNote, setAdminNote] = useState('');
            const [updating, setUpdating] = useState(false);

            const [senderFilter, setSenderFilter] = useState('All');

            useEffect(() => {
                const APP_ID = "dualtech-ojt-portal";
                const unsubscribe = db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('concerns')
                    .orderBy('createdAt', 'desc')
                    .onSnapshot(snapshot => {
                        const data = [];
                        snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
                        setConcerns(data);
                        setLoading(false);
                    }, error => {
                        // Add this error callback to see if Firebase is blocking the read!
                        console.error("Firebase Snapshot Error:", error);
                        alert("Error loading concerns: " + error.message);
// MISSING LINE 1951
// MISSING LINE 1952
// MISSING LINE 1953
// MISSING LINE 1954
// MISSING LINE 1955
// MISSING LINE 1956
// MISSING LINE 1957
// MISSING LINE 1958
// MISSING LINE 1959
// MISSING LINE 1960
// MISSING LINE 1961
// MISSING LINE 1962
// MISSING LINE 1963
// MISSING LINE 1964
// MISSING LINE 1965
// MISSING LINE 1966
// MISSING LINE 1967
// MISSING LINE 1968
// MISSING LINE 1969
// MISSING LINE 1970
// MISSING LINE 1971
// MISSING LINE 1972
// MISSING LINE 1973
// MISSING LINE 1974
// MISSING LINE 1975
// MISSING LINE 1976
// MISSING LINE 1977
// MISSING LINE 1978
// MISSING LINE 1979
// MISSING LINE 1980
// MISSING LINE 1981
// MISSING LINE 1982
// MISSING LINE 1983
// MISSING LINE 1984
// MISSING LINE 1985
// MISSING LINE 1986
// MISSING LINE 1987
// MISSING LINE 1988
// MISSING LINE 1989
// MISSING LINE 1990
// MISSING LINE 1991
// MISSING LINE 1992
// MISSING LINE 1993
// MISSING LINE 1994
// MISSING LINE 1995
// MISSING LINE 1996
// MISSING LINE 1997
// MISSING LINE 1998
// MISSING LINE 1999
// MISSING LINE 2000
// MISSING LINE 2001
// MISSING LINE 2002
// MISSING LINE 2003
// MISSING LINE 2004
// MISSING LINE 2005
// MISSING LINE 2006
// MISSING LINE 2007
// MISSING LINE 2008
// MISSING LINE 2009
// MISSING LINE 2010
// MISSING LINE 2011
// MISSING LINE 2012
// MISSING LINE 2013
// MISSING LINE 2014
// MISSING LINE 2015
// MISSING LINE 2016
// MISSING LINE 2017
// MISSING LINE 2018
// MISSING LINE 2019
// MISSING LINE 2020
// MISSING LINE 2021
// MISSING LINE 2022
// MISSING LINE 2023
// MISSING LINE 2024
// MISSING LINE 2025
// MISSING LINE 2026
// MISSING LINE 2027
// MISSING LINE 2028
// MISSING LINE 2029
// MISSING LINE 2030
// MISSING LINE 2031
// MISSING LINE 2032
// MISSING LINE 2033
// MISSING LINE 2034
// MISSING LINE 2035
// MISSING LINE 2036
// MISSING LINE 2037
// MISSING LINE 2038
// MISSING LINE 2039
// MISSING LINE 2040
// MISSING LINE 2041
// MISSING LINE 2042
// MISSING LINE 2043
// MISSING LINE 2044
// MISSING LINE 2045
// MISSING LINE 2046
// MISSING LINE 2047
// MISSING LINE 2048
// MISSING LINE 2049
// MISSING LINE 2050
// MISSING LINE 2051
// MISSING LINE 2052
// MISSING LINE 2053
// MISSING LINE 2054
// MISSING LINE 2055
// MISSING LINE 2056
// MISSING LINE 2057
// MISSING LINE 2058
// MISSING LINE 2059
// MISSING LINE 2060
// MISSING LINE 2061
// MISSING LINE 2062
// MISSING LINE 2063
// MISSING LINE 2064
// MISSING LINE 2065
// MISSING LINE 2066
// MISSING LINE 2067
// MISSING LINE 2068
// MISSING LINE 2069
// MISSING LINE 2070
// MISSING LINE 2071
// MISSING LINE 2072
// MISSING LINE 2073
// MISSING LINE 2074
// MISSING LINE 2075
// MISSING LINE 2076
// MISSING LINE 2077
// MISSING LINE 2078
// MISSING LINE 2079
// MISSING LINE 2080
// MISSING LINE 2081
// MISSING LINE 2082
// MISSING LINE 2083
// MISSING LINE 2084
// MISSING LINE 2085
// MISSING LINE 2086
// MISSING LINE 2087
// MISSING LINE 2088
// MISSING LINE 2089
// MISSING LINE 2090
// MISSING LINE 2091
// MISSING LINE 2092
// MISSING LINE 2093
// MISSING LINE 2094
// MISSING LINE 2095
// MISSING LINE 2096
// MISSING LINE 2097
// MISSING LINE 2098
// MISSING LINE 2099
// MISSING LINE 2100
// MISSING LINE 2101
// MISSING LINE 2102
// MISSING LINE 2103
// MISSING LINE 2104
// MISSING LINE 2105
// MISSING LINE 2106
// MISSING LINE 2107
// MISSING LINE 2108
// MISSING LINE 2109
// MISSING LINE 2110
// MISSING LINE 2111
// MISSING LINE 2112
// MISSING LINE 2113
// MISSING LINE 2114
// MISSING LINE 2115
// MISSING LINE 2116
// MISSING LINE 2117
// MISSING LINE 2118
// MISSING LINE 2119
// MISSING LINE 2120
// MISSING LINE 2121
// MISSING LINE 2122
// MISSING LINE 2123
// MISSING LINE 2124
// MISSING LINE 2125
// MISSING LINE 2126
// MISSING LINE 2127
// MISSING LINE 2128
// MISSING LINE 2129
// MISSING LINE 2130
// MISSING LINE 2131
// MISSING LINE 2132
// MISSING LINE 2133
// MISSING LINE 2134
// MISSING LINE 2135
// MISSING LINE 2136
// MISSING LINE 2137
// MISSING LINE 2138
// MISSING LINE 2139
// MISSING LINE 2140
// MISSING LINE 2141
// MISSING LINE 2142
// MISSING LINE 2143
// MISSING LINE 2144
// MISSING LINE 2145
// MISSING LINE 2146
// MISSING LINE 2147
// MISSING LINE 2148
// MISSING LINE 2149
// MISSING LINE 2150
// MISSING LINE 2151
// MISSING LINE 2152
// MISSING LINE 2153
// MISSING LINE 2154
// MISSING LINE 2155
// MISSING LINE 2156
// MISSING LINE 2157
// MISSING LINE 2158
// MISSING LINE 2159
// MISSING LINE 2160
// MISSING LINE 2161
// MISSING LINE 2162
// MISSING LINE 2163
// MISSING LINE 2164
// MISSING LINE 2165
// MISSING LINE 2166
// MISSING LINE 2167
// MISSING LINE 2168
// MISSING LINE 2169
// MISSING LINE 2170
// MISSING LINE 2171
// MISSING LINE 2172
// MISSING LINE 2173
// MISSING LINE 2174
// MISSING LINE 2175
// MISSING LINE 2176
// MISSING LINE 2177
// MISSING LINE 2178
// MISSING LINE 2179
// MISSING LINE 2180
// MISSING LINE 2181
// MISSING LINE 2182
// MISSING LINE 2183
// MISSING LINE 2184
// MISSING LINE 2185
// MISSING LINE 2186
// MISSING LINE 2187
// MISSING LINE 2188
// MISSING LINE 2189
// MISSING LINE 2190
// MISSING LINE 2191
// MISSING LINE 2192
// MISSING LINE 2193
// MISSING LINE 2194
// MISSING LINE 2195
// MISSING LINE 2196
// MISSING LINE 2197
// MISSING LINE 2198
// MISSING LINE 2199
// MISSING LINE 2200
// MISSING LINE 2201
// MISSING LINE 2202
// MISSING LINE 2203
// MISSING LINE 2204
// MISSING LINE 2205
// MISSING LINE 2206
// MISSING LINE 2207
// MISSING LINE 2208
// MISSING LINE 2209
// MISSING LINE 2210
// MISSING LINE 2211
// MISSING LINE 2212
// MISSING LINE 2213
// MISSING LINE 2214
// MISSING LINE 2215
// MISSING LINE 2216
// MISSING LINE 2217
// MISSING LINE 2218
// MISSING LINE 2219
// MISSING LINE 2220
// MISSING LINE 2221
// MISSING LINE 2222
// MISSING LINE 2223
// MISSING LINE 2224
// MISSING LINE 2225
// MISSING LINE 2226
// MISSING LINE 2227
// MISSING LINE 2228
// MISSING LINE 2229
// MISSING LINE 2230
// MISSING LINE 2231
// MISSING LINE 2232
// MISSING LINE 2233
// MISSING LINE 2234
// MISSING LINE 2235
// MISSING LINE 2236
// MISSING LINE 2237
// MISSING LINE 2238
// MISSING LINE 2239
// MISSING LINE 2240
// MISSING LINE 2241
// MISSING LINE 2242
// MISSING LINE 2243
// MISSING LINE 2244
// MISSING LINE 2245
// MISSING LINE 2246
// MISSING LINE 2247
// MISSING LINE 2248
// MISSING LINE 2249
// MISSING LINE 2250
// MISSING LINE 2251
// MISSING LINE 2252
// MISSING LINE 2253
// MISSING LINE 2254
// MISSING LINE 2255
// MISSING LINE 2256
// MISSING LINE 2257
// MISSING LINE 2258
// MISSING LINE 2259
// MISSING LINE 2260
// MISSING LINE 2261
// MISSING LINE 2262
// MISSING LINE 2263
// MISSING LINE 2264
// MISSING LINE 2265
// MISSING LINE 2266
// MISSING LINE 2267
// MISSING LINE 2268
// MISSING LINE 2269
// MISSING LINE 2270
// MISSING LINE 2271
// MISSING LINE 2272
// MISSING LINE 2273
// MISSING LINE 2274
// MISSING LINE 2275
// MISSING LINE 2276
// MISSING LINE 2277
// MISSING LINE 2278
// MISSING LINE 2279
// MISSING LINE 2280
// MISSING LINE 2281
// MISSING LINE 2282
// MISSING LINE 2283
// MISSING LINE 2284
// MISSING LINE 2285
// MISSING LINE 2286
// MISSING LINE 2287
// MISSING LINE 2288
// MISSING LINE 2289
// MISSING LINE 2290
// MISSING LINE 2291
// MISSING LINE 2292
// MISSING LINE 2293
// MISSING LINE 2294
// MISSING LINE 2295
// MISSING LINE 2296
// MISSING LINE 2297
// MISSING LINE 2298
// MISSING LINE 2299
// MISSING LINE 2300
// MISSING LINE 2301
// MISSING LINE 2302
// MISSING LINE 2303
// MISSING LINE 2304
// MISSING LINE 2305
// MISSING LINE 2306
// MISSING LINE 2307
// MISSING LINE 2308
// MISSING LINE 2309
// MISSING LINE 2310
// MISSING LINE 2311
// MISSING LINE 2312
// MISSING LINE 2313
// MISSING LINE 2314
// MISSING LINE 2315
// MISSING LINE 2316
// MISSING LINE 2317
// MISSING LINE 2318
// MISSING LINE 2319
// MISSING LINE 2320
// MISSING LINE 2321
// MISSING LINE 2322
// MISSING LINE 2323
// MISSING LINE 2324
// MISSING LINE 2325
// MISSING LINE 2326
// MISSING LINE 2327
// MISSING LINE 2328
// MISSING LINE 2329
// MISSING LINE 2330
// MISSING LINE 2331
// MISSING LINE 2332
// MISSING LINE 2333
// MISSING LINE 2334
// MISSING LINE 2335
// MISSING LINE 2336
// MISSING LINE 2337
// MISSING LINE 2338
// MISSING LINE 2339
// MISSING LINE 2340
// MISSING LINE 2341
// MISSING LINE 2342
// MISSING LINE 2343
// MISSING LINE 2344
// MISSING LINE 2345
// MISSING LINE 2346
// MISSING LINE 2347
// MISSING LINE 2348
// MISSING LINE 2349
// MISSING LINE 2350
// MISSING LINE 2351
// MISSING LINE 2352
// MISSING LINE 2353
// MISSING LINE 2354
// MISSING LINE 2355
// MISSING LINE 2356
// MISSING LINE 2357
// MISSING LINE 2358
// MISSING LINE 2359
// MISSING LINE 2360
// MISSING LINE 2361
// MISSING LINE 2362
// MISSING LINE 2363
// MISSING LINE 2364
// MISSING LINE 2365
// MISSING LINE 2366
// MISSING LINE 2367
// MISSING LINE 2368
// MISSING LINE 2369
// MISSING LINE 2370
// MISSING LINE 2371
// MISSING LINE 2372
// MISSING LINE 2373
// MISSING LINE 2374
// MISSING LINE 2375
// MISSING LINE 2376
// MISSING LINE 2377
// MISSING LINE 2378
// MISSING LINE 2379
// MISSING LINE 2380
// MISSING LINE 2381
// MISSING LINE 2382
// MISSING LINE 2383
// MISSING LINE 2384
// MISSING LINE 2385
// MISSING LINE 2386
// MISSING LINE 2387
// MISSING LINE 2388
// MISSING LINE 2389
// MISSING LINE 2390
// MISSING LINE 2391
// MISSING LINE 2392
// MISSING LINE 2393
// MISSING LINE 2394
// MISSING LINE 2395
// MISSING LINE 2396
// MISSING LINE 2397
// MISSING LINE 2398
// MISSING LINE 2399
// MISSING LINE 2400
// MISSING LINE 2401
// MISSING LINE 2402
// MISSING LINE 2403
// MISSING LINE 2404
// MISSING LINE 2405
// MISSING LINE 2406
// MISSING LINE 2407
// MISSING LINE 2408
// MISSING LINE 2409
// MISSING LINE 2410
// MISSING LINE 2411
// MISSING LINE 2412
// MISSING LINE 2413
// MISSING LINE 2414
// MISSING LINE 2415
// MISSING LINE 2416
// MISSING LINE 2417
// MISSING LINE 2418
// MISSING LINE 2419
// MISSING LINE 2420
// MISSING LINE 2421
// MISSING LINE 2422
// MISSING LINE 2423
// MISSING LINE 2424
// MISSING LINE 2425
// MISSING LINE 2426
// MISSING LINE 2427
// MISSING LINE 2428
// MISSING LINE 2429
// MISSING LINE 2430
// MISSING LINE 2431
// MISSING LINE 2432
// MISSING LINE 2433
// MISSING LINE 2434
// MISSING LINE 2435
// MISSING LINE 2436
// MISSING LINE 2437
// MISSING LINE 2438
// MISSING LINE 2439
// MISSING LINE 2440
// MISSING LINE 2441
// MISSING LINE 2442
// MISSING LINE 2443
// MISSING LINE 2444
// MISSING LINE 2445
// MISSING LINE 2446
// MISSING LINE 2447
// MISSING LINE 2448
// MISSING LINE 2449
// MISSING LINE 2450
// MISSING LINE 2451
// MISSING LINE 2452
// MISSING LINE 2453
// MISSING LINE 2454
// MISSING LINE 2455
// MISSING LINE 2456
// MISSING LINE 2457
// MISSING LINE 2458
// MISSING LINE 2459
// MISSING LINE 2460
// MISSING LINE 2461
// MISSING LINE 2462
// MISSING LINE 2463
// MISSING LINE 2464
// MISSING LINE 2465
// MISSING LINE 2466
// MISSING LINE 2467
// MISSING LINE 2468
// MISSING LINE 2469
// MISSING LINE 2470
// MISSING LINE 2471
// MISSING LINE 2472
// MISSING LINE 2473
// MISSING LINE 2474
// MISSING LINE 2475
// MISSING LINE 2476
// MISSING LINE 2477
// MISSING LINE 2478
// MISSING LINE 2479
// MISSING LINE 2480
// MISSING LINE 2481
// MISSING LINE 2482
// MISSING LINE 2483
// MISSING LINE 2484
// MISSING LINE 2485
// MISSING LINE 2486
// MISSING LINE 2487
// MISSING LINE 2488
// MISSING LINE 2489
// MISSING LINE 2490
// MISSING LINE 2491
// MISSING LINE 2492
// MISSING LINE 2493
// MISSING LINE 2494
// MISSING LINE 2495
// MISSING LINE 2496
// MISSING LINE 2497
// MISSING LINE 2498
// MISSING LINE 2499
// MISSING LINE 2500
// MISSING LINE 2501
// MISSING LINE 2502
// MISSING LINE 2503
// MISSING LINE 2504
// MISSING LINE 2505
// MISSING LINE 2506
// MISSING LINE 2507
// MISSING LINE 2508
// MISSING LINE 2509
// MISSING LINE 2510
// MISSING LINE 2511
// MISSING LINE 2512
// MISSING LINE 2513
// MISSING LINE 2514
// MISSING LINE 2515
// MISSING LINE 2516
// MISSING LINE 2517
// MISSING LINE 2518
// MISSING LINE 2519
// MISSING LINE 2520
// MISSING LINE 2521
// MISSING LINE 2522
// MISSING LINE 2523
// MISSING LINE 2524
// MISSING LINE 2525
// MISSING LINE 2526
// MISSING LINE 2527
// MISSING LINE 2528
// MISSING LINE 2529
// MISSING LINE 2530
// MISSING LINE 2531
// MISSING LINE 2532
// MISSING LINE 2533
// MISSING LINE 2534
// MISSING LINE 2535
// MISSING LINE 2536
// MISSING LINE 2537
// MISSING LINE 2538
// MISSING LINE 2539
// MISSING LINE 2540
// MISSING LINE 2541
// MISSING LINE 2542
// MISSING LINE 2543
// MISSING LINE 2544
// MISSING LINE 2545
// MISSING LINE 2546
// MISSING LINE 2547
// MISSING LINE 2548
// MISSING LINE 2549
// MISSING LINE 2550
// MISSING LINE 2551
// MISSING LINE 2552
// MISSING LINE 2553
// MISSING LINE 2554
// MISSING LINE 2555
// MISSING LINE 2556
// MISSING LINE 2557
// MISSING LINE 2558
// MISSING LINE 2559
                        'Assigned IC': t.assignedIC || t.icName || t.Coordinator || 'N/A',
                        'IPT Date Start': t.iptDateStart || t['IPT Date Start'] || t.startDate || 'N/A',
                        'IPT Date End': t.iptDateEnd || t['IPT Date End'] || t.endDate || 'N/A',
                        'Schooling Venue': t.schoolingHub || t.hub || t.venue || t.schoolingVenue || 'N/A',
                        'Weeks Since IPT Started': t.totalWeeks,
                        'Valid Weeks': t.validSchoolingCount,
                        'Weeks Lacking': t.lacking,
                        'Portal Registration': t.registeredAt || t.isRegistered || t.uid ? 'Registered' : 'No'
                    };

                    const rowArr = headers.map(h => rowData[h] !== undefined && rowData[h] !== null ? rowData[h] : '');
                    const bg = i % 2 === 0 ? '#ffffff' : '#f8fafc';
                    htmlTable += `<tr style="background-color: ${bg};">${rowArr.map(cell => `<td style="border: 1px solid #ccc; mso-number-format:'\\@';">${cell}</td>`).join('')}</tr>`;
                });

                const template = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"></head><body><table>${htmlTable}</table></body></html>`;
                const blob = new Blob([template], { type: 'application/vnd.ms-excel;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `ASTP_Schooling_${selectedSubGroup}_${new Date().getTime()}.xls`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            };

            return (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="mb-8">
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white">ASTP Schooling Dashboard</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Active & Completed IPT Trainees categorized by months since IPT start.</p>
                    </div>

                    {loading ? (
                        <div className="text-center p-10 font-bold text-slate-500 dark:text-slate-400">Loading Dashboard...</div>
                    ) : (
                        <div className="space-y-8">
                            {/* MAIN GRAPH */}
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-6 uppercase tracking-wider text-xs">Distribution by Months Since IPT Start</h3>
                                <div className="space-y-3">
                                    {mainCategories.map(cat => {
                                        const count = (groupedTrainees[cat] || []).length;
                                        const percentage = (count / maxMainValue) * 100;
                                        const isSelected = selectedMonth === cat;
                                        if (count === 0 && !isSelected) return null;

                                        return (
                                            <div key={cat} className="group relative">
                                                <div className="flex items-center gap-4 cursor-pointer" onClick={() => handleMainBarClick(cat)}>
                                                    <div className="w-24 text-right text-xs font-bold text-slate-500 dark:text-slate-400">{cat}</div>
                                                    <div className="flex-1 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden relative">
                                                        <div
                                                            className={`h-full transition-all duration-500 ease-out ${isSelected ? 'bg-primary-600' : 'bg-primary-400 group-hover:bg-primary-500'}`}
                                                            style={{ width: `${percentage}%` }}
                                                        ></div>
                                                    </div>
                                                    <div className="w-12 text-left text-sm font-black text-slate-700 dark:text-slate-300">{count}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* TABLE DATA directly shown after clicking main graph */}
                            {selectedSubGroup && (
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm animate-in fade-in overflow-hidden">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Trainees in "{selectedSubGroup}"</h3>
                                            {loadingSubGraph && (
                                                <p className="text-sm font-bold text-amber-500 animate-pulse mt-1">Fetching attendance records...</p>
                                            )}
                                        </div>
                                        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                                            <div className="relative w-full md:w-64">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Icon name="search" size={14} className="text-slate-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Search Name, Company, IC..."
                                                    value={searchQuery}
                                                    onChange={e => setSearchQuery(e.target.value)}
                                                    className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 w-full transition"
                                                />
                                            </div>
                                            <div className="flex gap-2 w-full md:w-auto">
                                                <div className="relative group flex-1 md:flex-none">
                                                    <button className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-600">
// MISSING LINE 2651
// MISSING LINE 2652
// MISSING LINE 2653
// MISSING LINE 2654
// MISSING LINE 2655
// MISSING LINE 2656
// MISSING LINE 2657
// MISSING LINE 2658
// MISSING LINE 2659
// MISSING LINE 2660
// MISSING LINE 2661
// MISSING LINE 2662
// MISSING LINE 2663
// MISSING LINE 2664
// MISSING LINE 2665
// MISSING LINE 2666
// MISSING LINE 2667
// MISSING LINE 2668
// MISSING LINE 2669
// MISSING LINE 2670
// MISSING LINE 2671
// MISSING LINE 2672
// MISSING LINE 2673
// MISSING LINE 2674
// MISSING LINE 2675
// MISSING LINE 2676
// MISSING LINE 2677
// MISSING LINE 2678
// MISSING LINE 2679
// MISSING LINE 2680
// MISSING LINE 2681
// MISSING LINE 2682
// MISSING LINE 2683
// MISSING LINE 2684
// MISSING LINE 2685
// MISSING LINE 2686
// MISSING LINE 2687
// MISSING LINE 2688
// MISSING LINE 2689
// MISSING LINE 2690
// MISSING LINE 2691
// MISSING LINE 2692
// MISSING LINE 2693
// MISSING LINE 2694
// MISSING LINE 2695
// MISSING LINE 2696
// MISSING LINE 2697
// MISSING LINE 2698
// MISSING LINE 2699
// MISSING LINE 2700
// MISSING LINE 2701
// MISSING LINE 2702
// MISSING LINE 2703
// MISSING LINE 2704
// MISSING LINE 2705
// MISSING LINE 2706
// MISSING LINE 2707
// MISSING LINE 2708
// MISSING LINE 2709
// MISSING LINE 2710
// MISSING LINE 2711
// MISSING LINE 2712
// MISSING LINE 2713
// MISSING LINE 2714
// MISSING LINE 2715
// MISSING LINE 2716
// MISSING LINE 2717
// MISSING LINE 2718
// MISSING LINE 2719
// MISSING LINE 2720
// MISSING LINE 2721
// MISSING LINE 2722
// MISSING LINE 2723
// MISSING LINE 2724
// MISSING LINE 2725
// MISSING LINE 2726
// MISSING LINE 2727
// MISSING LINE 2728
// MISSING LINE 2729
// MISSING LINE 2730
// MISSING LINE 2731
// MISSING LINE 2732
// MISSING LINE 2733
// MISSING LINE 2734
// MISSING LINE 2735
// MISSING LINE 2736
// MISSING LINE 2737
// MISSING LINE 2738
// MISSING LINE 2739
// MISSING LINE 2740
// MISSING LINE 2741
// MISSING LINE 2742
// MISSING LINE 2743
// MISSING LINE 2744
// MISSING LINE 2745
// MISSING LINE 2746
// MISSING LINE 2747
// MISSING LINE 2748
// MISSING LINE 2749
// MISSING LINE 2750
// MISSING LINE 2751
// MISSING LINE 2752
// MISSING LINE 2753
// MISSING LINE 2754
// MISSING LINE 2755
// MISSING LINE 2756
// MISSING LINE 2757
// MISSING LINE 2758
// MISSING LINE 2759
// MISSING LINE 2760
// MISSING LINE 2761
// MISSING LINE 2762
// MISSING LINE 2763
// MISSING LINE 2764
// MISSING LINE 2765
// MISSING LINE 2766
// MISSING LINE 2767
// MISSING LINE 2768
// MISSING LINE 2769
// MISSING LINE 2770
// MISSING LINE 2771
// MISSING LINE 2772
// MISSING LINE 2773
// MISSING LINE 2774
// MISSING LINE 2775
// MISSING LINE 2776
// MISSING LINE 2777
// MISSING LINE 2778
// MISSING LINE 2779
// MISSING LINE 2780
// MISSING LINE 2781
// MISSING LINE 2782
// MISSING LINE 2783
// MISSING LINE 2784
// MISSING LINE 2785
// MISSING LINE 2786
// MISSING LINE 2787
// MISSING LINE 2788
// MISSING LINE 2789
// MISSING LINE 2790
// MISSING LINE 2791
// MISSING LINE 2792
// MISSING LINE 2793
// MISSING LINE 2794
// MISSING LINE 2795
// MISSING LINE 2796
// MISSING LINE 2797
// MISSING LINE 2798
// MISSING LINE 2799
// MISSING LINE 2800
// MISSING LINE 2801
// MISSING LINE 2802
// MISSING LINE 2803
// MISSING LINE 2804
// MISSING LINE 2805
// MISSING LINE 2806
// MISSING LINE 2807
// MISSING LINE 2808
// MISSING LINE 2809
// MISSING LINE 2810
// MISSING LINE 2811
// MISSING LINE 2812
// MISSING LINE 2813
// MISSING LINE 2814
// MISSING LINE 2815
// MISSING LINE 2816
// MISSING LINE 2817
// MISSING LINE 2818
// MISSING LINE 2819
// MISSING LINE 2820
// MISSING LINE 2821
// MISSING LINE 2822
// MISSING LINE 2823
// MISSING LINE 2824
// MISSING LINE 2825
// MISSING LINE 2826
// MISSING LINE 2827
// MISSING LINE 2828
// MISSING LINE 2829
// MISSING LINE 2830
// MISSING LINE 2831
// MISSING LINE 2832
// MISSING LINE 2833
// MISSING LINE 2834
// MISSING LINE 2835
// MISSING LINE 2836
// MISSING LINE 2837
// MISSING LINE 2838
// MISSING LINE 2839
// MISSING LINE 2840
// MISSING LINE 2841
// MISSING LINE 2842
// MISSING LINE 2843
// MISSING LINE 2844
// MISSING LINE 2845
// MISSING LINE 2846
// MISSING LINE 2847
// MISSING LINE 2848
// MISSING LINE 2849
// MISSING LINE 2850
// MISSING LINE 2851
// MISSING LINE 2852
// MISSING LINE 2853
// MISSING LINE 2854
// MISSING LINE 2855
// MISSING LINE 2856
// MISSING LINE 2857
// MISSING LINE 2858
// MISSING LINE 2859
// MISSING LINE 2860
// MISSING LINE 2861
// MISSING LINE 2862
// MISSING LINE 2863
// MISSING LINE 2864
// MISSING LINE 2865
// MISSING LINE 2866
// MISSING LINE 2867
// MISSING LINE 2868
// MISSING LINE 2869

            useEffect(() => {
                const APP_ID = "dualtech-ojt-portal";

                // 1. Fetch Announcements from Firestore
                const unsubscribe = db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('announcements')
                    .orderBy('createdAt', 'desc')
                    .onSnapshot(snapshot => {
                        const annData = [];
                        snapshot.forEach(doc => annData.push({ id: doc.id, ...doc.data() }));
                        setAnnouncements(annData);
                        setLoading(false);
                    }, error => {
                        console.error("Error loading announcements:", error);
                        setLoading(false);
                    });

                // 2. Fetch Companies List for Filtering Trainees
                db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('trainees').get()
                    .then(snap => {
                        let activeCompanySet = new Set();
// MISSING LINE 2891
// MISSING LINE 2892
// MISSING LINE 2893
// MISSING LINE 2894
// MISSING LINE 2895
// MISSING LINE 2896
// MISSING LINE 2897
// MISSING LINE 2898
// MISSING LINE 2899
// MISSING LINE 2900
// MISSING LINE 2901
// MISSING LINE 2902
// MISSING LINE 2903
// MISSING LINE 2904
// MISSING LINE 2905
// MISSING LINE 2906
// MISSING LINE 2907
// MISSING LINE 2908
// MISSING LINE 2909
// MISSING LINE 2910
// MISSING LINE 2911
// MISSING LINE 2912
// MISSING LINE 2913
// MISSING LINE 2914
// MISSING LINE 2915
// MISSING LINE 2916
// MISSING LINE 2917
// MISSING LINE 2918
// MISSING LINE 2919
// MISSING LINE 2920
// MISSING LINE 2921
// MISSING LINE 2922
// MISSING LINE 2923
// MISSING LINE 2924
// MISSING LINE 2925
// MISSING LINE 2926
// MISSING LINE 2927
// MISSING LINE 2928
// MISSING LINE 2929
// MISSING LINE 2930
// MISSING LINE 2931
// MISSING LINE 2932
// MISSING LINE 2933
// MISSING LINE 2934
// MISSING LINE 2935
// MISSING LINE 2936
// MISSING LINE 2937
// MISSING LINE 2938
// MISSING LINE 2939
// MISSING LINE 2940
// MISSING LINE 2941
// MISSING LINE 2942
// MISSING LINE 2943
// MISSING LINE 2944
// MISSING LINE 2945
// MISSING LINE 2946
// MISSING LINE 2947
// MISSING LINE 2948
// MISSING LINE 2949
// MISSING LINE 2950
// MISSING LINE 2951
// MISSING LINE 2952
// MISSING LINE 2953
// MISSING LINE 2954
// MISSING LINE 2955
// MISSING LINE 2956
// MISSING LINE 2957
// MISSING LINE 2958
// MISSING LINE 2959
// MISSING LINE 2960
// MISSING LINE 2961
// MISSING LINE 2962
// MISSING LINE 2963
// MISSING LINE 2964
// MISSING LINE 2965
// MISSING LINE 2966
// MISSING LINE 2967
// MISSING LINE 2968
// MISSING LINE 2969
// MISSING LINE 2970
// MISSING LINE 2971
// MISSING LINE 2972
// MISSING LINE 2973
// MISSING LINE 2974
// MISSING LINE 2975
// MISSING LINE 2976
// MISSING LINE 2977
// MISSING LINE 2978
// MISSING LINE 2979
// MISSING LINE 2980
// MISSING LINE 2981
// MISSING LINE 2982
// MISSING LINE 2983
// MISSING LINE 2984
// MISSING LINE 2985
// MISSING LINE 2986
// MISSING LINE 2987
// MISSING LINE 2988
// MISSING LINE 2989
// MISSING LINE 2990
// MISSING LINE 2991
// MISSING LINE 2992
// MISSING LINE 2993
// MISSING LINE 2994
// MISSING LINE 2995
// MISSING LINE 2996
// MISSING LINE 2997
// MISSING LINE 2998
// MISSING LINE 2999
// MISSING LINE 3000
// MISSING LINE 3001
// MISSING LINE 3002
// MISSING LINE 3003
// MISSING LINE 3004
// MISSING LINE 3005
// MISSING LINE 3006
// MISSING LINE 3007
// MISSING LINE 3008
// MISSING LINE 3009
// MISSING LINE 3010
// MISSING LINE 3011
// MISSING LINE 3012
// MISSING LINE 3013
// MISSING LINE 3014
// MISSING LINE 3015
// MISSING LINE 3016
// MISSING LINE 3017
// MISSING LINE 3018
// MISSING LINE 3019
// MISSING LINE 3020
// MISSING LINE 3021
// MISSING LINE 3022
// MISSING LINE 3023
// MISSING LINE 3024
// MISSING LINE 3025
// MISSING LINE 3026
// MISSING LINE 3027
// MISSING LINE 3028
// MISSING LINE 3029
// MISSING LINE 3030
// MISSING LINE 3031
// MISSING LINE 3032
// MISSING LINE 3033
// MISSING LINE 3034
// MISSING LINE 3035
// MISSING LINE 3036
// MISSING LINE 3037
// MISSING LINE 3038
// MISSING LINE 3039
// MISSING LINE 3040
// MISSING LINE 3041
// MISSING LINE 3042
// MISSING LINE 3043
// MISSING LINE 3044
// MISSING LINE 3045
// MISSING LINE 3046
// MISSING LINE 3047
// MISSING LINE 3048
// MISSING LINE 3049
// MISSING LINE 3050
// MISSING LINE 3051
// MISSING LINE 3052
// MISSING LINE 3053
// MISSING LINE 3054
// MISSING LINE 3055
// MISSING LINE 3056
// MISSING LINE 3057
// MISSING LINE 3058
// MISSING LINE 3059
// MISSING LINE 3060
// MISSING LINE 3061
// MISSING LINE 3062
// MISSING LINE 3063
// MISSING LINE 3064
// MISSING LINE 3065
// MISSING LINE 3066
// MISSING LINE 3067
// MISSING LINE 3068
// MISSING LINE 3069
// MISSING LINE 3070
// MISSING LINE 3071
// MISSING LINE 3072
// MISSING LINE 3073
// MISSING LINE 3074
// MISSING LINE 3075
// MISSING LINE 3076
// MISSING LINE 3077
// MISSING LINE 3078
// MISSING LINE 3079
// MISSING LINE 3080
// MISSING LINE 3081
// MISSING LINE 3082
// MISSING LINE 3083
// MISSING LINE 3084
// MISSING LINE 3085
// MISSING LINE 3086
// MISSING LINE 3087
// MISSING LINE 3088
// MISSING LINE 3089
// MISSING LINE 3090
// MISSING LINE 3091
// MISSING LINE 3092
// MISSING LINE 3093
// MISSING LINE 3094
// MISSING LINE 3095
// MISSING LINE 3096
// MISSING LINE 3097
// MISSING LINE 3098
// MISSING LINE 3099
// MISSING LINE 3100
// MISSING LINE 3101
// MISSING LINE 3102
// MISSING LINE 3103
// MISSING LINE 3104
// MISSING LINE 3105
// MISSING LINE 3106
// MISSING LINE 3107
// MISSING LINE 3108
// MISSING LINE 3109
// MISSING LINE 3110
// MISSING LINE 3111
// MISSING LINE 3112
// MISSING LINE 3113
// MISSING LINE 3114
// MISSING LINE 3115
// MISSING LINE 3116
// MISSING LINE 3117
// MISSING LINE 3118
// MISSING LINE 3119
// MISSING LINE 3120
// MISSING LINE 3121
// MISSING LINE 3122
// MISSING LINE 3123
// MISSING LINE 3124
// MISSING LINE 3125
// MISSING LINE 3126
// MISSING LINE 3127
// MISSING LINE 3128
// MISSING LINE 3129
// MISSING LINE 3130
// MISSING LINE 3131
// MISSING LINE 3132
// MISSING LINE 3133
// MISSING LINE 3134
// MISSING LINE 3135
// MISSING LINE 3136
// MISSING LINE 3137
// MISSING LINE 3138
// MISSING LINE 3139
// MISSING LINE 3140
// MISSING LINE 3141
// MISSING LINE 3142
// MISSING LINE 3143
// MISSING LINE 3144
// MISSING LINE 3145
// MISSING LINE 3146
// MISSING LINE 3147
// MISSING LINE 3148
// MISSING LINE 3149
// MISSING LINE 3150
// MISSING LINE 3151
// MISSING LINE 3152
// MISSING LINE 3153
// MISSING LINE 3154
// MISSING LINE 3155
// MISSING LINE 3156
// MISSING LINE 3157
// MISSING LINE 3158
// MISSING LINE 3159
// MISSING LINE 3160
// MISSING LINE 3161
// MISSING LINE 3162
// MISSING LINE 3163
// MISSING LINE 3164
// MISSING LINE 3165
// MISSING LINE 3166
// MISSING LINE 3167
// MISSING LINE 3168
// MISSING LINE 3169
// MISSING LINE 3170
// MISSING LINE 3171
// MISSING LINE 3172
// MISSING LINE 3173
// MISSING LINE 3174
// MISSING LINE 3175
// MISSING LINE 3176
// MISSING LINE 3177
// MISSING LINE 3178
// MISSING LINE 3179
// MISSING LINE 3180
// MISSING LINE 3181
// MISSING LINE 3182
// MISSING LINE 3183
// MISSING LINE 3184
// MISSING LINE 3185
// MISSING LINE 3186
// MISSING LINE 3187
// MISSING LINE 3188
// MISSING LINE 3189
// MISSING LINE 3190
// MISSING LINE 3191
// MISSING LINE 3192
// MISSING LINE 3193
// MISSING LINE 3194
// MISSING LINE 3195
// MISSING LINE 3196
// MISSING LINE 3197
// MISSING LINE 3198
// MISSING LINE 3199
// MISSING LINE 3200
// MISSING LINE 3201
// MISSING LINE 3202
// MISSING LINE 3203
// MISSING LINE 3204
// MISSING LINE 3205
// MISSING LINE 3206
// MISSING LINE 3207
// MISSING LINE 3208
// MISSING LINE 3209
// MISSING LINE 3210
// MISSING LINE 3211
// MISSING LINE 3212
// MISSING LINE 3213
// MISSING LINE 3214
// MISSING LINE 3215
// MISSING LINE 3216
// MISSING LINE 3217
// MISSING LINE 3218
// MISSING LINE 3219
// MISSING LINE 3220
// MISSING LINE 3221
// MISSING LINE 3222
// MISSING LINE 3223
// MISSING LINE 3224
// MISSING LINE 3225
// MISSING LINE 3226
// MISSING LINE 3227
// MISSING LINE 3228
// MISSING LINE 3229
// MISSING LINE 3230
// MISSING LINE 3231
// MISSING LINE 3232
// MISSING LINE 3233
// MISSING LINE 3234
// MISSING LINE 3235
// MISSING LINE 3236
// MISSING LINE 3237
// MISSING LINE 3238
// MISSING LINE 3239
// MISSING LINE 3240
// MISSING LINE 3241
// MISSING LINE 3242
// MISSING LINE 3243
// MISSING LINE 3244
// MISSING LINE 3245
// MISSING LINE 3246
// MISSING LINE 3247
// MISSING LINE 3248
// MISSING LINE 3249
// MISSING LINE 3250
// MISSING LINE 3251
// MISSING LINE 3252
// MISSING LINE 3253
// MISSING LINE 3254
// MISSING LINE 3255
// MISSING LINE 3256
// MISSING LINE 3257
// MISSING LINE 3258
// MISSING LINE 3259
// MISSING LINE 3260
// MISSING LINE 3261
// MISSING LINE 3262
// MISSING LINE 3263
// MISSING LINE 3264
// MISSING LINE 3265
// MISSING LINE 3266
// MISSING LINE 3267
// MISSING LINE 3268
// MISSING LINE 3269
// MISSING LINE 3270
// MISSING LINE 3271
// MISSING LINE 3272
// MISSING LINE 3273
// MISSING LINE 3274
// MISSING LINE 3275
// MISSING LINE 3276
// MISSING LINE 3277
// MISSING LINE 3278
// MISSING LINE 3279
// MISSING LINE 3280
// MISSING LINE 3281
// MISSING LINE 3282
// MISSING LINE 3283
// MISSING LINE 3284
// MISSING LINE 3285
// MISSING LINE 3286
// MISSING LINE 3287
// MISSING LINE 3288
// MISSING LINE 3289
// MISSING LINE 3290
// MISSING LINE 3291
// MISSING LINE 3292
// MISSING LINE 3293
// MISSING LINE 3294
// MISSING LINE 3295
// MISSING LINE 3296
// MISSING LINE 3297
// MISSING LINE 3298
// MISSING LINE 3299
// MISSING LINE 3300
// MISSING LINE 3301
// MISSING LINE 3302
// MISSING LINE 3303
// MISSING LINE 3304
// MISSING LINE 3305
// MISSING LINE 3306
// MISSING LINE 3307
// MISSING LINE 3308
// MISSING LINE 3309
// MISSING LINE 3310
// MISSING LINE 3311
// MISSING LINE 3312
// MISSING LINE 3313
// MISSING LINE 3314
// MISSING LINE 3315
// MISSING LINE 3316
// MISSING LINE 3317
// MISSING LINE 3318
// MISSING LINE 3319
// MISSING LINE 3320
// MISSING LINE 3321
// MISSING LINE 3322
// MISSING LINE 3323
// MISSING LINE 3324
// MISSING LINE 3325
                const unsubSettings = onSnapshot(settingsRef, (snap) => {
                    const settingsMap = {};
                    snap.docs.forEach(doc => { settingsMap[doc.id] = doc.data(); });
                    setCompanySettings(settingsMap);
                });

                const unsubHolidays = onSnapshot(holidaysRef, (docSnap) => {
                    setGlobalHolidays(docSnap.exists() && docSnap.data().holidays ? docSnap.data().holidays : []);
                });

                return () => { unsubSettings(); unsubHolidays(); };
            }, []);

            useEffect(() => {
                const traineesRef = collection(firestore, 'artifacts', appId, 'public', 'data', 'trainees');
                const unsub = onSnapshot(traineesRef, (snap) => {
                    let data = snap.docs.map(d => d.data()).filter(t => (t.status || 'Active').trim().toLowerCase() === 'active');
                    const comps = [...new Set(data.map(t => t.company || 'Unassigned'))].sort();
                    setTrainees(data);
                    setCompanies(comps);
                    setLoading(false);
                });
                return () => unsub();
            }, []);

            // --- Helpers ---
            const isHoliday = (dateStr, companyName) => {
                const compSettings = companySettings[companyName] || {};
                const normalizeDate = (val) => {
                    if (!val) return null;
                    const d = new Date(String(val).replace(/-/g, '/'));
                    if (isNaN(d.getTime())) return String(val).trim();
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                };

// MISSING LINE 3361
// MISSING LINE 3362
// MISSING LINE 3363
// MISSING LINE 3364
// MISSING LINE 3365
// MISSING LINE 3366
// MISSING LINE 3367
// MISSING LINE 3368
// MISSING LINE 3369
// MISSING LINE 3370
// MISSING LINE 3371
// MISSING LINE 3372
// MISSING LINE 3373
// MISSING LINE 3374
// MISSING LINE 3375
// MISSING LINE 3376
// MISSING LINE 3377
// MISSING LINE 3378
// MISSING LINE 3379
// MISSING LINE 3380
// MISSING LINE 3381
// MISSING LINE 3382
// MISSING LINE 3383
// MISSING LINE 3384
// MISSING LINE 3385
// MISSING LINE 3386
// MISSING LINE 3387
// MISSING LINE 3388
// MISSING LINE 3389
// MISSING LINE 3390
// MISSING LINE 3391
// MISSING LINE 3392
// MISSING LINE 3393
// MISSING LINE 3394
// MISSING LINE 3395
// MISSING LINE 3396
// MISSING LINE 3397
// MISSING LINE 3398
// MISSING LINE 3399
// MISSING LINE 3400
// MISSING LINE 3401
// MISSING LINE 3402
// MISSING LINE 3403
// MISSING LINE 3404
// MISSING LINE 3405
// MISSING LINE 3406
// MISSING LINE 3407
// MISSING LINE 3408
// MISSING LINE 3409
// MISSING LINE 3410
// MISSING LINE 3411
// MISSING LINE 3412
// MISSING LINE 3413
// MISSING LINE 3414
// MISSING LINE 3415
// MISSING LINE 3416
// MISSING LINE 3417
// MISSING LINE 3418
// MISSING LINE 3419
// MISSING LINE 3420
// MISSING LINE 3421
// MISSING LINE 3422
// MISSING LINE 3423
// MISSING LINE 3424
// MISSING LINE 3425
// MISSING LINE 3426
// MISSING LINE 3427
// MISSING LINE 3428
// MISSING LINE 3429
// MISSING LINE 3430
// MISSING LINE 3431
// MISSING LINE 3432
// MISSING LINE 3433
// MISSING LINE 3434
// MISSING LINE 3435
// MISSING LINE 3436
// MISSING LINE 3437
// MISSING LINE 3438
// MISSING LINE 3439
// MISSING LINE 3440
// MISSING LINE 3441
// MISSING LINE 3442
// MISSING LINE 3443
// MISSING LINE 3444
// MISSING LINE 3445
// MISSING LINE 3446
// MISSING LINE 3447
// MISSING LINE 3448
// MISSING LINE 3449
// MISSING LINE 3450
// MISSING LINE 3451
// MISSING LINE 3452
// MISSING LINE 3453
// MISSING LINE 3454
// MISSING LINE 3455
// MISSING LINE 3456
// MISSING LINE 3457
// MISSING LINE 3458
// MISSING LINE 3459
// MISSING LINE 3460
// MISSING LINE 3461
// MISSING LINE 3462
// MISSING LINE 3463
// MISSING LINE 3464
// MISSING LINE 3465
// MISSING LINE 3466
// MISSING LINE 3467
// MISSING LINE 3468
// MISSING LINE 3469
// MISSING LINE 3470
// MISSING LINE 3471
// MISSING LINE 3472
// MISSING LINE 3473
// MISSING LINE 3474
// MISSING LINE 3475
// MISSING LINE 3476
// MISSING LINE 3477
// MISSING LINE 3478
// MISSING LINE 3479
// MISSING LINE 3480
// MISSING LINE 3481
// MISSING LINE 3482
// MISSING LINE 3483
// MISSING LINE 3484
// MISSING LINE 3485
// MISSING LINE 3486
// MISSING LINE 3487
// MISSING LINE 3488
// MISSING LINE 3489
// MISSING LINE 3490
// MISSING LINE 3491
// MISSING LINE 3492
// MISSING LINE 3493
// MISSING LINE 3494
// MISSING LINE 3495
// MISSING LINE 3496
// MISSING LINE 3497
// MISSING LINE 3498
// MISSING LINE 3499
// MISSING LINE 3500
// MISSING LINE 3501
// MISSING LINE 3502
// MISSING LINE 3503
// MISSING LINE 3504
// MISSING LINE 3505
// MISSING LINE 3506
// MISSING LINE 3507
// MISSING LINE 3508
// MISSING LINE 3509
// MISSING LINE 3510
// MISSING LINE 3511
// MISSING LINE 3512
// MISSING LINE 3513
// MISSING LINE 3514
// MISSING LINE 3515
// MISSING LINE 3516
// MISSING LINE 3517
// MISSING LINE 3518
// MISSING LINE 3519
// MISSING LINE 3520
// MISSING LINE 3521
// MISSING LINE 3522
// MISSING LINE 3523
// MISSING LINE 3524
// MISSING LINE 3525
// MISSING LINE 3526
// MISSING LINE 3527
// MISSING LINE 3528
// MISSING LINE 3529
// MISSING LINE 3530
// MISSING LINE 3531
// MISSING LINE 3532
// MISSING LINE 3533
// MISSING LINE 3534
// MISSING LINE 3535
// MISSING LINE 3536
// MISSING LINE 3537
// MISSING LINE 3538
// MISSING LINE 3539
// MISSING LINE 3540
// MISSING LINE 3541
// MISSING LINE 3542
// MISSING LINE 3543
// MISSING LINE 3544
// MISSING LINE 3545
// MISSING LINE 3546
// MISSING LINE 3547
// MISSING LINE 3548
// MISSING LINE 3549
// MISSING LINE 3550
// MISSING LINE 3551
// MISSING LINE 3552
// MISSING LINE 3553
// MISSING LINE 3554
// MISSING LINE 3555
// MISSING LINE 3556
// MISSING LINE 3557
// MISSING LINE 3558
// MISSING LINE 3559
// MISSING LINE 3560
// MISSING LINE 3561
// MISSING LINE 3562
// MISSING LINE 3563
// MISSING LINE 3564
// MISSING LINE 3565
// MISSING LINE 3566
// MISSING LINE 3567
// MISSING LINE 3568
// MISSING LINE 3569
// MISSING LINE 3570
// MISSING LINE 3571
// MISSING LINE 3572
// MISSING LINE 3573
// MISSING LINE 3574
// MISSING LINE 3575
// MISSING LINE 3576
// MISSING LINE 3577
// MISSING LINE 3578
// MISSING LINE 3579
// MISSING LINE 3580
// MISSING LINE 3581
// MISSING LINE 3582
// MISSING LINE 3583
// MISSING LINE 3584
// MISSING LINE 3585
// MISSING LINE 3586
// MISSING LINE 3587
// MISSING LINE 3588
// MISSING LINE 3589
// MISSING LINE 3590
// MISSING LINE 3591
// MISSING LINE 3592
// MISSING LINE 3593
// MISSING LINE 3594
// MISSING LINE 3595
// MISSING LINE 3596
// MISSING LINE 3597
// MISSING LINE 3598
// MISSING LINE 3599
// MISSING LINE 3600
// MISSING LINE 3601
// MISSING LINE 3602
// MISSING LINE 3603
// MISSING LINE 3604
// MISSING LINE 3605
// MISSING LINE 3606
// MISSING LINE 3607
// MISSING LINE 3608
// MISSING LINE 3609
// MISSING LINE 3610
// MISSING LINE 3611
// MISSING LINE 3612
// MISSING LINE 3613
// MISSING LINE 3614
// MISSING LINE 3615
// MISSING LINE 3616
// MISSING LINE 3617
// MISSING LINE 3618
// MISSING LINE 3619
// MISSING LINE 3620
// MISSING LINE 3621
// MISSING LINE 3622
// MISSING LINE 3623
// MISSING LINE 3624
// MISSING LINE 3625
// MISSING LINE 3626
// MISSING LINE 3627
// MISSING LINE 3628
// MISSING LINE 3629
// MISSING LINE 3630
// MISSING LINE 3631
// MISSING LINE 3632
// MISSING LINE 3633
// MISSING LINE 3634
// MISSING LINE 3635
// MISSING LINE 3636
// MISSING LINE 3637
// MISSING LINE 3638
// MISSING LINE 3639
// MISSING LINE 3640
// MISSING LINE 3641
// MISSING LINE 3642
// MISSING LINE 3643
// MISSING LINE 3644
// MISSING LINE 3645
// MISSING LINE 3646
// MISSING LINE 3647
// MISSING LINE 3648
// MISSING LINE 3649
// MISSING LINE 3650
// MISSING LINE 3651
// MISSING LINE 3652
// MISSING LINE 3653
// MISSING LINE 3654
// MISSING LINE 3655
// MISSING LINE 3656
// MISSING LINE 3657
// MISSING LINE 3658
// MISSING LINE 3659
// MISSING LINE 3660
// MISSING LINE 3661
// MISSING LINE 3662
// MISSING LINE 3663
// MISSING LINE 3664
// MISSING LINE 3665
// MISSING LINE 3666
// MISSING LINE 3667
// MISSING LINE 3668
// MISSING LINE 3669
// MISSING LINE 3670
// MISSING LINE 3671
// MISSING LINE 3672
// MISSING LINE 3673
// MISSING LINE 3674
// MISSING LINE 3675
// MISSING LINE 3676
// MISSING LINE 3677
// MISSING LINE 3678
// MISSING LINE 3679
// MISSING LINE 3680
// MISSING LINE 3681
// MISSING LINE 3682
// MISSING LINE 3683
// MISSING LINE 3684
// MISSING LINE 3685
// MISSING LINE 3686
// MISSING LINE 3687
// MISSING LINE 3688
// MISSING LINE 3689
// MISSING LINE 3690
// MISSING LINE 3691
// MISSING LINE 3692
// MISSING LINE 3693
// MISSING LINE 3694
// MISSING LINE 3695
// MISSING LINE 3696
// MISSING LINE 3697
// MISSING LINE 3698
// MISSING LINE 3699
// MISSING LINE 3700
// MISSING LINE 3701
// MISSING LINE 3702
// MISSING LINE 3703
// MISSING LINE 3704
// MISSING LINE 3705
// MISSING LINE 3706
// MISSING LINE 3707
// MISSING LINE 3708
// MISSING LINE 3709
// MISSING LINE 3710
// MISSING LINE 3711
// MISSING LINE 3712
// MISSING LINE 3713
// MISSING LINE 3714
// MISSING LINE 3715
// MISSING LINE 3716
// MISSING LINE 3717
// MISSING LINE 3718
// MISSING LINE 3719
// MISSING LINE 3720
// MISSING LINE 3721
// MISSING LINE 3722
// MISSING LINE 3723
// MISSING LINE 3724
// MISSING LINE 3725
// MISSING LINE 3726
// MISSING LINE 3727
// MISSING LINE 3728
// MISSING LINE 3729
// MISSING LINE 3730
// MISSING LINE 3731
// MISSING LINE 3732
// MISSING LINE 3733
// MISSING LINE 3734
// MISSING LINE 3735
// MISSING LINE 3736
// MISSING LINE 3737
// MISSING LINE 3738
// MISSING LINE 3739
// MISSING LINE 3740
// MISSING LINE 3741
// MISSING LINE 3742
// MISSING LINE 3743
// MISSING LINE 3744
// MISSING LINE 3745
// MISSING LINE 3746
// MISSING LINE 3747
// MISSING LINE 3748
// MISSING LINE 3749
// MISSING LINE 3750
// MISSING LINE 3751
// MISSING LINE 3752
// MISSING LINE 3753
// MISSING LINE 3754
// MISSING LINE 3755
// MISSING LINE 3756
// MISSING LINE 3757
// MISSING LINE 3758
// MISSING LINE 3759
// MISSING LINE 3760
// MISSING LINE 3761
// MISSING LINE 3762
// MISSING LINE 3763
// MISSING LINE 3764
// MISSING LINE 3765
// MISSING LINE 3766
// MISSING LINE 3767
// MISSING LINE 3768
// MISSING LINE 3769
// MISSING LINE 3770
// MISSING LINE 3771
// MISSING LINE 3772
// MISSING LINE 3773
// MISSING LINE 3774
// MISSING LINE 3775
// MISSING LINE 3776
// MISSING LINE 3777
// MISSING LINE 3778
// MISSING LINE 3779
// MISSING LINE 3780
// MISSING LINE 3781
// MISSING LINE 3782
// MISSING LINE 3783
// MISSING LINE 3784
// MISSING LINE 3785
// MISSING LINE 3786
// MISSING LINE 3787
// MISSING LINE 3788
// MISSING LINE 3789
// MISSING LINE 3790
// MISSING LINE 3791
// MISSING LINE 3792
// MISSING LINE 3793
// MISSING LINE 3794
// MISSING LINE 3795
// MISSING LINE 3796
// MISSING LINE 3797
// MISSING LINE 3798
// MISSING LINE 3799
// MISSING LINE 3800
// MISSING LINE 3801
// MISSING LINE 3802
// MISSING LINE 3803
// MISSING LINE 3804
// MISSING LINE 3805
// MISSING LINE 3806
// MISSING LINE 3807
// MISSING LINE 3808
// MISSING LINE 3809
// MISSING LINE 3810
// MISSING LINE 3811
// MISSING LINE 3812
// MISSING LINE 3813
// MISSING LINE 3814
// MISSING LINE 3815
// MISSING LINE 3816
// MISSING LINE 3817
// MISSING LINE 3818
// MISSING LINE 3819
// MISSING LINE 3820
// MISSING LINE 3821
// MISSING LINE 3822
// MISSING LINE 3823
// MISSING LINE 3824
// MISSING LINE 3825
// MISSING LINE 3826
// MISSING LINE 3827
// MISSING LINE 3828
// MISSING LINE 3829
// MISSING LINE 3830
// MISSING LINE 3831
// MISSING LINE 3832
// MISSING LINE 3833
// MISSING LINE 3834
// MISSING LINE 3835
// MISSING LINE 3836
// MISSING LINE 3837
// MISSING LINE 3838
// MISSING LINE 3839
// MISSING LINE 3840
// MISSING LINE 3841
// MISSING LINE 3842
// MISSING LINE 3843
// MISSING LINE 3844
// MISSING LINE 3845
// MISSING LINE 3846
// MISSING LINE 3847
// MISSING LINE 3848
// MISSING LINE 3849
// MISSING LINE 3850
// MISSING LINE 3851
// MISSING LINE 3852
// MISSING LINE 3853
// MISSING LINE 3854
// MISSING LINE 3855
// MISSING LINE 3856
// MISSING LINE 3857
// MISSING LINE 3858
// MISSING LINE 3859
// MISSING LINE 3860
// MISSING LINE 3861
// MISSING LINE 3862
// MISSING LINE 3863
// MISSING LINE 3864
// MISSING LINE 3865
// MISSING LINE 3866
// MISSING LINE 3867
// MISSING LINE 3868
// MISSING LINE 3869
// MISSING LINE 3870
// MISSING LINE 3871
// MISSING LINE 3872
// MISSING LINE 3873
// MISSING LINE 3874
// MISSING LINE 3875
// MISSING LINE 3876
// MISSING LINE 3877
// MISSING LINE 3878
// MISSING LINE 3879
// MISSING LINE 3880
// MISSING LINE 3881
// MISSING LINE 3882
// MISSING LINE 3883
// MISSING LINE 3884
// MISSING LINE 3885
// MISSING LINE 3886
// MISSING LINE 3887
// MISSING LINE 3888
// MISSING LINE 3889
// MISSING LINE 3890
// MISSING LINE 3891
// MISSING LINE 3892
// MISSING LINE 3893
// MISSING LINE 3894
// MISSING LINE 3895
// MISSING LINE 3896
// MISSING LINE 3897
// MISSING LINE 3898
// MISSING LINE 3899
// MISSING LINE 3900
// MISSING LINE 3901
// MISSING LINE 3902
// MISSING LINE 3903
// MISSING LINE 3904
// MISSING LINE 3905
// MISSING LINE 3906
// MISSING LINE 3907
// MISSING LINE 3908
// MISSING LINE 3909
// MISSING LINE 3910
// MISSING LINE 3911
// MISSING LINE 3912
// MISSING LINE 3913
// MISSING LINE 3914
// MISSING LINE 3915
// MISSING LINE 3916
// MISSING LINE 3917
// MISSING LINE 3918
// MISSING LINE 3919
// MISSING LINE 3920
// MISSING LINE 3921
// MISSING LINE 3922
// MISSING LINE 3923
// MISSING LINE 3924
// MISSING LINE 3925
// MISSING LINE 3926
// MISSING LINE 3927
// MISSING LINE 3928
// MISSING LINE 3929
// MISSING LINE 3930
// MISSING LINE 3931
// MISSING LINE 3932
// MISSING LINE 3933
// MISSING LINE 3934
// MISSING LINE 3935
// MISSING LINE 3936
// MISSING LINE 3937
// MISSING LINE 3938
// MISSING LINE 3939
// MISSING LINE 3940
// MISSING LINE 3941
// MISSING LINE 3942
// MISSING LINE 3943
// MISSING LINE 3944
// MISSING LINE 3945
// MISSING LINE 3946
// MISSING LINE 3947
// MISSING LINE 3948
// MISSING LINE 3949
                                        {displayData.map((row, i) => (
                                            <tr key={i} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group">
                                                <td className="table-cell font-bold text-slate-800 dark:text-slate-100">{row.name} <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{row.id}</span></td>
                                                <td className="table-cell text-slate-700 dark:text-slate-300 text-xs font-bold">{row.company}</td>
                                                <td className="table-cell text-slate-500 dark:text-slate-400 text-xs italic">{row.ic}</td>

                                                {viewMode === 'Daily' ? (
                                                    <>
                                                        <td className="table-cell font-mono text-xs text-slate-700 dark:text-slate-300">{row.clockIn}</td>
                                                        <td className="table-cell text-[10px] font-bold uppercase">
                                                            {row.locInCoords ? (
                                                                <a href={`https://maps.google.com/?q=${row.locInCoords}`} target="_blank" rel="noreferrer" className={`underline flex items-center gap-1 ${row.locInText === 'Verified' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                                                                    <MapPin size={10}/> {row.locInText}
                                                                </a>
                                                            ) : (
                                                                <span className="text-slate-400 dark:text-slate-500">{row.locInText}</span>
                                                            )}
                                                        </td>
                                                        <td className="table-cell font-mono text-xs text-slate-700 dark:text-slate-300">{row.clockOut}</td>
                                                        <td className="table-cell text-[10px] font-bold uppercase">
                                                            {row.locOutCoords ? (
                                                                <a href={`https://maps.google.com/?q=${row.locOutCoords}`} target="_blank" rel="noreferrer" className={`underline flex items-center gap-1 ${row.locOutText === 'Verified' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                                                                    <MapPin size={10}/> {row.locOutText}
                                                                </a>
                                                            ) : (
                                                                <span className="text-slate-400 dark:text-slate-500">{row.locOutText}</span>
                                                            )}
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="table-cell text-xs font-bold text-slate-500 dark:text-slate-400">{row.period}</td>
                                                        <td className="table-cell text-center font-black text-slate-700 dark:text-slate-200">{row.daysPresent}</td>
                                                        <td className="table-cell text-center font-black text-rose-500 dark:text-rose-400">{row.daysAbsent > 0 ? row.daysAbsent : '-'}</td>
                                                    </>
                                                )}

                                                <td className="table-cell text-center font-black text-emerald-600 dark:text-emerald-400">{row.hours}</td>
                                                <td className="table-cell">
                                                    <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-md tracking-wide ${
                                                        row.remarks.includes('AWOL') ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                                                        row.remarks.includes('Notification') ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                        row.remarks.includes('Late') || row.remarks.includes('Undertime') || row.remarks.includes('Missing') ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                                        row.remarks.includes('Absences') ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                                                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                    }`}>
                                                        {row.remarks}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {displayData.length === 0 && (
                                            <tr>
                                                <td colSpan={viewMode === 'Daily' ? 10 : 9} className="table-cell p-10 text-center text-slate-400 dark:text-slate-500 italic bg-slate-50/50 dark:bg-slate-800/30">
                                                    No records matched your filters.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            );
        };

        const App = () => {
            const [selectedProject, setSelectedProject] = useState(null);

const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
const [globalSearchQuery, setGlobalSearchQuery] = useState('');
const [showGlobalSearchDropdown, setShowGlobalSearchDropdown] = useState(false);
const searchRef = useRef(null);

useEffect(() => {
    const handleClickOutside = (event) => {
        if (searchRef.current && !searchRef.current.contains(event.target)) {
            setShowGlobalSearchDropdown(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);

const menuItems = [
    { id: 'performance', name: 'ASTP Performance', icon: Activity },
    { id: 'ojtAttendance', name: 'OJT Attendance', icon: ClipboardList },
    { id: 'visitSchedule', name: 'Visit Schedule', icon: Calendar },
    { id: 'allowanceRecords', name: 'Allowance Records', icon: DollarSign },
    { id: 'settings', name: 'Settings', icon: Settings },
];

const filteredGlobalTabs = useMemo(() => {
    if (!globalSearchQuery || !globalSearchQuery.trim()) return [];
    const q = globalSearchQuery.toLowerCase();
    return menuItems.filter(t => t.name.toLowerCase().includes(q));
}, [globalSearchQuery]);

            const navigate = useNavigate();
const location = useLocation();
const activeView = location.pathname.substring(1) || 'performance';
const setActiveView = (view) => navigate('/' + view);
            const [user, setUser] = useState(null);
            const [authReady, setAuthReady] = useState(false);
            const [authError, setAuthError] = useState('');
            const [sidebarOpen, setSidebarOpen] = useState(false);
            const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system');
                    root.classList.add(theme);
            useEffect(() => {
                localStorage.setItem('theme', theme);
            }, [theme]);
                if (theme === 'system') {
            const changeView = (view) => {
                setSelectedProject(null);
                } else {
            };
                }
            useEffect(() => {
            }, [theme]);
                    if (!currentUser) {
            const changeView = (view) => {
                setSelectedProject(null);
                setActiveView(view);
            };

            useEffect(() => {
                const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
                    if (!currentUser) {
                        setUser(null);
                        setAuthReady(true);
                        return;
                    }
                            const adminData = adminQuery.docs[0].data();
                    try {
                        // 1. Query the 'admins' collection by the logged-in user's email
                        const adminQuery = await db.collection('admins')
                            .where('email', '==', currentUser.email)
                            .get();
                            } else {
                        if (!adminQuery.empty) {
                            const adminData = adminQuery.docs[0].data();
                                setAuthError('Access denied: Your account exists, but you do not have permission to access the TSD Portal.');
                            }
                        } else {
                            await auth.signOut();
                            setUser(null);
                            } else {
                        }
                    } catch (err) {
                        console.error(err);
                        setUser(null);
                        } else {
                    }
                    setAuthReady(true);
                });
                        }
                return () => unsubscribe();
            }, []);
                        setUser(null);
            const handleLogin = async (email, password) => {
                setAuthError('');
                try {
                });
                } catch (err) {
                return () => unsubscribe();
            }, []);
                }
            };
                setAuthError('');
            const handleLogout = async () => {
                try {
                } catch (err) {
                } catch (err) {
                    setAuthError('Invalid email or password.');
                }
            };

            const handleLogout = async () => {
                try {
const getMonthsDifference = (startDate, targetDate) => {
    const start = new Date(startDate);
    const target = new Date(targetDate);
    if (isNaN(start) || isNaN(target)) return 0;
    const diffTime = target - start;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.floor(diffDays / 30.44));
};
    const currentUserName = user?.displayName || user?.email?.split('@')[0] || "User";
const getLoc = (details) => {
    if (!details) return null;
    if (details.location?.lat) return { lat: parseFloat(details.location.lat), lon: parseFloat(details.location.lon) };
    if (details.location?.latitude) return { lat: parseFloat(details.location.latitude), lon: parseFloat(details.location.longitude) };
    if (details.lat) return { lat: parseFloat(details.lat), lon: parseFloat(details.lon) };
    if (details.latitude) return { lat: parseFloat(details.latitude), lon: parseFloat(details.longitude) };
    return null;
};

const getDistanceFromLatLonInM = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; // Distance in m
};
                    {!isSidebarCollapsed && <div className="font-bold text-lg text-primary-600 dark:text-primary-400 flex items-center gap-2">
const formatTime = (ts) => {
    if (!ts) return '--:--';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
                        <img src="https://dualtech.org.ph/wp-content/uploads/2023/07/dualtech-logo-1.png" alt="Dualtech" className="w-8 h-8 object-contain" />
                    </div>}
                    <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="hidden md:block p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md ml-auto">
                        <Menu size={20}/>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
                    <ul className="space-y-1 px-3">
                        {menuItems.map(tab => {
                            const IconCmp = tab.icon;
                            const isActive = activeView === tab.id;
                            return (
                                <li key={tab.id}>
                                    <button onClick={() => { setActiveView(tab.id); if(window.innerWidth < 768) setIsSidebarCollapsed(true); }} title={isSidebarCollapsed ? tab.name : ''}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium transition-all ${isActive ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300 font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'}`}>
                                        <IconCmp size={18} className={isActive ? 'text-primary-600 dark:text-primary-400' : ''} />
                                        {!isSidebarCollapsed && <span>{tab.name}</span>}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                {/* User Profile Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                    <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} mb-4`}>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md">
                            {currentUserName.charAt(0).toUpperCase()}
                        </div>
                        {!isSidebarCollapsed && (
                            <div className="overflow-hidden flex-1">
                                <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{currentUserName}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate text-ellipsis w-[150px]" title={user?.email}>{user?.email}</p>
                            </div>
                        )}
                    </div>

                    {!isSidebarCollapsed && (
                        <div className="flex items-center justify-between gap-2">
                            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-600">
                                {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                            </button>
                            <button onClick={() => auth.signOut()} className="flex items-center justify-center p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900/50" title="Sign out">
                                <LogOut size={16} />
                            </button>
                        </div>
                    )}
                    {isSidebarCollapsed && (
                        <div className="flex flex-col gap-2">
                            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="flex items-center justify-center p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-600" title="Toggle Theme">
                                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                            </button>
                            <button onClick={() => auth.signOut()} className="flex items-center justify-center p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Sign out">
                                <LogOut size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};) => {
                // Extract name from display name or email prefix
                const currentUserName = user?.displayName || user?.email?.split('@')[0] || "User";

                return (
                    <>
                        {/* Mobile Overlay */}
                        {isOpen && (
                            <div className="md:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
                        )}

                        {/* Sidebar */}
                        <div className={`fixed inset-y-0 left-0 z-50 md:static ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} w-64 flex-shrink-0 bg-slate-50 dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300`}>
                            {/* Top Branding Section */}
                            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700">
                                <div className="font-bold text-lg text-primary-600 dark:text-primary-400 flex items-center gap-2">
                                    <Icon name="briefcase" size={24} className="text-primary-600 dark:text-primary-400" />
                                    TSD Portal
                                </div>
                                <button onClick={onClose} className="md:hidden p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md">
                                    <Icon name="x" size={20}/>
                                </button>
                            </div>

                            {/* Theme Toggle */}
                            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Theme</span>
                                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 shadow-inner">
                                    <button onClick={() => setTheme('light')} className={`p-1.5 rounded-lg transition-all duration-300 ${theme === 'light' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'}`} title="Light Mode">
                                        <Icon name="sun" size={16} />
                                    </button>
                                    <button onClick={() => setTheme('dark')} className={`p-1.5 rounded-lg transition-all duration-300 ${theme === 'dark' ? 'bg-slate-700 text-primary-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'}`} title="Dark Mode">
                                        <Icon name="moon" size={16} />
                                    </button>
                                    <button onClick={() => setTheme('system')} className={`p-1.5 rounded-lg transition-all duration-300 ${theme === 'system' ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'}`} title="System Default">
                                        <Icon name="monitor" size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 flex-1 overflow-y-auto">
                                {/* User Profile Card */}
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/50 mb-6 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-primary-100 dark:bg-primary-900/50 p-2 rounded-full text-primary-600 dark:text-primary-400">
                                            <Icon name="user" size={20} />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-bold text-slate-800 dark:text-white leading-tight capitalize break-words">
                                                {currentUserName}
                                            </h2>
                                            <p className="text-[10px] text-primary-600 dark:text-primary-400 mt-0.5 uppercase font-bold tracking-wider">
                                                Admin User
                                            </p>
                                        </div>
                                    </div>
// MISSING LINE 4281
// MISSING LINE 4282
// MISSING LINE 4283
// MISSING LINE 4284
// MISSING LINE 4285
// MISSING LINE 4286
// MISSING LINE 4287
// MISSING LINE 4288
// MISSING LINE 4289
// MISSING LINE 4290
// MISSING LINE 4291
// MISSING LINE 4292
// MISSING LINE 4293
// MISSING LINE 4294
// MISSING LINE 4295
// MISSING LINE 4296
// MISSING LINE 4297
// MISSING LINE 4298
// MISSING LINE 4299
                        }
                        return false;
                    });
                                    <button
                    // Extract Companies for Filter based on status matched trainees
                    const compSet = new Set(statusMatchedTrainees.map(t => t.company || t['Company Name']).filter(Boolean));
                    const sortedComps = Array.from(compSet).sort();
                    setCompanies(sortedComps);
                                    </button>
                    if (selectedCompany && !compSet.has(selectedCompany)) {
                        setSelectedCompany('');
                    }
                                    >
                    // Filter trainees based on Status and Company
                    let filteredTrainees = statusMatchedTrainees.filter(t => {
                        const tComp = t.company || t['Company Name'] || '';
                        // Company check
                        if (selectedCompany && tComp !== selectedCompany && compSet.has(selectedCompany)) return false;
                        return true;
                    });
                                    </button>
                    // 2. Map Student IDs to UIDs
                    const studentIds = filteredTrainees.map(t => t.studentId).filter(Boolean);
                                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 hover:-translate-y-0.5 ${activeView === 'concerns' && !selectedProject ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary-600 dark:hover:text-primary-400'}`}
                    const chunkArray = (arr, size) => {
                        const chunks = [];
                        for (let i = 0; i < arr.length; i += size) {
                            chunks.push(arr.slice(i, i + size));
                        }
                        return chunks;
                    };
                                        <Icon name="megaphone" size={18} /> Announcements
                    let uidsMap = {};
                    if (studentIds.length > 0) {
                        const profileChunks = chunkArray(studentIds, 30);
                        for (const chunk of profileChunks) {
                            const profilesSnap = await getDocs(query(collectionGroup(db, 'profile'), where('studentId', 'in', chunk)));
                            profilesSnap.forEach(doc => {
                                const d = doc.data();
                                if (d.studentId && d.uid) uidsMap[d.studentId] = d.uid;
                            });
                        }
                    }
                    </>
                );
            };
                        uid: uidsMap[t.studentId] || null,
            const PortfolioView = ({ onSelectProject }) => {
                const [projects, setProjects] = useState([]);
                const [loading, setLoading] = useState(true);
                const [isAdding, setIsAdding] = useState(false);
                const [newProjectTitle, setNewProjectTitle] = useState('');
                    let allLeaveRequests = [];
                // Get the currently logged-in user
                const currentUser = firebase.auth().currentUser;
                        // Determine date range to fetch to avoid fetching massive data.
                useEffect(() => {
                    const APP_ID = "dualtech-ojt-portal";
                    // Listen to the projects collection in Firebase
                    const unsubscribe = db.collection('artifacts').doc(APP_ID).collection('projects')
                        } else if (viewMode === 'Weekly' || perfectMode === 'Weekly') {
                        .onSnapshot(snapshot => {
                        {/* Footer */}
                        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                            setProjects(projData);
                            setLoading(false);
                        });
                    return () => unsubscribe();
                }, []);
                            >
                const handleAddProject = async (e) => {
                    e.preventDefault();
                    if (!newProjectTitle.trim()) return;
                    </div>
                </div>
            );
        }
                        title: newProjectTitle,
const Sidebar = ({ user, activeView, setActiveView, selectedProject, setSelectedProject, isOpen, onClose, theme, setTheme, isSidebarCollapsed, setIsSidebarCollapsed }) => {
    const currentUserName = user?.displayName || user?.email?.split('@')[0] || "User";
                        creatorName: currentUser.displayName || currentUser.email.split('@')[0], // Automatically use their name!
    const menuItems = [
        { id: 'performance', name: 'ASTP Performance', icon: Activity },
        { id: 'company_attendance', name: 'Company Attendance', icon: ListChecks },
        { id: 'ojtAttendance', name: 'OJT Attendance', icon: ClipboardList },
        { id: 'visitSchedule', name: 'Visit Schedule', icon: Calendar },
        { id: 'allowanceRecords', name: 'Allowance Records', icon: DollarSign },
        { id: 'settings', name: 'Settings', icon: Settings },
    ];

    return (
        <>
            {!isSidebarCollapsed && (
                <div className="md:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarCollapsed(true)} />
            )}
                    let allSchooling = [];
            <div className={`fixed inset-y-0 left-0 z-50 md:static ${isSidebarCollapsed ? '-translate-x-full md:translate-x-0 md:w-20' : 'translate-x-0 w-64'} flex-shrink-0 bg-slate-50 dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300`}>
                <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700">
                    {!isSidebarCollapsed && <div className="font-bold text-lg text-primary-600 dark:text-primary-400 flex items-center gap-2">
                        <img src="/dualtech-logo.png" alt="Dualtech" className="w-8 h-8 object-contain" />
                        Dualtech
                    </div>}
                    {isSidebarCollapsed && <div className="w-full flex justify-center">
                        <img src="/dualtech-logo.png" alt="Dualtech" className="w-8 h-8 object-contain" />
                    </div>}
                    <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="hidden md:block p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md ml-auto">
                    }
                    </button>
                </div>
                    const processedData = filteredTrainees.map(trainee => {
                <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
                    <ul className="space-y-1 px-3">
                        {menuItems.map(tab => {
                            const IconCmp = tab.icon;
                        let result = {
                            return (
                            monthSinceIpt: getMonthsDifference(trainee.iptDateStart || trainee['IPT Date Start'], targetD),
                            remarks: trainee.isRegistered ? '' : 'Not registered in portal',
                            totalHours: 0,
                            daysPresent: 0,
                            daysAbsent: 0,
                            awolCount: 0,
                            excusedCount: 0
                        };
                        })}
                    </ul>
                </div>
                            let timeIn = null, timeOut = null;
                {/* User Profile Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                    <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} mb-4`}>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md">
                            });
                        </div>
                        {!isSidebarCollapsed && (
                            traineeSchooling.forEach(s => {
                                let match = s.date === dateString;
                                if (!match && s.timestamp) {
                            </div>
                        )}
                    </div>

                    {!isSidebarCollapsed && (
                        <div className="flex items-center justify-between gap-2">
                            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-600">
                                {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                            </button>
                            <button onClick={() => auth.signOut()} className="flex items-center justify-center p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900/50" title="Sign out">
                                <LogOut size={16} />
                            </button>
                        </div>
                    )}
                    {isSidebarCollapsed && (
                        <div className="flex flex-col gap-2">
                            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="flex items-center justify-center p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-600" title="Toggle Theme">
                                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                            </button>
                            <button onClick={() => auth.signOut()} className="flex items-center justify-center p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Sign out">
                                <LogOut size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

            const PortfolioView = ({ onSelectProject }) => {
                const [projects, setProjects] = useState([]);
                const [loading, setLoading] = useState(true);
                const [isAdding, setIsAdding] = useState(false);
                const [newProjectTitle, setNewProjectTitle] = useState('');

                // Get the currently logged-in user
                const currentUser = firebase.auth().currentUser;

                useEffect(() => {
                    const APP_ID = "dualtech-ojt-portal";
                    // Listen to the projects collection in Firebase
                    const unsubscribe = db.collection('artifacts').doc(APP_ID).collection('projects')
                        .orderBy('createdAt', 'desc')
                        .onSnapshot(snapshot => {
                            const projData = [];
                            snapshot.forEach(doc => projData.push({ id: doc.id, ...doc.data() }));
                            setProjects(projData);
                            setLoading(false);
                        });
                    return () => unsubscribe();
                }, []);

                const handleAddProject = async (e) => {
                    e.preventDefault();
                    if (!newProjectTitle.trim()) return;

                    const APP_ID = "dualtech-ojt-portal";
                    // Scaffold a standard Google PM Framework project
                    const newProject = {
                        title: newProjectTitle,
                        status: 'Planning',
                        creatorEmail: currentUser.email,
                        creatorName: currentUser.displayName || currentUser.email.split('@')[0], // Automatically use their name!
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        charter: { goal: '', inScope: '', outOfScope: '' },
                        stakeholders: [],
                        raci: [],
                        plan: [],
                        risks: []
                    };

                    await db.collection('artifacts').doc(APP_ID).collection('projects').add(newProject);
                    setNewProjectTitle('');
                    setIsAdding(false);
                };

                if (loading) return <div className="p-10 text-center text-slate-500 font-bold">Loading portfolio...</div>;

                return (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                            <div>
                                <h2 className="text-xl md:text-2xl font-black text-slate-800">Project Portfolio</h2>
                                <p className="text-slate-500 text-xs md:text-sm">Google Project Management Framework</p>
                            </div>
                            <button onClick={() => setIsAdding(!isAdding)} className="w-full md:w-auto bg-primary-600 text-white px-5 py-3 md:py-2 rounded-xl font-bold hover:bg-primary-700 transition shadow-sm active:scale-95">
                                + New Project
                            </button>
                        </div>

                        {isAdding && (
                            <form onSubmit={handleAddProject} className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-slate-200 mb-8 flex flex-col gap-4 items-stretch md:flex-row md:items-end">
                                <div className="flex-1 w-full">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Project Title</label>
                                    <input type="text" value={newProjectTitle} onChange={e => setNewProjectTitle(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:ring-2 focus:ring-primary-500 outline-none transition text-base" placeholder="e.g., Q3 Operations Overhaul" autoFocus required />
                                </div>
                                <div className="flex gap-2 w-full md:w-auto">
                                    <button type="submit" className="flex-1 md:flex-none bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition active:scale-95">Create</button>
                                    <button type="button" onClick={() => setIsAdding(false)} className="flex-1 md:flex-none bg-slate-100 text-slate-600 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition active:scale-95">Cancel</button>
                                </div>
                            </form>
                        )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            {projects.map(proj => (
                                <div key={proj.id} onClick={() => onSelectProject(proj)} className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-primary-300 cursor-pointer transition-all hover:-translate-y-1 active:scale-95 md:active:scale-100">
                                    <h3 className="text-lg md:text-xl font-black text-slate-800 mb-2">{proj.title}</h3>
                                    <div className="text-xs text-slate-500 mb-6">Project Manager: <span className="font-bold text-slate-700">{proj.creatorName}</span></div>
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600">{proj.status}</span>
                            result.outLoc = dayStats.outLoc;
                            result.inOutOfRange = dayStats.inOutOfRange;
                            result.inNoLocation = dayStats.inNoLocation;
                            result.outOutOfRange = dayStats.outOutOfRange;
                            result.outNoLocation = dayStats.outNoLocation;
                                    </div>
                            if (dayStats.isSchoolingDay) {
                            ))}
                            {projects.length === 0 && !isAdding && (
                            } else if (dayStats.isHoliday) {
                                result.rowColor = 'bg-gray-100 dark:bg-gray-800';
                                result.statusRemark = `Holiday (${dayStats.holidayName || 'Declared'})`;
                            } else if (dayStats.isRestDay) {
                        </div>
                    </div>
                );
            };
                                result.statusRemark = 'Completed Shift';
                            } else if (dayStats.timeIn && !dayStats.timeOut) {
                                result.rowColor = 'bg-amber-100 dark:bg-amber-900/30';
            const ProjectWorkspace = ({ project: initialProject, onBack }) => {
                const [project, setProject] = useState(initialProject);
                const [activeTab, setActiveTab] = useState('charter');
                                result.statusRemark = 'Undertime';
                // Check permissions based on the logged-in user
                const currentUser = firebase.auth().currentUser;
                const currentUserName = currentUser.displayName || currentUser.email.split('@')[0];
                const isEditor = project.creatorEmail === currentUser.email;
                                result.rowColor = 'bg-red-100 dark:bg-red-900/30';
                // Live-sync edits with Firebase
                useEffect(() => {
                    const APP_ID = "dualtech-ojt-portal";
                    const unsubscribe = db.collection('artifacts').doc(APP_ID).collection('projects').doc(project.id)
                        .onSnapshot(doc => {
                            if (doc.exists) {
                            if (dayStats.inOutOfRange) result.remarks += ' | Clock In Out of Range';
                            } else {
                            if (dayStats.outOutOfRange) result.remarks += ' | Clock Out Out of Range';
                            if (dayStats.outNoLocation) result.remarks += ' | Clock Out No Location Data';
                            }
                        });
                    return () => unsubscribe();
                }, [project.id, onBack]);
                                const d = new Date(targetD);
                const updateProject = async (field, value) => {
                    if (!isEditor) return;
                    const APP_ID = "dualtech-ojt-portal";
                    await db.collection('artifacts').doc(APP_ID).collection('projects').doc(project.id).update({
                        [field]: value
                    });
                };

                // --- DELETE PROJECT LOGIC ---
                const handleDeleteProject = async () => {
                    if (!isEditor) return;

                    // Ask for confirmation to prevent accidental clicks
                    const confirmed = window.confirm(`Are you sure you want to completely delete "${project.title}"? This action cannot be undone.`);
                    if (!confirmed) return;

                    try {
                        const APP_ID = "dualtech-ojt-portal";
                        await db.collection('artifacts').doc(APP_ID).collection('projects').doc(project.id).delete();
                        // The onSnapshot listener above will detect the deletion and automatically call onBack()
                    } catch (error) {
                        console.error("Error deleting project:", error);
                        alert("Failed to delete the project. Please try again.");
                    }
                };

                const addItem = (field, emptyObj) => {
                    const newArray = [...(project[field] || []), { id: Date.now(), ...emptyObj }];
                    updateProject(field, newArray);
                };

                const updateItem = (field, id, key, value) => {
                    const newArray = project[field].map(item => item.id === id ? { ...item, [key]: value } : item);
                    updateProject(field, newArray);
                };

                const removeItem = (field, id) => {
                    const newArray = project[field].filter(item => item.id !== id);
                    updateProject(field, newArray);
                };

                return (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <button onClick={onBack} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition font-bold text-xs md:text-sm bg-white px-3 md:px-4 py-2 md:py-2 rounded-xl shadow-sm border border-slate-200 w-max active:scale-95">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                            Back
                        </button>

                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-black text-slate-800">{project.title}</h2>
                                <p className="text-slate-500 text-xs md:text-sm mt-1">Project Manager: <span className="font-bold text-slate-700">{project.creatorName}</span></p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
                                <select
                                    disabled={!isEditor}
                                    value={project.status}
                                    onChange={e => updateProject('status', e.target.value)}
                                    className={`flex-1 sm:flex-none px-4 py-2 rounded-xl font-bold text-sm border-2 outline-none ${project.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'} ${!isEditor ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                    <option value="Planning">Planning</option>
                                    <option value="Active">Active</option>
                                    <option value="On Hold">On Hold</option>
                                    <option value="Completed">Completed</option>
                                </select>

                                {/* Conditional View Only Badge OR Delete Button */}
                                {!isEditor ? (
                                    <span className="bg-slate-800 text-white px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm whitespace-nowrap">
                                        View Only
                                    </span>
                                ) : (
                                    <button
                                        onClick={handleDeleteProject}
                                        className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 transition shadow-sm active:scale-95 whitespace-nowrap"
                                        title="Delete Project"
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Google PM Tools Navigation - Mobile Optimized */}
                        <div className="flex gap-2 border-b border-slate-200 mb-8 overflow-x-auto hide-scrollbar pb-2 -mx-4 md:mx-0 px-4 md:px-0">
                            {[
                                { id: 'charter', label: 'Charter' },
                                { id: 'stakeholders', label: 'Stakeholders' },
                                { id: 'raci', label: 'RACI' },
                                { id: 'plan', label: 'Plan' },
                                { id: 'risks', label: 'Risks' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 md:px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm transition whitespace-nowrap active:scale-95 ${activeTab === tab.id ? 'bg-primary-600 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="bg-white p-4 md:p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">

                            {/* PROJECT CHARTER */}
                            {activeTab === 'charter' && (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Project Goal</label>
                                        <textarea readOnly={!isEditor} value={project.charter?.goal || ''} onChange={e => updateProject('charter', { ...project.charter, goal: e.target.value })} placeholder="What is the measurable outcome of this project?" className={`w-full border border-slate-200 rounded-xl p-4 min-h-[100px] outline-none ${isEditor ? 'bg-slate-50 focus:ring-2 focus:ring-primary-500' : 'bg-transparent'}`} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">In Scope</label>
                                            <textarea readOnly={!isEditor} value={project.charter?.inScope || ''} onChange={e => updateProject('charter', { ...project.charter, inScope: e.target.value })} placeholder="What exactly will be delivered?" className={`w-full border border-slate-200 rounded-xl p-4 min-h-[120px] outline-none ${isEditor ? 'bg-slate-50 focus:ring-2 focus:ring-primary-500' : 'bg-transparent'}`} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Out of Scope</label>
                                            <textarea readOnly={!isEditor} value={project.charter?.outOfScope || ''} onChange={e => updateProject('charter', { ...project.charter, outOfScope: e.target.value })} placeholder="What is explicitly excluded?" className={`w-full border border-slate-200 rounded-xl p-4 min-h-[120px] outline-none ${isEditor ? 'bg-slate-50 focus:ring-2 focus:ring-primary-500' : 'bg-transparent'}`} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STAKEHOLDER REGISTER */}
                            {activeTab === 'stakeholders' && (
                                <div>
                                    {isEditor && (
                                        <button onClick={() => addItem('stakeholders', { name: '', role: '', interest: 'High', influence: 'High' })} className="mb-4 bg-primary-50 text-primary-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-primary-100 transition">
                                            + Add Stakeholder
                                        </button>
                                    )}
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse min-w-[600px]">
                                            <thead>
                                                <tr className="bg-slate-50">
                                                    <th className="p-3 text-xs font-bold text-slate-500 uppercase rounded-tl-xl rounded-bl-xl">Name</th>
                                                    <th className="p-3 text-xs font-bold text-slate-500 uppercase">Role</th>
                                                    <th className="p-3 text-xs font-bold text-slate-500 uppercase">Interest</th>
                                                    <th className="p-3 text-xs font-bold text-slate-500 uppercase rounded-tr-xl rounded-br-xl">Influence</th>
                                                    {isEditor && <th></th>}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(project.stakeholders || []).map(sh => (
                                                    <tr key={sh.id} className="border-b border-slate-100 last:border-0">
                                                        <td className="p-2"><input readOnly={!isEditor} value={sh.name} onChange={e => updateItem('stakeholders', sh.id, 'name', e.target.value)} placeholder="Name" className="w-full p-2 bg-transparent outline-none focus:bg-slate-50 rounded-lg" /></td>
                                                        <td className="p-2"><input readOnly={!isEditor} value={sh.role} onChange={e => updateItem('stakeholders', sh.id, 'role', e.target.value)} placeholder="Role/Title" className="w-full p-2 bg-transparent outline-none focus:bg-slate-50 rounded-lg" /></td>
                                                        <td className="p-2"><select disabled={!isEditor} value={sh.interest} onChange={e => updateItem('stakeholders', sh.id, 'interest', e.target.value)} className="w-full p-2 bg-transparent outline-none"><option>High</option><option>Medium</option><option>Low</option></select></td>
                                                        <td className="p-2"><select disabled={!isEditor} value={sh.influence} onChange={e => updateItem('stakeholders', sh.id, 'influence', e.target.value)} className="w-full p-2 bg-transparent outline-none"><option>High</option><option>Medium</option><option>Low</option></select></td>
                                                        {isEditor && <td className="p-2 text-right"><button onClick={() => removeItem('stakeholders', sh.id)} className="text-rose-400 hover:text-rose-600 px-2 font-bold text-lg">&times;</button></td>}
                                                    </tr>
                                                ))}
                                                {(!project.stakeholders || project.stakeholders.length === 0) && <tr><td colSpan="5" className="p-6 text-center text-slate-400">No stakeholders mapped yet.</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* RACI CHART */}
                            {activeTab === 'raci' && (
                                <div>
                                    {isEditor && (
                                        <button onClick={() => addItem('raci', { task: '', r: currentUserName, a: currentUserName, c: '', i: '' })} className="mb-4 bg-primary-50 text-primary-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-primary-100 transition">
                                            + Add RACI Task
                                        </button>
                                    )}
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse min-w-[700px]">
                                            <thead>
                                                <tr className="bg-slate-50">
                                                    <th className="p-3 text-xs font-bold text-slate-500 uppercase rounded-tl-xl rounded-bl-xl w-1/3">Task / Deliverable</th>
                                                    <th className="p-3 text-xs font-bold text-blue-600 uppercase">R (Responsible)</th>
                                                    <th className="p-3 text-xs font-bold text-emerald-600 uppercase">A (Accountable)</th>
                                                    <th className="p-3 text-xs font-bold text-amber-600 uppercase">C (Consulted)</th>
                                                    <th className="p-3 text-xs font-bold text-purple-600 uppercase rounded-tr-xl rounded-br-xl">I (Informed)</th>
                                                    {isEditor && <th></th>}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(project.raci || []).map(row => (
                                                    <tr key={row.id} className="border-b border-slate-100 last:border-0">
                                                        <td className="p-2"><input readOnly={!isEditor} value={row.task} onChange={e => updateItem('raci', row.id, 'task', e.target.value)} placeholder="Describe task..." className="w-full p-2 bg-transparent outline-none focus:bg-slate-50 rounded-lg font-medium" /></td>
                                                        <td className="p-2"><input readOnly={!isEditor} value={row.r} onChange={e => updateItem('raci', row.id, 'r', e.target.value)} placeholder="Name/Role" className="w-full p-2 bg-blue-50/50 outline-none focus:bg-blue-50 rounded-lg border border-transparent focus:border-blue-200 text-sm" /></td>
                                                        <td className="p-2"><input readOnly={!isEditor} value={row.a} onChange={e => updateItem('raci', row.id, 'a', e.target.value)} placeholder="Name/Role" className="w-full p-2 bg-emerald-50/50 outline-none focus:bg-emerald-50 rounded-lg border border-transparent focus:border-emerald-200 text-sm" /></td>
                                                        <td className="p-2"><input readOnly={!isEditor} value={row.c} onChange={e => updateItem('raci', row.id, 'c', e.target.value)} placeholder="Name/Role" className="w-full p-2 bg-amber-50/50 outline-none focus:bg-amber-50 rounded-lg border border-transparent focus:border-amber-200 text-sm" /></td>
                                                        <td className="p-2"><input readOnly={!isEditor} value={row.i} onChange={e => updateItem('raci', row.id, 'i', e.target.value)} placeholder="Name/Role" className="w-full p-2 bg-purple-50/50 outline-none focus:bg-purple-50 rounded-lg border border-transparent focus:border-purple-200 text-sm" /></td>
                                                        {isEditor && <td className="p-2 text-right"><button onClick={() => removeItem('raci', row.id)} className="text-rose-400 hover:text-rose-600 px-2 font-bold text-lg">&times;</button></td>}
                                                    </tr>
                                                ))}
                                                {(!project.raci || project.raci.length === 0) && <tr><td colSpan="6" className="p-6 text-center text-slate-400">No RACI matrix defined yet.</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* PROJECT PLAN */}
                            {activeTab === 'plan' && (
                                <div>
                                    {isEditor && (
                                        <button onClick={() => addItem('plan', { task: '', assignee: currentUserName, status: 'Not Started', due: '' })} className="mb-4 bg-primary-50 text-primary-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-primary-100 transition">
                                            + Add Task
                                        </button>
                                    )}
                                    <div className="space-y-3">
// MISSING LINE 4801
// MISSING LINE 4802
// MISSING LINE 4803
// MISSING LINE 4804
// MISSING LINE 4805
// MISSING LINE 4806
// MISSING LINE 4807
// MISSING LINE 4808
// MISSING LINE 4809
// MISSING LINE 4810
// MISSING LINE 4811
// MISSING LINE 4812
// MISSING LINE 4813
// MISSING LINE 4814
// MISSING LINE 4815
// MISSING LINE 4816
// MISSING LINE 4817
// MISSING LINE 4818
// MISSING LINE 4819
// MISSING LINE 4820
// MISSING LINE 4821
// MISSING LINE 4822
// MISSING LINE 4823
// MISSING LINE 4824
// MISSING LINE 4825
// MISSING LINE 4826
// MISSING LINE 4827
// MISSING LINE 4828
// MISSING LINE 4829
// MISSING LINE 4830
// MISSING LINE 4831
// MISSING LINE 4832
// MISSING LINE 4833
// MISSING LINE 4834
// MISSING LINE 4835
// MISSING LINE 4836
// MISSING LINE 4837
// MISSING LINE 4838
// MISSING LINE 4839
// MISSING LINE 4840
// MISSING LINE 4841
// MISSING LINE 4842
// MISSING LINE 4843
// MISSING LINE 4844
// MISSING LINE 4845
// MISSING LINE 4846
// MISSING LINE 4847
// MISSING LINE 4848
// MISSING LINE 4849
// MISSING LINE 4850
// MISSING LINE 4851
// MISSING LINE 4852
// MISSING LINE 4853
// MISSING LINE 4854
// MISSING LINE 4855
// MISSING LINE 4856
// MISSING LINE 4857
// MISSING LINE 4858
// MISSING LINE 4859
// MISSING LINE 4860
// MISSING LINE 4861
// MISSING LINE 4862
// MISSING LINE 4863
// MISSING LINE 4864
// MISSING LINE 4865
// MISSING LINE 4866
// MISSING LINE 4867
// MISSING LINE 4868
// MISSING LINE 4869
// MISSING LINE 4870
// MISSING LINE 4871
// MISSING LINE 4872
// MISSING LINE 4873
// MISSING LINE 4874
// MISSING LINE 4875
// MISSING LINE 4876
// MISSING LINE 4877
// MISSING LINE 4878
// MISSING LINE 4879
// MISSING LINE 4880
// MISSING LINE 4881
// MISSING LINE 4882
// MISSING LINE 4883
// MISSING LINE 4884
// MISSING LINE 4885
// MISSING LINE 4886
// MISSING LINE 4887
// MISSING LINE 4888
// MISSING LINE 4889
// MISSING LINE 4890
// MISSING LINE 4891
// MISSING LINE 4892
// MISSING LINE 4893
// MISSING LINE 4894
// MISSING LINE 4895
// MISSING LINE 4896
// MISSING LINE 4897
// MISSING LINE 4898
// MISSING LINE 4899
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search trainee name or ID..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium dark:text-white outline-none focus:border-primary-500"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 relative ml-auto">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-transparent select-none">Columns</label>
                                <button
                                    onClick={() => setShowColumnToggle(!showColumnToggle)}
                                    className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium dark:text-white flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <Columns size={16} /> Columns
                                </button>
                                {showColumnToggle && (
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 p-2 flex flex-col gap-1">
                                        <div className="px-2 py-1 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 mb-1">Toggle Columns</div>
                                        {Object.keys(visibleColumns).map(col => {
                                            // hide columns not relevant to the current view
                                            if (col === 'monthSinceIpt' && viewMode === 'Perfect') return null;
                                            if ((col === 'clockIn' || col === 'clockOut' || col === 'remarks') && viewMode !== 'Daily') return null;
                                            if ((col === 'daysPresent' || col === 'daysAbsent' || col === 'totalHours') && (viewMode !== 'Weekly' && viewMode !== 'Monthly')) return null;

                                            const labelMap = { studentId: 'Student ID#', studentName: 'Student Name', company: 'Assigned Company', iptDateStart: 'IPT Date Start', iptDateEnd: 'IPT Date End', monthSinceIpt: 'Month Since IPT', clockIn: 'Clock In', clockOut: 'Clock Out', remarks: 'Remarks', daysPresent: 'Days Present', daysAbsent: 'Days Absent', totalHours: 'Total Hours' };

                                            return (
                                                <label key={col} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors group">
                                                    <input
                                                        type="checkbox"
                                                        checked={visibleColumns[col]}
                                                        onChange={e => setVisibleColumns(prev => ({ ...prev, [col]: e.target.checked }))}
                                                        className="w-4 h-4 text-primary-600 bg-slate-100 border-slate-300 rounded focus:ring-primary-500 cursor-pointer"
                                                    />
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">{labelMap[col]}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="relative flex items-center justify-center mb-6">
                                <img src="dualtech-logo.png" alt="Loading" className="w-16 h-16 object-contain animate-pulse opacity-90 drop-shadow-md" />
                                <Loader2 className="absolute text-primary-600/50 animate-spin" size={100} strokeWidth={1.5} />
                            </div>
                            <p className="text-slate-500 font-bold tracking-wide animate-pulse">Analyzing Attendance Records...</p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                                            {visibleColumns.studentId && <TableHeader label="Student ID#" sortKey="studentId" />}
                                            {visibleColumns.studentName && <TableHeader label="Student Name" sortKey="firstName" />}
                                            {visibleColumns.company && <TableHeader label="Assigned Company" sortKey="company" />}
                                            {visibleColumns.iptDateStart && <TableHeader label="IPT Date Start" sortKey="iptDateStart" />}
                                            {visibleColumns.iptDateEnd && <TableHeader label="IPT Date End" sortKey="iptDateEnd" />}
                                            {viewMode !== 'Perfect' && visibleColumns.monthSinceIpt && <TableHeader label="Month (Since Start)" sortKey="monthSinceIpt" align="center" />}

                                            {viewMode === 'Daily' && (
                                                <>
// MISSING LINE 4971
// MISSING LINE 4972
// MISSING LINE 4973
// MISSING LINE 4974
// MISSING LINE 4975
// MISSING LINE 4976
// MISSING LINE 4977
// MISSING LINE 4978
// MISSING LINE 4979
// MISSING LINE 4980
// MISSING LINE 4981
// MISSING LINE 4982
// MISSING LINE 4983
// MISSING LINE 4984
// MISSING LINE 4985
// MISSING LINE 4986
// MISSING LINE 4987
// MISSING LINE 4988
// MISSING LINE 4989
// MISSING LINE 4990
// MISSING LINE 4991
// MISSING LINE 4992
// MISSING LINE 4993
// MISSING LINE 4994
// MISSING LINE 4995
// MISSING LINE 4996
// MISSING LINE 4997
// MISSING LINE 4998
// MISSING LINE 4999
// MISSING LINE 5000
// MISSING LINE 5001
// MISSING LINE 5002
// MISSING LINE 5003
// MISSING LINE 5004
// MISSING LINE 5005
// MISSING LINE 5006
// MISSING LINE 5007
// MISSING LINE 5008
// MISSING LINE 5009
// MISSING LINE 5010
// MISSING LINE 5011
// MISSING LINE 5012
// MISSING LINE 5013
// MISSING LINE 5014
// MISSING LINE 5015
// MISSING LINE 5016
// MISSING LINE 5017
// MISSING LINE 5018
// MISSING LINE 5019
// MISSING LINE 5020
// MISSING LINE 5021
// MISSING LINE 5022
// MISSING LINE 5023
// MISSING LINE 5024
// MISSING LINE 5025
// MISSING LINE 5026
// MISSING LINE 5027
// MISSING LINE 5028
// MISSING LINE 5029
// MISSING LINE 5030
// MISSING LINE 5031
// MISSING LINE 5032
// MISSING LINE 5033
// MISSING LINE 5034
// MISSING LINE 5035
// MISSING LINE 5036
// MISSING LINE 5037
// MISSING LINE 5038
// MISSING LINE 5039
// MISSING LINE 5040
// MISSING LINE 5041
// MISSING LINE 5042
// MISSING LINE 5043
// MISSING LINE 5044
// MISSING LINE 5045
// MISSING LINE 5046
// MISSING LINE 5047
// MISSING LINE 5048
// MISSING LINE 5049
// MISSING LINE 5050
// MISSING LINE 5051
// MISSING LINE 5052
// MISSING LINE 5053
// MISSING LINE 5054
// MISSING LINE 5055
// MISSING LINE 5056
// MISSING LINE 5057
// MISSING LINE 5058
// MISSING LINE 5059
// MISSING LINE 5060
// MISSING LINE 5061
// MISSING LINE 5062
// MISSING LINE 5063
// MISSING LINE 5064
// MISSING LINE 5065
// MISSING LINE 5066
// MISSING LINE 5067
// MISSING LINE 5068
// MISSING LINE 5069
// MISSING LINE 5070
// MISSING LINE 5071
// MISSING LINE 5072
// MISSING LINE 5073
// MISSING LINE 5074
// MISSING LINE 5075
// MISSING LINE 5076
// MISSING LINE 5077
// MISSING LINE 5078
// MISSING LINE 5079
// MISSING LINE 5080
// MISSING LINE 5081
// MISSING LINE 5082
// MISSING LINE 5083
// MISSING LINE 5084
// MISSING LINE 5085
// MISSING LINE 5086
// MISSING LINE 5087
// MISSING LINE 5088
// MISSING LINE 5089
// MISSING LINE 5090
// MISSING LINE 5091
// MISSING LINE 5092
// MISSING LINE 5093
// MISSING LINE 5094
// MISSING LINE 5095
// MISSING LINE 5096
// MISSING LINE 5097
// MISSING LINE 5098
// MISSING LINE 5099
// MISSING LINE 5100
// MISSING LINE 5101
// MISSING LINE 5102
// MISSING LINE 5103
// MISSING LINE 5104
// MISSING LINE 5105
// MISSING LINE 5106
// MISSING LINE 5107
// MISSING LINE 5108
// MISSING LINE 5109
// MISSING LINE 5110
// MISSING LINE 5111
// MISSING LINE 5112
// MISSING LINE 5113
// MISSING LINE 5114
// MISSING LINE 5115
// MISSING LINE 5116
// MISSING LINE 5117
// MISSING LINE 5118
// MISSING LINE 5119
// MISSING LINE 5120
// MISSING LINE 5121
// MISSING LINE 5122
// MISSING LINE 5123
// MISSING LINE 5124
// MISSING LINE 5125
// MISSING LINE 5126
// MISSING LINE 5127
// MISSING LINE 5128
// MISSING LINE 5129
// MISSING LINE 5130
// MISSING LINE 5131
// MISSING LINE 5132
// MISSING LINE 5133
// MISSING LINE 5134
// MISSING LINE 5135
// MISSING LINE 5136
// MISSING LINE 5137
// MISSING LINE 5138
// MISSING LINE 5139
// MISSING LINE 5140
// MISSING LINE 5141
// MISSING LINE 5142
// MISSING LINE 5143
// MISSING LINE 5144
// MISSING LINE 5145
// MISSING LINE 5146
// MISSING LINE 5147
// MISSING LINE 5148
// MISSING LINE 5149
                if (dateRangeMode === 'daily') {
                    startDate = new Date(d);
                    endDate = new Date(d);
                } else if (dateRangeMode === 'weekly') {
                    const day = d.getDay() || 7;
                    const monday = new Date(d);
                    if (day !== 1) monday.setDate(d.getDate() - (day - 1));
                    startDate = monday;
                    endDate = new Date(monday);
                    endDate.setDate(monday.getDate() + 4); // Mon-Fri
                } else if (dateRangeMode === 'monthly') {
                    startDate = new Date(d.getFullYear(), d.getMonth(), 1);
                    endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0);
                } else if (dateRangeMode === 'custom') {
                    startDate = customStartDate ? new Date(customStartDate) : new Date();
                    endDate = customEndDate ? new Date(customEndDate) : new Date();
                }
                return { startDate, endDate };
            }, [exportDate, dateRangeMode, customStartDate, customEndDate]);

            const formatDateRange = () => {
                const { startDate, endDate } = getDateRange();
                if (dateRangeMode === 'daily') return startDate.toLocaleDateString('en-CA');
                return `${startDate.toLocaleDateString('en-CA')} to ${endDate.toLocaleDateString('en-CA')}`;
            };

            const chunkArray = (arr, size) => {
                const chunks = [];
                for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
                return chunks;
            };

            // Check if a date is a holiday
            const isHoliday = useCallback((dateStr) => {
                return globalHolidays.some(h => h.date === dateStr);
            }, [globalHolidays]);

            // Generate preview data
            const handleGeneratePreview = async () => {
                setPreviewLoading(true);
                setPreviewData([]);
                try {
                    // 1. Filter trainees by scope
                    let targetTrainees = filteredByStatus;
                    if (exportScope === 'trainee' && selectedTrainee) {
                        targetTrainees = targetTrainees.filter(t => t.studentId === selectedTrainee.studentId);
                    } else if (exportScope === 'company' && selectedExportCompany) {
                        targetTrainees = targetTrainees.filter(t => (t.company || t['Company Name'] || '') === selectedExportCompany);
                    }

                    if (targetTrainees.length === 0) {
                        setPreviewLoading(false);
                        return;
                    }

                    // 2. Map student IDs to UIDs
                    const studentIds = targetTrainees.map(t => t.studentId).filter(Boolean);
                    let uidsMap = {};
                    if (studentIds.length > 0) {
                        const chunks = chunkArray(studentIds, 30);
                        for (const chunk of chunks) {
                            const snap = await getDocs(query(collectionGroup(db, 'profile'), where('studentId', 'in', chunk)));
                            snap.forEach(d => { const data = d.data(); if (data.studentId && data.uid) uidsMap[data.studentId] = data.uid; });
                        }
                    }

                    targetTrainees = targetTrainees.map(t => ({ ...t, uid: uidsMap[t.studentId] || null }));

                    // 3. Fetch attendance logs
                    const uids = targetTrainees.map(t => t.uid).filter(Boolean);
                    let allLogs = [];
                    if (uids.length > 0) {
                        const uidChunks = chunkArray(uids, 30);
                        for (const chunk of uidChunks) {
                            await Promise.all(chunk.map(async (uid) => {
                                try {
                                    const attSnap = await getDocs(collection(db, 'artifacts', APP_ID, 'users', uid, 'attendanceLogs'));
                                    attSnap.forEach(d => allLogs.push({ id: d.id, uid, ...d.data() }));
                                } catch (e) { /* skip */ }
                            }));
                        }
                    }

                    // 4. Fetch schooling records
                    let allSchooling = [];
                    if (studentIds.length > 0) {
                        const sChunks = chunkArray(studentIds, 30);
                        for (const chunk of sChunks) {
                            try {
                                const snap = await getDocs(query(collection(db, 'artifacts', APP_ID, 'public', 'data', 'mentoring_attendance'), where('studentId', 'in', chunk)));
                                snap.forEach(d => allSchooling.push({ id: d.id, ...d.data() }));
                            } catch (e) { /* skip */ }
                        }
                    }

                    // 5. Process each trainee
                    const { startDate, endDate } = getDateRange();
                    const isDailyFormat = dateRangeMode === 'daily' || dateRangeMode === 'custom';
                    const results = [];

                    targetTrainees.forEach(trainee => {
                        const traineeLogs = allLogs.filter(l => l.uid === trainee.uid);
                        const traineeSchooling = allSchooling.filter(s => s.studentId === trainee.studentId);
                        const traineeRestDay = (trainee.restDay || '').trim();
                        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

                        let daysPresent = 0;
                        let totalHours = 0;
                        let expectedWorkDays = 0;

                        let currDate = new Date(startDate);
                        while (currDate <= endDate) {
                            const dayOfWeek = currDate.getDay();
                            const dateStr = currDate.toLocaleDateString('en-CA');
                            const dayName = dayNames[dayOfWeek];

                            // Skip weekends
                            if (dayOfWeek === 0 || dayOfWeek === 6) {
                                currDate.setDate(currDate.getDate() + 1);
                                continue;
                            }

                            // Skip holidays
                            if (isHoliday(dateStr)) {
                                currDate.setDate(currDate.getDate() + 1);
                                continue;
                            }

                            // Skip trainee's rest day
                            if (traineeRestDay && dayName === traineeRestDay) {
                                currDate.setDate(currDate.getDate() + 1);
                                continue;
                            }

                            // Skip schooling day
                            const isSchoolingDay = traineeSchooling.some(s => {
                                const sDate = s.date || s.dateString || '';
                                return sDate === dateStr && ['Present', 'Late', 'Verified'].includes(s.status);
                            });
                            if (isSchoolingDay) {
                                currDate.setDate(currDate.getDate() + 1);
                                continue;
                            }

                            expectedWorkDays++;

                            // Check for attendance
                            const dayLogs = traineeLogs.filter(l => {
                                const logDate = l.date || l.dateString || '';
                                if (logDate === dateStr) return true;
                                if (l.timestamp) {
                                    const d = typeof l.timestamp.toDate === 'function' ? l.timestamp.toDate() : new Date(l.timestamp);
                                    return d.toLocaleDateString('en-CA') === dateStr;
                                }
                                if (l.timeIn) {
                                    const d = typeof l.timeIn.toDate === 'function' ? l.timeIn.toDate() : new Date(l.timeIn);
                                    return d.toLocaleDateString('en-CA') === dateStr;
                                }
                                return false;
                            });

                            let timeIn = null, timeOut = null;
                            let inLoc = null, outLoc = null;

                            dayLogs.forEach(l => {
                                if (l.type === 'IN') { timeIn = l.timestamp || l.timeIn; inLoc = getLoc(l.clockInDetails || l); }
                                else if (l.type === 'OUT') { timeOut = l.timestamp || l.timeOut; outLoc = getLoc(l.clockOutDetails || l); }
                                else if (l.timeIn) {
                                    timeIn = l.timeIn; timeOut = l.timeOut;
                                    inLoc = getLoc(l.clockInDetails || l);
                                    outLoc = getLoc(l.clockOutDetails || l);
                                }
                            });

                            if (timeIn) {
                                const tIn = typeof timeIn.toDate === 'function' ? timeIn.toDate() : new Date(timeIn);
                                let tOut = timeOut ? (typeof timeOut.toDate === 'function' ? timeOut.toDate() : new Date(timeOut)) : null;

                                if (isDailyFormat) {
                                    // Build daily-style row for this date
                                    const timeInStr = tIn.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                                    const timeOutStr = tOut ? tOut.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--';

                                    let remarksArr = [];
                                    let dailyHoursRendered = 0;
                                    const compSettings = companySettings[trainee.company || trainee['Company Name']];
                                    if (compSettings && compSettings.location) {
                                        const compLoc = getLoc(compSettings);
                                        if (inLoc && compLoc) {
                                            const dist = getDistanceFromLatLonInM(inLoc.lat, inLoc.lon, compLoc.lat, compLoc.lon);
                                            if (dist > (compSettings.radius || 1000)) remarksArr.push('<span style="color:red;font-weight:bold;">Clock In: Out of Range</span>');
                                            else remarksArr.push('<span style="color:green;font-weight:bold;">Clock In: Valid Location</span>');
                                        } else {
                                            remarksArr.push('<span style="color:red;font-weight:bold;">Clock In: No Location data</span>');
                                        }
                                        if (tOut) {
                                            if (outLoc && compLoc) {
                                                const dist = getDistanceFromLatLonInM(outLoc.lat, outLoc.lon, compLoc.lat, compLoc.lon);
                                                if (dist > (compSettings.radius || 1000)) remarksArr.push('<span style="color:red;font-weight:bold;">Clock Out: Out of Range</span>');
                                                else remarksArr.push('<span style="color:green;font-weight:bold;">Clock Out: Valid Location</span>');
                                            } else {
                                                remarksArr.push('<span style="color:red;font-weight:bold;">Clock Out: No Location data</span>');
                                            }
                                        }
                                    } else {
                                        remarksArr.push('No location required');
                                    }

                                    if (!tOut) {
                                        remarksArr.push('<span style="color:#0284c7;font-weight:bold;">Currently Clocked In</span>');
                                    } else {
                                        const nextDay = (() => { const nd = new Date(tIn); nd.setDate(nd.getDate() + 1); return nd.toLocaleDateString('en-CA') === tOut.toLocaleDateString('en-CA'); })();
                                        let hrs = (tOut - tIn) / (1000 * 60 * 60);
                                        const compName = trainee.company || trainee['Company Name'];
                                        const cs = companySettings[compName];
                                        if (cs && cs.breakMinutes) hrs -= (cs.breakMinutes / 60);
                                        hrs = Math.max(0, hrs);

                                        if (hrs < 0 || (tOut < tIn && !nextDay)) {
                                            remarksArr.push('<span style="color:red;font-weight:bold;">Incomplete Shift</span>');
                                            dailyHoursRendered = 0;
                                        } else if (hrs < 8) {
                                            remarksArr.push('<span style="color:#d97706;font-weight:bold;">Incomplete Shift (' + hrs.toFixed(1) + 'h)</span>');
                                            dailyHoursRendered = hrs;
                                        } else {
                                            remarksArr.push('<span style="color:#059669;font-weight:bold;">Completed Shift</span>');
                                            dailyHoursRendered = hrs;
                                        }
                                    }

                                    results.push({
                                        studentId: trainee.studentId,
                                        name: `${trainee.lastName || ''}, ${trainee.firstName || ''}`,
                                        company: trainee.company || trainee['Company Name'] || '',
                                        dateRange: dateStr,
                                        timeInStr,
                                        timeOutStr,
                                        dailyRemarksStr: remarksArr.join('<br/>'),
                                        dailyHoursRendered: dailyHoursRendered.toFixed(1)
                                    });
                                }

                                if (tIn && tOut) {
                                    let hours = (tOut - tIn) / (1000 * 60 * 60);
                                    const compName = trainee.company || trainee['Company Name'];
                                    const cs = companySettings[compName];
                                    if (cs && cs.breakMinutes) hours -= (cs.breakMinutes / 60);
                                    totalHours += Math.max(0, hours);
                                }
                                daysPresent++;
                            } else if (isDailyFormat) {
                                // No attendance for this day â€” push an absent row
                                results.push({
                                    studentId: trainee.studentId,
                                    name: `${trainee.lastName || ''}, ${trainee.firstName || ''}`,
                                    company: trainee.company || trainee['Company Name'] || '',
                                    dateRange: dateStr,
                                    timeInStr: '--:--',
                                    timeOutStr: '--:--',
                                    dailyRemarksStr: '<span style="color:red;font-weight:bold;">Absent</span>',
                                    dailyHoursRendered: '0.0'
                                });
                            }

                            currDate.setDate(currDate.getDate() + 1);
                        }

                        // For non-daily formats (weekly/monthly), push an aggregated row
                        if (!isDailyFormat) {
                            const daysAbsent = Math.max(0, expectedWorkDays - daysPresent);
                            results.push({
                                studentId: trainee.studentId,
                                name: `${trainee.lastName || ''}, ${trainee.firstName || ''}`,
                                company: trainee.company || trainee['Company Name'] || '',
                                dateRange: formatDateRange(),
                                daysPresent,
                                totalHours: totalHours.toFixed(1),
                                daysAbsent
                            });
                        }
                    });

                    setPreviewData(results);
                } catch (err) {
                    console.error('Export preview error:', err);
                }
                setPreviewLoading(false);
            };

            // XLS Export
            const handleExportXLS = () => {
                if (previewData.length === 0) return;

                const isDailyFormat = dateRangeMode === 'daily' || dateRangeMode === 'custom';
                const headers = ['Student ID#', 'Name', 'Assigned Company', 'Date/Date Range'];
                if (isDailyFormat) {
                    headers.push('Clock In', 'Clock Out', 'Total Hours Rendered', 'Remarks');
                } else {
                    headers.push('Days Present', 'Hours Present', 'Days Absent');
                }

                let tableContent = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;

                previewData.forEach((row, i) => {
                    const bgColor = i % 2 === 0 ? '#ffffff' : '#f8fafc';
                    tableContent += `<tr style="background-color: ${bgColor};">
                        <td>${row.studentId}</td>
                        <td>${row.name}</td>
                        <td>${row.company}</td>
                        <td>${row.dateRange}</td>
                        ${isDailyFormat ? `<td>${row.timeInStr}</td><td>${row.timeOutStr}</td><td>${row.dailyHoursRendered}</td><td>${row.dailyRemarksStr || 'N/A'}</td>` : `<td>${row.daysPresent}</td><td>${row.totalHours}</td><td>${row.daysAbsent}</td>`}
                    </tr>`;
                });

                const xlsTemplate = `
                    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
                    <head>
                        <meta charset="utf-8">
                        <style>
                            table { border-collapse: collapse; font-family: Arial, sans-serif; }
                            th { background-color: #10b981; color: white; font-weight: bold; font-size: 14px; border: 1px solid #cccccc; padding: 8px; text-align: left; }
                            td { border: 1px solid #cccccc; padding: 6px 8px; font-size: 13px; mso-number-format:"\\@"; }
                        </style>
                    </head>
                    <body><table>${tableContent}</table></body>
                    </html>
                `;
                const blob = new Blob([xlsTemplate], { type: 'application/vnd.ms-excel;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.setAttribute('href', url);
                const { startDate, endDate } = getDateRange();
                const scopeName = exportScope === 'trainee' && selectedTrainee ? selectedTrainee.studentId : (selectedExportCompany || 'All').replace(/\s+/g, '_');
                link.setAttribute('download', `Attendance_${scopeName}_${startDate.toLocaleDateString('en-CA')}_to_${endDate.toLocaleDateString('en-CA')}.xls`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            };

            const inputClass = 'w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium dark:text-white outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500';
            const labelClass = 'text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block';

            return (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-3xl">
                            <div>
                                <h3 className="text-xl font-black flex items-center gap-2"><Download size={20} /> Export Attendance Report</h3>
                                <p className="text-emerald-100 text-sm mt-0.5">Generate and export attendance data as XLS</p>
                            </div>
                            <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-xl transition-colors"><X size={20} /></button>
                        </div>

                        {/* Body - scrollable */}
                        <div className="overflow-y-auto flex-1 p-6 space-y-5">

                            {/* Row 1: Status + Scope */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Trainee Status</label>
                                    <select value={exportStatus} onChange={e => { setExportStatus(e.target.value); setSelectedTrainee(null); setSearchQuery(''); }} className={inputClass}>
                                        <option value="Active">Active</option>
                                        <option value="LOA">LOA</option>
                                        <option value="Completed IPT">Completed IPT</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Export Scope</label>
                                    <div className="flex gap-2">
                                        <button onClick={() => { setExportScope('company'); setSearchQuery(''); setSelectedTrainee(null); }} className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${exportScope === 'company' ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>Per Company</button>
                                        <button onClick={() => { setExportScope('trainee'); setSearchQuery(''); setSelectedExportCompany(''); }} className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${exportScope === 'trainee' ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>Per Trainee</button>
                                    </div>
                                </div>
                            </div>
                            </div>
                            {/* Row 2: Search */}
                            {/* Row 2: Search */}
                            {exportScope !== 'all_companies' && (
                                <div className="relative">
                                    <label className={labelClass}>{exportScope === 'trainee' ? 'Search Trainee' : 'Search Company'}</label>
                                )}
                                        type="text"
                                {/* Dropdown */}
                                {showDropdown && searchQuery.trim() && (
                                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                        {exportScope === 'trainee' && traineeSearchResults.map((t, i) => (
                                        className={`${inputClass} pl-9`}
                                    />
                                </div>
                                        />
                                {/* Selected indicator */}
                                {exportScope === 'trainee' && selectedTrainee && (
                                    {/* Selected indicator */}
                                    {exportScope === 'trainee' && selectedTrainee && (
                                        <span className="font-bold text-primary-700 dark:text-primary-300">{selectedTrainee.lastName}, {selectedTrainee.firstName}</span>
                                        <span className="text-primary-500">({selectedTrainee.studentId})</span>
                                        {((exportScope === 'trainee' && traineeSearchResults.length === 0) || (exportScope === 'company' && companySearchResults.length === 0)) && (
                                    </div>
                                )}
                                    </div>
                                )}
                            </div>
                                        <div className="mt-2 flex items-center gap-2 bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg px-3 py-2 text-sm">
                            {/* Row 3: Date Range Mode + Picker */}
                            <div>
                                <label className={labelClass}>Date Range</label>
                                <div className="flex gap-2 mb-3">
                                    {['daily', 'weekly', 'monthly', 'custom'].map(mode => (
                                </div>
                            )}
                                        </button>
                                {/* Dropdown */}
                                {showDropdown && searchQuery.trim() && (
                                <div className="flex gap-3 flex-wrap">
                                    {dateRangeMode === 'daily' && (
                                        <input type="date" value={exportDate} onChange={e => setExportDate(e.target.value)} className={inputClass + ' max-w-[200px]'} />
                                    )}
                                    {dateRangeMode === 'weekly' && (
                                        <input type="week" value={(() => { const d = new Date(exportDate); const ys = new Date(d.getFullYear(), 0, 1); const days = Math.floor((d - ys) / 86400000); const wn = Math.ceil((days + ys.getDay() + 1) / 7); return `${d.getFullYear()}-W${String(wn).padStart(2, '0')}`; })()} onChange={e => { const val = e.target.value; if (!val || !val.includes('-W')) return; const [y, w] = val.split('-W'); const jan1 = new Date(parseInt(y), 0, 1); const dow = jan1.getDay() || 7; const mon1 = new Date(jan1); mon1.setDate(jan1.getDate() + (1 - dow)); const target = new Date(mon1); target.setDate(mon1.getDate() + (parseInt(w) - 1) * 7); setExportDate(target.toLocaleDateString('en-CA')); }} className={inputClass + ' max-w-[200px]'} />
                                    )}
                                    {dateRangeMode === 'monthly' && (
                                        <input type="month" value={exportDate.substring(0, 7)} onChange={e => { let v = e.target.value; if (v.length === 7) v += '-01'; setExportDate(v); }} className={inputClass + ' max-w-[200px]'} />
                                    )}
                                    {dateRangeMode === 'custom' && (
                                        <>
                                        {((exportScope === 'trainee' && traineeSearchResults.length === 0) || (exportScope === 'company' && companySearchResults.length === 0)) && (
                                            <div className="px-4 py-3 text-sm text-slate-400 italic">No results found</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Row 3: Date Range Mode + Picker */}
                            <div>
                                <label className={labelClass}>Date Range</label>
                                <div className="flex gap-2 mb-3">
                                    {['daily', 'weekly', 'monthly', 'custom'].map(mode => (
                                        <button key={mode} onClick={() => setDateRangeMode(mode)} className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${dateRangeMode === mode ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                                            {mode}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-3 flex-wrap">
                                    {dateRangeMode === 'daily' && (
                                        <input type="date" value={exportDate} onChange={e => setExportDate(e.target.value)} className={inputClass + ' max-w-[200px]'} />
                                    )}
                                    {dateRangeMode === 'weekly' && (
                                        <input type="week" value={(() => { const d = new Date(exportDate); const ys = new Date(d.getFullYear(), 0, 1); const days = Math.floor((d - ys) / 86400000); const wn = Math.ceil((days + ys.getDay() + 1) / 7); return `${d.getFullYear()}-W${String(wn).padStart(2, '0')}`; })()} onChange={e => { const val = e.target.value; if (!val || !val.includes('-W')) return; const [y, w] = val.split('-W'); const jan1 = new Date(parseInt(y), 0, 1); const dow = jan1.getDay() || 7; const mon1 = new Date(jan1); mon1.setDate(jan1.getDate() + (1 - dow)); const target = new Date(mon1); target.setDate(mon1.getDate() + (parseInt(w) - 1) * 7); setExportDate(target.toLocaleDateString('en-CA')); }} className={inputClass + ' max-w-[200px]'} />
                                    )}
                                    {dateRangeMode === 'monthly' && (
                                        <input type="month" value={exportDate.substring(0, 7)} onChange={e => { let v = e.target.value; if (v.length === 7) v += '-01'; setExportDate(v); }} className={inputClass + ' max-w-[200px]'} />
                                    )}
                                    {dateRangeMode === 'custom' && (
                                        <>
                                            <div>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">Start</span>
                                                <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className={inputClass} />
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">End</span>
                                                <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className={inputClass} />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Generate Preview Button */}
                            <button
                                onClick={handleGeneratePreview}
                                disabled={previewLoading || (exportScope === 'trainee' && !selectedTrainee) || (exportScope === 'company' && !selectedExportCompany)}
                                className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                {previewLoading ? <><Loader2 className="animate-spin" size={16} /> Generating Preview...</> : <><Activity size={16} /> Generate Preview</>}
                            </button>

                            {/* Preview Table */}
                            {previewData.length > 0 && (
                                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                                    <div className="bg-slate-50 dark:bg-slate-900 px-4 py-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Preview â€” {previewData.length} record(s)</span>
                                    </div>
                                    <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                                        <table className="w-full text-sm">
                                            <thead className="sticky top-0 bg-slate-100 dark:bg-slate-900">
                                                <tr>
                                                    <th className="p-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-500">Student ID#</th>
                                                    <th className="p-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-500">Name</th>
                                                    <th className="p-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-500">Assigned Company</th>
                                                    <th className="p-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-500">Date/Date Range</th>
                                                    {(dateRangeMode === 'daily' || dateRangeMode === 'custom') ? (
                                                        <>
                                                            <th className="p-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-500">Clock In</th>
                                                            <th className="p-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-500">Clock Out</th>
                                                            <th className="p-3 text-center text-[10px] font-black uppercase tracking-wider text-blue-600">Total Hours</th>
                                                            <th className="p-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-500">Remarks</th>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <th className="p-3 text-center text-[10px] font-black uppercase tracking-wider text-emerald-600">Days Present</th>
                                                            <th className="p-3 text-center text-[10px] font-black uppercase tracking-wider text-red-500">Days Absent</th>
                                                        </>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody>
                                            <tbody>
                                                {previewData.map((row, i) => (
                                                    <tr key={i} className={`border-t border-slate-100 dark:border-slate-700 ${i % 2 === 0 ? '' : 'bg-slate-50 dark:bg-slate-900/50'}`}>
                                                        <td className="p-3 font-medium text-slate-700 dark:text-slate-300">{row.studentId}</td>
                                                        <td className="p-3 text-slate-600 dark:text-slate-400">{row.company}</td>
                                                        <td className="p-3 text-slate-600 dark:text-slate-400">{row.dateRange}</td>
                                                        {(dateRangeMode === 'daily' || dateRangeMode === 'custom') ? (
                                                        {(dateRangeMode === 'daily' || dateRangeMode === 'custom') ? (
                                                            <>
                                                                <td className="p-3 font-bold text-slate-600 dark:text-slate-400">{row.timeOutStr}</td>
                                                                <td className="p-3 text-center font-black text-blue-600">{row.dailyHoursRendered}</td>
                                                                <td className="p-3 text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-normal min-w-[220px]" dangerouslySetInnerHTML={{ __html: row.dailyRemarksStr || 'N/A' }} />
                                                            </>
                                                        ) : (
                                                        ) : (
                                                            <>
                                                                <td className="p-3 text-center font-black text-emerald-600">{row.daysPresent}</td>
                                                                <td className="p-3 text-center font-black text-red-500">{row.daysAbsent}</td>
                                                            </>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                            <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                            <button
                                onClick={handleExportXLS}
                                disabled={previewData.length === 0}
                                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center gap-2 shadow-sm"
                            >
                                <Download size={16} /> Download XLS
                            </button>
                        </div>
                    </div>
            );
        }
        }
const Sidebar = ({ user, activeView, setActiveView, selectedProject, setSelectedProject, isOpen, onClose, theme, setTheme, isSidebarCollapsed, setIsSidebarCollapsed }) => {
const Sidebar = ({ user, activeView, setActiveView, selectedProject, setSelectedProject, isOpen, onClose, theme, setTheme, isSidebarCollapsed, setIsSidebarCollapsed }) => {
    const currentUserName = user?.displayName || user?.email?.split('@')[0] || "User";
    const menuItems = [
    const menuItems = [
        { id: 'performance', name: 'ASTP Performance', icon: Activity },
        { id: 'ojtAttendance', name: 'OJT Attendance', icon: ClipboardList },
        { id: 'visitSchedule', name: 'Visit Schedule', icon: Calendar },
        { id: 'visitSchedule', name: 'Visit Schedule', icon: Calendar },
        { id: 'settings', name: 'Settings', icon: Settings },
    ];
    ];
    return (
    return (
        <>
            {!isSidebarCollapsed && (
            )}
            )}
            <div className={`fixed inset-y-0 left-0 z-50 md:static ${isSidebarCollapsed ? '-translate-x-full md:translate-x-0 md:w-20' : 'translate-x-0 w-64'} flex-shrink-0 bg-slate-50 dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300`}>
                <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700">
                    {!isSidebarCollapsed && <div className="font-bold text-lg text-primary-600 dark:text-primary-400 flex items-center gap-2">
                        <img src="/dualtech-logo.png" alt="Dualtech" className="w-8 h-8 object-contain" />
                        Dualtech
                    </div>}
                    {isSidebarCollapsed && <div className="w-full flex justify-center">
                        <img src="/dualtech-logo.png" alt="Dualtech" className="w-8 h-8 object-contain" />
                    </div>}
                    <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="hidden md:block p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md ml-auto">
// MISSING LINE 5731
// MISSING LINE 5732
// MISSING LINE 5733
// MISSING LINE 5734
// MISSING LINE 5735
// MISSING LINE 5736
// MISSING LINE 5737
// MISSING LINE 5738
// MISSING LINE 5739
// MISSING LINE 5740
// MISSING LINE 5741
// MISSING LINE 5742
// MISSING LINE 5743
// MISSING LINE 5744
// MISSING LINE 5745
// MISSING LINE 5746
// MISSING LINE 5747
// MISSING LINE 5748
// MISSING LINE 5749
// MISSING LINE 5750
// MISSING LINE 5751
// MISSING LINE 5752
// MISSING LINE 5753
// MISSING LINE 5754
// MISSING LINE 5755
// MISSING LINE 5756
// MISSING LINE 5757
// MISSING LINE 5758
// MISSING LINE 5759
// MISSING LINE 5760
// MISSING LINE 5761
// MISSING LINE 5762
// MISSING LINE 5763
// MISSING LINE 5764
// MISSING LINE 5765
// MISSING LINE 5766
// MISSING LINE 5767
// MISSING LINE 5768
// MISSING LINE 5769
// MISSING LINE 5770
// MISSING LINE 5771
// MISSING LINE 5772
// MISSING LINE 5773
// MISSING LINE 5774
// MISSING LINE 5775
// MISSING LINE 5776
// MISSING LINE 5777
// MISSING LINE 5778
// MISSING LINE 5779
// MISSING LINE 5780
// MISSING LINE 5781
// MISSING LINE 5782
// MISSING LINE 5783
// MISSING LINE 5784
// MISSING LINE 5785
// MISSING LINE 5786
// MISSING LINE 5787
// MISSING LINE 5788
// MISSING LINE 5789
// MISSING LINE 5790
// MISSING LINE 5791
// MISSING LINE 5792
// MISSING LINE 5793
// MISSING LINE 5794
// MISSING LINE 5795
// MISSING LINE 5796
// MISSING LINE 5797
// MISSING LINE 5798
// MISSING LINE 5799
// MISSING LINE 5800
// MISSING LINE 5801
// MISSING LINE 5802
// MISSING LINE 5803
// MISSING LINE 5804
// MISSING LINE 5805
// MISSING LINE 5806
// MISSING LINE 5807
// MISSING LINE 5808
// MISSING LINE 5809
// MISSING LINE 5810
// MISSING LINE 5811
// MISSING LINE 5812
// MISSING LINE 5813
// MISSING LINE 5814
// MISSING LINE 5815
// MISSING LINE 5816
// MISSING LINE 5817
// MISSING LINE 5818
// MISSING LINE 5819
// MISSING LINE 5820
// MISSING LINE 5821
// MISSING LINE 5822
// MISSING LINE 5823
// MISSING LINE 5824
// MISSING LINE 5825
// MISSING LINE 5826
// MISSING LINE 5827
// MISSING LINE 5828
// MISSING LINE 5829
// MISSING LINE 5830
// MISSING LINE 5831
// MISSING LINE 5832
// MISSING LINE 5833
// MISSING LINE 5834
// MISSING LINE 5835
// MISSING LINE 5836
// MISSING LINE 5837
// MISSING LINE 5838
// MISSING LINE 5839
// MISSING LINE 5840
// MISSING LINE 5841
// MISSING LINE 5842
// MISSING LINE 5843
// MISSING LINE 5844
// MISSING LINE 5845
// MISSING LINE 5846
// MISSING LINE 5847
// MISSING LINE 5848
// MISSING LINE 5849
// MISSING LINE 5850
// MISSING LINE 5851
// MISSING LINE 5852
// MISSING LINE 5853
// MISSING LINE 5854
// MISSING LINE 5855
// MISSING LINE 5856
// MISSING LINE 5857
// MISSING LINE 5858
// MISSING LINE 5859
// MISSING LINE 5860
// MISSING LINE 5861
// MISSING LINE 5862
// MISSING LINE 5863
// MISSING LINE 5864
// MISSING LINE 5865
// MISSING LINE 5866
// MISSING LINE 5867
// MISSING LINE 5868
// MISSING LINE 5869
// MISSING LINE 5870
// MISSING LINE 5871
// MISSING LINE 5872
// MISSING LINE 5873
// MISSING LINE 5874
// MISSING LINE 5875
// MISSING LINE 5876
// MISSING LINE 5877
// MISSING LINE 5878
// MISSING LINE 5879
// MISSING LINE 5880
// MISSING LINE 5881
// MISSING LINE 5882
// MISSING LINE 5883
// MISSING LINE 5884
// MISSING LINE 5885
// MISSING LINE 5886
// MISSING LINE 5887
// MISSING LINE 5888
// MISSING LINE 5889
// MISSING LINE 5890
// MISSING LINE 5891
// MISSING LINE 5892
// MISSING LINE 5893
// MISSING LINE 5894
// MISSING LINE 5895
// MISSING LINE 5896
// MISSING LINE 5897
// MISSING LINE 5898
// MISSING LINE 5899
// MISSING LINE 5900
// MISSING LINE 5901
// MISSING LINE 5902
// MISSING LINE 5903
// MISSING LINE 5904
// MISSING LINE 5905
// MISSING LINE 5906
// MISSING LINE 5907
// MISSING LINE 5908
// MISSING LINE 5909
// MISSING LINE 5910
// MISSING LINE 5911
// MISSING LINE 5912
// MISSING LINE 5913
// MISSING LINE 5914
// MISSING LINE 5915
// MISSING LINE 5916
// MISSING LINE 5917
// MISSING LINE 5918
// MISSING LINE 5919
// MISSING LINE 5920
// MISSING LINE 5921
// MISSING LINE 5922
// MISSING LINE 5923
// MISSING LINE 5924
// MISSING LINE 5925
// MISSING LINE 5926
// MISSING LINE 5927
// MISSING LINE 5928
// MISSING LINE 5929
// MISSING LINE 5930
// MISSING LINE 5931
// MISSING LINE 5932
// MISSING LINE 5933
// MISSING LINE 5934
// MISSING LINE 5935
// MISSING LINE 5936
// MISSING LINE 5937
// MISSING LINE 5938
// MISSING LINE 5939
// MISSING LINE 5940
// MISSING LINE 5941
// MISSING LINE 5942
// MISSING LINE 5943
// MISSING LINE 5944
// MISSING LINE 5945
// MISSING LINE 5946
// MISSING LINE 5947
// MISSING LINE 5948
// MISSING LINE 5949
                const updateItem = (field, id, key, value) => {
                    const newArray = project[field].map(item => item.id === id ? { ...item, [key]: value } : item);
                    updateProject(field, newArray);
                };

                const removeItem = (field, id) => {
                    const newArray = project[field].filter(item => item.id !== id);
                    updateProject(field, newArray);
                };

                return (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <button onClick={onBack} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition font-bold text-xs md:text-sm bg-white px-3 md:px-4 py-2 md:py-2 rounded-xl shadow-sm border border-slate-200 w-max active:scale-95">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                            Back
                        </button>

                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-black text-slate-800">{project.title}</h2>
                                <p className="text-slate-500 text-xs md:text-sm mt-1">Project Manager: <span className="font-bold text-slate-700">{project.creatorName}</span></p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
                                <select
                                    disabled={!isEditor}
                                    value={project.status}
                                    onChange={e => updateProject('status', e.target.value)}
                                    className={`flex-1 sm:flex-none px-4 py-2 rounded-xl font-bold text-sm border-2 outline-none ${project.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'} ${!isEditor ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                    <option value="Planning">Planning</option>
                                    <option value="Active">Active</option>
                                    <option value="On Hold">On Hold</option>
                                    <option value="Completed">Completed</option>
                                </select>

                                {/* Conditional View Only Badge OR Delete Button */}
                                {!isEditor ? (
                                    <span className="bg-slate-800 text-white px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm whitespace-nowrap">
                                        View Only
                                    </span>
                                ) : (
                                    <button
                                        onClick={handleDeleteProject}
                                        className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 transition shadow-sm active:scale-95 whitespace-nowrap"
                                        title="Delete Project"
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Google PM Tools Navigation - Mobile Optimized */}
                        <div className="flex gap-2 border-b border-slate-200 mb-8 overflow-x-auto hide-scrollbar pb-2 -mx-4 md:mx-0 px-4 md:px-0">
                            {[
                                { id: 'charter', label: 'Charter' },
                                { id: 'stakeholders', label: 'Stakeholders' },
                                { id: 'raci', label: 'RACI' },
                                { id: 'plan', label: 'Plan' },
                                { id: 'risks', label: 'Risks' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 md:px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm transition whitespace-nowrap active:scale-95 ${activeTab === tab.id ? 'bg-primary-600 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="bg-white p-4 md:p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">

                            {/* PROJECT CHARTER */}
                            {activeTab === 'charter' && (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Project Goal</label>
                                        <textarea readOnly={!isEditor} value={project.charter?.goal || ''} onChange={e => updateProject('charter', { ...project.charter, goal: e.target.value })} placeholder="What is the measurable outcome of this project?" className={`w-full border border-slate-200 rounded-xl p-4 min-h-[100px] outline-none ${isEditor ? 'bg-slate-50 focus:ring-2 focus:ring-primary-500' : 'bg-transparent'}`} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">In Scope</label>
                                            <textarea readOnly={!isEditor} value={project.charter?.inScope || ''} onChange={e => updateProject('charter', { ...project.charter, inScope: e.target.value })} placeholder="What exactly will be delivered?" className={`w-full border border-slate-200 rounded-xl p-4 min-h-[120px] outline-none ${isEditor ? 'bg-slate-50 focus:ring-2 focus:ring-primary-500' : 'bg-transparent'}`} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Out of Scope</label>
                                            <textarea readOnly={!isEditor} value={project.charter?.outOfScope || ''} onChange={e => updateProject('charter', { ...project.charter, outOfScope: e.target.value })} placeholder="What is explicitly excluded?" className={`w-full border border-slate-200 rounded-xl p-4 min-h-[120px] outline-none ${isEditor ? 'bg-slate-50 focus:ring-2 focus:ring-primary-500' : 'bg-transparent'}`} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STAKEHOLDER REGISTER */}
                            {activeTab === 'stakeholders' && (
                                <div>
                                    {isEditor && (
                                        <button onClick={() => addItem('stakeholders', { name: '', role: '', interest: 'High', influence: 'High' })} className="mb-4 bg-primary-50 text-primary-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-primary-100 transition">
                                            + Add Stakeholder
                                        </button>
                                    )}
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse min-w-[600px]">
                                            <thead>
                                                <tr className="bg-slate-50">
                                                    <th className="p-3 text-xs font-bold text-slate-500 uppercase rounded-tl-xl rounded-bl-xl">Name</th>
                                                    <th className="p-3 text-xs font-bold text-slate-500 uppercase">Role</th>
                                                    <th className="p-3 text-xs font-bold text-slate-500 uppercase">Interest</th>
                                                    <th className="p-3 text-xs font-bold text-slate-500 uppercase rounded-tr-xl rounded-br-xl">Influence</th>
                                                    {isEditor && <th></th>}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(project.stakeholders || []).map(sh => (
                                                    <tr key={sh.id} className="border-b border-slate-100 last:border-0">
                                                        <td className="p-2"><input readOnly={!isEditor} value={sh.name} onChange={e => updateItem('stakeholders', sh.id, 'name', e.target.value)} placeholder="Name" className="w-full p-2 bg-transparent outline-none focus:bg-slate-50 rounded-lg" /></td>
                                                        <td className="p-2"><input readOnly={!isEditor} value={sh.role} onChange={e => updateItem('stakeholders', sh.id, 'role', e.target.value)} placeholder="Role/Title" className="w-full p-2 bg-transparent outline-none focus:bg-slate-50 rounded-lg" /></td>
                                                        <td className="p-2"><select disabled={!isEditor} value={sh.interest} onChange={e => updateItem('stakeholders', sh.id, 'interest', e.target.value)} className="w-full p-2 bg-transparent outline-none"><option>High</option><option>Medium</option><option>Low</option></select></td>
                                                        <td className="p-2"><select disabled={!isEditor} value={sh.influence} onChange={e => updateItem('stakeholders', sh.id, 'influence', e.target.value)} className="w-full p-2 bg-transparent outline-none"><option>High</option><option>Medium</option><option>Low</option></select></td>
                                                        {isEditor && <td className="p-2 text-right"><button onClick={() => removeItem('stakeholders', sh.id)} className="text-rose-400 hover:text-rose-600 px-2 font-bold text-lg">&times;</button></td>}
                                                    </tr>
                                                ))}
                                                {(!project.stakeholders || project.stakeholders.length === 0) && <tr><td colSpan="5" className="p-6 text-center text-slate-400">No stakeholders mapped yet.</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* RACI CHART */}
                            {activeTab === 'raci' && (
                                <div>
                                    {isEditor && (
                                        <button onClick={() => addItem('raci', { task: '', r: currentUserName, a: currentUserName, c: '', i: '' })} className="mb-4 bg-primary-50 text-primary-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-primary-100 transition">
                                            + Add RACI Task
                                        </button>
                                    )}
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse min-w-[700px]">
                                            <thead>
                                                <tr className="bg-slate-50">
                                                    <th className="p-3 text-xs font-bold text-slate-500 uppercase rounded-tl-xl rounded-bl-xl w-1/3">Task / Deliverable</th>
                                                    <th className="p-3 text-xs font-bold text-blue-600 uppercase">R (Responsible)</th>
                                                    <th className="p-3 text-xs font-bold text-emerald-600 uppercase">A (Accountable)</th>
                                                    <th className="p-3 text-xs font-bold text-amber-600 uppercase">C (Consulted)</th>
                                                    <th className="p-3 text-xs font-bold text-purple-600 uppercase rounded-tr-xl rounded-br-xl">I (Informed)</th>
                                                    {isEditor && <th></th>}
                                                </tr>
                                            </thead>
                                            <tbody>
                                <div>
                                    {isEditor && (
                                        <button onClick={() => addItem('risks', { risk: '', prob: 'Medium', impact: 'Medium', mitigation: '' })} className="mb-4 bg-primary-50 text-primary-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-primary-100 transition">
                                            + Add Risk
                                        </button>
                                    )}
                                    <div className="space-y-4">
                                        {(project.risks || []).map(risk => (
                                            <div key={risk.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm relative">
                                                {isEditor && <button onClick={() => removeItem('risks', risk.id)} className="absolute top-4 right-4 text-rose-400 hover:text-rose-600 font-bold text-xl leading-none">&times;</button>}
                                                {(!project.raci || project.raci.length === 0) && <tr><td colSpan="6" className="p-6 text-center text-slate-400">No RACI matrix defined yet.</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Probability</label>
                            {/* PROJECT PLAN */}
                            {activeTab === 'plan' && (
                                <div>
                                    {isEditor && (
                                        <button onClick={() => addItem('plan', { task: '', assignee: currentUserName, status: 'Not Started', due: '' })} className="mb-4 bg-primary-50 text-primary-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-primary-100 transition">
                                            + Add Task
                                        </button>
                                    )}
                                    <div className="space-y-3">
                                        {(project.plan || []).map(task => (
                                            <div key={task.id} className="flex flex-col md:flex-row md:items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Mitigation Plan</label>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-3">
                                            </div>
                                        ))}
                                        {(!project.risks || project.risks.length === 0) && <div className="p-6 text-center text-slate-400">No risks identified.</div>}
                                    </div>
                                </div>
                            )}
                                                </div>
                        </div>
                    </div>
                );
            };
                                </div>
            // --- MAIN LAYOUT RENDER ---
            if (!authReady) {
                return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading portal access...</div>;
            }
                                <div>
            if (!user) {
                return <LoginScreen onLogin={handleLogin} error={authError} />;
            }

                        return (
                <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-900 transition-colors">
                    <Sidebar
                        theme={theme}
                        setTheme={setTheme}
                        user={user}
                        activeView={activeView}
                        setActiveView={setActiveView}
                        selectedProject={selectedProject}
                        setSelectedProject={setSelectedProject}
                        isOpen={sidebarOpen}
                        onClose={() => setSidebarOpen(false)}
                        isSidebarCollapsed={isSidebarCollapsed}
                        setIsSidebarCollapsed={setIsSidebarCollapsed}
                    />

                    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white dark:bg-slate-900">
                        {/* Header */}
                        <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-slate-200 dark:border-slate-700 relative z-30">
                            <div className="flex items-center flex-1">
                                <button
                                    onClick={() => setIsSidebarCollapsed(false)}
                                    className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full mr-2"
                                >
                                    <Menu size={20} />
                                </button>
                                {/* Search Bar - GMail Style */}
                                <div ref={searchRef} className="max-w-2xl w-full hidden md:flex flex-col relative z-50">
                                    <div className="flex-1 flex items-center bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2.5 focus-within:bg-white focus-within:shadow-md focus-within:ring-1 focus-within:ring-slate-300 dark:focus-within:bg-slate-700 dark:focus-within:ring-slate-600 transition-all relative">
                                        <Search size={20} className="text-slate-400" />
                                        <input
                                            type="text"
                                            value={globalSearchQuery}
                                            onChange={(e) => {
                                                setGlobalSearchQuery(e.target.value);
                                                setShowGlobalSearchDropdown(true);
                                            }}
                                            onFocus={() => setShowGlobalSearchDropdown(true)}
                                            placeholder={`Search for a module or function...`}
                                            className="w-full bg-transparent border-none outline-none ml-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-500"
                                        />
                                        <Filter size={18} className="text-slate-400 cursor-pointer hover:text-slate-600" />
                                    </div>
                                    {showGlobalSearchDropdown && globalSearchQuery.trim() !== '' && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                            {filteredGlobalTabs.length > 0 ? (
                                                filteredGlobalTabs.map(tab => {
                                                    const IconCmp = tab.icon;
