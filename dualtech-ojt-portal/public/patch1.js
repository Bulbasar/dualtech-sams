const fs = require('fs');
let content = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8');

// 1. Add registeredStudentIds state
content = content.replace(
    "const [attendanceLogsFetched, setAttendanceLogsFetched] = useState(false);",
    "const [attendanceLogsFetched, setAttendanceLogsFetched] = useState(false);\n            const [registeredStudentIds, setRegisteredStudentIds] = useState(new Set());"
);

// 2. Load registeredStudentIds from cache
content = content.replace(
    /const cacheTime = localStorage\.getItem\('astp_attendance_cache_time'\);/,
    "const cacheTime = localStorage.getItem('astp_attendance_cache_time');\n                        const cachedIds = localStorage.getItem('astp_registered_ids_cache');"
);
content = content.replace(
    /setAttendanceLogs\(JSON\.parse\(cachedLogs\)\);/,
    "setAttendanceLogs(JSON.parse(cachedLogs));\n                                if (cachedIds) setRegisteredStudentIds(new Set(JSON.parse(cachedIds)));"
);

// 3. Save registeredStudentIds to cache and set state
content = content.replace(
    /let allAstpLogs = \[\];/,
    "const ids = Object.keys(studentIdToUid);\n                    setRegisteredStudentIds(new Set(ids));\n                    let allAstpLogs = [];"
);
content = content.replace(
    /localStorage\.setItem\('astp_attendance_cache_time', Date\.now\(\)\.toString\(\)\);/,
    "localStorage.setItem('astp_attendance_cache_time', Date.now().toString());\n                            localStorage.setItem('astp_registered_ids_cache', JSON.stringify(ids));"
);

// 4. Pass registeredStudentIds to DashboardTab
content = content.replace(
    /<DashboardTab allTrainees=\{trainees\} attendanceLogs=\{attendanceLogs\} \/>/,
    "<DashboardTab allTrainees={trainees} attendanceLogs={attendanceLogs} registeredStudentIds={registeredStudentIds} />"
);

fs.writeFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', content);
console.log('ICManagementPortal state updated.');
