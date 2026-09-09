const fs = require('fs');
let html = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8');

// Remove stray SyncStatusBar at 3255
html = html.replace(
    '                    <SyncStatusBar isVisible={syncStatus.visible} message={syncStatus.message} type={syncStatus.type} />\\n                    {/* Mobile Overlay */}',
    '                    {/* Mobile Overlay */}'
);

fs.writeFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', html);
console.log('Removed stray SyncStatusBar');
