const fs = require('fs');

const lfPath = 'c:/Users/rober/dualtech-ojt-portal/public/lfportal.html';
let lfContent = fs.readFileSync(lfPath, 'utf8');

const msgButtonLf = `
<button type="button" onClick={() => setShowMessages(!showMessages)} className="relative p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors" title="Messages">
    <Lucide.MessageCircle size={20} />
    {totalUnread > 0 && (
        <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white dark:border-slate-900"></span>
        </span>
    )}
</button>
{showMessages && (
    <div className="absolute top-12 right-12 mt-2 z-[100]">
        <ChatWidget currentUser={{id: lfData?.id || user?.uid, name: lfData?.name || "LF", role: 'LF', initials: lfData?.initials, profilePhotoUrl: null}} db={db} onClose={() => setShowMessages(false)} />
    </div>
)}
`;

if (!lfContent.includes('Lucide.MessageCircle size={20}')) {
    lfContent = lfContent.replace(/<button[^>]*onClick=\{\(\) => setShowNotifications\(\!showNotifications\)\}[^>]*>/, match => {
        return msgButtonLf + '\n' + match;
    });
    
    // Also need to add state for showMessages and totalUnread
    if (!lfContent.includes('const [showMessages, setShowMessages] = useState(false);')) {
        lfContent = lfContent.replace('const [showNotifications, setShowNotifications] = useState(false);', 'const [showNotifications, setShowNotifications] = useState(false);\n      const [showMessages, setShowMessages] = useState(false);\n      const [totalUnread, setTotalUnread] = useState(0);');
    }

    fs.writeFileSync(lfPath, lfContent);
    console.log('Injected message icon into lfportal.html');
} else {
    console.log('Already injected');
}
