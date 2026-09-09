const fs = require('fs');
const path = 'c:/Users/rober/dualtech-ojt-portal/trainee-portal/src/components/layout/BSTPLayout.jsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(
    'import React, { useState } from \'react\';',
    'import React, { useState } from \'react\';\nimport ChatWidget from \'../ChatWidget\';'
);

const searchStr = '{showMessageModal && (\n                <MessageModal onClose={() => setShowMessageModal(false)} />\n            )}\n        </div>';
const replacement = '{showMessageModal && (\n                <MessageModal onClose={() => setShowMessageModal(false)} />\n            )}\n            <ChatWidget currentUser={{id: profile.studentId, name: profile.given + \' \' + profile.family, role: \'BSTP\', profilePhotoUrl: profile.profilePhotoUrl, adviserInitial: profile.adviser}} db={primaryDb} />\n        </div>';

c = c.replace(searchStr, replacement);
fs.writeFileSync(path, c);
console.log('patched');
