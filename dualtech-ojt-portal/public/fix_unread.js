const fs = require('fs');

// 1. Update ChatWidget.jsx
const cwPath = '../trainee-portal/src/components/ChatWidget.jsx';
let cw = fs.readFileSync(cwPath, 'utf8');

cw = cw.replace('export default function ChatWidget({ currentUser, db, isOpen, onClose }) {', 'export default function ChatWidget({ currentUser, db, isOpen, onClose, onUnreadChange }) {');

const queryStr = `const q = query(
            collection(db, "chat_conversations"),
            where("participants", "array-contains", currentUser.id),
            orderBy("lastMessageTime", "desc")
        );`;
const newQueryStr = `const q = query(
            collection(db, "chat_conversations"),
            where("participants", "array-contains", currentUser.id)
        );`;
cw = cw.replace(queryStr, newQueryStr);

const sortStr = `const convs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setConversations(convs);`;
const newSortStr = `const convs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            convs.sort((a, b) => (b.lastMessageTime?.toMillis?.() || 0) - (a.lastMessageTime?.toMillis?.() || 0));
            setConversations(convs);`;
cw = cw.replace(sortStr, newSortStr);

const unreadStr = `const totalUnread = conversations.reduce((acc, conv) => acc + (conv.unreadCount?.[currentUser.id] || 0), 0);`;
const newUnreadStr = `const totalUnread = conversations.reduce((acc, conv) => acc + (conv.unreadCount?.[currentUser.id] || 0), 0);

    useEffect(() => {
        if (onUnreadChange) onUnreadChange(totalUnread);
    }, [totalUnread, onUnreadChange]);`;
cw = cw.replace(unreadStr, newUnreadStr);

fs.writeFileSync(cwPath, cw);

// 2. Update BSTPLayout.jsx
const blPath = '../trainee-portal/src/components/layout/BSTPLayout.jsx';
let bl = fs.readFileSync(blPath, 'utf8');

bl = bl.replace('const [isChatOpen, setIsChatOpen] = useState(false);', 'const [isChatOpen, setIsChatOpen] = useState(false);\n    const [totalUnread, setTotalUnread] = useState(0);');

const oldBtn = `<button onClick={() => setIsChatOpen(!isChatOpen)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors relative">
                        <MessageCircle size={20} className={activeTab === 'profile' ? 'fill-blue-500 text-blue-500' : ''} />
                    </button>`;
const newBtn = `<button onClick={() => setIsChatOpen(!isChatOpen)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors relative">
                        <MessageCircle size={20} className={activeTab === 'profile' ? 'fill-blue-500 text-blue-500' : ''} />
                        {totalUnread > 0 && (
                            <span className="absolute top-0 right-0 flex h-3 w-3 mt-0.5 mr-0.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
                            </span>
                        )}
                    </button>`;
bl = bl.replace(oldBtn, newBtn);

const oldWidget = `<ChatWidget currentUser={{id: profile.studentId, name: profile.given + ' ' + profile.family, role: 'BSTP', profilePhotoUrl: profile.profilePhotoUrl, adviserInitial: profile.adviser}} db={primaryDb} isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />`;
const newWidget = `<ChatWidget currentUser={{id: profile.studentId, name: profile.given + ' ' + profile.family, role: 'BSTP', profilePhotoUrl: profile.profilePhotoUrl, adviserInitial: profile.adviser}} db={primaryDb} isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} onUnreadChange={setTotalUnread} />`;
bl = bl.replace(oldWidget, newWidget);

fs.writeFileSync(blPath, bl);

// 3. Update HTML files for the sorting bug
const adminPath = 'bstpadmin.html';
let adminHtml = fs.readFileSync(adminPath, 'utf8');
adminHtml = adminHtml.replace(queryStr, newQueryStr);
adminHtml = adminHtml.replace(sortStr, newSortStr);
fs.writeFileSync(adminPath, adminHtml);

const lfPath = 'lfportal.html';
let lfHtml = fs.readFileSync(lfPath, 'utf8');
lfHtml = lfHtml.replace(queryStr, newQueryStr);
lfHtml = lfHtml.replace(sortStr, newSortStr);
fs.writeFileSync(lfPath, lfHtml);

console.log('Fixed unread badge and indexing issue');
