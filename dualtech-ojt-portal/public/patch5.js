const fs = require('fs');
let html = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8');

// 1. Change initial state of syncStatus to be visible and loading
html = html.replace(
    "const [syncStatus, setSyncStatus] = useState({ visible: false, message: '', type: 'loading' });",
    "const [syncStatus, setSyncStatus] = useState({ visible: true, message: 'Loading records from Firebase...', type: 'loading' });"
);

// 2. Remove the premature showSyncStatus at the end of useEffect
html = html.replace(
    "showSyncStatus('Live database synced', 'success', 2000);\\n\\n                return () => {",
    "return () => {"
);
html = html.replace(
    "showSyncStatus('Live database synced', 'success', 2000);\\n                \\n                return () => {",
    "return () => {"
);
html = html.replace(
    /showSyncStatus\('Live database synced', 'success', 2000\);\s*return \(\) => \{ unsubTrainees\(\);/,
    "return () => { unsubTrainees();"
);

// 3. Add showSyncStatus inside unsubTrainees (which serves as the main data loader)
html = html.replace(
    "setLoadingData(false);\\n                });",
    "setLoadingData(false);\\n                    showSyncStatus('Live database synced', 'success', 3000);\\n                });"
);
html = html.replace(
    /setLoadingData\(false\);\s*\}\);/,
    "setLoadingData(false);\n                    showSyncStatus('Live database synced', 'success', 3000);\n                });"
);

fs.writeFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', html);
console.log('Fixed initial sync status logic');
