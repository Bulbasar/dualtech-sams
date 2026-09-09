const fs = require('fs');
const path = '../trainee-portal/src/components/layout/BSTPLayout.jsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(/import ChatWidget from '\.\.\/ChatWidget';\s*import ChatWidget from '\.\.\/ChatWidget';/g, "import ChatWidget from '../ChatWidget';");
c = c.replace(/import ChatWidget from "\.\.\/ChatWidget";\s*import ChatWidget from "\.\.\/ChatWidget";/g, 'import ChatWidget from "../ChatWidget";');
c = c.replace(/import ChatWidget from "\.\.\/ChatWidget";\s*import ChatWidget from '\.\.\/ChatWidget';/g, 'import ChatWidget from "../ChatWidget";');

// In case there are multiple <ChatWidget> elements
const widgetStr = `<ChatWidget currentUser={{id: profile.studentId, name: profile.given + ' ' + profile.family, role: 'BSTP', profilePhotoUrl: profile.profilePhotoUrl, adviserInitial: profile.adviser}} db={primaryDb} />`;
c = c.replace(/<ChatWidget[^>]+>\s*<ChatWidget[^>]+>/g, widgetStr);

fs.writeFileSync(path, c);
console.log('Fixed imports');
