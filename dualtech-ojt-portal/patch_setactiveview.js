const fs = require('fs');

let content = fs.readFileSync('tsd-portal/src/App.jsx', 'utf8');

// The string we inserted previously was:
// const navigate = useNavigate();
// const location = useLocation();
// const activeView = location.pathname.substring(1) || 'performance';

const searchStr = "const activeView = location.pathname.substring(1) || 'performance';";
const replacementStr = searchStr + "\nconst setActiveView = (view) => navigate('/' + view);";

content = content.replace(searchStr, replacementStr);

fs.writeFileSync('tsd-portal/src/App.jsx', content);
console.log('App.jsx patched for setActiveView');
