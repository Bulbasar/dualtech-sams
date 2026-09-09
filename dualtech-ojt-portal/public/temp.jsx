import React from 'react';
export default function Dashboard() { 
            return (
                <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col relative font-sans">
                    {/* FB-Style Top Navigation */}
                    <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm h-14 flex items-center justify-between px-4">
                        <div className="flex items-center gap-2 w-1/4">
                            <div className="bg-blue-600 text-white p-1 rounded-full w-9 h-9 flex items-center justify-center font-black text-sm shadow-inner">DT</div>
                            <span className="font-bold text-slate-800 dark:text-slate-100 hidden sm:block text-lg">Dualtech</span>
                        </div>
                        <div className="flex-1 max-w-xl mx-4 hidden md:block">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input type="text" placeholder="Search dualtech..." className="w-full bg-slate-100 dark:bg-slate-800 rounded-full py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 w-1/4">
                            <button className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">
                                <MessageCircle size={20} className={activeTab === 'profile' ? 'fill-blue-500 text-blue-500' : ''} />
                            </button>
                            <button className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">
                                <Bell size={20} />
                            </button>
                            <button onClick={() => setActiveTab('profile')} className="w-10 h-10 ml-2 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 overflow-hidden border border-slate-200 hover:opacity-80 transition-opacity">
                                <User size={20} />
                            </button>
                        </div>
                    </header>

                    {/* MAIN 3-COLUMN CONTENT */}
                    <div className="flex-1 flex max-w-[1600px] mx-auto w-full pt-4">

                        {/* LEFT SIDEBAR (Desktop) */}
                        <div className="hidden md:flex w-[280px] flex-col sticky top-[72px] h-[calc(100vh-80px)] overflow-y-auto px-2 pb-4">
                            <div className="flex items-center gap-3 p-2 mb-4">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200">
                                    <User size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 leading-tight">{profile.given} {profile.family}</h3>
                                    <p className="text-xs text-slate-500">{profile.studentId}</p>
                                </div>
                            </div>
                            <nav className="space-y-1">
                                <button onClick={() => setActiveTab('home')} className={`w-full flex items-center gap-3 p-3 rounded-lg font-medium transition-colors ${activeTab === 'home' ? 'bg-slate-200 dark:bg-slate-800' : 'text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'}`}><Home size={24} className="text-blue-500 fill-blue-500/20" /> Clock In/Out</button>
                                <button onClick={() => setActiveTab('history')} className={`w-full flex items-center gap-3 p-3 rounded-lg font-medium transition-colors ${activeTab === 'history' ? 'bg-slate-200 dark:bg-slate-800' : 'text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'}`}><History size={24} className="text-blue-500" /> Attendance History</button>
                                <button onClick={() => setActiveTab('absence')} className={`w-full flex items-center gap-3 p-3 rounded-lg font-medium transition-colors ${activeTab === 'absence' ? 'bg-slate-200 dark:bg-slate-800' : 'text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'}`}><FileText size={24} className="text-blue-500" /> Absences</button>
                                <button onClick={() => setActiveTab('schooling')} className={`w-full flex items-center gap-3 p-3 rounded-lg font-medium transition-colors ${activeTab === 'schooling' ? 'bg-slate-200 dark:bg-slate-800' : 'text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'}`}><BookOpen size={24} className="text-blue-500" /> Schooling</button>
                                <button onClick={() => setActiveTab('diligence')} className={`w-full flex items-center gap-3 p-3 rounded-lg font-medium transition-colors ${activeTab === 'diligence' ? 'bg-slate-200 dark:bg-slate-800' : 'text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'}`}><Award size={24} className="text-blue-500" /> Diligence Report</button>
                                <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 p-3 rounded-lg font-medium transition-colors ${activeTab === 'profile' ? 'bg-slate-200 dark:bg-slate-800' : 'text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'}`}><Settings size={24} className="text-slate-500" /> Profile Settings</button>
                            </nav>
                            <hr className="my-4 border-slate-300 dark:border-slate-700 mx-2" />
                            <button onClick={() => signOut(auth)} className="w-full flex items-center gap-3 p-3 rounded-lg font-medium text-slate-700 hover:bg-slate-200 dark:text-slate-300 transition-colors"><LogOut size={24} className="text-slate-500" /> Sign Out</button>
                            <div className="mt-auto px-3 text-xs text-slate-400">
                                Privacy · Terms · Dualtech © 2026
                            </div>
                        </div>

                        {/* CENTER FEED */}
                        <div className="flex-1 max-w-[680px] mx-auto w-full px-2 md:px-6 pb-24 md:pb-8 shrink-0">
                            {/* Survey Modal Overlay */}
                            {showSurvey && activeSurvey && (
                                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 overflow-y-auto">
                                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative my-auto animate-in zoom-in duration-300">
                                        {/* Can only close if dismissed less than 2 times (0 or 1). On 3rd appearance (count >= 2), force answer */}
                                        {surveyDismissCount < 2 && (
                                            <button onClick={handleDismissSurvey} className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 dark:bg-slate-700 rounded-full transition-colors">
                                                <X size={20} />
                                            </button>
                                        )}
        
                                        <div className="mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                                            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">{activeSurvey.title}</h2>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{activeSurvey.description}</p>
                                            {surveyDismissCount >= 2 && (
                                                <div className="mt-3 inline-flex items-center gap-2 bg-amber-50 text-amber-700 text-xs font-bold px-3 py-2 rounded-lg border border-amber-200">
                                                    <AlertTriangle size={14} /> Action Required: You must complete this survey to proceed.
                                                </div>
                                            )}
                                        </div>
        
                                        <form onSubmit={handleSurveySubmit} className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                                            {activeSurvey.questions.map((q, idx) => (
                                                <div key={q.id} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">{idx + 1}. {q.prompt}</label>
        
                                                    {q.type === 'short_text' && (
                                                        <input type="text" required onChange={e => setSurveyAnswers({ ...surveyAnswers, [q.id]: e.target.value })} className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500" placeholder="Your answer..." />
                                                    )}
        
                                                    {q.type === 'long_text' && (
                                                        <textarea required rows="3" onChange={e => setSurveyAnswers({ ...surveyAnswers, [q.id]: e.target.value })} className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 resize-none" placeholder="Your detailed answer..."></textarea>
                                                    )}
        
                                                    {q.type === 'multiple_choice' && (
                                                        <div className="space-y-2">
                                                            {q.options.split(',').map((opt, i) => (
                                                                <label key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-blue-300">
                                                                    <input type="radio" name={`survey_${q.id}`} value={opt.trim()} required onChange={e => setSurveyAnswers({ ...surveyAnswers, [q.id]: e.target.value })} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                                                                    <span className="text-sm text-slate-700 dark:text-slate-200 font-medium">{opt.trim()}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    )}
        
                                                    {q.type === 'file_upload' && (
                                                        <input type="file" accept="image/*" required onChange={e => setSurveyFiles({ ...surveyFiles, [q.id]: e.target.files[0] })} className="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                                                    )}
                                                </div>
                                            ))}
        
                                            <button type="submit" disabled={submittingSurvey} className="w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md flex items-center justify-center gap-2">
                                                {submittingSurvey ? <Loader2 className="animate-spin" size={20} /> : 'Submit Answers'}
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            )}
        
                            {/* Make Up Modal Overlay */}
                            {showMakeupModal && isActive && (
                                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 animate-fade-in">
                                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
                                        <button onClick={() => setShowMakeupModal(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 dark:bg-slate-700 rounded-full transition-colors"><X size={20} /></button>
                                        <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2"><Calendar className="text-blue-600" /> Request Make-Up</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Schedule extra hours to make up for your absence on <strong className="text-slate-700 dark:text-slate-200">{makeupForm.absenceDate}</strong>.</p>
        
                                        <form onSubmit={submitMakeupRequest} className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Proposed Make-Up Date</label>
                                                <input type="date" value={makeupForm.makeUpDate} onChange={e => setMakeupForm({ ...makeupForm, makeUpDate: e.target.value })} required className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500" min={getLocalYYYYMMDD(new Date())} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Time From</label>
                                                    <input type="time" value={makeupForm.timeFrom} onChange={e => setMakeupForm({ ...makeupForm, timeFrom: e.target.value })} required className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Time To</label>
                                                    <input type="time" value={makeupForm.timeTo} onChange={e => setMakeupForm({ ...makeupForm, timeTo: e.target.value })} required className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500" />
                                                </div>
                                            </div>
                                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-2">
                                                <p className="text-xs text-blue-800 font-medium"><strong>Note:</strong> Make-up hours are strictly calculated as time rendered <strong>in excess of your standard 8 hours</strong> on the scheduled day. Make-up requires approval from {profile.companyName} HR.</p>
                                            </div>
                                            <button disabled={submittingMakeup} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 disabled:opacity-50">
                                                {submittingMakeup ? 'Submitting...' : 'Submit Request to HR'}
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            )}
        
                            {isOffline && (
                                <div className="bg-amber-100 border-b border-amber-200 p-3 flex items-center justify-center gap-2 text-amber-800 text-xs font-bold w-full z-50 sticky top-14 shadow-sm animate-pulse mb-4 rounded-xl">
                                    <AlertTriangle size={16} />
                                    Weak or no connection. Logs will sync automatically.
                                </div>
                            )}

                            {/* Floating Glassmorphic Mobile Bottom Nav */}
                            <div className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around py-1 px-1 sm:px-2">
                                {[
                                    { id: 'home', icon: Home, label: 'Clock' },
                                    { id: 'history', icon: History, label: 'History' },
                                    { id: 'absence', icon: FileText, label: 'Absence' },
                                    { id: 'schooling', icon: BookOpen, label: 'School' },
                                    { id: 'profile', icon: Settings, label: 'Menu' }
                                ].map(btn => (
                                    <button key={btn.id} onClick={() => setActiveTab(btn.id)}
                                        className={`flex flex-col items-center justify-center gap-1 p-2 w-full max-w-[64px]
                                        ${activeTab === btn.id
                                                ? 'text-blue-600'
                                                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}>
                                        <btn.icon size={24} className={activeTab === btn.id ? 'fill-blue-500/20' : ''} />
                                        <span className="text-[10px] font-medium text-center truncate w-full">
                                            {btn.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        {/* 👇 PASTE THE NEW BADGE HERE 👇 */}
                        {/* --- NEW: LIVE LOCATION PING BADGE --- */}
                        <div className="flex items-center justify-center mt-4 w-full px-4 shrink-0">
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
                                <span className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold shadow-sm border border-blue-200 w-fit">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping absolute"></div>
                                    <div className="w-2 h-2 rounded-full bg-blue-500 relative"></div>
                                    Verified: Inside Plant
                                </span>
                            )}

                            {liveStatus === 'out-zone' && (
                                <span className="flex items-center gap-2 px-3 py-1.5 bg-rose-100 text-rose-700 rounded-full text-xs font-bold shadow-sm border border-rose-200 w-fit">
                                    <div className="w-2 h-2 rounded-full bg-rose-500 relative"></div>
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
                                    GPS Signal Lost / Denied
                                </span>
                            )}
                        </div>

                        {/* DYNAMIC ANNOUNCEMENT MESSAGE BUBBLE */}
                        {isActive && latestAnnouncement && (
                            <div className="bg-blue-50 border border-blue-200 p-4 md:p-5 rounded-2xl shadow-sm flex items-start gap-4 text-blue-900 mb-6 animate-fade-in relative">
                                {/* Unread Ping Indicator */}
                                <div className="absolute top-0 right-0 -mt-2 -mr-2 flex h-4 w-4">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 border border-white"></span>
                                </div>

                                <div className="bg-white p-2.5 rounded-2xl shrink-0 mt-0.5 shadow-sm border border-blue-100">
                                    <Megaphone className="text-blue-600" size={20} />
                                </div>

                                <div className="flex-1 w-full">
                                    <p className="font-black text-lg leading-tight pr-4">
                                        {latestAnnouncement.title}
                                    </p>

                                    {/* Fallback to check both .content and .message */}
                                    <p className="text-sm mt-2 font-medium text-blue-800/90 leading-relaxed whitespace-pre-wrap">
                                        {latestAnnouncement.content || latestAnnouncement.message}
                                    </p>

                                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-blue-200/60">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md">
                                            {latestAnnouncement.authorIC || 'System Broadcast'}
                                        </span>
                                        <span className="text-[10px] font-bold text-blue-600/80">
                                            {latestAnnouncement.createdAt
                                                ? new Date(latestAnnouncement.createdAt?.toDate ? latestAnnouncement.createdAt.toDate() : latestAnnouncement.createdAt).toLocaleDateString('en-us')
                                                : ''}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ACCOUNT INACTIVE BANNER */}
                        {!isActive && (
                            <div className="bg-red-50 border-2 border-red-300 p-5 rounded-3xl shadow-sm flex items-start gap-4 text-red-800 mb-6 animate-fade-in">
                                <Ban className="shrink-0 mt-1" size={28} />
                                <div>
                                    <p className="font-black text-lg">Account Inactive: {masterStatus}</p>
                                    <p className="text-sm mt-1 font-medium text-red-700 leading-relaxed">
                                        Your current training status is marked as <strong>"{masterStatus}"</strong>. Action controls (such as clocking in, disputing, and filing absences) have been disabled.
                                        Please contact your Industrial Coordinator for details or clearance.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* 9+ ABSENCES WARNING BANNER */}
                        {isActive && !dismissedWarning && (activeTab === 'home' || activeTab === 'history') && totalAbsences >= 9 && (
                            <div className="bg-red-50 border-2 border-red-200 p-5 rounded-3xl shadow-sm flex items-start gap-4 text-red-700 mb-6 animate-fade-in relative pr-10">

                                {/* Close/Dismiss Button */}
                                <button onClick={() => setDismissedWarning(true)} className="absolute top-4 right-4 p-1 rounded-full hover:bg-red-100 transition-colors text-red-700 opacity-70 hover:opacity-100">
                                    <X size={20} />
                                </button>

                                <AlertTriangle className="shrink-0 mt-1" size={28} />
                                <div>
                                    <p className="font-black text-lg text-red-800">Warning: Allowable Absences Exceeded</p>
                                    <p className="text-sm mt-1 font-medium text-red-700 leading-relaxed">
                                        You currently have <strong>{totalAbsences} recorded absences</strong> since you registered in the portal, which is more than the allowable limit.
                                        Please go to the History tab to submit a dispute or schedule a make-up for unrecorded days.
                                    </p>
                                    {activeTab !== 'history' && (
                                        <button onClick={() => setActiveTab('history')} className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-700 transition-colors shadow-sm active:scale-95">
                                            Go to History & Make-Ups
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}


                        {/* TAB 1: HOME */}
                        {activeTab === 'home' && (
                            <div className="space-y-6 animate-fade-in">
                                <div><h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Hi, {profile.given}!</h1><p className="text-slate-500 dark:text-slate-400 font-medium">Record your daily attendance.</p></div>

                                {/* NEW: UNSYNCED DATA WARNING BADGE */}
                                {unsyncedLogsCount > 0 && (
                                    <div className="bg-amber-50 border-2 border-dashed border-amber-400 p-5 rounded-3xl shadow-sm flex items-start gap-4 text-amber-900 animate-pulse">
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

                                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
                                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2"><Clock className="text-blue-500" /> Live Attendance</h2>

                                    {/* --- BREAK POLICY NOTICE --- */}
                                    {breakSettings.applyBreak && (
                                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 animate-fade-in">
                                            <div className="text-blue-600 mt-0.5">
                                                <Info size={16} />
                                            </div>
                                            <div className="text-xs text-blue-800">
                                                <p className="font-black mb-0.5">Company Break Policy Active</p>
                                                <p>A mandatory break of <strong>{breakSettings.breakMinutes} minutes</strong> is automatically deducted from your total daily hours for any shift exceeding 4 hours.</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* CONDITIONAL RENDER BASED ON ATTENDANCE TYPE */}
                                    {attendanceType === 'Individual Mobile Phone' && (
                                        <div className="space-y-4 animate-fade-in mt-4 mb-4">
                                            {/* ========================================== */}
                                            {/* NEW: Explicit Geolocation Consent UI */}
                                            {/* ========================================== */}
                                            <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl transition-all">
                                                <input
                                                    type="checkbox"
                                                    id="geo-consent-checkbox"
                                                    checked={geoConsent}
                                                    onChange={(e) => setGeoConsent(e.target.checked)}
                                                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                                                />
                                                <label htmlFor="geo-consent-checkbox" className="text-xs text-slate-600 font-medium leading-relaxed select-none cursor-pointer">
                                                    I explicitly authorize the system to access and process my device's real-time geographic location. I understand this data is used solely to verify my physical presence within the company's authorized geofenced zone during clock-in/out attempts.
                                                </label>
                                            </div>

                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => initiateClockFlow('in')}
                                                    disabled={!isActive || clockState.isClockedIn || loadingLoc || !geoConsent}
                                                    className={`flex-1 py-4 md:py-6 rounded-2xl font-black md:text-lg transition-all ${!isActive || clockState.isClockedIn || !geoConsent
                                                            ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                                                            : 'bg-green-500 text-white shadow-md active:scale-95 hover:bg-green-600'
                                                        }`}
                                                >
                                                    {loadingLoc && !clockState.isClockedIn ? 'Locating...' : 'Clock In'}
                                                </button>
                                                <button
                                                    onClick={() => initiateClockFlow('out')}
                                                    disabled={!isActive || !clockState.isClockedIn || loadingLoc || !geoConsent}
                                                    className={`flex-1 py-4 md:py-6 rounded-2xl font-black md:text-lg transition-all ${!isActive || !clockState.isClockedIn || !geoConsent
                                                            ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                                                            : 'bg-blue-600 text-white shadow-md active:scale-95 hover:bg-blue-700'
                                                        }`}
                                                >
                                                    {loadingLoc && clockState.isClockedIn ? 'Locating...' : 'Clock Out'}
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
                                                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-4">
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
                                            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-4">
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

                                    {locationMsg && (
                                        <div className={`mt-6 p-4 rounded-2xl flex flex-col gap-3 border relative pr-10 ${locationMsg.includes('BLOCKED') ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                                            <button onClick={() => setLocationMsg('')} className="absolute top-3 right-3 p-1 rounded-full hover:bg-black/5 transition-colors text-current opacity-70 hover:opacity-100">
                                                <X size={18} />
                                            </button>

                                            <div className="flex items-start gap-2">
                                                {locationMsg.includes('BLOCKED') ? <AlertTriangle className="shrink-0 mt-0.5" /> : <AlertTriangle className="shrink-0 mt-0.5" />}
                                                <p className="font-bold text-sm leading-tight">{locationMsg}</p>
                                            </div>

                                            {isActive && isDisputed && (
                                                <button onClick={() => submitDispute(clockState.activeDocId || "Blocked Clock Attempt")} className="bg-red-600 text-white text-sm font-bold py-3 rounded-xl hover:bg-red-700 active:scale-95 transition-transform w-full">File a Dispute for this Block</button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
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
                            </div>
                        )}

                        {/* TAB 2: HISTORY */}
                        {activeTab === 'history' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                                    <div>
                                        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Attendance History</h1>
                                        <p className="text-slate-500 dark:text-slate-400 font-medium">Review monthly records, dispute absences, or request make-ups.</p>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                                        <Calendar size={18} className="text-blue-500 ml-2" />
                                        <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="p-2 font-bold text-slate-700 dark:text-slate-200 outline-none bg-transparent" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 text-center"><p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Days Present</p><p className="text-3xl font-black text-green-600">{historyStats.present}</p></div>
                                    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 text-center"><p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Days Absent</p><p className={`text-3xl font-black ${historyStats.absent >= 9 ? 'text-red-600' : 'text-rose-600'}`}>{historyStats.absent}</p><p className="text-[10px] text-slate-400 mt-1">In Selected Month</p></div>
                                </div>

                                {historyStats.missingDates.length > 0 && (
                                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
                                        <h3 className="font-bold text-rose-600 mb-4 flex items-center gap-2"><AlertTriangle size={18} /> Absences & Make-Up (Action Required)</h3>
                                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                            {historyStats.missingDates.map(date => {
                                                const makeupStatus = getMakeupStatus(date);
                                                const isComplete = makeupStatus?.label === 'Make up complete';

                                                return (
                                                    <div key={date} className={`flex flex-col lg:flex-row justify-between lg:items-center gap-4 p-4 rounded-xl border ${isComplete ? 'bg-blue-50 border-blue-100' : 'bg-rose-50 border-rose-100'}`}>
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <p className={`font-black ${isComplete ? 'text-blue-800' : 'text-rose-800'}`}>{new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                                                                <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded ${isComplete ? 'bg-blue-200 text-blue-800' : 'bg-rose-200 text-rose-800'}`}>
                                                                    {isComplete ? 'Resolved' : 'Absent'}
                                                                </span>
                                                            </div>
                                                            {!makeupStatus && <p className="text-xs text-rose-600">No clock in/out found. Dispute or schedule make-up.</p>}
                                                            {makeupStatus && (
                                                                <span className={`px-2 py-1 text-xs font-bold rounded-lg inline-block mt-1 ${makeupStatus.color}`}>
                                                                    Status: {makeupStatus.label}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="flex flex-wrap gap-2 lg:justify-end shrink-0">
                                                            {isActive && !isComplete && (
                                                                <>
                                                                    <button onClick={() => submitAbsenceDispute(date)} className="bg-white dark:bg-slate-900 text-rose-600 text-xs font-bold px-4 py-2 border border-rose-200 rounded-lg hover:bg-rose-50 shadow-sm transition-colors">Dispute</button>
                                                                    <button onClick={() => { setMakeupForm({ ...makeupForm, absenceDate: date }); setShowMakeupModal(true); }} className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-1">
                                                                        <Plus size={14} /> Request Make-Up
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
                                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2"><History size={18} /> Clock Logs ({selectedMonth})</h3>
                                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                                        {allLogs.filter(l => l.dateString.startsWith(selectedMonth)).map(log => (
                                            <div key={log.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800">
                                                <div>
                                                    <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{new Date(log.timestamp).toLocaleDateString('en-us')}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${log.type === 'IN' ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>{log.type}</span>
                                                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${(log.type === 'IN' ? log.clockInDetails?.statusRemark : log.clockOutDetails?.statusRemark)?.includes('BLOCKED') ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                                        {(log.type === 'IN' ? log.clockInDetails?.statusRemark : log.clockOutDetails?.statusRemark)?.includes('BLOCKED')
                                                            ? 'Blocked'
                                                            : (log.type === 'IN' ? log.clockInDetails?.statusRemark : log.clockOutDetails?.statusRemark)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        {allLogs.filter(l => l.dateString.startsWith(selectedMonth)).length === 0 && <p className="text-sm text-slate-400 italic py-4 text-center">No clock logs found for this month.</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: ABSENCES */}
                        {activeTab === 'absence' && (
                            <div className="space-y-6 animate-fade-in">
                                <div><h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Absence Application</h1><p className="text-slate-500 dark:text-slate-400 font-medium">Submit scheduled or emergency absences.</p></div>

                                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
                                    <form onSubmit={handleAbsenceSubmit} className="space-y-5">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Type</label><select value={absenceType} onChange={e => { setAbsenceType(e.target.value); setSelectedDates([]); setAbsenceStartDate(''); }} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500"><option value="Scheduled">Scheduled</option><option value="Emergency">Emergency</option></select></div>
                                            <div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Category</label><select value={absenceCat} onChange={e => setAbsenceCat(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500"><option value="Health">Health</option><option value="Personal">Personal</option><option value="Family">Family</option></select></div>
                                        </div>

                                        {absenceType === 'Scheduled' ? (
                                            <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Select Specific Dates for Absence</label>
                                                <div className="flex gap-2 mb-3">
                                                    <input type="date" value={dateToAdd} onChange={e => setDateToAdd(e.target.value)} className="flex-1 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500" />
                                                    <button type="button" onClick={handleAddDate} disabled={!isActive} className="bg-blue-100 text-blue-700 px-5 font-bold rounded-xl hover:bg-blue-200 transition-colors flex items-center gap-1 disabled:opacity-50"><Plus size={16} /> Add</button>
                                                </div>
                                                {selectedDates.length > 0 ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectedDates.map(date => (
                                                            <div key={date} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm">
                                                                {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                <button type="button" onClick={() => handleRemoveDate(date)} className="text-red-400 hover:text-red-600 bg-red-50 p-1 rounded"><X size={12} /></button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-slate-400 italic">No dates added yet. Please add at least one date.</p>
                                                )}
                                                <p className="text-[10px] text-amber-600 font-bold mt-3">* Scheduled Absences require clearance from both your IC and HR.</p>
                                            </div>
                                        ) : (
                                            <div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Date of Absence</label><input type="date" value={absenceStartDate} onChange={e => setAbsenceStartDate(e.target.value)} required className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500" /></div>
                                        )}

                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Reason / Description</label>
                                            <textarea
                                                value={absenceDescription}
                                                onChange={e => setAbsenceDescription(e.target.value)}
                                                required
                                                rows="3"
                                                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none resize-none focus:border-blue-500"
                                                placeholder="Briefly describe the reason for your absence..."
                                            ></textarea>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Attach Proof (Optional)</label>
                                            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:bg-slate-700 transition-colors">
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <Upload className="w-6 h-6 text-slate-400 mb-1" />
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-[200px]">{absenceFile ? absenceFile.name : "Tap to upload picture"}</p>
                                                </div>
                                                <input type="file" className="hidden" accept="image/*" onChange={e => setAbsenceFile(e.target.files[0])} />
                                            </label>
                                        </div>
                                        {/* Replace your current submit button with this one: */}
                                        <button
                                            type="submit"
                                            disabled={submittingAbsence}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {submittingAbsence ? (
                                                <>
                                                    <Loader2 size={18} className="animate-spin" />
                                                    Uploading Picture & Submitting...
                                                </>
                                            ) : (
                                                <>
                                                    <Upload size={18} />
                                                    Submit Request
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </div>

                                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
                                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2"><FileText size={18} /> Absence History</h3>
                                    <div className="space-y-3">
                                        {absenceLogs.map(l => {
                                            const isPending = !l.status || l.status.toLowerCase().includes('pending');
                                            const isCanceled = l.status?.toLowerCase().includes('canceled');

                                            let statusColor = 'bg-amber-100 text-amber-700 border border-amber-200';
                                            if (l.status?.toLowerCase() === 'approved') statusColor = 'bg-blue-100 text-blue-700 border border-blue-200';
                                            else if (l.status?.toLowerCase().includes('denied') || l.status?.toLowerCase().includes('rejected')) statusColor = 'bg-rose-100 text-rose-700 border border-rose-200';
                                            else if (l.status?.toLowerCase() === 'acknowledged') statusColor = 'bg-purple-100 text-purple-700 border border-purple-200';
                                            else if (isCanceled) statusColor = 'bg-slate-200 text-slate-600 border border-slate-300';

                                            return (
                                                <div key={l.id} className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl flex flex-col md:flex-row justify-between md:items-start gap-3">
                                                    <div className="flex-1">
                                                        <p className="font-bold text-sm text-slate-800 dark:text-slate-100 leading-tight">
                                                            {l.date || 'Unknown Date'}
                                                        </p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 mt-0.5">{l.type} - {l.category}</p>

                                                        {l.reason && (
                                                            <p className="text-xs text-slate-600 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700 mt-2 italic break-words">
                                                                "{l.reason}"
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-col gap-2 items-start md:items-end mt-2 md:mt-0 shrink-0">
                                                        <span className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg whitespace-nowrap text-center ${statusColor}`}>
                                                            {l.status || 'Pending'}
                                                        </span>

                                                        {/* SHOW IC AND HR BREAKDOWN */}
                                                        {!isCanceled && (
                                                            <div className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 mt-1 bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                                                                <span className={l.icStatus === 'Approved' || l.icStatus === 'Acknowledged' ? 'text-blue-600' : l.icStatus === 'Denied' ? 'text-red-600' : 'text-amber-500'}>
                                                                    IC: {l.icStatus || 'Pending'}
                                                                </span>
                                                                <span className="text-slate-300">|</span>
                                                                <span className={l.hrStatus === 'Approved' || l.hrStatus === 'Acknowledged' ? 'text-blue-600' : l.hrStatus === 'Denied' ? 'text-red-600' : 'text-amber-500'}>
                                                                    HR: {l.hrStatus || 'Pending'}
                                                                </span>
                                                            </div>
                                                        )}

                                                        {isActive && isPending && (
                                                            <button
                                                                onClick={() => cancelAbsenceRequest(l.id)}
                                                                className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 shadow-sm mt-1 w-full md:w-auto"
                                                            >
                                                                Cancel Request
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                        {absenceLogs.length === 0 && <p className="text-sm text-slate-400 italic">No absence applications yet.</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'schooling' && <SchoolingTab user={user} profile={profile} masterStatus={masterStatus} showToast={showToast} />}
                        {activeTab === 'diligence' && <DiligenceReportTab profile={profile} />}

                        {/* TAB 5: PROFILE */}
                        {activeTab === 'profile' && (
                            <div className="space-y-6 animate-fade-in">
                                <div><h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Profile & Settings</h1><p className="text-slate-500 dark:text-slate-400 font-medium">Manage your account information.</p></div>

                                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-black text-2xl">{profile.given.charAt(0)}</div>
                                        <div><h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{profile.given} {profile.family}</h2><p className="text-sm text-slate-500 dark:text-slate-400">{profile.studentId}</p></div>
                                    </div>
                                    <div className="space-y-5">
                                        <div><p className="text-xs font-bold text-slate-400 uppercase mb-1">Assigned Company</p><p className="font-medium text-slate-800 dark:text-slate-100 flex items-center gap-2"><MapPin size={16} className="text-blue-500" />{profile.companyName || 'N/A'}</p></div>
                                        <div><p className="text-xs font-bold text-slate-400 uppercase mb-1">Coordinator (IC)</p><p className="font-medium text-slate-800 dark:text-slate-100 flex items-center gap-2"><User size={16} className="text-blue-500" />{profile.assignedIC || 'N/A'}</p></div>
                                        <div><p className="text-xs font-bold text-slate-400 uppercase mb-1">IPT Schedule</p><p className="font-medium text-slate-800 dark:text-slate-100 flex items-center gap-2"><Calendar size={16} className="text-blue-500" />{profile.iptDateStart || 'TBA'} to {profile.iptDateEnd || 'TBA'}</p></div>
                                        <div><p className="text-xs font-bold text-slate-400 uppercase mb-1">Trusted Devices</p><p className="font-medium text-slate-800 dark:text-slate-100 flex items-center gap-2 text-xs break-all"><Smartphone size={16} className="text-blue-500 shrink-0" />{profile.trustedDevices?.length || 1} Device(s) Authorized</p></div>
                                    </div>
                                </div>

                                {/* APP THEME SETTINGS */}
                                <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 dark:border-slate-700 mt-6">
                                    <h3 className="font-bold text-slate-700 dark:text-slate-200 dark:text-slate-200 mb-4 flex items-center gap-2">
                                        <Settings size={18} /> App Theme Appearance
                                    </h3>
                                    <div className="flex gap-3">
                                        {['light', 'dark', 'system'].map((t) => (
                                            <button
                                                key={t}
                                                onClick={() => setTheme(t)}
                                                className={`flex-1 py-3 px-4 rounded-xl font-bold capitalize transition-all border ${theme === t
                                                        ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700 shadow-sm'
                                                        : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:bg-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
                                                    }`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* --- FIX: UPDATE 4-DIGIT PIN FORM --- */}
                                <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 mt-6">
                                    <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>
                                        Update 4-Digit Clock-In PIN
                                    </h3>

                                    <form onSubmit={handleUpdatePin} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">New PIN</label>
                                                <input
                                                    type="password"
                                                    maxLength="4"
                                                    pattern="\d{4}"
                                                    inputMode="numeric"
                                                    placeholder="0000"
                                                    value={pinData.newPin}
                                                    onChange={e => setPinData({ ...pinData, newPin: e.target.value.replace(/\D/g, '') })}
                                                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-center tracking-[0.5em] text-lg font-black"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Confirm New PIN</label>
                                                <input
                                                    type="password"
                                                    maxLength="4"
                                                    pattern="\d{4}"
                                                    inputMode="numeric"
                                                    placeholder="0000"
                                                    value={pinData.confirmPin}
                                                    onChange={e => setPinData({ ...pinData, confirmPin: e.target.value.replace(/\D/g, '') })}
                                                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-center tracking-[0.5em] text-lg font-black"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isUpdatingPin}
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                                        >
                                            {isUpdatingPin ? 'Updating...' : 'Save New PIN'}
                                        </button>
                                    </form>
                                </div>

                                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
                                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2"><Lock size={18} /> Security Settings</h3>
                                    <form onSubmit={handlePasswordUpdate}>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Update Password</label>
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New Password (min 6 chars)" className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500" required minLength="6" />
                                            <button disabled={updatingPwd} className="bg-slate-800 text-white font-bold px-6 py-3 rounded-xl hover:bg-slate-900 disabled:opacity-50">Update</button>
                                        </div>
                                    </form>
                                </div>

                                {/* BIOMETRIC SETUP */}
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 mt-6">
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                                        <ShieldCheck className="text-blue-500" /> Biometric Authentication
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Set up fingerprint or face recognition for quick, 1-tap clock-ins on this device.</p>

                                    {profile.biometricCredentialId ? (
                                        <div className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 p-4 rounded-xl font-bold flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 cursor-not-allowed">
                                            <CheckCircle2 size={20} className="text-blue-500" /> Biometric Already Configured
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleBiometricSetup}
                                            disabled={isSettingUpBio}
                                            className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-md transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                                        >
                                            {isSettingUpBio ? 'Setting up...' : 'Register Biometric Now'}
                                        </button>
                                    )}
                                </div>

                                {/* GOOGLE AUTHENTICATOR SETUP */}
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 mt-6">
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2"><ShieldCheck className="text-blue-500" /> Google Authenticator (2FA)</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Link Google Authenticator so you can verify yourself when clocking in from a new phone, bypassing the need for HR approval.</p>

                                    {profile.totpSecret ? (
                                        <div className="bg-blue-50 text-blue-700 p-4 rounded-xl font-bold flex items-center gap-2">
                                            <CheckCircle2 size={20} /> Google Authenticator is Active!
                                        </div>
                                    ) : !totpSetupUri ? (
                                        <button onClick={handleSetupGoogleAuth} className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-900 transition-colors">
                                            Setup Google Authenticator
                                        </button>
                                    ) : (
                                        <div className="p-6 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 flex flex-col items-center text-center">
                                            <p className="font-bold text-slate-800 dark:text-slate-100 mb-2">1. Scan this QR code in the Google Authenticator App</p>

                                            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm mb-4 border border-slate-100 dark:border-slate-800">
                                                <QRCodeSVG value={totpSetupUri} size={200} />
                                            </div>

                                            {/* MANUAL ENTRY FALLBACK */}
                                            <div className="mb-6 w-full max-w-sm">
                                                <div className="relative flex items-center py-2">
                                                    <div className="flex-grow border-t border-slate-300"></div>
                                                    <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase">Or enter manually</span>
                                                    <div className="flex-grow border-t border-slate-300"></div>
                                                </div>
                                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 mt-2 flex flex-col items-center">
                                                    <span className="text-xs text-slate-500 dark:text-slate-400 mb-1">Account: Dualtech ({profile.email})</span>
                                                    <span className="font-mono font-bold text-blue-600 tracking-wider break-all text-center select-all cursor-pointer">
                                                        {tempSecret}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 mt-1 mt-2">Select "Enter a setup key" in your app</span>
                                                </div>
                                            </div>

                                            <p className="font-bold text-slate-800 dark:text-slate-100 mb-2">2. Enter the 6-digit code to verify</p>
                                            <input
                                                type="text"
                                                maxLength="6"
                                                placeholder="000000"
                                                className="w-40 px-4 py-3 text-center text-2xl tracking-widest border border-slate-300 rounded-xl outline-none focus:border-blue-500 mb-4 font-mono shadow-inner bg-white dark:bg-slate-900"
                                                id="totpVerifyInput"
                                            />
                                            <button onClick={() => confirmSetupGoogleAuth(document.getElementById('totpVerifyInput').value)} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-md transition-colors">
                                                Verify & Link App
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <button onClick={() => signOut(auth)} className="md:hidden w-full bg-red-50 text-red-600 font-bold py-4 rounded-2xl hover:bg-red-100 transition-colors flex justify-center items-center gap-2"><LogOut size={20} /> Sign Out</button>
                            </div>
                        )}

                        {/* --- NEW: DATA PRIVACY RIGHTS SECTION --- */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 mt-6">
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                                <ShieldCheck className="text-blue-600" size={20} /> Data Privacy Rights
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                Under the Data Privacy Act of 2012, you have the right to access, correct, or request the deletion of your personal data stored in our system.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <button
                                    onClick={() => {
                                        window.location.href = `mailto:dpo@dualtech.edu.ph?subject=Data Update Request - ${profile.studentId}&body=Hi DPO,%0D%0A%0D%0AI would like to request an update/correction to my personal records.`;
                                    }}
                                    className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold py-3 px-4 rounded-xl transition-colors text-sm"
                                >
                                    <Edit3 size={16} /> Request Data Update
                                </button>

                                <button
                                    onClick={() => {
                                        if (window.confirm("Are you sure you want to request account deletion? HR will review this request within 30 days.")) {
                                            window.location.href = `mailto:dpo@dualtech.edu.ph?subject=Data Deletion Request - ${profile.studentId}&body=Hi DPO,%0D%0A%0D%0AI am requesting the complete deletion of my personal data from the Trainee Portal.`;
                                        }
                                    }}
                                    className="flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-3 px-4 rounded-xl transition-colors text-sm"
                                >
                                    <Trash2 size={16} /> Request Data Deletion
                                </button>
                            </div>
                        </div>

                    </div> {/* End CENTER FEED */}

                    {/* RIGHT SIDEBAR (Desktop) */}
                    <div className="hidden lg:block w-[320px] sticky top-[72px] h-[calc(100vh-80px)] overflow-y-auto px-2 pb-4">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 mb-4">
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                                <MessageSquare size={18} className="text-blue-500" /> Mentoring Contacts
                            </h3>
                            <p className="text-sm text-slate-500">Select a contact below to chat with your IC or Mentor.</p>
                            <div className="mt-4">
                                <button 
                                    onClick={() => document.getElementById('floating-chat-trigger')?.click()}
                                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                            IC
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-sm text-slate-800 dark:text-slate-100">Assigned IC</p>
                                            <p className="text-xs text-slate-500">Click to open chat</p>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div> {/* End RIGHT SIDEBAR */}

                </div> {/* End MAIN 3-COLUMN CONTENT */}

                {/* MODALS AND FLOATING WIDGETS */}
                <div>

                    {/* MAP PREVIEW MODAL */}
                    {previewLoc && (
                        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col">
                                <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                                    <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                        <MapPin className="text-blue-500" /> Confirm Location
                                    </h3>
                                    <button onClick={() => setPreviewLoc(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 text-center">
                                    Please verify your location on the map before officially clocking <strong>{previewLoc.action.toUpperCase()}</strong>.
                                </p>

                                <div className="w-full h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden mb-6 border-2 border-blue-100 dark:border-blue-900 relative shadow-inner pointer-events-none">
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        frameBorder="0"
                                        scrolling="no"
                                        marginHeight="0"
                                        marginWidth="0"
                                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${previewLoc.lon - 0.003},${previewLoc.lat - 0.003},${previewLoc.lon + 0.003},${previewLoc.lat + 0.003}&layer=mapnik&marker=${previewLoc.lat},${previewLoc.lon}`}
                                    ></iframe>
                                </div>

                                <div className="flex gap-3 mt-auto">
                                    <button onClick={() => setPreviewLoc(null)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            const { action, lat, lon } = previewLoc;
                                            setPreviewLoc(null);
                                            // Trigger final save using the confirmed coordinates
                                            handleTimeAction(action, lat, lon);
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
                            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                                <div className="p-5 border-b border-amber-100 bg-amber-50 flex justify-between items-center shrink-0">
                                    <h3 className="font-black text-amber-900 flex items-center gap-2">
                                        <AlertCircle size={20} />
                                        {disputeType === 'Location' ? 'Out of Bounds Warning' : disputeType === 'Location Disabled' ? 'GPS Disabled Warning' : 'Action Restricted'}
                                    </h3>
                                    <button onClick={() => setShowDisputeModal(false)} className="p-1.5 text-amber-400 hover:bg-amber-200 rounded-lg"><X size={20} /></button>
                                </div>

                                <div className="p-6 overflow-y-auto">
                                    {/* NEW: Map Preview for Location Dispute */}
                                    {disputeType === 'Location' && disputedLoc && (
                                        <div className="w-full h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden mb-4 border-2 border-amber-100 dark:border-amber-900 relative shadow-inner pointer-events-none">
                                            <iframe
                                                width="100%"
                                                height="100%"
                                                frameBorder="0"
                                                scrolling="no"
                                                marginHeight="0"
                                                marginWidth="0"
                                                src={`https://www.openstreetmap.org/export/embed.html?bbox=${disputedLoc.lon - 0.003},${disputedLoc.lat - 0.003},${disputedLoc.lon + 0.003},${disputedLoc.lat + 0.003}&layer=mapnik&marker=${disputedLoc.lat},${disputedLoc.lon}`}
                                            ></iframe>
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
                                        ) : (
                                            <>
                                                You are attempting to clock <strong>{pendingAction?.toUpperCase()}</strong> on your scheduled
                                                <strong> {new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() === (profile.schoolingDay || 'saturday').toLowerCase() ? ' Schooling Day' : ' Rest Day'}</strong>.
                                                <br /><br />
                                                If you have authorized make-up duty or overtime, you may proceed, but you must state your reason.
                                            </>
                                        )}
                                        <strong> This will be marked as "Acknowledged" and will automatically send a dispute ticket to HR and your Industry Coordinator.</strong>
                                    </p>

                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                                        Reason for {disputeType === 'Location' ? `remote clock ${pendingAction?.toLowerCase()}` : disputeType === 'Location Disabled' ? `missing GPS data` : `clocking ${pendingAction?.toLowerCase()} today`}
                                    </label>
                                    <textarea
                                        value={disputeReason}
                                        onChange={e => setDisputeReason(e.target.value)}
                                        placeholder={disputeType === 'Location' ? "e.g., Assigned to field work, client meeting..." : disputeType === 'Location Disabled' ? "e.g., Phone GPS is broken, poor signal..." : "e.g., Approved overtime, Make-up duty..."}
                                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-amber-500 text-sm bg-white dark:bg-slate-900 min-h-[100px] resize-none mb-4"
                                    ></textarea>

                                    <div className="flex gap-3">
                                        <button onClick={() => setShowDisputeModal(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-700">Cancel</button>
                                        <button
                                            onClick={() => {
                                                if (!disputeReason.trim()) return showToast("You must provide a dispute reason.", "error");

                                                handleClock(
                                                    pendingAction,
                                                    'Disputed',
                                                    `[${disputeType} Override] ${disputeReason}`,
                                                    disputedLoc?.lat,
                                                    disputedLoc?.lon
                                                );

                                                setShowDisputeModal(false);
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

                    {/* FLOATING FEEDBACK BUTTON */}
                    <button
                        onClick={() => setShowFeedbackModal(true)}
                        className="fixed bottom-44 md:bottom-24 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-xl transition-transform hover:scale-105 z-40 flex items-center justify-center"
                    >
                        <MessageSquare size={24} />
                    </button>

                    {/* FEEDBACK MODAL */}
                    {showFeedbackModal && (
                        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                                <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                                    <h3 className="font-black text-lg text-slate-800 dark:text-slate-100">Submit a Feedback</h3>
                                    <button onClick={() => setShowFeedbackModal(false)} className="text-slate-400 hover:text-slate-600">
                                        <X size={20} />
                                    </button>
                                </div>

                                <form onSubmit={submitFeedback} className="p-5 space-y-4">
                                    {/* Category Selection */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Category of Concern</label>
                                        <select
                                            required
                                            value={feedbackForm.category}
                                            onChange={(e) => setFeedbackForm({ ...feedbackForm, category: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="" disabled>Select a category...</option>
                                            <option value="Attendance Recording (Clock In / Clock Out)">Attendance Recording (Clock In / Clock Out)</option>
                                            <option value="Request for Absence">Request for Absence</option>
                                            <option value="Schooling">Schooling</option>
                                            <option value="Others">Others</option>
                                        </select>
                                    </div>

                                    {/* Conditional "Others" Textbox */}
                                    {feedbackForm.category === 'Others' && (
                                        <div className="animate-in fade-in slide-in-from-top-2">
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Specify Type of Concern</label>
                                            <input
                                                type="text" required
                                                value={feedbackForm.otherCategory}
                                                onChange={(e) => setFeedbackForm({ ...feedbackForm, otherCategory: e.target.value })}
                                                placeholder="Please specify..."
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    )}

                                    {/* Details Textbox */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Explain your concern</label>
                                        <textarea
                                            required rows="4"
                                            value={feedbackForm.details}
                                            onChange={(e) => setFeedbackForm({ ...feedbackForm, details: e.target.value })}
                                            placeholder="Please provide details about your issue or request..."
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                        />
                                    </div>

                                    {/* File Upload */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Attach a Picture (Optional)</label>
                                        <div className="flex items-center gap-3">
                                            <label className="flex-1 cursor-pointer bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-300 rounded-xl px-4 py-4 text-center hover:bg-slate-100 dark:bg-slate-700 transition-colors">
                                                <UploadCloud className="mx-auto text-slate-400 mb-2" size={24} />
                                                <span className="text-xs font-semibold text-slate-600">
                                                    {feedbackForm.fileName ? feedbackForm.fileName : "Click to upload an image"}
                                                </span>
                                                <input type="file" accept="image/*" onChange={handleFeedbackFileChange} className="hidden" />
                                            </label>
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={isSubmittingFeedback}
                                        className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/30 disabled:opacity-70 flex justify-center items-center gap-2 mt-4"
                                    >
                                        {isSubmittingFeedback ? (
                                            <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
                                        ) : (
                                            "Submit Feedback"
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div> {/* End Modals Wrapper */}
            </div> {/* End Outer Wrapper */}
        );
}