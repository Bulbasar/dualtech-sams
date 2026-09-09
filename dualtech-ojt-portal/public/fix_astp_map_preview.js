const fs = require('fs');

const path = 'c:/Users/rober/dualtech-ojt-portal/trainee-portal/src/pages/tabs/ASTPHomeTab.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Update initiateClockFlow to show previewLoc even on GPS failure
content = content.replace(
    /\(err\) => \{\s*\/\/ Fallback: If we couldn't get a new high-accuracy lock but we DO have a previous lock, use it\s*if \(latestLoc && latestLoc\.lat\) \{\s*setPreviewLoc\(\{ lat: latestLoc\.lat, lon: latestLoc\.lon, action: actionType \}\);\s*\} else \{\s*handleTimeAction\(actionType\); \/\/ Let the original error handling\/dispute catch it\s*\}\s*setLoadingLoc\(false\);\s*\}/,
    `(err) => {
                        if (latestLoc && latestLoc.lat) {
                            setPreviewLoc({ lat: latestLoc.lat, lon: latestLoc.lon, action: actionType });
                        } else {
                            // Show preview modal with GPS failure warning instead of skipping it
                            setPreviewLoc({ lat: null, lon: null, action: actionType, gpsFailed: true });
                        }
                        setLoadingLoc(false);
                    }`
);

// 2. Update MapPreviewModal to handle gpsFailed
const modalRegex = /<div className="w-full h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden mb-6 relative shadow-inner border border-slate-200 dark:border-slate-700 pointer-events-none">([\s\S]*?)<\/div>/;

if (content.match(modalRegex)) {
    content = content.replace(
        modalRegex,
        `{previewLoc.gpsFailed ? (
                            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 mb-6 text-center">
                                <AlertTriangle className="text-rose-500 w-12 h-12 mx-auto mb-3" />
                                <p className="text-sm font-bold text-rose-700 mb-2">GPS Signal Not Found</p>
                                <p className="text-xs text-rose-600">We could not acquire your precise location. If you continue, you will be required to submit a Location Dispute to clock your time.</p>
                            </div>
                        ) : (
                            <div className="w-full h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden mb-6 relative shadow-inner border border-slate-200 dark:border-slate-700 pointer-events-none">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    frameBorder="0"
                                    scrolling="no"
                                    marginHeight="0"
                                    marginWidth="0"
                                    src={\`https://www.openstreetmap.org/export/embed.html?bbox=\${previewLoc.lon - 0.003},\${previewLoc.lat - 0.003},\${previewLoc.lon + 0.003},\${previewLoc.lat + 0.003}&layer=mapnik&marker=\${previewLoc.lat},\${previewLoc.lon}\`}
                                ></iframe>
                            </div>
                        )}`
    );
}

// 3. Update Map Preview Confirm Button to pass nulls if gpsFailed
content = content.replace(
    /onClick=\{\(\) => \{\s*const \{ action, lat, lon \} = previewLoc;\s*setPreviewLoc\(null\);\s*handleTimeAction\(action, lat, lon\);\s*\}\}/,
    `onClick={() => {
                                    const { action, lat, lon, gpsFailed } = previewLoc;
                                    setPreviewLoc(null);
                                    if (gpsFailed) {
                                        handleTimeAction(action, null, null);
                                    } else {
                                        handleTimeAction(action, lat, lon);
                                    }
                                }}`
);

fs.writeFileSync(path, content);
console.log("Patched ASTPHomeTab.jsx successfully.");
