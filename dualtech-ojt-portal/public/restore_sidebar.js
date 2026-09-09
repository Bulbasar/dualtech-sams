const fs = require('fs');
const path = 'c:/Users/rober/dualtech-ojt-portal/public/bstpadmin.html';
let content = fs.readFileSync(path, 'utf8');

const anchor = '                <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-900 transition-colors duration-200">';
const afterAnchorIdx = content.indexOf(anchor) + anchor.length;

const replacement = `
                    {/* Mobile Overlay */}
                    {!isSidebarCollapsed && (
                        <div className="md:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarCollapsed(true)} />
                    )}

                    {/* Sidebar */}
                    <div className={\`fixed inset-y-0 left-0 z-50 md:static \${isSidebarCollapsed ? '-translate-x-full md:translate-x-0 md:w-20' : 'translate-x-0 w-64'} flex-shrink-0 bg-slate-50 dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300\`}>
                        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700">
                            {!isSidebarCollapsed && <div className="font-bold text-lg text-blue-600 dark:text-blue-400 flex items-center gap-2">`;

// Find where the deletion ended:
const deletionEndStr = '                                <div className="bg-blue-600 p-1.5 rounded-lg"><Shield size={20} className="text-white"/></div>';
const deletionEndIdx = content.indexOf(deletionEndStr, afterAnchorIdx);

if (afterAnchorIdx !== -1 && deletionEndIdx !== -1) {
    const newContent = content.substring(0, afterAnchorIdx) + replacement + '\n' + content.substring(deletionEndIdx);
    fs.writeFileSync(path, newContent);
    console.log("Restored deleted sidebar block!");
} else {
    console.log("Could not find anchor or deletion end!");
}
