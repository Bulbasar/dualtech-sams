const fs = require('fs');

const lfPath = 'c:/Users/rober/dualtech-ojt-portal/public/lfportal.html';
let lfContent = fs.readFileSync(lfPath, 'utf8');

if (!lfContent.includes('const [totalUnread, setTotalUnread] = useState(0);')) {
    lfContent = lfContent.replace(
        'const [elapsedTime, setElapsedTime] = useState("00:00:00");',
        'const [elapsedTime, setElapsedTime] = useState("00:00:00");\n      const [showMessages, setShowMessages] = useState(false);\n      const [totalUnread, setTotalUnread] = useState(0);'
    );
    
    // Also inject onUnreadChange prop into ChatWidget
    lfContent = lfContent.replace(
        'onClose={() => setShowMessages(false)} />',
        'onClose={() => setShowMessages(false)} onUnreadChange={setTotalUnread} />'
    );

    fs.writeFileSync(lfPath, lfContent);
    console.log('Fixed state declarations in lfportal.html');
} else {
    console.log('Already fixed');
}
