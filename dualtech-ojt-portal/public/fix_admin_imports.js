const fs = require('fs');

const adminPath = 'c:/Users/rober/dualtech-ojt-portal/public/bstpadmin.html';
let content = fs.readFileSync(adminPath, 'utf8');

const oldImport = "import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, getDoc, getDocs, query, where, updateDoc, orderBy, limit, serverTimestamp, addDoc } from 'firebase/firestore';";
const newImport = "import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, getDoc, getDocs, query, where, updateDoc, orderBy, limit, serverTimestamp, addDoc, increment } from 'firebase/firestore';";

if (content.includes(oldImport)) {
    content = content.replace(oldImport, newImport);
    
    // Also inject window.increment = increment; if not there
    if (!content.includes('window.increment = increment;')) {
        content = content.replace('window.collection = collection;', 'window.increment = increment; window.collection = collection;');
    }
    
    fs.writeFileSync(adminPath, content);
    console.log('Fixed bstpadmin.html imports');
} else {
    console.log('Could not find old import in bstpadmin.html');
}
