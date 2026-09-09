const fs = require('fs');
let content = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8');

// Add state
content = content.replace(
    /const \[attendanceLogsFetched, setAttendanceLogsFetched\] = useState\(false\);/,
    "const [attendanceLogsFetched, setAttendanceLogsFetched] = useState(false);\n            const [registeredStudentIds, setRegisteredStudentIds] = useState(new Set());"
);

// Update state in fetchLogs
content = content.replace(
    /let allAstpLogs = \[\];/,
    "setRegisteredStudentIds(new Set(Object.keys(studentIdToUid)));\n                    let allAstpLogs = [];"
);

// Add prop to DashboardTab
content = content.replace(
    /<DashboardTab allTrainees=\{trainees\} attendanceLogs=\{attendanceLogs\} \/>/,
    "<DashboardTab allTrainees={trainees} attendanceLogs={attendanceLogs} registeredStudentIds={registeredStudentIds} />"
);

// Ensure the local storage cache is preserved for registered IDs too? The cache doesn't store registered IDs. Let's not worry about cache for now, or just leave it empty on cache hit, which might be a bug if they use the cache. Let's fix that.
// If cache hits, we don't know registeredStudentIds unless we save it.
// Let's just run this to see if it replaces correctly.
fs.writeFileSync('temp_ic_mod.js', content);
