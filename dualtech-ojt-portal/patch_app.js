const fs = require('fs');

let content = fs.readFileSync('tsd-portal/src/app_extracted.jsx', 'utf8');

// 1. Remove the blockSourceAccess()
content = content.replace(/const blockSourceAccess = \(\) => {[\s\S]*?blockSourceAccess\(\);/m, '');

// 2. Fix compat firebase initialization
content = content.replace(
    'const firebaseApp = firebase.initializeApp(firebaseConfig);',
    `import firebase from 'firebase/compat/app';\nimport 'firebase/compat/auth';\nimport 'firebase/compat/firestore';\n\nconst firebaseApp = firebase.initializeApp(firebaseConfig);`
);

// 3. Fix the rendering at the bottom
content = content.replace(
    /const root = createRoot\(document\.getElementById\('root'\)\);\s*root\.render\(<App \/>\);/m,
    'export default App;'
);

// 4. In main.jsx we will render App. 

fs.writeFileSync('tsd-portal/src/App.jsx', content);
console.log('App.jsx has been patched and created.');
