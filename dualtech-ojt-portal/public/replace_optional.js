const fs = require('fs');
let content = fs.readFileSync('temp_script.jsx', 'utf8');
content = content.replace(/auth\?\.currentUser\?\.displayName/g, "auth && auth.currentUser && auth.currentUser.displayName");
content = content.replace(/auth\?\.currentUser\?\.email/g, "auth && auth.currentUser && auth.currentUser.email");
fs.writeFileSync('temp_script2.jsx', content);
