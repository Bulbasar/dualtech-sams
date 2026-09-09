const fs = require('fs');

const lfPath = 'c:/Users/rober/dualtech-ojt-portal/public/lfportal.html';
let content = fs.readFileSync(lfPath, 'utf8');

// 1. Update the imports
const oldImport = 'import { getFirestore, collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, getDocs, setDoc, increment } from "firebase/firestore"';
const newImport = 'import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, getDoc, getDocs, query, where, updateDoc, orderBy, limit, serverTimestamp, addDoc, increment } from "firebase/firestore";';

if (content.includes(oldImport)) {
    content = content.replace(oldImport, newImport);
} else {
    // Maybe it was modified differently, let's use regex
    const regex = /import\s+\{[^}]+\}\s+from\s+["']firebase\/firestore["']/g;
    const match = regex.exec(content);
    if (match) {
        content = content.replace(match[0], newImport);
    }
}

// 2. Update window.* assignments
const oldWindowStr = 'window.increment = increment;';
const newWindowStr = 'window.increment = increment;\n    window.getDoc = getDoc;\n    window.deleteDoc = deleteDoc;\n    window.limit = limit;';

if (content.includes(oldWindowStr) && !content.includes('window.getDoc')) {
    content = content.replace(oldWindowStr, newWindowStr);
}

fs.writeFileSync(lfPath, content);
console.log('Fixed missing getDoc imports');
