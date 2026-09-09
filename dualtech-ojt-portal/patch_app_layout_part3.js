const fs = require('fs');

let content = fs.readFileSync('tsd-portal/src/App.jsx', 'utf8');

const newAppReturn = `            return (
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
                                            placeholder={\`Search for a module or function...\`} 
                                            className="w-full bg-transparent border-none outline-none ml-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-500" 
                                        />
                                        <Filter size={18} className="text-slate-400 cursor-pointer hover:text-slate-600" />
                                    </div>
                                    {showGlobalSearchDropdown && globalSearchQuery.trim() !== '' && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                            {filteredGlobalTabs.length > 0 ? (
                                                filteredGlobalTabs.map(tab => {
                                                    const IconCmp = tab.icon;
                                                    return (
                                                        <button
                                                            key={tab.id}
                                                            onClick={() => {
                                                                setActiveView(tab.id);
                                                                setGlobalSearchQuery('');
                                                                setShowGlobalSearchDropdown(false);
                                                            }}
                                                            className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3 transition-colors"
                                                        >
                                                            <div className="p-2 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
                                                                <IconCmp size={18} className="text-primary-600 dark:text-primary-400" />
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{tab.name}</div>
                                                                <div className="text-xs text-slate-500 dark:text-slate-400">Navigate to {tab.name} module</div>
                                                            </div>
                                                        </button>
                                                    );
                                                })
                                            ) : (
                                                <div className="px-4 py-6 text-center text-slate-500 dark:text-slate-400 text-sm">
                                                    No functions found matching "{globalSearchQuery}"
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <div className="text-slate-500 text-xs md:text-sm hidden sm:block">Signed in as <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.email}</span></div>
                                <button onClick={handleLogout} className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sm font-bold shadow-sm">Sign out</button>
                            </div>
                        </header>

                        {/* Main Content */}
                        <main className="flex-1 p-4 md:p-6 overflow-hidden split-pane bg-slate-50/30 dark:bg-slate-900/50">
                            <div className="h-full overflow-y-auto custom-scrollbar">
                                
{!selectedProject ? (
    <Routes>
        <Route path="/" element={<AstpPerformanceView />} />
        <Route path="/performance" element={<AstpPerformanceView />} />
        <Route path="/ojtAttendance" element={<OjtAttendanceView />} />
        <Route path="/engagement" element={<CompanyEngagementView />} />
        <Route path="/surveys" element={<SurveysView />} />
        <Route path="/icSurveys" element={<ICSurveysView />} />
        <Route path="/concerns" element={<ConcernsView />} />
        <Route path="/announcements" element={<AnnouncementsView />} />
        <Route path="/astpSchooling" element={<AstpSchoolingDashboard />} />
        <Route path="/portfolio" element={<PortfolioView onSelectProject={setSelectedProject} />} />
        <Route path="*" element={<PortfolioView onSelectProject={setSelectedProject} />} />
    </Routes>`;

const appReturnRegex = /return \([\s\r\n]*<div className="flex h-screen w-full bg-white dark:bg-slate-900 transition-colors">[\s\S]*?<\/Routes>/;
if (appReturnRegex.test(content)) {
    content = content.replace(appReturnRegex, newAppReturn);
    fs.writeFileSync('tsd-portal/src/App.jsx', content);
    console.log('App layout updated successfully.');
} else {
    console.error("Could not find App return block with regex");
}
