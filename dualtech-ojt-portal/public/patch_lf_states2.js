const fs = require('fs');

const lfPath = 'c:/Users/rober/dualtech-ojt-portal/public/lfportal.html';
let lfContent = fs.readFileSync(lfPath, 'utf8');

// Remove the mistakenly placed states (which was injected near showNotifications)
lfContent = lfContent.replace('const [showNotifications, setShowNotifications] = useState(false);\n      const [showMessages, setShowMessages] = useState(false);\n      const [totalUnread, setTotalUnread] = useState(0);', 'const [showNotifications, setShowNotifications] = useState(false);');

// Insert them correctly in Dashboard
lfContent = lfContent.replace(
    'const [elapsedTime, setElapsedTime] = useState("00:00:00");',
    'const [elapsedTime, setElapsedTime] = useState("00:00:00");\n      const [showMessages, setShowMessages] = useState(false);\n      const [totalUnread, setTotalUnread] = useState(0);'
);

// Inject onUnreadChange into ChatWidget if not present
if (!lfContent.includes('onUnreadChange={setTotalUnread}')) {
    lfContent = lfContent.replace(
        'onClose={() => setShowMessages(false)} />',
        'onClose={() => setShowMessages(false)} onUnreadChange={setTotalUnread} />'
    );
}

fs.writeFileSync(lfPath, lfContent);
console.log('Fixed state scope in lfportal.html');
