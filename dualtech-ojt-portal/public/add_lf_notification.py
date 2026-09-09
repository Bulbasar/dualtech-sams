import re

with open('c:/Users/rober/dualtech-ojt-portal/public/lfportal.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 3. Add Bell icon in header and Dropdown UI
header_pattern = r'<header className="h-16 shrink-0 flex items-center justify-between px-4 md:px-6 border-b border-slate-200 dark:border-slate-700 relative z-30 bg-white dark:bg-slate-900">\s*<div className="flex items-center flex-1">\s*<button onClick=\{\(\) => setIsSidebarCollapsed\(false\)\} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full mr-2">\s*<Menu size=\{20\} />\s*</button>\s*<h1 className="text-lg font-black text-slate-800 dark:text-slate-100 ml-2 hidden md:block">LF Portal</h1>\s*</div>\s*</header>'

header_new = '''<header className="h-16 shrink-0 flex items-center justify-between px-4 md:px-6 border-b border-slate-200 dark:border-slate-700 relative z-30 bg-white dark:bg-slate-900">
                              <div className="flex items-center flex-1">
                                  <button onClick={() => setIsSidebarCollapsed(false)} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full mr-2">
                                      <Menu size={20} />
                                  </button>
                                  <h1 className="text-lg font-black text-slate-800 dark:text-slate-100 ml-2 hidden md:block">LF Portal</h1>
                              </div>
                              <div className="flex items-center gap-4">
                                  <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors" title="Notifications">
                                      <Bell size={20} />
                                      {notifications.length > 0 && (
                                          <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white dark:border-slate-900"></span>
                                          </span>
                                      )}
                                  </button>
                              </div>
                          </header>
                          {showNotifications && (
                              <div className="absolute top-16 right-4 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2">
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
                          )}'''

if re.search(header_pattern, content):
    content = re.sub(header_pattern, header_new, content)
    with open('c:/Users/rober/dualtech-ojt-portal/public/lfportal.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Replaced successfully')
else:
    print('Regex pattern not found')
