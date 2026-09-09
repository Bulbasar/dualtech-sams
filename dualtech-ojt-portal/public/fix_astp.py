import sys

path = 'c:/Users/rober/dualtech-ojt-portal/trainee-portal/src/pages/tabs/ASTPHomeTab.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_effect = """    // Calculate active log
    useEffect(() => {
        const todayStr = getLocalYYYYMMDD(new Date());
        const todaysLogs = allLogs.filter(l => l.dateString === todayStr);
        let isClockedIn = false;
        let activeDocId = null;
        for (let i = 0; i < todaysLogs.length; i++) {
            if (todaysLogs[i].type === 'IN' && !todaysLogs[i].timeOut) {
                isClockedIn = true;
                activeDocId = todaysLogs[i].id;
                break;
            }
        }
        setClockState({ isClockedIn, activeDocId });
    }, [allLogs]);"""

new_effect = """    // Calculate active log
    useEffect(() => {
        const todayStr = getLocalYYYYMMDD(new Date());
        const todaysLogs = allLogs.filter(l => l.dateString === todayStr);

        // Sort by timestamp descending to find the most recent action
        const sorted = [...todaysLogs].sort((a, b) => {
            const tA = typeof a.timestamp === 'number' ? a.timestamp : (a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0);
            const tB = typeof b.timestamp === 'number' ? b.timestamp : (b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0);
            return tB - tA;
        });

        let isClockedIn = false;
        let activeDocId = null;

        // If the most recent log for today is an OUT, user is clocked out
        if (sorted.length > 0 && sorted[0].type === 'OUT') {
            isClockedIn = false;
            activeDocId = null;
        } else {
            // Otherwise check for an IN log without a matching OUT
            for (let i = 0; i < todaysLogs.length; i++) {
                if (todaysLogs[i].type === 'IN' && !todaysLogs[i].timeOut) {
                    isClockedIn = true;
                    activeDocId = todaysLogs[i].id;
                    break;
                }
            }
        }

        setClockState({ isClockedIn, activeDocId });
    }, [allLogs]);"""

if old_effect in content:
    content = content.replace(old_effect, new_effect)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Updated successfully')
else:
    print('ERROR: Could not find the target code block')
