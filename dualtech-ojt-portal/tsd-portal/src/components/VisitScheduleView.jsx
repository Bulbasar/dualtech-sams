import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, MapPin, Loader2, X, Bell, Clock, CalendarDays, Calendar as CalendarMonth, AlignLeft, Edit2, Trash2 } from 'lucide-react';
import { collection, query, getDocs, addDoc, serverTimestamp, onSnapshot, updateDoc, deleteDoc, doc } from 'firebase/firestore';

// Note: Replace this with the actual URL from the user later, or read from settings.
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzeqh014p4ASVP-brwNJ1DLOeAr038X_bTMZs4VxEb1vwQZSGvnS39YPvyQ4GPw-aZn/exec";

export default function VisitScheduleView({ db, APP_ID, currentUser }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);

    const [companies, setCompanies] = useState([]);
    const [activeCompanies, setActiveCompanies] = useState(new Set());
    
    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [formData, setFormData] = useState({ companyName: '', agenda: '', time: '' });
    const [companySearch, setCompanySearch] = useState('');
    const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Users to notify
    const [registeredEmails, setRegisteredEmails] = useState([]);

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const traineesRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'trainees');
                const traineesSnap = await getDocs(traineesRef);
                const allComps = new Set();
                const activeComps = new Set();
                
                traineesSnap.forEach(doc => {
                    const data = doc.data();
                    const comp = (data.company || data['Company Name'] || '').trim();
                    const status = (data.status || data.Status || '').trim();
                    if (comp) {
                        allComps.add(comp);
                        if (status === 'Active') {
                            activeComps.add(comp);
                        }
                    }
                });
                
                setCompanies(Array.from(allComps).sort());
                setActiveCompanies(activeComps);

                const adminsRef = collection(db, 'admins');
                const adminsSnap = await getDocs(adminsRef);
                const emails = [];
                adminsSnap.forEach(doc => {
                    const data = doc.data();
                    if (data.email && data.email !== currentUser.email && data.allowedPortals && data.allowedPortals.includes('tsd_portal')) {
                        emails.push(data.email);
                    }
                });
                setRegisteredEmails(emails);

            } catch (err) {
                console.error("Error fetching initial data:", err);
            }
            setLoading(false);
        };
        fetchInitialData();

        const schedRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'visitSchedules');
        const unsubscribe = onSnapshot(schedRef, (snap) => {
            const arr = [];
            snap.forEach(doc => arr.push({ id: doc.id, ...doc.data() }));
            setSchedules(arr);
        });

        return () => unsubscribe();
    }, [db, APP_ID, currentUser.email]);

    // Calendar & Navigation logic
    const today = new Date();
    
    const navigatePrev = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'month') newDate.setMonth(newDate.getMonth() - 1);
        else if (viewMode === 'week') newDate.setDate(newDate.getDate() - 7);
        else if (viewMode === 'day') newDate.setDate(newDate.getDate() - 1);
        setCurrentDate(newDate);
    };

    const navigateNext = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + 1);
        else if (viewMode === 'week') newDate.setDate(newDate.getDate() + 7);
        else if (viewMode === 'day') newDate.setDate(newDate.getDate() + 1);
        setCurrentDate(newDate);
    };

    const navigateToday = () => {
        setCurrentDate(new Date());
    };

    // Format local date string safely to YYYY-MM-DD
    const formatDateStr = (d) => {
        return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    };

    const handleDateClick = (d) => {
        setSelectedDate(formatDateStr(d));
        setFormData({ companyName: '', agenda: '', time: '' });
        setCompanySearch('');
        setEditingId(null);
        setShowModal(true);
    };

    const openEditModal = (sched) => {
        setSelectedDate(sched.date);
        setFormData({
            companyName: sched.companyName,
            agenda: sched.agenda,
            time: sched.rawTime || ''
        });
        setCompanySearch(sched.companyName);
        setEditingId(sched.id);
        setShowModal(true);
    };

    const handleDeleteVisit = async (id) => {
        if (!window.confirm("Are you sure you want to delete this schedule?")) return;
        try {
            await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'visitSchedules', id));
            if (editingId === id) {
                setShowModal(false);
                setEditingId(null);
            }
        } catch (error) {
            console.error("Error deleting visit:", error);
            alert("Failed to delete schedule.");
        }
    };

    const handleSaveVisit = async () => {
        if (!formData.companyName || !formData.agenda || !formData.time) return alert("Please fill in all fields (Company, Date, Time, Agenda).");
        setSubmitting(true);
        try {
            // Format time for 12-hour display just for saving
            const [hh, mm] = formData.time.split(":");
            const hour = parseInt(hh, 10);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const h12 = hour % 12 || 12;
            const timeDisplay = `${h12}:${mm} ${ampm}`;

            if (editingId) {
                const docRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'visitSchedules', editingId);
                await updateDoc(docRef, {
                    companyName: formData.companyName,
                    time: timeDisplay,
                    rawTime: formData.time,
                    agenda: formData.agenda,
                    updatedAt: serverTimestamp()
                });
            } else {
                await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'visitSchedules'), {
                    companyName: formData.companyName,
                    date: selectedDate,
                    time: timeDisplay,
                    rawTime: formData.time,
                    agenda: formData.agenda,
                    createdBy: currentUser.displayName || currentUser.email,
                    creatorEmail: currentUser.email,
                    createdAt: serverTimestamp()
                });

                await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'notifications'), {
                    type: 'visit_schedule',
                    message: `${currentUser.displayName || currentUser.email} added a visit schedule to ${formData.companyName} on ${selectedDate} at ${timeDisplay}.`,
                    link: 'visitSchedule',
                    visitDate: selectedDate,
                    createdAt: serverTimestamp(),
                    dismissedBy: []
                });

                fetch(GAS_WEB_APP_URL, {
                    method: 'POST',
                    body: JSON.stringify({
                        company: formData.companyName,
                        date: selectedDate,
                        time: timeDisplay,
                        agenda: formData.agenda,
                        addedBy: currentUser.displayName || currentUser.email,
                        targetEmails: registeredEmails
                    }),
                    headers: {
                        "Content-Type": "text/plain;charset=utf-8",
                    }
                }).catch(e => console.error("GAS error:", e));
            }

            setShowModal(false);
            setEditingId(null);
        } catch (error) {
            console.error("Error saving visit:", error);
            alert("Failed to save schedule.");
        }
        setSubmitting(false);
    };

    const filteredCompanies = useMemo(() => {
        let list = companies;
        if (companySearch) {
            const q = companySearch.toLowerCase();
            list = list.filter(c => c.toLowerCase().includes(q));
        }
        return list.sort((a, b) => {
            const aActive = activeCompanies.has(a);
            const bActive = activeCompanies.has(b);
            if (aActive && !bActive) return -1;
            if (!aActive && bActive) return 1;
            return a.localeCompare(b);
        });
    }, [companies, companySearch, activeCompanies]);

    // Format time for rendering block
    const ScheduleBlock = ({ sched }) => (
        <div 
            onClick={(e) => {
                e.stopPropagation();
                if (sched.creatorEmail === currentUser.email) {
                    openEditModal(sched);
                }
            }}
            className={`text-left mb-1 p-1.5 md:p-2 bg-amber-50 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100 rounded-lg border border-amber-200 dark:border-amber-700/50 transition-shadow group relative ${sched.creatorEmail === currentUser.email ? 'cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/50 hover:shadow-md' : 'cursor-default hover:shadow-md'}`}
        >
            <div className="font-bold text-[10px] md:text-xs truncate">{sched.time} - {sched.companyName}</div>
            <div className="text-[10px] truncate opacity-80">{sched.agenda}</div>
            {/* Tooltip on hover */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-[200px] bg-slate-800 text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl hidden md:block whitespace-pre-wrap">
                <span className="font-bold text-amber-300">{sched.time}</span><br/>
                <span className="font-bold">{sched.companyName}</span><br/>
                {sched.agenda}
            </div>
        </div>
    );

    // Render Month View
    const renderMonthView = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        const rowsNeeded = Math.ceil((daysInMonth + firstDay) / 7);
        const totalCells = rowsNeeded * 7;

        return (
            <div className="flex-1 flex flex-col min-h-0">
                <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex-shrink-0">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="py-2 md:py-3 text-center text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{day}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 flex-1 bg-slate-200 dark:bg-slate-700 gap-[1px] overflow-y-auto" style={{ gridTemplateRows: `repeat(${rowsNeeded}, minmax(100px, 1fr))` }}>
                    {Array.from({ length: totalCells }).map((_, i) => {
                        const day = i - firstDay + 1;
                        const isCurrentMonth = day > 0 && day <= daysInMonth;
                        const dateObj = new Date(year, month, day);
                        const dStr = isCurrentMonth ? formatDateStr(dateObj) : null;
                        const isToday = isCurrentMonth && dStr === formatDateStr(today);
                        
                        // Sort schedules by time
                        const daySchedules = schedules.filter(s => s.date === dStr).sort((a, b) => (a.rawTime || '').localeCompare(b.rawTime || ''));

                        return (
                            <div 
                                key={i} 
                                onClick={() => isCurrentMonth && handleDateClick(dateObj)}
                                className={`bg-white dark:bg-slate-800 p-1 md:p-2 relative transition-colors ${!isCurrentMonth ? 'opacity-30 pointer-events-none' : 'hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer'} ${isToday ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}
                            >
                                {isCurrentMonth && (
                                    <>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className={`inline-flex items-center justify-center w-6 h-6 md:w-7 md:h-7 text-xs md:text-sm font-semibold rounded-full ${isToday ? 'bg-primary-600 text-white shadow-md' : 'text-slate-700 dark:text-slate-300'}`}>
                                                {day}
                                            </span>
                                            {daySchedules.length > 0 && (
                                                <span className="text-[10px] text-slate-400 font-medium md:hidden">{daySchedules.length} visits</span>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-1 overflow-y-auto max-h-24 md:max-h-full no-scrollbar">
                                            {daySchedules.map(sched => <ScheduleBlock key={sched.id} sched={sched} />)}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Render Week View
    const renderWeekView = () => {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Sunday

        const weekDays = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(startOfWeek);
            d.setDate(d.getDate() + i);
            return d;
        });

        return (
            <div className="flex-1 flex flex-col min-h-0">
                <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex-shrink-0">
                    {weekDays.map(d => {
                        const isToday = formatDateStr(d) === formatDateStr(today);
                        return (
                            <div key={d.toISOString()} className="py-2 md:py-3 text-center flex flex-col items-center">
                                <span className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                <span className={`mt-1 inline-flex items-center justify-center w-7 h-7 text-sm font-semibold rounded-full ${isToday ? 'bg-primary-600 text-white shadow-md' : 'text-slate-700 dark:text-slate-300'}`}>
                                    {d.getDate()}
                                </span>
                            </div>
                        );
                    })}
                </div>
                <div className="grid grid-cols-7 flex-1 bg-slate-200 dark:bg-slate-700 gap-[1px]">
                    {weekDays.map(d => {
                        const dStr = formatDateStr(d);
                        const isToday = dStr === formatDateStr(today);
                        const daySchedules = schedules.filter(s => s.date === dStr).sort((a, b) => (a.rawTime || '').localeCompare(b.rawTime || ''));
                        return (
                            <div 
                                key={d.toISOString()} 
                                onClick={() => handleDateClick(d)}
                                className={`bg-white dark:bg-slate-800 p-2 overflow-y-auto transition-colors hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer ${isToday ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}
                            >
                                <div className="flex flex-col gap-2">
                                    {daySchedules.map(sched => <ScheduleBlock key={sched.id} sched={sched} />)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Render Day View
    const renderDayView = () => {
        const dStr = formatDateStr(currentDate);
        const daySchedules = schedules.filter(s => s.date === dStr).sort((a, b) => (a.rawTime || '').localeCompare(b.rawTime || ''));
        const isToday = dStr === formatDateStr(today);

        return (
            <div className="flex-1 bg-white dark:bg-slate-800 overflow-y-auto p-4 md:p-8">
                <div className="max-w-3xl mx-auto flex flex-col items-center">
                    <div className="text-center mb-8">
                        <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{currentDate.toLocaleDateString('en-US', { weekday: 'long' })}</h3>
                        <p className={`text-lg font-bold mt-1 ${isToday ? 'text-primary-600' : 'text-slate-500'}`}>{currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                    
                    <div className="w-full space-y-4">
                        {daySchedules.length === 0 ? (
                            <div className="text-center p-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-4">
                                <CalendarDays size={48} className="text-slate-300 dark:text-slate-600" />
                                <p className="text-slate-500 font-medium">No visits scheduled for this day.</p>
                                <button onClick={() => handleDateClick(currentDate)} className="text-primary-600 font-bold hover:underline flex items-center gap-1"><Plus size={16}/> Add a visit</button>
                            </div>
                        ) : (
                            daySchedules.map(sched => (
                                <div key={sched.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-4 md:gap-6 items-start">
                                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 px-4 py-2 rounded-xl font-bold md:min-w-[120px] justify-center text-sm md:text-base">
                                        <Clock size={18} />
                                        {sched.time}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-1">{sched.companyName}</h4>
                                        <p className="text-slate-600 dark:text-slate-400 text-sm whitespace-pre-wrap"><AlignLeft size={16} className="inline mr-1 text-slate-400 -mt-0.5" />{sched.agenda}</p>
                                    </div>
                                    <div className="text-right text-xs text-slate-400 flex flex-col items-end gap-1 shrink-0">
                                        <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">Added by {sched.createdBy || 'Unknown'}</span>
                                        {sched.creatorEmail === currentUser.email && (
                                            <div className="flex gap-2 mt-2">
                                                <button onClick={() => openEditModal(sched)} className="p-1.5 bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"><Edit2 size={14}/></button>
                                                <button onClick={() => handleDeleteVisit(sched.id)} className="p-1.5 bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={14}/></button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                        {daySchedules.length > 0 && (
                             <button onClick={() => handleDateClick(currentDate)} className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center justify-center gap-2"><Plus size={18}/> Add Another Visit</button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const getHeaderText = () => {
        if (viewMode === 'month') {
            return currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        } else if (viewMode === 'week') {
            const start = new Date(currentDate);
            start.setDate(currentDate.getDate() - currentDate.getDay());
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            if (start.getMonth() === end.getMonth()) {
                return `${start.toLocaleString('en-US', { month: 'short' })} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
            }
            return `${start.toLocaleString('en-US', { month: 'short' })} ${start.getDate()} - ${end.toLocaleString('en-US', { month: 'short' })} ${end.getDate()}, ${start.getFullYear()}`;
        } else {
            return currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        }
    };

    return (
        <div className="p-4 md:p-6 lg:p-8 w-full max-w-7xl mx-auto h-full flex flex-col bg-slate-50 dark:bg-slate-900 rounded-3xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <MapPin className="text-primary-600" />
                        TSD Visit Schedule
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Collaborative calendar for company visits</p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                    {/* View Toggles */}
                    <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
                        <button onClick={() => setViewMode('month')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'month' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-200' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                            <CalendarMonth size={16} className="hidden sm:block"/> Month
                        </button>
                        <button onClick={() => setViewMode('week')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'week' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-200' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                            <CalendarDays size={16} className="hidden sm:block"/> Week
                        </button>
                        <button onClick={() => setViewMode('day')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'day' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-200' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                            <Calendar size={16} className="hidden sm:block"/> Day
                        </button>
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center gap-2 justify-between w-full sm:w-auto">
                        <button onClick={navigatePrev} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 transition active:scale-95 text-slate-600 dark:text-slate-300 shadow-sm"><ChevronLeft size={20} /></button>
                        <button onClick={navigateToday} className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 transition active:scale-95 text-slate-600 dark:text-slate-300 shadow-sm font-bold text-sm hidden sm:block">Today</button>
                        <h2 className="text-base sm:text-lg font-black text-slate-700 dark:text-slate-200 min-w-[140px] sm:min-w-[180px] text-center tracking-tight">
                            {getHeaderText()}
                        </h2>
                        <button onClick={navigateNext} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 transition active:scale-95 text-slate-600 dark:text-slate-300 shadow-sm"><ChevronRight size={20} /></button>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex-1 flex flex-col">
                {viewMode === 'month' && renderMonthView()}
                {viewMode === 'week' && renderWeekView()}
                {viewMode === 'day' && renderDayView()}
            </div>

            {/* ADD SCHEDULE MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-full">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 shrink-0">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <Calendar size={20} className="text-primary-500" />
                                {editingId ? "Edit Visit Schedule" : "Add Visit Schedule"}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-5 overflow-y-auto shrink-1">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Date</label>
                                    <input type="date" value={selectedDate} disabled className="w-full bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 px-4 py-3 rounded-xl border-none outline-none font-medium opacity-70" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Time</label>
                                    <input 
                                        type="time" 
                                        value={formData.time} 
                                        onChange={e => setFormData(prev => ({ ...prev, time: e.target.value }))}
                                        className="w-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all font-medium" 
                                    />
                                </div>
                            </div>

                            <div className="relative">
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Company</label>
                                <input 
                                    type="text" 
                                    placeholder="Search company..."
                                    value={companySearch}
                                    onFocus={() => setShowCompanyDropdown(true)}
                                    onChange={(e) => {
                                        setCompanySearch(e.target.value);
                                        setFormData(prev => ({ ...prev, companyName: e.target.value }));
                                        setShowCompanyDropdown(true);
                                    }}
                                    className="w-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all font-medium"
                                />
                                {showCompanyDropdown && (
                                    <div className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                                        {filteredCompanies.map(comp => {
                                            const isActive = activeCompanies.has(comp);
                                            return (
                                                <div 
                                                    key={comp} 
                                                    onClick={() => {
                                                        setFormData(prev => ({ ...prev, companyName: comp }));
                                                        setCompanySearch(comp);
                                                        setShowCompanyDropdown(false);
                                                    }}
                                                    className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer flex justify-between items-center transition-colors border-b border-slate-50 dark:border-slate-700/50 last:border-0"
                                                >
                                                    <span className="font-medium text-slate-700 dark:text-slate-300">{comp}</span>
                                                    {isActive && <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg shrink-0 ml-2">Active</span>}
                                                </div>
                                            );
                                        })}
                                        {filteredCompanies.length === 0 && (
                                            <div className="px-4 py-3 text-slate-500 text-sm">No companies found</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Agenda / Notes</label>
                                <textarea 
                                    rows="4" 
                                    placeholder="Enter the purpose of the visit..."
                                    value={formData.agenda}
                                    onChange={e => setFormData(prev => ({ ...prev, agenda: e.target.value }))}
                                    className="w-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all resize-none font-medium"
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center shrink-0">
                            <div>
                                {editingId && (
                                    <button onClick={() => handleDeleteVisit(editingId)} className="p-2.5 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition flex items-center gap-2 font-bold text-sm">
                                        <Trash2 size={16} /> <span className="hidden sm:inline">Delete</span>
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => { setShowModal(false); setEditingId(null); }} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition active:scale-95">Cancel</button>
                                <button 
                                    onClick={handleSaveVisit} 
                                    disabled={submitting || !formData.companyName || !formData.agenda || !formData.time}
                                    className="px-5 py-2.5 rounded-xl font-bold bg-primary-600 text-white hover:bg-primary-700 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md shadow-primary-500/20"
                                >
                                    {submitting ? <Loader2 className="animate-spin" size={18} /> : (editingId ? <Edit2 size={18} /> : <Plus size={18} />)}
                                    {editingId ? "Update" : "Add Schedule"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
