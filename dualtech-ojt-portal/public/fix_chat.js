const fs = require('fs');

// 1. Update ChatWidget.jsx
const cwPath = '../trainee-portal/src/components/ChatWidget.jsx';
let cw = fs.readFileSync(cwPath, 'utf8');

cw = cw.replace('export default function ChatWidget({ currentUser, db }) {', 'export default function ChatWidget({ currentUser, db, isOpen, onClose }) {');
cw = cw.replace('const [isOpen, setIsOpen] = useState(false);', '');

// Remove the toggle button
const toggleBtnRegex = /<button onClick=\{\(\) => setIsOpen\(!isOpen\)\}[^>]+>[\s\S]*?<\/button>/g;
cw = cw.replace(toggleBtnRegex, '');
cw = cw.replace(/<button onClick=\{\(\) => setIsOpen\(false\)\}/g, '<button onClick={onClose}');

fs.writeFileSync(cwPath, cw);

// 2. Update BSTPLayout.jsx
const blPath = '../trainee-portal/src/components/layout/BSTPLayout.jsx';
let bl = fs.readFileSync(blPath, 'utf8');

bl = bl.replace('const [showMessageModal, setShowMessageModal] = useState(false);', 'const [isChatOpen, setIsChatOpen] = useState(false);');

const oldBtn = `<button onClick={() => setShowMessageModal(true)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">
                        <MessageCircle size={20} className={activeTab === 'profile' ? 'fill-blue-500 text-blue-500' : ''} />
                    </button>`;
const newBtn = `<button onClick={() => setIsChatOpen(!isChatOpen)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors relative">
                        <MessageCircle size={20} className={activeTab === 'profile' ? 'fill-blue-500 text-blue-500' : ''} />
                    </button>`;
bl = bl.replace(oldBtn, newBtn);

const oldModal = `{showMessageModal && (
                <MessageModal onClose={() => setShowMessageModal(false)} />
            )}`;
bl = bl.replace(oldModal, '');

const oldWidget = `<ChatWidget currentUser={{id: profile.studentId, name: profile.given + ' ' + profile.family, role: 'BSTP', profilePhotoUrl: profile.profilePhotoUrl, adviserInitial: profile.adviser}} db={primaryDb} />`;
const newWidget = `<ChatWidget currentUser={{id: profile.studentId, name: profile.given + ' ' + profile.family, role: 'BSTP', profilePhotoUrl: profile.profilePhotoUrl, adviserInitial: profile.adviser}} db={primaryDb} isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />`;
bl = bl.replace(oldWidget, newWidget);

fs.writeFileSync(blPath, bl);
console.log('Fixed chat integration');
