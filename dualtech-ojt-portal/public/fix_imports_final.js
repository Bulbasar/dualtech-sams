isconst fs = require('fs');

function fixImports(file) {
    let content = fs.readFileSync(file, 'utf8');

    // Find the import statement for firebase/firestore
    const importStart = content.indexOf('import {');
    const firestoreIndex = content.indexOf('"firebase/firestore"', importStart);

    if (importStart > -1 && firestoreIndex > -1) {
        // We have an import block
        // Let's just blindly replace the entire import block for firestore up to the closing quote
        const regex = /import\s+\{[^}]+\}\s+from\s+["']firebase\/firestore["']/g;
        const match = regex.exec(content);

        if (match) {
            const newImport = 'import { getFirestore, collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, getDocs, setDoc, increment } from "firebase/firestore"';
            content = content.replace(match[0], newImport);
            fs.writeFileSync(file, content);
            console.log('Fixed imports in ' + file);
        } else {
            console.log('Could not match regex in ' + file);
        }
    } else {
        console.log('Could not find import block in ' + file);
    }
}

fixImports('c:/Users/rober/dualtech-ojt-portal/public/lfportal.html');
fixImports('c:/Users/rober/dualtech-ojt-portal/public/bstpadmin.html');
