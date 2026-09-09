const fs = require('fs');
let html = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8');

if (html.includes('w-full bg-white dark:bg-slate-800 dark:bg-slate-900 transition-colors">\\r\\n                    <SyncStatusBar')) {
    html = html.replace('w-full bg-white dark:bg-slate-800 dark:bg-slate-900 transition-colors">\\r\\n                    <SyncStatusBar isVisible={syncStatus.visible} message={syncStatus.message} type={syncStatus.type} />', 'w-full bg-white dark:bg-slate-800 dark:bg-slate-900 transition-colors">');
    fs.writeFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', html);
    console.log('Fixed Windows line endings');
} else if (html.includes('w-full bg-white dark:bg-slate-800 dark:bg-slate-900 transition-colors">\\n                    <SyncStatusBar')) {
    html = html.replace('w-full bg-white dark:bg-slate-800 dark:bg-slate-900 transition-colors">\\n                    <SyncStatusBar isVisible={syncStatus.visible} message={syncStatus.message} type={syncStatus.type} />', 'w-full bg-white dark:bg-slate-800 dark:bg-slate-900 transition-colors">');
    fs.writeFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', html);
    console.log('Fixed Unix line endings');
} else {
    // try regex
    html = html.replace(/<div className="flex h-screen w-full bg-white dark:bg-slate-800 dark:bg-slate-900 transition-colors">\s*<SyncStatusBar isVisible=\{syncStatus\.visible\} message=\{syncStatus\.message\} type=\{syncStatus\.type\} \/>/, '<div className="flex h-screen w-full bg-white dark:bg-slate-800 dark:bg-slate-900 transition-colors">');
    fs.writeFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', html);
    console.log('Fixed via regex');
}
