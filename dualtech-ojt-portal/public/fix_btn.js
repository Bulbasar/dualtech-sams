const fs = require('fs');
const blPath = '../trainee-portal/src/components/layout/BSTPLayout.jsx';
let bl = fs.readFileSync(blPath, 'utf8');

const regex = /<button onClick=\{\(\) => setShowMessageModal\(true\)\} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">/g;

bl = bl.replace(regex, '<button onClick={() => setIsChatOpen(!isChatOpen)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">');

fs.writeFileSync(blPath, bl);
console.log('Fixed button');
