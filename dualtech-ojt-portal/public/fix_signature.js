const fs = require('fs');

const lfPath = 'c:/Users/rober/dualtech-ojt-portal/public/lfportal.html';
let content = fs.readFileSync(lfPath, 'utf8');

const brokenStr = `function ChatWidget({
    const { useState, useEffect, useRef } = React;
    const { MessageCircle, X, Send, ChevronLeft, Search, Check, CheckCheck, Trash2 } = Lucide;
    const { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, getDocs, deleteDoc, setDoc, increment } = window; // We will extract these from firebase/firestore in the script
 currentUser, db, isOpen, onClose, onUnreadChange }) {`;

const fixedStr = `function ChatWidget({ currentUser, db, isOpen, onClose, onUnreadChange }) {
    const { useState, useEffect, useRef } = React;
    const { MessageCircle, X, Send, ChevronLeft, Search, Check, CheckCheck, Trash2 } = Lucide;
    const { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, getDocs, deleteDoc, setDoc, increment } = window; // We will extract these from firebase/firestore in the script`;

if (content.includes(brokenStr)) {
    content = content.replace(brokenStr, fixedStr);
    fs.writeFileSync(lfPath, content);
    console.log('Fixed broken ChatWidget signature in lfportal.html');
} else {
    // maybe it has different whitespace, let's use regex
    const regex = /function ChatWidget\(\{\s*const \{ useState.*?window;.*?\n\s*currentUser, db, isOpen, onClose, onUnreadChange \}\) \{/s;
    if (regex.test(content)) {
        content = content.replace(regex, fixedStr);
        fs.writeFileSync(lfPath, content);
        console.log('Fixed broken ChatWidget signature in lfportal.html using regex');
    } else {
        console.log('Could not find broken signature');
    }
}
