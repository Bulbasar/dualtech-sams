const fs = require('fs');
let html = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8');

// 1. Update SyncStatusBar definition
const oldSyncStatusBarRegex = /const SyncStatusBar = \(\{\s*isVisible,\s*message,\s*type = 'loading'\s*\}\) => \{[\s\S]*?<\span className="font-medium text-sm">\{message\}<\/span>\s*<\/div>\s*<\/div>\s*\);\s*\};/;

const newSyncStatusBar = \const SyncStatusBar = ({ isVisible, message, type = 'loading' }) => {
            if (!isVisible) return null;
            return (
                <div className={\\\lex items-center gap-2 px-3 py-1.5 rounded-full shadow-sm backdrop-blur-md border \\\\}>
                    {type === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
                    {type === 'success' && <CheckCircle2 className="w-4 h-4" />}
                    {type === 'error' && <AlertCircle className="w-4 h-4" />}
                    <span className="font-bold text-xs whitespace-nowrap">{message}</span>
                </div>
            );
        };\;

html = html.replace(oldSyncStatusBarRegex, newSyncStatusBar);

// 2. Remove the old SyncStatusBar invocation at the bottom
html = html.replace(
    /                    <\/div>\s*<SyncStatusBar isVisible=\{syncStatus\.visible\} message=\{syncStatus\.message\} type=\{syncStatus\.type\} \/>\s*<\/div>\s*\);\s*\};/,
    "                    </div>\n                </div>\n            );\n        };"
);

// 3. Inject it alongside the refresh button
html = html.replace(
    /<div className="flex items-center gap-2 md:gap-4 pl-4">/,
    \<div className="flex items-center gap-2 md:gap-4 pl-4">
                                <SyncStatusBar isVisible={syncStatus.visible} message={syncStatus.message} type={syncStatus.type} />\
);

// 4. Update fetchLogs to show percentage
const fetchLogsLoopRegex = /const chunkSize = 30;\s*for \(let i = 0; i < astpUids\.length; i \+= chunkSize\) \{[\s\S]*?snap\.forEach\(d => \{ allAstpLogs\.push\(\{ id: d\.id, studentId: sid, uid: uid, \.\.\.d\.data\(\) \}\); \}\);\s*\}\)\);\s*\}/;

const newFetchLogsLoop = \const chunkSize = 30;
                    for (let i = 0; i < astpUids.length; i += chunkSize) {
                        const chunk = astpUids.slice(i, i + chunkSize);
                        const pct = Math.min(100, Math.round(((i + chunk.length) / astpUids.length) * 100));
                        showSyncStatus(\\\Syncing Attendance... \%\\\, 'loading');
                        await Promise.all(chunk.map(async (uid) => {
                            const logsRef = collection(db, 'artifacts', appId, 'users', uid, 'attendanceLogs');
                            const snap = await getDocs(logsRef);
                            const sid = uidToStudentId[uid];
                            snap.forEach(d => { allAstpLogs.push({ id: d.id, studentId: sid, uid: uid, ...d.data() }); });
                        }));
                    }\;

html = html.replace(fetchLogsLoopRegex, newFetchLogsLoop);

fs.writeFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', html);
console.log('Successfully updated SyncStatusBar and percentage.');
