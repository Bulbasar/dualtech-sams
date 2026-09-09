const fs = require('fs');

const blPath = '../trainee-portal/src/components/layout/BSTPLayout.jsx';
let bl = fs.readFileSync(blPath, 'utf8');

const widgetStr = `
            <ChatWidget currentUser={{id: profile.studentId, name: profile.given + ' ' + profile.family, role: 'BSTP', profilePhotoUrl: profile.profilePhotoUrl, adviserInitial: profile.adviser}} db={primaryDb} isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        </div>
    );
}`;

bl = bl.replace(/<\/div>\s*\);\s*\}/, widgetStr);

fs.writeFileSync(blPath, bl);
console.log('Injected widget');
