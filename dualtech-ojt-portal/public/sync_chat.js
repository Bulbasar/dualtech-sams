const fs = require('fs');

const jsxPath = 'c:/Users/rober/dualtech-ojt-portal/trainee-portal/src/components/ChatWidget.jsx';
const lfPath = 'c:/Users/rober/dualtech-ojt-portal/public/lfportal.html';
const adminPath = 'c:/Users/rober/dualtech-ojt-portal/public/bstpadmin.html';

let jsxContent = fs.readFileSync(jsxPath, 'utf8');

// Extract the component code from JSX
const funcStart = jsxContent.indexOf('export default function ChatWidget');
let funcCode = jsxContent.substring(funcStart);
funcCode = funcCode.replace('export default ', ''); // remove export default

// Inject the variable destructuring at the top of the function
const destructuring = `    const { useState, useEffect, useRef } = React;
    const { MessageCircle, X, Send, ChevronLeft, Search, Check, CheckCheck, Trash2 } = Lucide;
    const { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, getDocs, deleteDoc, setDoc, increment } = window; // We will extract these from firebase/firestore in the script\n`;

// Find the opening brace of function ChatWidget
const braceIndex = funcCode.indexOf('{');
funcCode = funcCode.substring(0, braceIndex + 1) + '\n' + destructuring + funcCode.substring(braceIndex + 1);

function updateFile(filePath) {
    let htmlContent = fs.readFileSync(filePath, 'utf8');
    
    // Find the old function ChatWidget
    const oldStart = htmlContent.indexOf('function ChatWidget(');
    // Find where the next function or component begins
    // In lfportal.html, it's `function Dashboard(props)`
    // In bstpadmin.html, it's `function Dashboard(props)`
    let oldEnd = htmlContent.indexOf('function Dashboard(props)');
    
    if (oldStart > -1 && oldEnd > -1) {
        htmlContent = htmlContent.substring(0, oldStart) + funcCode + '\n\n    ' + htmlContent.substring(oldEnd);
        fs.writeFileSync(filePath, htmlContent);
        console.log('Synced ChatWidget in ' + filePath);
    } else {
        console.log('Could not find boundaries in ' + filePath);
    }
}

updateFile(lfPath);
updateFile(adminPath);
