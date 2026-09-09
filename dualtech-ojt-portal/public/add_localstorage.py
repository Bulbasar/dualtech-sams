import re

with open('c:/Users/rober/dualtech-ojt-portal/public/lfportal.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update state initialization
state_old = r'''const \[isClockedIn, setIsClockedIn\] = useState\(false\);
              const \[clockInTime, setClockInTime\] = useState\(null\);'''

state_new = r'''const [isClockedIn, setIsClockedIn] = useState(localStorage.getItem('lfClockedIn') === 'true');
              const [clockInTime, setClockInTime] = useState(() => {
                  const storedTime = localStorage.getItem('lfClockInTime');
                  return storedTime ? new Date(storedTime) : null;
              });'''

if "localStorage.getItem('lfClockedIn') === 'true'" not in content:
    content = re.sub(state_old, state_new, content)

# 2. Update handleClockIn
clockin_old = r'setIsClockedIn\(true\);\n\s*setClockInTime\(new Date\(\)\);'
clockin_new = r'''setIsClockedIn(true);
                          const now = new Date();
                          setClockInTime(now);
                          localStorage.setItem('lfClockedIn', 'true');
                          localStorage.setItem('lfClockInTime', now.toISOString());'''

if "localStorage.setItem('lfClockedIn', 'true')" not in content:
    content = re.sub(clockin_old, clockin_new, content, count=1)

# 3. Update handleClockOut
clockout_old = r'setIsClockedIn\(false\);\n\s*setClockInTime\(null\);'
clockout_new = r'''setIsClockedIn(false);
                  setClockInTime(null);
                  localStorage.removeItem('lfClockedIn');
                  localStorage.removeItem('lfClockInTime');'''

if "localStorage.removeItem('lfClockedIn')" not in content:
    content = re.sub(clockout_old, clockout_new, content, count=1)

with open('c:/Users/rober/dualtech-ojt-portal/public/lfportal.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Successfully applied localStorage persistence to lfportal.html')
