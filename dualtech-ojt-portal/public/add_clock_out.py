import re

with open('c:/Users/rober/dualtech-ojt-portal/public/lfportal.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add state in App
app_state_old = r'const \[isClockedIn, setIsClockedIn\] = useState\(false\);'
app_state_new = r'''const [isClockedIn, setIsClockedIn] = useState(false);
              const [clockInTime, setClockInTime] = useState(null);
              const handleClockOut = () => {
                  setIsClockedIn(false);
                  setClockInTime(null);
                  showMessage("Clocked out successfully.", "success");
              };'''
content = re.sub(app_state_old, app_state_new, content)

# 2. Update setIsClockedIn(true);
clockin_old = r'setIsClockedIn\(true\);'
clockin_new = r'setIsClockedIn(true);\n                          setClockInTime(new Date());'
content = re.sub(clockin_old, clockin_new, content, count=1)

# 3. Update Dashboard props call
dashboard_call_old = r'<Dashboard user=\{user\} lfData=\{lfData\} showMessage=\{showMessage\} onLogout=\{handleLogout\} isClockedIn=\{isClockedIn\} showClockInModal=\{showClockInModal\} schoolLocation=\{schoolLocation\} clockingIn=\{clockingIn\} handleClockIn=\{handleClockIn\} setShowClockInModal=\{setShowClockInModal\} />'
dashboard_call_new = r'<Dashboard user={user} lfData={lfData} showMessage={showMessage} onLogout={handleLogout} isClockedIn={isClockedIn} showClockInModal={showClockInModal} schoolLocation={schoolLocation} clockingIn={clockingIn} handleClockIn={handleClockIn} setShowClockInModal={setShowClockInModal} clockInTime={clockInTime} handleClockOut={handleClockOut} />'
content = re.sub(dashboard_call_old, dashboard_call_new, content)


# 4. Update Dashboard function
dashboard_func_old = r'function Dashboard\(props\) \{\n\s*const \{ user, lfData, showMessage, onLogout, isClockedIn, showClockInModal, schoolLocation, clockingIn, handleClockIn, setShowClockInModal \} = props;'
dashboard_func_new = r'''function Dashboard(props) {
            const { user, lfData, showMessage, onLogout, isClockedIn, showClockInModal, schoolLocation, clockingIn, handleClockIn, setShowClockInModal, clockInTime, handleClockOut } = props;
            
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
'''
content = re.sub(dashboard_func_old, dashboard_func_new, content)

# 5. Add Clock Out Button and Timer to header
header_old = r'<div className="flex items-center gap-4">\s*<button onClick=\{\(\) => setShowNotifications\(!showNotifications\)\} className="relative p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors" title="Notifications">'
header_new = r'''<div className="flex items-center gap-4">
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
                                  <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors" title="Notifications">'''
content = re.sub(header_old, header_new, content)


with open('c:/Users/rober/dualtech-ojt-portal/public/lfportal.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('Replaced successfully')
