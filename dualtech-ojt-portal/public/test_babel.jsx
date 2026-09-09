
        import React, { useState, useEffect, useMemo } from 'react';
        import { createRoot } from 'react-dom/client';
        import * as Lucide from 'lucide-react';
        import * as Recharts from 'recharts';
        import { initializeApp } from 'firebase/app';
        import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
        import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
        import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, getDoc, getDocs, query, where, updateDoc, orderBy, limit, serverTimestamp, addDoc } from 'firebase/firestore';
window.collection = collection; window.query = query; window.where = where; window.orderBy = orderBy; window.onSnapshot = onSnapshot; window.addDoc = addDoc; window.updateDoc = updateDoc; window.doc = doc; window.serverTimestamp = serverTimestamp; window.getDocs = getDocs; window.setDoc = setDoc;
        import { getFunctions, httpsCallable } from 'firebase/functions';

        const { QrCode, Download, ChevronUp, ChevronDown, Users, MapPin, LogOut, Plus, Trash2, Edit, X, Loader2, Moon, Sun, Lock, Mail, Shield, AlertTriangle, CheckCircle2, Copy , Menu, Globe, Layers, Clock, Bell, Eye, EyeOff} = Lucide;

        // --- Firebase Configuration ---
        const firebaseConfig = {
            apiKey: "AIzaSyAPpy4VcR2uTIPmH01aJ3GvegSDzNNpM9U",
            authDomain: "dualtech-ojt-portal.firebaseapp.com",
            projectId: "dualtech-ojt-portal",
            storageBucket: "dualtech-ojt-portal.firebasestorage.app",
            messagingSenderId: "255242185978",
            appId: "1:255242185978:web:2f07c554fad2e3a78ead43"
        };
        const app = initializeApp(firebaseConfig);
        const appCheck = initializeAppCheck(app, {
            provider: new ReCaptchaEnterpriseProvider('6LeGUowtAAAAALQKvlwQ1T7UtdbAqcL47wPVBxff'),
            isTokenAutoRefreshEnabled: true
        });
        const auth = getAuth(app);
        const db = getFirestore(app);
        const functions = getFunctions(app, "asia-southeast1");
        const APP_ID = "dualtech-ojt-portal"; 

        

// --- CHAT WIDGET ---
function ChatWidget({ currentUser, db, onClose }) {
    const { useState, useEffect, useRef } = React;
    const { MessageCircle, X, Send, ChevronLeft, Search, Check, CheckCheck, Trash2 } = Lucide;
    const { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, getDocs, setDoc, increment } = window; // We will extract these from firebase/firestore in the script

    const [activeConv, setActiveConv] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [view, setView] = useState('list'); 
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!currentUser?.id) return;
        const q = query(
            collection(db, "chat_conversations"),
            where("participants", "array-contains", currentUser.id)
        );
        const unsub = onSnapshot(q, (snap) => {
            const convs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            convs.sort((a, b) => (b.lastMessageTime?.toMillis?.() || 0) - (a.lastMessageTime?.toMillis?.() || 0));
            setConversations(convs);
        });
        return () => unsub();
    }, [currentUser?.id, db]);

    useEffect(() => {
        if (!activeConv?.id) {
            setMessages([]);
            return;
        }
        const q = query(collection(db, 'chat_conversations/' + activeConv.id + '/messages'), orderBy("timestamp", "asc"));
        const unsub = onSnapshot(q, (snap) => {
            const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setMessages(msgs);
            
            msgs.forEach(m => {
                if (!m.viewed && m.senderId !== currentUser.id) {
                    const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
                    updateDoc(doc(db, 'chat_conversations/' + activeConv.id + '/messages', m.id), {
                        viewed: true,
                        expiresAt: expiresAt
                    }).catch(e => console.error(e));
                }
            });
            
            if (activeConv.unreadCount && activeConv.unreadCount[currentUser.id] > 0) {
                updateDoc(doc(db, "chat_conversations", activeConv.id), {
                    ['unreadCount.' + currentUser.id]: 0
                }).catch(e => console.error(e));
            }
        });
        return () => unsub();
    }, [activeConv?.id, currentUser?.id, db]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSearch = async (e) => {
        setSearchQuery(e.target.value);
        if (e.target.value.length < 3) {
            setSearchResults([]);
            return;
        }
        try {
            const traineesQ = query(collection(db, "artifacts", "dualtech-ojt-portal", "public", "data", "trainees"));
            const tSnap = await getDocs(traineesQ);
            const results = [];
            const queryLower = e.target.value.toLowerCase();
            tSnap.forEach(d => {
                const data = d.data();
                const nameMatch = (data.Name || data.name || '').toLowerCase().includes(queryLower);
                const idMatch = (data.studentId || data['Student ID#'] || '').toLowerCase().includes(queryLower);
                if (currentUser.role === 'LF') {
                    const adv = (data.adviser || '').toLowerCase();
                    if (!adv.includes(currentUser.initials?.toLowerCase() || '---')) return;
                }
                if (nameMatch || idMatch) {
                    results.push({
                        id: data.studentId || d.id,
                        name: data.Name || data.name || 'Unknown',
                        role: "BSTP",
                        photoUrl: data.profilePhotoUrl || null
                    });
                }
            });
            setSearchResults(results.slice(0, 20));
        } catch (err) {
            console.error(err);
        }
    };

    const startConversation = async (contact) => {
        const convId = [currentUser.id, contact.id].sort().join('_');
        try {
            await updateDoc(doc(db, "chat_conversations", convId), {
                participants: [currentUser.id, contact.id],
                ['participantDetails.' + currentUser.id]: { name: currentUser.name, role: currentUser.role, photoUrl: currentUser.profilePhotoUrl || null },
                ['participantDetails.' + contact.id]: { name: contact.name, role: contact.role, photoUrl: contact.photoUrl || null }
            });
        } catch(e) {
            await setDoc(doc(db, "chat_conversations", convId), {
                participants: [currentUser.id, contact.id],
                participantDetails: {
                    [currentUser.id]: { name: currentUser.name, role: currentUser.role, photoUrl: currentUser.profilePhotoUrl || null },
                    [contact.id]: { name: contact.name, role: contact.role, photoUrl: contact.photoUrl || null }
                },
                lastMessage: "",
                lastMessageTime: serverTimestamp(),
                unreadCount: { [currentUser.id]: 0, [contact.id]: 0 }
            }, { merge: true }).catch(err => console.error(err));
        }
        setActiveConv({ id: convId, participantDetails: { [contact.id]: { name: contact.name, role: contact.role, photoUrl: contact.photoUrl || null } } });
        setView('chat');
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConv) return;
        const msgText = newMessage.trim();
        setNewMessage('');
        const otherUserId = activeConv.id.split('_').find(id => id !== currentUser.id);
        try {
            await addDoc(collection(db, 'chat_conversations/' + activeConv.id + '/messages'), {
                senderId: currentUser.id,
                message: msgText,
                timestamp: serverTimestamp(),
                viewed: false,
                unsent: false
            });
            // Fake increment for pure HTML fallback if increment isn't available
            const prevUnread = activeConv.unreadCount?.[otherUserId] || 0;
            await setDoc(doc(db, "chat_conversations", activeConv.id), {
                lastMessage: msgText,
                lastMessageTime: serverTimestamp(),
                ['unreadCount.' + otherUserId]: prevUnread + 1
            }, { merge: true });
        } catch (err) {
            console.error(err);
        }
    };

    const unsendMessage = async (msgId) => {
        try {
            await updateDoc(doc(db, 'chat_conversations/' + activeConv.id + '/messages', msgId), {
                unsent: true,
                message: "Message unsent"
            });
        } catch(e) { console.error(e); }
    };

    const getOtherUser = (conv) => {
        if (!conv.participantDetails) return { name: "Unknown" };
        const otherId = Object.keys(conv.participantDetails).find(id => id !== currentUser.id);
        return conv.participantDetails[otherId] || { name: "Unknown" };
    };

    return (
        <div className="w-[340px] h-[500px] mb-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-left relative z-[100]">
            <div className="bg-blue-600 text-white p-3 flex items-center justify-between shadow-md z-10">
                <div className="flex items-center gap-2">
                    {view !== 'list' && (
                        <button onClick={() => setView('list')} className="p-1 hover:bg-blue-700 rounded-full transition-colors">
                            <ChevronLeft size={20} />
                        </button>
                    )}
                    <h3 className="font-bold">
                        {view === 'list' ? 'Messages' : view === 'chat' ? getOtherUser(activeConv).name : 'New Message'}
                    </h3>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-blue-700 rounded-full transition-colors">
                    <X size={20} />
                </button>
            </div>

            {view === 'list' && (
                <div className="flex-1 overflow-y-auto flex flex-col">
                    <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                        <button onClick={() => setView('new_chat')} className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                            <MessageCircle size={18} /> New Message
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {conversations.length === 0 ? (
                            <div className="p-6 text-center text-slate-500">
                                <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No active conversations</p>
                            </div>
                        ) : (
                            conversations.map(conv => {
                                const other = getOtherUser(conv);
                                const unread = conv.unreadCount?.[currentUser.id] || 0;
                                return (
                                    <div key={conv.id} onClick={() => { setActiveConv(conv); setView('chat'); }}
                                         className="p-3 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 cursor-pointer transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                            {other.photoUrl ? <img src={other.photoUrl} alt="" className="w-full h-full object-cover" /> : <span className="font-bold text-slate-500">{other.name?.charAt(0)}</span>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline">
                                                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{other.name}</h4>
                                                <span className="text-[10px] text-slate-400">{conv.lastMessageTime ? new Date(conv.lastMessageTime.toDate()).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : ''}</span>
                                            </div>
                                            <p className={'text-xs truncate ' + (unread > 0 ? 'font-bold text-slate-800 dark:text-slate-200' : 'text-slate-500')}>
                                                {conv.lastMessage || "No messages yet"}
                                            </p>
                                        </div>
                                        {unread > 0 && (
                                            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                                                {unread}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {view === 'new_chat' && (
                <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900">
                    <div className="p-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={handleSearch}
                                placeholder="Search trainee name or ID..." 
                                className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {searchQuery.length < 3 ? (
                            <p className="p-4 text-center text-sm text-slate-500">Type at least 3 characters to search</p>
                        ) : searchResults.length === 0 ? (
                            <p className="p-4 text-center text-sm text-slate-500">No trainees found</p>
                        ) : (
                            searchResults.map(res => (
                                <div key={res.id} onClick={() => startConversation(res)}
                                     className="p-3 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 cursor-pointer">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                                        {res.photoUrl ? <img src={res.photoUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-slate-500 text-xs font-bold">{res.name.charAt(0)}</span>}
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{res.name}</div>
                                        <div className="text-[10px] text-slate-500">{res.id}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {view === 'chat' && (
                <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900">
                    <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-3">
                        {messages.map((m, i) => {
                            const isMe = m.senderId === currentUser.id;
                            return (
                                <div key={m.id} className={'flex flex-col ' + (isMe ? 'items-end' : 'items-start')}>
                                    <div className={'group relative max-w-[85%] rounded-2xl px-3 py-2 ' + (isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-sm shadow-sm')}>
                                        <p className={'text-sm ' + (m.unsent ? 'italic opacity-70' : '')}>{m.message}</p>
                                        {isMe && !m.unsent && (
                                            <button onClick={() => unsendMessage(m.id)} className="absolute top-1/2 -translate-y-1/2 -left-8 p-1.5 bg-white dark:bg-slate-700 rounded-full shadow-md text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 mt-1 px-1">
                                        <span className="text-[9px] text-slate-400">
                                            {m.timestamp ? new Date(m.timestamp.toDate()).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : 'Sending...'}
                                        </span>
                                        {isMe && (
                                            <span className="text-slate-400">
                                                {m.viewed ? <CheckCheck size={12} className="text-blue-500" /> : <Check size={12} />}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                    <form onSubmit={sendMessage} className="p-2 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex gap-2 items-end">
                        <textarea 
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 max-h-24 min-h-[40px] bg-slate-100 dark:bg-slate-900 border-none rounded-xl px-3 py-2.5 text-sm resize-none focus:ring-2 focus:ring-blue-500 outline-none dark:text-white custom-scrollbar"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage(e);
                                }
                            }}
                        />
                        <button type="submit" disabled={!newMessage.trim()} className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl transition-colors flex-shrink-0">
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
// --- END CHAT WIDGET ---


// --- COMPONENTS ---

        
        function ManageShiftsTab({ showMessage, globalData, setGlobalData }) {
            const [activeSubTab, setActiveSubTab] = useState('manage'); // 'manage' or 'assign'
            const shifts = globalData.shifts || [];
            const trainees = globalData.trainees || [];
            const [loading, setLoading] = useState(false);
            const [showModal, setShowModal] = useState(false);
            const [isEditing, setIsEditing] = useState(false);
            const [formData, setFormData] = useState({ 
                id: '', 
                name: '', 
                isSameForAllWeeks: false,
                evenWeekStartTime: '', 
                evenWeekEndTime: '',
                oddWeekStartTime: '',
                oddWeekEndTime: '' 
            });
            
            // Assign SubTab State
            const [searchQuery, setSearchQuery] = useState('');
            const [shiftFilter, setShiftFilter] = useState('');
            const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
            const [selectedTrainees, setSelectedTrainees] = useState([]);
            const [selectedShiftForBatch, setSelectedShiftForBatch] = useState('');
            const [selectedAdviserForBatch, setSelectedAdviserForBatch] = useState('');

            

            // --- Manage Schedules Logic ---
            const handleSaveShift = async (e) => {
                e.preventDefault();
                setLoading(true);
                try {
                    const shiftData = {
                        name: formData.name,
                        isSameForAllWeeks: formData.isSameForAllWeeks,
                        evenWeekStartTime: formData.evenWeekStartTime,
                        evenWeekEndTime: formData.evenWeekEndTime,
                        oddWeekStartTime: formData.oddWeekStartTime,
                        oddWeekEndTime: formData.oddWeekEndTime,
                    };
                    
                    if (formData.isSameForAllWeeks) {
                        shiftData.oddWeekStartTime = formData.evenWeekStartTime;
                        shiftData.oddWeekEndTime = formData.evenWeekEndTime;
                    }

                    if (isEditing) {
                        shiftData.updatedAt = new Date().toISOString();
                        await setDoc(doc(db, "artifacts", "dualtech-ojt-portal", "public", "data", "bstpShifts", formData.id), shiftData, { merge: true });
                        showMessage("Shift updated successfully!");
                    } else {
                        shiftData.createdAt = new Date().toISOString();
                        const newRef = doc(collection(db, "artifacts", "dualtech-ojt-portal", "public", "data", "bstpShifts"));
                        await setDoc(newRef, shiftData);
                        showMessage("Shift created successfully!");
                    }
                    setShowModal(false);
                } catch(e) {
                    showMessage("Error saving shift: " + e.message, "error");
                }
                setLoading(false);
            };

            const handleDeleteShift = async (id) => {
                if(!window.confirm('Are you sure you want to delete this shift?')) return;
                setLoading(true);
                try {
                    await deleteDoc(doc(db, "artifacts", "dualtech-ojt-portal", "public", "data", "bstpShifts", id));
                    showMessage("Shift deleted successfully!");
                } catch(e) {
                    showMessage("Error deleting shift: " + e.message, "error");
                }
                setLoading(false);
            };

            // --- Assign Shifts Logic ---
            const filteredTrainees = useMemo(() => {
                return trainees.filter(t => {
                    const status = (t.Status || t.status || 'Active').trim();
                    if (!['Active', 'Pre-BSTP', 'Post-BSTP'].includes(status)) return false;
                    
                    if (shiftFilter) {
                        const traineeShift = (t.shift || t.bstpshiftName || '').toLowerCase();
                        if (shiftFilter === 'none') {
                            if (traineeShift) return false;
                        } else {
                            const selectedShiftName = shifts.find(s => s.id === shiftFilter)?.name?.toLowerCase() || '';
                            if (traineeShift !== selectedShiftName && traineeShift !== shiftFilter.toLowerCase()) return false;
                        }
                    }

                    if (searchQuery) {
                        const q = searchQuery.toLowerCase();
                        const name = `${t.lastName || t.Family || ''} ${t.firstName || t.Given || ''}`.toLowerCase();
                        const idNum = (t.idNumber || t.id_number || t.id || '').toLowerCase();
                        const section = (t.section || t.Section || '').toLowerCase();
                        const adviser = (t.adviser || t.Adviser || '').toLowerCase();
                        return name.includes(q) || idNum.includes(q) || section.includes(q) || adviser.includes(q);
                    }
                    return true;
                });
            }, [trainees, searchQuery, shiftFilter, shifts]);

            const sortedTrainees = useMemo(() => {
                let sortable = [...filteredTrainees];
                sortable.sort((a, b) => {
                    let valA = '';
                    let valB = '';
                    if (sortConfig.key === 'name') {
                        valA = `${a.lastName || a.Family}, ${a.firstName || a.Given}`.toLowerCase();
                        valB = `${b.lastName || b.Family}, ${b.firstName || b.Given}`.toLowerCase();
                    } else if (sortConfig.key === 'idNumber') {
                        valA = (a.idNumber || a.id_number || a.id || '').toLowerCase();
                        valB = (b.idNumber || b.id_number || b.id || '').toLowerCase();
                    } else if (sortConfig.key === 'section') {
                        valA = (a.section || a.Section || '').toLowerCase();
                        valB = (b.section || b.Section || '').toLowerCase();
                    } else if (sortConfig.key === 'adviser') {
                        valA = (a.adviser || a.Adviser || '').toLowerCase();
                        valB = (b.adviser || b.Adviser || '').toLowerCase();
                    } else if (sortConfig.key === 'shift') {
                        valA = (a.shift || a.bstpshiftName || '').toLowerCase();
                        valB = (b.shift || b.bstpshiftName || '').toLowerCase();
                    }
                    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                    return 0;
                });
                return sortable;
            }, [filteredTrainees, sortConfig]);

            const requestSort = (key) => {
                let direction = 'asc';
                if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
                setSortConfig({ key, direction });
            };

            const handleSelectAll = (e) => {
                if (e.target.checked) {
                    setSelectedTrainees(sortedTrainees.map(t => t.id));
                } else {
                    setSelectedTrainees([]);
                }
            };

            const handleSelectTrainee = (id) => {
                if (selectedTrainees.includes(id)) {
                    setSelectedTrainees(selectedTrainees.filter(t => t !== id));
                } else {
                    setSelectedTrainees([...selectedTrainees, id]);
                }
            };

            
            const handleBatchAssignAdviser = async (lfInitials) => {
                if (selectedTrainees.length === 0) return;
                setLoading(true);
                try {
                    const batchPromises = selectedTrainees.map(tid => {
                        const docRef = doc(db, "artifacts", "dualtech-ojt-portal", "public", "data", "trainees", tid);
                        if (lfInitials) {
                            return updateDoc(docRef, { adviser: lfInitials, Adviser: lfInitials });
                        } else {
                            // Revert/Remove adviser
                            return updateDoc(docRef, { adviser: null, Adviser: null });
                        }
                    });
                    await Promise.all(batchPromises);
                    setGlobalData(prev => ({
                        ...prev,
                        trainees: prev.trainees.map(t => selectedTrainees.includes(t.id) ? { ...t, adviser: lfInitials || null, Adviser: lfInitials || null } : t)
                    }));
                    showMessage(`Successfully updated adviser for ${selectedTrainees.length} trainee(s).`);
                    setSelectedTrainees([]);
                    setSelectedAdviserForBatch('');
                } catch(e) {
                    showMessage("Error updating adviser: " + e.message, "error");
                }
                setLoading(false);
            };

            const handleBatchAssign = async (shiftId) => {
                if (selectedTrainees.length === 0) return;
                setLoading(true);
                try {
                    let sName = '';
                    if (shiftId) {
                        const shift = shifts.find(s => s.id === shiftId);
                        if (shift) sName = shift.name;
                    }
                    
                    const batchPromises = selectedTrainees.map(tid => {
                        const docRef = doc(db, "artifacts", "dualtech-ojt-portal", "public", "data", "trainees", tid);
                        if (shiftId) {
                            return updateDoc(docRef, { bstpshiftId: shiftId, bstpshiftName: sName });
                        } else {
                            // Revert/Remove shift
                            return updateDoc(docRef, { bstpshiftId: null, bstpshiftName: null });
                        }
                    });
                    await Promise.all(batchPromises);
                    setGlobalData(prev => ({
                        ...prev,
                        trainees: prev.trainees.map(t => selectedTrainees.includes(t.id) ? { ...t, bstpshiftId: shiftId || null, bstpshiftName: sName || null } : t)
                    }));
                    showMessage(`Successfully updated shifts for ${selectedTrainees.length} trainee(s).`);
                    setSelectedTrainees([]);
                    setSelectedShiftForBatch('');
                } catch(e) {
                    showMessage("Error updating shifts: " + e.message, "error");
                }
                setLoading(false);
            };

            return (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Clock className="text-blue-500" /> BSTP Shift Schedule
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage alternating shift schedules and assign them to trainees.</p>
                        </div>
                        
                        <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl">
                            <button 
                                onClick={() => setActiveSubTab('manage')}
                                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeSubTab === 'manage' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                Manage Schedules
                            </button>
                            <button 
                                onClick={() => setActiveSubTab('assign')}
                                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeSubTab === 'assign' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                Assign Shifts
                            </button>
                        </div>
                    </div>

                    {activeSubTab === 'manage' && (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                                <h3 className="font-bold text-slate-800 dark:text-white">Shift Schedules</h3>
                                <button onClick={() => {
                                    setFormData({ 
                                        id: '', name: '', isSameForAllWeeks: false,
                                        evenWeekStartTime: '', evenWeekEndTime: '',
                                        oddWeekStartTime: '', oddWeekEndTime: ''
                                    });
                                    setIsEditing(false);
                                    setShowModal(true);
                                }} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors">
                                    <Plus size={16} /> Add Shift
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                                        <tr>
                                            <th className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400">Shift Name</th>
                                            <th className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400">Even Weeks (e.g. Wk 34)</th>
                                            <th className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400">Odd Weeks (e.g. Wk 35)</th>
                                            <th className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                        {shifts.map(s => (
                                            <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{s.name}</td>
                                                <td className="p-4">
                                                    {s.isSameForAllWeeks ? (
                                                        <span className="text-slate-600 dark:text-slate-400">{s.evenWeekStartTime || s.startTime} - {s.evenWeekEndTime || s.endTime}</span>
                                                    ) : (
                                                        <span className="text-slate-600 dark:text-slate-400">{s.evenWeekStartTime} - {s.evenWeekEndTime}</span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    {s.isSameForAllWeeks ? (
                                                        <span className="text-slate-400 italic text-sm">Same</span>
                                                    ) : (
                                                        <span className="text-slate-600 dark:text-slate-400">{s.oddWeekStartTime} - {s.oddWeekEndTime}</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => {
                                                            setFormData({ 
                                                                id: s.id, 
                                                                name: s.name,
                                                                isSameForAllWeeks: s.isSameForAllWeeks || false,
                                                                evenWeekStartTime: s.evenWeekStartTime || s.startTime || '',
                                                                evenWeekEndTime: s.evenWeekEndTime || s.endTime || '',
                                                                oddWeekStartTime: s.oddWeekStartTime || s.startTime || '',
                                                                oddWeekEndTime: s.oddWeekEndTime || s.endTime || ''
                                                            });
                                                            setIsEditing(true);
                                                            setShowModal(true);
                                                        }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                                                            <Edit size={16} />
                                                        </button>
                                                        <button onClick={() => handleDeleteShift(s.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {shifts.length === 0 && !loading && (
                                            <tr>
                                                <td colSpan="4" className="p-8 text-center text-slate-500 italic">No shift schedules defined.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeSubTab === 'assign' && (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-[600px]">
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <div className="relative flex-1 sm:w-64">
                                        <input 
                                            type="text" 
                                            placeholder="Search name, id, section..." 
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            className="w-full pl-3 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                                        />
                                    </div>
                                    <select 
                                        value={shiftFilter}
                                        onChange={e => setShiftFilter(e.target.value)}
                                        className="w-32 sm:w-40 p-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 outline-none text-sm font-medium"
                                    >
                                        <option value="">All Shifts</option>
                                        <option value="none">No Shift assigned</option>
                                        {shifts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    <span className="text-sm font-bold text-slate-500 whitespace-nowrap">{filteredTrainees.length} Trainees</span>
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <select 
                                        value={selectedShiftForBatch}
                                        onChange={e => setSelectedShiftForBatch(e.target.value)}
                                        className="flex-1 sm:w-48 p-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 outline-none text-sm font-medium"
                                    >
                                        <option value="">Select Shift...</option>
                                        {shifts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    <button 
                                        onClick={() => handleBatchAssign(selectedShiftForBatch)}
                                        disabled={selectedTrainees.length === 0 || !selectedShiftForBatch}
                                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap"
                                    >
                                        Assign ({selectedTrainees.length})
                                    </button>
                                    <button 
                                        onClick={() => handleBatchAssign(null)}
                                        disabled={selectedTrainees.length === 0}
                                        className="bg-slate-600 hover:bg-slate-700 disabled:opacity-50 text-white px-3 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap"
                                    >
                                        Revert
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-y-auto flex-1 custom-scrollbar">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                                        <tr>
                                            <th className="p-4 w-12 text-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedTrainees.length === sortedTrainees.length && sortedTrainees.length > 0}
                                                    onChange={handleSelectAll}
                                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                />
                                            </th>
                                            <th className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => requestSort('idNumber')}>
                                                Student ID# {sortConfig.key === 'idNumber' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => requestSort('name')}>
                                                Trainee Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => requestSort('section')}>
                                                Section {sortConfig.key === 'section' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => requestSort('adviser')}>
                                                Adviser {sortConfig.key === 'adviser' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => requestSort('shift')}>
                                                Assigned Shift {sortConfig.key === 'shift' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                        {sortedTrainees.map(t => (
                                            <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="p-4 text-center">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedTrainees.includes(t.id)}
                                                        onChange={() => handleSelectTrainee(t.id)}
                                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                </td>
                                                <td className="p-4 text-sm font-medium">{t.idNumber || t.id_number || t.id}</td>
                                                <td className="p-4 font-bold">{t.lastName || t.Family || ''}, {t.firstName || t.Given || ''}</td>
                                                <td className="p-4 text-sm">{t.section || t.Section || ''}</td>
                                                <td className="p-4 text-sm text-slate-500">{t.adviser || t.Adviser || ''}</td>
                                                <td className="p-4">
                                                    {(t.shift || t.bstpshiftName) ? 
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 text-xs font-bold rounded-lg">{t.shift || t.bstpshiftName}</span> 
                                                        : <span className="text-slate-400 text-xs italic">None</span>
                                                    }
                                                </td>
                                            </tr>
                                        ))}
                                        {sortedTrainees.length === 0 && !loading && (
                                            <tr>
                                                <td colSpan="6" className="p-8 text-center text-slate-500 italic">No trainees found matching criteria.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Manage Shift Modal */}
                    {showModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
                                    <h3 className="font-bold text-lg">{isEditing ? 'Edit Shift Schedule' : 'Add Shift Schedule'}</h3>
                                    <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={20} /></button>
                                </div>
                                <div className="p-6 overflow-y-auto">
                                    <form id="shiftForm" onSubmit={handleSaveShift} className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Shift Name</label>
                                            <input type="text" required className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                placeholder="e.g. Shift A"
                                                value={formData.name}
                                                onChange={e => setFormData({...formData, name: e.target.value})}
                                            />
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="checkbox" 
                                                id="sameWeeks"
                                                checked={formData.isSameForAllWeeks}
                                                onChange={e => setFormData({...formData, isSameForAllWeeks: e.target.checked})}
                                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <label htmlFor="sameWeeks" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                                                Same schedule for all weeks
                                            </label>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                                                {formData.isSameForAllWeeks ? "Shift Times" : "Even Weeks (e.g. Week 34)"}
                                            </h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 mb-1">Start Time</label>
                                                    <input type="time" required className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                        value={formData.evenWeekStartTime}
                                                        onChange={e => setFormData({...formData, evenWeekStartTime: e.target.value})}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 mb-1">End Time</label>
                                                    <input type="time" required className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                        value={formData.evenWeekEndTime}
                                                        onChange={e => setFormData({...formData, evenWeekEndTime: e.target.value})}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {!formData.isSameForAllWeeks && (
                                            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                                <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Odd Weeks (e.g. Week 35)</h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 mb-1">Start Time</label>
                                                        <input type="time" required={!formData.isSameForAllWeeks} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                            value={formData.oddWeekStartTime}
                                                            onChange={e => setFormData({...formData, oddWeekStartTime: e.target.value})}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 mb-1">End Time</label>
                                                        <input type="time" required={!formData.isSameForAllWeeks} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                            value={formData.oddWeekEndTime}
                                                            onChange={e => setFormData({...formData, oddWeekEndTime: e.target.value})}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </form>
                                </div>
                                <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex justify-end gap-3">
                                    <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                                    <button type="submit" form="shiftForm" disabled={loading} className="px-6 py-2 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2">
                                        {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                        {isEditing ? 'Save Changes' : 'Add Shift'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        function ManageSchoolLocationTab({ showMessage }) {
            const [activeSubTab, setActiveSubTab] = useState('school'); // 'school' or 'classrooms'
            
            // School Location State
            const [schoolLocation, setSchoolLocation] = useState({ latitude: '', longitude: '', radiusMeters: 500 });
            const [schoolLocLoading, setSchoolLocLoading] = useState(false);
            
            // Classrooms State
            const [classrooms, setClassrooms] = useState([]);
            const [skillsets, setSkillsets] = useState([]);
            const [classroomLoading, setClassroomLoading] = useState(false);
            const [newClassroom, setNewClassroom] = useState({ id: '', name: '', skillset: '', lat: '', lng: '', radiusMeters: 100, capacity: '' });
            
            // Modal States
            const [showClassroomModal, setShowClassroomModal] = useState(false);
            const [isEditingClassroom, setIsEditingClassroom] = useState(false);

              const useCurrentRoomLocation = () => {
                  if ("geolocation" in navigator) {
                      navigator.geolocation.getCurrentPosition(
                          (pos) => {
                              setNewClassroom(prev => ({
                                  ...prev,
                                  lat: pos.coords.latitude,
                                  lng: pos.coords.longitude
                              }));
                              showMessage("Room location pinned successfully!", "success");
                          },
                          (err) => showMessage("Failed to get location: " + err.message, "error"),
                          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                      );
                  } else {
                      showMessage("Geolocation is not supported by your browser", "error");
                  }
              };

            const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
            
            // QR Modal State
            const [showQrModal, setShowQrModal] = useState(false);
            const [qrDataUrl, setQrDataUrl] = useState('');
            const [qrRoomName, setQrRoomName] = useState('');

            useEffect(() => {
                fetchSchoolLocation();
                fetchClassrooms();
                fetchSkillsets();
            }, []);

            async function fetchSchoolLocation() {
                setSchoolLocLoading(true);
                try {
                    const docRef = doc(db, "artifacts", APP_ID, "public", "data", "settings", "schoolLocation");
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setSchoolLocation(docSnap.data());
                    }
                } catch (e) {
                    console.error("Error fetching school location:", e);
                }
                setSchoolLocLoading(false);
            }
            
            async function saveSchoolLocation() {
                setSchoolLocLoading(true);
                try {
                    await setDoc(doc(db, "artifacts", APP_ID, "public", "data", "settings", "schoolLocation"), {
                        latitude: parseFloat(schoolLocation.latitude),
                        longitude: parseFloat(schoolLocation.longitude),
                        radiusMeters: parseFloat(schoolLocation.radiusMeters)
                    });
                    showMessage('Dualtech School Location saved!');
                } catch (e) {
                    showMessage('Error saving location: ' + e.message, 'error');
                }
                setSchoolLocLoading(false);
            }
            
            const useCurrentLocation = () => {
                if (!navigator.geolocation) {
                    showMessage('Geolocation is not supported by your browser.', 'error');
                    return;
                }
                showMessage('Acquiring location...');
                navigator.geolocation.getCurrentPosition((pos) => {
                    setSchoolLocation(prev => ({
                        ...prev,
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude
                    }));
                    showMessage('Location pinned successfully!');
                }, (err) => {
                    showMessage('Error acquiring location: ' + err.message, 'error');
                }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
            };
            
            async function fetchClassrooms() {
                setClassroomLoading(true);
                try {
                    const snap = await getDocs(collection(db, "artifacts", APP_ID, "public", "data", "bstpVenues"));
                    const list = [];
                    snap.forEach(d => list.push({ id: d.id, ...d.data() }));
                    setClassrooms(list);
                } catch (e) {
                    console.error("Error fetching classrooms:", e);
                }
                setClassroomLoading(false);
            }

            async function fetchSkillsets() {
                try {
                    const snap = await getDocs(collection(db, "artifacts", APP_ID, "public", "data", "bstpSkillsets"));
                    const list = [];
                    snap.forEach(d => list.push({ id: d.id, ...d.data() }));
                    setSkillsets(list);
                } catch (e) {
                    console.error("Error fetching skillsets:", e);
                }
            }
            
            function openAddClassroomModal() {
                setNewClassroom({ id: '', name: '', skillset: '', lat: '', lng: '', radiusMeters: 100, capacity: '' });
                setIsEditingClassroom(false);
                setShowClassroomModal(true);
            }

            function openEditClassroomModal(c) {
                setNewClassroom({ 
                    id: c.id, 
                    name: c.name, 
                    skillset: c.skillset || '', 
                    lat: c.latitude || c.lat, 
                    lng: c.longitude || c.lng, 
                    radiusMeters: c.radiusMeters || 100, 
                    capacity: c.capacity || '' 
                });
                setIsEditingClassroom(true);
                setShowClassroomModal(true);
            }

            async function saveClassroom() {
                if (!newClassroom.name || !newClassroom.lat || !newClassroom.lng) {
                    showMessage('Please fill all required classroom fields', 'error');
                    return;
                }
                setClassroomLoading(true);
                try {
                    const data = {
                        name: newClassroom.name,
                        skillset: newClassroom.skillset || '',
                        latitude: parseFloat(newClassroom.lat),
                        longitude: parseFloat(newClassroom.lng),
                        radiusMeters: parseInt(newClassroom.radiusMeters) || 100,
                        capacity: parseInt(newClassroom.capacity) || 0
                    };
                    
                    if (isEditingClassroom && newClassroom.id) {
                        data.updatedAt = new Date().toISOString();
                        await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "bstpVenues", newClassroom.id), data);
                        showMessage('Classroom updated!');
                    } else {
                        data.createdAt = new Date().toISOString();
                        const newRef = doc(collection(db, "artifacts", APP_ID, "public", "data", "bstpVenues"));
                        await setDoc(newRef, data);
                        showMessage('Classroom added!');
                    }
                    
                    setShowClassroomModal(false);
                    fetchClassrooms();
                } catch (e) {
                    showMessage('Error saving classroom: ' + e.message, 'error');
                }
                setClassroomLoading(false);
            }
            
            async function deleteClassroom(id) {
                if (!window.confirm('Are you sure you want to delete this classroom?')) return;
                setClassroomLoading(true);
                try {
                    await deleteDoc(doc(db, "artifacts", APP_ID, "public", "data", "bstpVenues", id));
                    showMessage('Classroom deleted!');
                    fetchClassrooms();
                } catch (e) {
                    showMessage('Error deleting classroom: ' + e.message, 'error');
                }
                setClassroomLoading(false);
            }
            
            async function generateAndShowQR(classroom) {
                const qrPayload = JSON.stringify({
                    roomId: classroom.id,
                    name: classroom.name,
                    skillset: classroom.skillset || '',
                    lat: classroom.latitude || classroom.lat,
                    lng: classroom.longitude || classroom.lng,
                    radiusMeters: classroom.radiusMeters
                });
                try {
                    const url = await window.QRCode.toDataURL(qrPayload, { width: 400, margin: 2, color: { dark: '#0f172a', light: '#ffffff' } });
                    setQrDataUrl(url);
                    setQrRoomName(classroom.name);
                    setShowQrModal(true);
                } catch (err) {
                    console.error("QR Code Error:", err);
                    showMessage('Error generating QR code', 'error');
                }
            }

            const requestSort = (key) => {
                let direction = 'asc';
                if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
                setSortConfig({ key, direction });
            };

            const sortedClassrooms = useMemo(() => {
                let sortableItems = [...classrooms];
                if (sortConfig !== null) {
                    sortableItems.sort((a, b) => {
                        let valA = a[sortConfig.key];
                        let valB = b[sortConfig.key];
                        if (typeof valA === 'string') valA = valA.toLowerCase();
                        if (typeof valB === 'string') valB = valB.toLowerCase();
                        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                        return 0;
                    });
                }
                return sortableItems;
            }, [classrooms, sortConfig]);

            return (
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <MapPin className="text-blue-500" /> Manage Classrooms and School Location
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage geofence locations and generate Room QR codes</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700">
                        <button onClick={() => setActiveSubTab('school')} className={`pb-4 px-4 font-bold transition-all ${activeSubTab === 'school' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Dualtech Campus</button>
                        <button onClick={() => setActiveSubTab('classrooms')} className={`pb-4 px-4 font-bold transition-all ${activeSubTab === 'classrooms' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Classrooms / Venues</button>
                    </div>
                    
                    {activeSubTab === 'school' && (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
                            <h3 className="font-bold text-lg dark:text-white">Main Campus Geolocation</h3>
                            <p className="text-sm text-slate-500">This is used for general "Time In" and "Time Out" for BSTP trainees before they select a specific room.</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Latitude</label>
                                    <input type="number" step="any" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900" value={schoolLocation.latitude} onChange={e=>setSchoolLocation({...schoolLocation, latitude:e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Longitude</label>
                                    <input type="number" step="any" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900" value={schoolLocation.longitude} onChange={e=>setSchoolLocation({...schoolLocation, longitude:e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Radius (Meters)</label>
                                    <input type="number" step="any" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900" value={schoolLocation.radiusMeters} onChange={e=>setSchoolLocation({...schoolLocation, radiusMeters:e.target.value})} />
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-3 mt-4">
                                <button onClick={saveSchoolLocation} disabled={schoolLocLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2">
                                    {schoolLocLoading ? <Loader2 className="animate-spin" size={20}/> : <Copy size={20}/>}
                                    Save Campus Location
                                </button>
                                <button onClick={useCurrentLocation} disabled={schoolLocLoading} className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-colors">
                                    <MapPin size={20}/>
                                    Use My Current Location
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {activeSubTab === 'classrooms' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                                <h3 className="font-bold text-lg dark:text-white">Classrooms / Venues</h3>
                                <button onClick={openAddClassroomModal} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2">
                                    <Plus size={18}/> Add Classroom
                                </button>
                            </div>
                            
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-x-auto">
                                <table className="w-full text-left whitespace-nowrap min-w-[600px]">
                                    <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                                        <tr>
                                            <th className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => requestSort('name')}>
                                                Room Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => requestSort('skillset')}>
                                                Skillset {sortConfig.key === 'skillset' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => requestSort('latitude')}>
                                                Coordinates {sortConfig.key === 'latitude' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => requestSort('radiusMeters')}>
                                                Radius (m) {sortConfig.key === 'radiusMeters' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => requestSort('capacity')}>
                                                Capacity {sortConfig.key === 'capacity' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {sortedClassrooms.map(c => (
                                            <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                <td className="p-4 font-bold dark:text-slate-200">{c.name}</td>
                                                <td className="p-4 dark:text-slate-300">
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">{c.skillset || 'N/A'}</span>
                                                </td>
                                                <td className="p-4 font-mono text-xs dark:text-slate-400">{c.latitude || c.lat}, {c.longitude || c.lng}</td>
                                                <td className="p-4 dark:text-slate-300">{c.radiusMeters}m</td>
                                                <td className="p-4 dark:text-slate-300">
                                                    {c.capacity && c.capacity > 0 ? (
                                                        <span className="font-bold">{c.capacity}</span>
                                                    ) : (
                                                        <span className="text-slate-400 text-xs italic">Unlimited</span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <button title="Show QR Code" onClick={() => generateAndShowQR(c)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">
                                                            <QrCode size={18}/>
                                                        </button>
                                                        <button title="Edit" onClick={() => openEditClassroomModal(c)} className="p-2 text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700/50 rounded-lg">
                                                            <Edit size={18}/>
                                                        </button>
                                                        <button title="Delete" onClick={() => deleteClassroom(c.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                                                            <Trash2 size={18}/>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {sortedClassrooms.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="p-8 text-center text-slate-500 italic">No classrooms found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {showClassroomModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
                                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
                                    <h3 className="font-bold text-lg">{isEditingClassroom ? 'Edit Classroom' : 'Add New Classroom'}</h3>
                                    <button onClick={() => setShowClassroomModal(false)} className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={20} /></button>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="sm:col-span-2">
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Room Name</label>
                                            <input type="text" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Room Name" value={newClassroom.name} onChange={e=>setNewClassroom({...newClassroom, name:e.target.value})} />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Skillset</label>
                                            <select className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={newClassroom.skillset} onChange={e=>setNewClassroom({...newClassroom, skillset:e.target.value})}>
                                                <option value="">Select a skillset...</option>
                                                {skillsets.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <button type="button" onClick={useCurrentRoomLocation} className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors border border-slate-200 dark:border-slate-700 mb-2">
                                                <MapPin size={16}/> Use My Current Location
                                            </button>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Latitude</label>
                                            <input type="number" step="any" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Latitude" value={newClassroom.lat} onChange={e=>setNewClassroom({...newClassroom, lat:e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Longitude</label>
                                            <input type="number" step="any" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Longitude" value={newClassroom.lng} onChange={e=>setNewClassroom({...newClassroom, lng:e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Radius (m)</label>
                                            <input type="number" step="any" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Radius (m)" value={newClassroom.radiusMeters} onChange={e=>setNewClassroom({...newClassroom, radiusMeters:e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Capacity (0=unlimited)</label>
                                            <input type="number" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Capacity" value={newClassroom.capacity} onChange={e=>setNewClassroom({...newClassroom, capacity:e.target.value})} />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex justify-end gap-3">
                                    <button type="button" onClick={() => setShowClassroomModal(false)} className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                                    <button type="button" onClick={saveClassroom} disabled={classroomLoading} className="px-6 py-2 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2">
                                        {classroomLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                        {isEditingClassroom ? 'Save Changes' : 'Add Classroom'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {showQrModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
                                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
                                    <h3 className="font-bold text-lg">{qrRoomName}</h3>
                                    <button onClick={() => setShowQrModal(false)} className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={20} /></button>
                                </div>
                                <div className="p-6 flex flex-col items-center">
                                    <img src={qrDataUrl} alt="Room QR Code" className="w-64 h-64 border border-slate-200 rounded-xl" />
                                    <p className="text-center text-sm text-slate-500 mt-4">Trainees can scan this QR code to clock in to this skillset room.</p>
                                </div>
                                <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                                    <button onClick={() => {
                                        const link = document.createElement('a');
                                        link.download = `QR_${qrRoomName}.png`;
                                        link.href = qrDataUrl;
                                        link.click();
                                    }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2">
                                        <Download size={18} /> Download
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            );
        }

        function ManageUsersTab({ showMessage, globalData, setGlobalData }) {
            const [activeSubTab, setActiveSubTab] = useState('lfs'); // 'lfs' or 'trainees'
            const [showSummary, setShowSummary] = useState(true);
            
            const bstpUsers = globalData.lfs || [];
            const trainees = globalData.trainees || [];
            const [loading, setLoading] = useState(false);
            const [showModal, setShowModal] = useState(false);
            
            // Form state
            const [formData, setFormData] = useState({ id: '', name: '', email: '', initials: '', role: 'Learning Facilitator', password: '' });
            const [isEditing, setIsEditing] = useState(false);

            // Trainees Advanced Features State
            const [traineeFilterStatus, setTraineeFilterStatus] = useState('All');
            const [traineeSearchTerm, setTraineeSearchTerm] = useState('');
            const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
            const [currentPage, setCurrentPage] = useState(1);
            const [itemsPerPage, setItemsPerPage] = useState(50); // numeric or 'All'

              const [selectedTraineesUsersTab, setSelectedTraineesUsersTab] = useState([]);
              const [selectedAdviserForUsersTab, setSelectedAdviserForUsersTab] = useState('');
              const [selectedProctorForUsersTab, setSelectedProctorForUsersTab] = useState('');

              const handleSelectAllUsersTab = (e) => {
                  if (e.target.checked) {
                      setSelectedTraineesUsersTab(paginatedTrainees.map(t => t.id));
                  } else {
                      setSelectedTraineesUsersTab([]);
                  }
              };

              const handleSelectTraineeUsersTab = (id) => {
                  setSelectedTraineesUsersTab(prev => 
                      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
                  );
              };

              const handleBatchAssignAdviserUsersTab = async (lfInitials) => {
                  if (selectedTraineesUsersTab.length === 0) return;
                  setLoading(true);
                  try {
                      const batchPromises = selectedTraineesUsersTab.map(tid => {
                          const docRef = doc(db, "artifacts", "dualtech-ojt-portal", "public", "data", "trainees", tid);
                          if (lfInitials) {
                              return updateDoc(docRef, { adviser: lfInitials, Adviser: lfInitials });
                          } else {
                              return updateDoc(docRef, { adviser: null, Adviser: null });
                          }
                      });
                      await Promise.all(batchPromises);
                      setGlobalData(prev => ({
                          ...prev,
                          trainees: prev.trainees.map(t => selectedTraineesUsersTab.includes(t.id) ? { ...t, adviser: lfInitials || null, Adviser: lfInitials || null } : t)
                      }));
                      showMessage(`Successfully updated adviser for ${selectedTraineesUsersTab.length} trainee(s).`);
                      setSelectedTraineesUsersTab([]);
                      setSelectedAdviserForUsersTab('');
                  } catch(e) {
                      showMessage("Error updating adviser: " + e.message, "error");
                  }
                  setLoading(false);
              };

              const handleBatchAssignProctorUsersTab = async (lfInitials) => {
                  if (selectedTraineesUsersTab.length === 0) return;
                  try {
                      const batch = [];
                      for (const tid of selectedTraineesUsersTab) {
                          const docRef = doc(db, "artifacts", "dualtech-ojt-portal", "public", "data", "trainees", tid);
                          if (lfInitials) {
                              batch.push(updateDoc(docRef, { proctor: lfInitials, Proctor: lfInitials }));
                          } else {
                              batch.push(updateDoc(docRef, { proctor: null, Proctor: null }));
                          }
                      }
                      await Promise.all(batch);
                      setGlobalData(prev => ({
                          ...prev,
                          trainees: prev.trainees.map(t => selectedTraineesUsersTab.includes(t.id) ? { ...t, proctor: lfInitials || null, Proctor: lfInitials || null } : t)
                      }));
                      showMessage(`Successfully updated proctor for ${selectedTraineesUsersTab.length} trainee(s).`);
                      setSelectedProctorForUsersTab('');
                  } catch (e) {
                      showMessage("Error updating proctor: " + e.message, "error");
                  }
              };

            const handleSave = async (e) => {
                e.preventDefault();
                try {
                    if (isEditing) {
                        await updateDoc(doc(db, "bstpUsers", formData.id), {
                            name: formData.name,
                            email: formData.email,
                            initials: formData.initials,
                            role: formData.role,
                            updatedAt: new Date().toISOString()
                        });
                        setGlobalData(prev => ({
                            ...prev,
                            lfs: prev.lfs.map(lf => lf.id === formData.id ? { ...lf, name: formData.name, email: formData.email, initials: formData.initials, role: formData.role } : lf)
                        }));
                        showMessage("User updated successfully!");
                    } else {
                        const newRef = doc(collection(db, "bstpUsers"));
                        await setDoc(newRef, {
                            name: formData.name,
                            email: formData.email,
                            initials: formData.initials,
                            role: formData.role,
                            status: 'Active',
                            createdAt: new Date().toISOString()
                        });
                        setGlobalData(prev => ({
                            ...prev,
                            lfs: [{ id: newRef.id, name: formData.name, email: formData.email, initials: formData.initials, role: formData.role, status: 'Active' }, ...prev.lfs]
                        }));
                        showMessage("User record created!");
                    }
                    setShowModal(false);
                } catch(e) {
                    showMessage("Error saving user: " + e.message, "error");
                }
            };

            const handleDelete = async (u, isTrainee) => {
                if(!window.confirm(`Are you sure you want to delete the account for ${u.name || u.email || u.idNumber}? This will allow them to re-register.`)) return;
                try {
                    showMessage("Deleting account...", "info");
                    const deleteFn = httpsCallable(functions, "deleteUserAuth");
                    const result = await deleteFn({ email: u.email });
                    
                    if (result.data.success) {
                        if (isTrainee) {
                            await updateDoc(doc(db, "artifacts", "dualtech-ojt-portal", "public", "data", "bstpTrainees", u.id), { status: 'Deleted', deletedAt: new Date().toISOString() });
                        } else {
                            await updateDoc(doc(db, "bstpUsers", u.id), { status: 'Deleted', deletedAt: new Date().toISOString() });
                            setGlobalData(prev => ({
                                ...prev,
                                lfs: prev.lfs.filter(lf => lf.id !== u.id)
                            }));
                        }
                        showMessage("User soft-deleted successfully!");
                    } else {
                        showMessage(result.data.message || "Failed to delete account.", "error");
                    }
                } catch(e) {
                    showMessage("Error deleting user: " + e.message, "error");
                }
            };

            const handleApprove = async (user) => {
                if(!window.confirm(`Are you sure you want to approve ${user.name}?`)) return;
                try {
                    await updateDoc(doc(db, "bstpUsers", user.id), { status: 'Active', approvedAt: new Date().toISOString() });
                    setGlobalData(prev => ({
                        ...prev,
                        lfs: prev.lfs.map(lf => lf.id === user.id ? { ...lf, status: 'Active' } : lf)
                    }));
                    
                    // Trigger Apps Script email
                    try {
                        await fetch("https://script.google.com/macros/s/AKfycbxl_hDEqFZ7mTuBvLsPwfs2l3nCHH2UonqaDGdrbKlJ-rg13F02WsjROINdf-3nHyjtTA/exec", {
                            method: "POST",
                            body: JSON.stringify({
                                type: "lfApproval",
                                name: user.name,
                                targetEmails: [user.email]
                            }),
                            headers: { "Content-Type": "text/plain;charset=utf-8" }
                        });
                    } catch(err) {
                        console.error("Failed to send approval email", err);
                    }
                    
                    showMessage("User approved successfully!");
                } catch(e) {
                    showMessage("Error approving user: " + e.message, "error");
                }
            };

            const openEdit = (u) => {
                setFormData({ id: u.id, name: u.name || '', email: u.email || '', initials: u.initials || '', role: u.role || 'Learning Facilitator', password: '' });
                setIsEditing(true);
                setShowModal(true);
            };

            const openAdd = () => {
                setFormData({ id: '', name: '', email: '', initials: '', role: 'Learning Facilitator', password: '' });
                setIsEditing(false);
                setShowModal(true);
            };

            // --- Advanced LF Logic ---
            const [lfSearchTerm, setLfSearchTerm] = useState('');
            const [lfSortConfig, setLfSortConfig] = useState({ key: 'name', direction: 'asc' });

            const filteredLFs = React.useMemo(() => {
                let filtered = bstpUsers;
                if (lfSearchTerm) {
                    const term = lfSearchTerm.toLowerCase();
                    filtered = filtered.filter(u => 
                        (u.name && u.name.toLowerCase().includes(term)) ||
                        (u.email && u.email.toLowerCase().includes(term)) ||
                        (u.initials && u.initials.toLowerCase().includes(term))
                    );
                }
                return filtered;
            }, [bstpUsers, lfSearchTerm]);

            const sortedLFs = React.useMemo(() => {
                let sortable = [...filteredLFs];
                sortable.sort((a, b) => {
                    const key = lfSortConfig.key;
                    const valA = String(a[key] || '').toLowerCase();
                    const valB = String(b[key] || '').toLowerCase();
                    if (valA < valB) return lfSortConfig.direction === 'asc' ? -1 : 1;
                    if (valA > valB) return lfSortConfig.direction === 'asc' ? 1 : -1;
                    return 0;
                });
                return sortable;
            }, [filteredLFs, lfSortConfig]);

            const handleLfSort = (key) => {
                let direction = 'asc';
                if (lfSortConfig.key === key && lfSortConfig.direction === 'asc') direction = 'desc';
                setLfSortConfig({ key, direction });
            };

            const renderLfSortIcon = (key) => {
                if (lfSortConfig.key !== key) return <div className="w-4 inline-block"></div>;
                return lfSortConfig.direction === 'asc' ? <ChevronUp size={14} className="inline ml-1" /> : <ChevronDown size={14} className="inline ml-1" />;
            };

            // --- Advanced Trainees Logic ---
            // 1. Summarize
            const statusSummary = React.useMemo(() => {
                return trainees.reduce((acc, curr) => {
                    const status = (curr.Status || curr.status || 'Active').trim();
                    if (!acc[status]) acc[status] = { total: 0, registered: 0 };
                    acc[status].total++;
                    if (curr.isRegistered === true) acc[status].registered++;
                    return acc;
                }, {});
            }, [trainees]);

            // 2. Filter
            const filteredTrainees = React.useMemo(() => {
                let result = trainees;
                if (traineeFilterStatus !== 'All') {
                    result = result.filter(t => (t.Status || t.status || 'Active').trim() === traineeFilterStatus);
                }
                if (traineeSearchTerm) {
                    const search = traineeSearchTerm.toLowerCase();
                    result = result.filter(t => {
                        const name = `${t.lastName || t.Family}, ${t.firstName || t.Given} ${t.middleName || t.Middle}`.toLowerCase();
                        const section = (t.section || t.Section || '').toLowerCase();
                        const adviser = (t.adviser || t.Adviser || '').toLowerCase();
                        const proctor = (t.proctor || t.Proctor || '').toLowerCase();
                        const id = (t.idNumber || t.id_number || t.id || '').toLowerCase();
                        return name.includes(search) || section.includes(search) || adviser.includes(search) || proctor.includes(search) || id.includes(search);
                    });
                }
                return result;
            }, [trainees, traineeFilterStatus, traineeSearchTerm]);

            // 3. Sort
            const sortedTrainees = React.useMemo(() => {
                let sortable = [...filteredTrainees];
                sortable.sort((a, b) => {
                    let valA = '';
                    let valB = '';
                    if (sortConfig.key === 'name') {
                        valA = `${a.lastName || a.Family}, ${a.firstName || a.Given}`.toLowerCase();
                        valB = `${b.lastName || b.Family}, ${b.firstName || b.Given}`.toLowerCase();
                    } else if (sortConfig.key === 'idNumber') {
                        valA = (a.idNumber || a.id_number || a.id || '').toLowerCase();
                        valB = (b.idNumber || b.id_number || b.id || '').toLowerCase();
                    } else if (sortConfig.key === 'status') {
                        valA = (a.Status || a.status || 'Active').toLowerCase();
                        valB = (b.Status || b.status || 'Active').toLowerCase();
                    } else if (sortConfig.key === 'registered') {
                        valA = a.isRegistered ? 1 : 0;
                        valB = b.isRegistered ? 1 : 0;
                    }
                    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                    return 0;
                });
                return sortable;
            }, [filteredTrainees, sortConfig]);

            // 4. Paginate
            const totalPages = itemsPerPage === 'All' ? 1 : Math.ceil(sortedTrainees.length / itemsPerPage);
            const paginatedTrainees = React.useMemo(() => {
                if (itemsPerPage === 'All') return sortedTrainees;
                const start = (currentPage - 1) * itemsPerPage;
                return sortedTrainees.slice(start, start + itemsPerPage);
            }, [sortedTrainees, currentPage, itemsPerPage]);

            const handleSort = (key) => {
                let direction = 'asc';
                if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
                setSortConfig({ key, direction });
            };

            const exportCSV = () => {
                const headers = ['ID Number', 'Last Name', 'First Name', 'Level', 'Status', 'Registered'];
                const rows = sortedTrainees.map(u => [
                    u.idNumber || u.id_number || u.id,
                    `"${u.lastName || u.Family || ''}"`,
                    `"${u.firstName || u.Given || ''}"`,
                    u.Level || u.level || 'BSTP',
                    u.Status || u.status || 'Active',
                    u.isRegistered ? 'Yes' : 'No'
                ]);
                const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join("\n");
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `BSTP_Trainees_Export_${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            };

            const renderSortIcon = (key) => {
                if (sortConfig.key !== key) return <div className="w-4 inline-block"></div>;
                return sortConfig.direction === 'asc' ? <ChevronUp size={14} className="inline ml-1" /> : <ChevronDown size={14} className="inline ml-1" />;
            };

            return (
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Users className="text-blue-500" /> Manage Users
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage Learning Facilitators and view BSTP Trainees.</p>
                        </div>
                        {activeSubTab === 'lfs' && (
                            <button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-sm whitespace-nowrap">
                                <Plus size={18} /> Add Facilitator
                            </button>
                        )}
                        {activeSubTab === 'trainees' && (
                            <button onClick={exportCSV} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-sm whitespace-nowrap">
                                <Download size={18} /> Export CSV
                            </button>
                        )}
                    </div>

                    {/* SUB-TABS */}
                    <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-700 mb-6">
                        <button 
                            onClick={() => { setActiveSubTab('lfs'); setCurrentPage(1); }}
                            className={`px-4 py-3 font-bold text-sm border-b-2 transition-colors ${activeSubTab === 'lfs' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
                        >
                            Learning Facilitators
                        </button>
                        <button 
                            onClick={() => { setActiveSubTab('trainees'); setCurrentPage(1); }}
                            className={`px-4 py-3 font-bold text-sm border-b-2 transition-colors ${activeSubTab === 'trainees' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
                        >
                            BSTP Trainees
                        </button>
                    </div>

                    {activeSubTab === 'lfs' && (
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 animate-in fade-in duration-300">
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Search LF:</span>
                                <input 
                                    type="text" 
                                    value={lfSearchTerm}
                                    onChange={(e) => setLfSearchTerm(e.target.value)}
                                    placeholder="Search by name, email or initials..."
                                    className="p-3 w-full border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                />
                            </div>
                        </div>
                    )}

                    {activeSubTab === 'trainees' && (
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 animate-in fade-in duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Registration Summary</h3>
                                <button onClick={() => setShowSummary(!showSummary)} className="text-slate-500 hover:text-slate-800 dark:hover:text-white text-sm flex items-center gap-1 font-bold">
                                    {showSummary ? <ChevronUp size={16}/> : <ChevronDown size={16}/>} {showSummary ? 'Hide' : 'Show'}
                                </button>
                            </div>
                            {showSummary && (
                                <div className="flex flex-wrap gap-4 mb-6">
                                    {Object.entries(statusSummary).map(([status, counts]) => (
                                        <div key={status} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 rounded-xl flex-1 min-w-[200px]">
                                            <div className="font-bold text-slate-700 dark:text-slate-300 mb-1">{status}</div>
                                            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                                                {counts.registered} <span className="text-sm font-normal text-slate-500 dark:text-slate-500">registered out of {counts.total}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-slate-100 dark:border-slate-700 pt-4">
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Filter Status:</span>
                                    <select 
                                        value={traineeFilterStatus}
                                        onChange={(e) => { setTraineeFilterStatus(e.target.value); setCurrentPage(1); }}
                                        className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm font-bold flex-1"
                                    >
                                        <option value="All">All Statuses</option>
                                        {Object.keys(statusSummary).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
                                    <input 
                                        type="text" 
                                        value={traineeSearchTerm}
                                        onChange={(e) => { setTraineeSearchTerm(e.target.value); setCurrentPage(1); }}
                                        placeholder="Search by name, ID, section, adviser, proctor..."
                                        className="p-2 w-full border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm font-bold flex-1"
                                    />
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Show:</span>
                                    <select 
                                        value={itemsPerPage}
                                        onChange={(e) => { setItemsPerPage(e.target.value === 'All' ? 'All' : Number(e.target.value)); setCurrentPage(1); }}
                                        className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm font-bold flex-1"
                                    >
                                        <option value={50}>50 rows</option>
                                        <option value={100}>100 rows</option>
                                        <option value={300}>300 rows</option>
                                        <option value="All">All rows</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSubTab === 'trainees' && (
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 animate-in fade-in">
                            <span className="text-sm font-bold text-slate-500">{selectedTraineesUsersTab.length} Trainee(s) Selected</span>
                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto overflow-x-auto">
                                <div className="flex items-center gap-2">
                                    <select 
                                        value={selectedAdviserForUsersTab}
                                        onChange={e => setSelectedAdviserForUsersTab(e.target.value)}
                                        className="flex-1 sm:w-48 p-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 outline-none text-sm font-medium"
                                    >
                                        <option value="">Select LF (Adviser)...</option>
                                        {globalData.lfs.filter(lf => lf.status !== 'Deleted').map(lf => <option key={lf.id} value={lf.initials}>{lf.initials} - {lf.name}</option>)}
                                    </select>
                                    <button 
                                        onClick={() => handleBatchAssignAdviserUsersTab(selectedAdviserForUsersTab)}
                                        disabled={selectedTraineesUsersTab.length === 0 || !selectedAdviserForUsersTab}
                                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap"
                                    >
                                        Assign
                                    </button>
                                    <button 
                                        onClick={() => handleBatchAssignAdviserUsersTab(null)}
                                        disabled={selectedTraineesUsersTab.length === 0}
                                        className="bg-slate-600 hover:bg-slate-700 disabled:opacity-50 text-white px-3 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap"
                                    >
                                        Clear
                                    </button>
                                </div>
                                
                                <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-slate-700"></div>

                                <div className="flex items-center gap-2">
                                    <select 
                                        value={selectedProctorForUsersTab}
                                        onChange={e => setSelectedProctorForUsersTab(e.target.value)}
                                        className="flex-1 sm:w-48 p-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 outline-none text-sm font-medium"
                                    >
                                        <option value="">Select LF (Proctor)...</option>
                                        {globalData.lfs.filter(lf => lf.status !== 'Deleted').map(lf => <option key={lf.id} value={lf.initials}>{lf.initials} - {lf.name}</option>)}
                                    </select>
                                    <button 
                                        onClick={() => handleBatchAssignProctorUsersTab(selectedProctorForUsersTab)}
                                        disabled={selectedTraineesUsersTab.length === 0 || !selectedProctorForUsersTab}
                                        className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-3 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap"
                                    >
                                        Assign
                                    </button>
                                    <button 
                                        onClick={() => handleBatchAssignProctorUsersTab(null)}
                                        disabled={selectedTraineesUsersTab.length === 0}
                                        className="bg-slate-600 hover:bg-slate-700 disabled:opacity-50 text-white px-3 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap min-w-[600px]">
                            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    {activeSubTab === 'lfs' ? (
                                        <>
                                            <th onClick={() => handleLfSort('name')} className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">Name {renderLfSortIcon('name')}</th>
                                            <th onClick={() => handleLfSort('email')} className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">Email {renderLfSortIcon('email')}</th>
                                            <th onClick={() => handleLfSort('initials')} className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">Initials {renderLfSortIcon('initials')}</th>
                                            <th onClick={() => handleLfSort('role')} className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">Role {renderLfSortIcon('role')}</th>
                                            <th onClick={() => handleLfSort('status')} className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">Status {renderLfSortIcon('status')}</th>
                                            <th className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400">Added Date</th>
                                            <th className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400 text-right">Actions</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="p-4 w-12 text-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedTraineesUsersTab.length === paginatedTrainees.length && paginatedTrainees.length > 0}
                                                    onChange={handleSelectAllUsersTab}
                                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                />
                                            </th>
                                            <th onClick={() => handleSort('idNumber')} className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">ID Number {renderSortIcon('idNumber')}</th>
                                            <th onClick={() => handleSort('name')} className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">Name {renderSortIcon('name')}</th>
                                            <th className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400">Level</th>
                                            <th onClick={() => handleSort('status')} className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">Status {renderSortIcon('status')}</th>
                                            <th className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400">Adviser</th>
                                            <th className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400">Proctor</th>
                                            <th className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400">Current Status (Sheet)</th>
                                            <th onClick={() => handleSort('registered')} className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">Registered {renderSortIcon('registered')}</th>
                                            <th className="p-4 text-center text-sm font-bold text-slate-500 dark:text-slate-400">Actions</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {activeSubTab === 'lfs' && sortedLFs.map(u => (
                                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="p-4 font-bold dark:text-slate-200">{u.name}</td>
                                        <td className="p-4 text-slate-500 dark:text-slate-400 text-sm">{u.email}</td>
                                        <td className="p-4 font-bold text-slate-600 dark:text-slate-300">{u.initials || <span className="text-slate-300 italic">-</span>}</td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                                                {u.role || 'Learning Facilitator'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-500 dark:text-slate-400 text-sm">
                                            {u.status === 'Pending' ? (
                                                <span className="px-2 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">Pending</span>
                                            ) : (
                                                <span className="px-2 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">{u.status}</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-slate-500 dark:text-slate-400 text-sm">
                                            {u.createdAt ? (u.createdAt.seconds ? new Date(u.createdAt.seconds * 1000).toLocaleDateString() : new Date(u.createdAt).toLocaleDateString()) : '-'}
                                        </td>
                                        <td className="p-4 flex gap-2 justify-end">
                                            {u.status === 'Pending' && (
                                                <button onClick={() => handleApprove(u)} className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg" title="Approve">
                                                    <CheckCircle2 size={18}/>
                                                </button>
                                            )}
                                            <button onClick={() => openEdit(u)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><Edit size={18}/></button>
                                            <button onClick={() => handleDelete(u, false)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 size={18}/></button>
                                        </td>
                                    </tr>
                                ))}
                                {activeSubTab === 'trainees' && paginatedTrainees.map(u => (
                                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="p-4 text-center">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedTraineesUsersTab.includes(u.id)}
                                                onChange={() => handleSelectTraineeUsersTab(u.id)}
                                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="p-4 text-slate-500 dark:text-slate-400 text-sm font-mono">{u.idNumber || u.id_number || u.id}</td>
                                        <td className="p-4 font-bold dark:text-slate-200">{u.lastName || u.Family || ''}, {u.firstName || u.Given || ''} {u.middleName || u.Middle || ''}</td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                                                {u.Level || u.level || 'BSTP'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-500 dark:text-slate-400 text-sm">{u.Status || u.status || 'Active'}</td>
                                        <td className="p-4 text-slate-500 dark:text-slate-400 text-sm">{u.adviser || <span className="text-slate-300 italic">-</span>}</td>
                                        <td className="p-4 text-slate-500 dark:text-slate-400 text-sm">{u.proctor || <span className="text-slate-300 italic">-</span>}</td>
                                        <td className="p-4">
                                            {u.currentbstpStatus ? (
                                                <span className="px-2 py-1 text-xs font-bold rounded-md bg-purple-100 text-purple-800 border border-purple-200">
                                                    {u.currentbstpStatus}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 text-xs italic">Not synced</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {u.isRegistered ? (
                                                <span className="flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-md w-fit"><CheckCircle2 size={14}/> Yes</span>
                                            ) : (
                                                <span className="text-slate-400 text-xs font-bold px-2 py-1">No</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <button onClick={() => handleDelete(u, true)} className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg transition-colors" title="Delete Trainee Account">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {((activeSubTab === 'lfs' && sortedLFs.length === 0) || (activeSubTab === 'trainees' && paginatedTrainees.length === 0)) && !loading && (
                                    <tr><td colSpan={activeSubTab === "lfs" ? 7 : 8} className="p-8 text-center text-slate-500 italic">No records found.</td></tr>
                                )}
                            </tbody>
                        </table>
                        
                        {activeSubTab === 'trainees' && itemsPerPage !== 'All' && totalPages > 1 && (
                            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                                <button 
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(p => p - 1)}
                                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-bold disabled:opacity-50 dark:text-white"
                                >
                                    Previous
                                </button>
                                <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button 
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(p => p + 1)}
                                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-bold disabled:opacity-50 dark:text-white"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>

                    {showModal && (
                        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col">
                                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">{isEditing ? 'Edit Facilitator' : 'Add New Facilitator'}</h3>
                                    <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                                </div>
                                <form onSubmit={handleSave} className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                                        <input required type="text" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                                        <input required type="email" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900" value={formData.email} onChange={e=>setFormData({...formData, email:e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Initials</label>
                                        <input type="text" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900" value={formData.initials} onChange={e=>setFormData({...formData, initials:e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Role</label>
                                        <select className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900" value={formData.role} onChange={e=>setFormData({...formData, role:e.target.value})}>
                                            <option value="Learning Facilitator">Learning Facilitator</option>
                                        </select>
                                    </div>
                                    {!isEditing && (
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Initial Password (will create auth account later)</label>
                                            <input type="password" placeholder="Min 6 chars" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900" value={formData.password} onChange={e=>setFormData({...formData, password:e.target.value})} />
                                        </div>
                                    )}
                                    <div className="pt-4 flex gap-3">
                                        <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-xl font-bold transition-colors">Cancel</button>
                                        <button type="submit" className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition-colors">{isEditing ? 'Save Changes' : 'Create User'}</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        function ManageSkillsetsTab({ showMessage, globalData, setGlobalData }) {
            const skillsets = globalData.skillsets || [];
            const venues = globalData.venues || [];
            const lfs = globalData.lfs || [];
            const loading = false;
            const [showModal, setShowModal] = useState(false);
            const [showRoomDropdown, setShowRoomDropdown] = useState(false);
            
            // Form state
            const [formData, setFormData] = useState({ id: '', name: '', rooms: [], assignedLFs: [] });
            const [isEditing, setIsEditing] = useState(false);
            const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

            

            const requestSort = (key) => {
                let direction = 'asc';
                if (sortConfig.key === key && sortConfig.direction === 'asc') {
                    direction = 'desc';
                }
                setSortConfig({ key, direction });
            };

            const sortedSkillsets = useMemo(() => {
                let sortableItems = [...skillsets];
                if (sortConfig !== null) {
                    sortableItems.sort((a, b) => {
                        let aVal = a[sortConfig.key] || '';
                        let bVal = b[sortConfig.key] || '';
                        
                        if (Array.isArray(aVal)) aVal = aVal.join(', ');
                        if (Array.isArray(bVal)) bVal = bVal.join(', ');
                        
                        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
                        if (typeof bVal === 'string') bVal = bVal.toLowerCase();

                        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                        return 0;
                    });
                }
                return sortableItems;
            }, [skillsets, sortConfig]);

            const handleSave = async (e) => {
                e.preventDefault();
                if (!formData.name) {
                    showMessage("Skillset name is required", "error");
                    return;
                }
                if (formData.assignedLFs.length > 4) {
                    showMessage("You can assign up to 4 LFs only.", "error");
                    return;
                }
                setLoading(true);
                try {
                    const skillsetsRef = collection(db, "artifacts", APP_ID, "public", "data", "bstpSkillsets");
                    if (isEditing) {
                        await updateDoc(doc(skillsetsRef, formData.id), {
                            name: formData.name,
                            rooms: formData.rooms,
                            assignedLFs: formData.assignedLFs,
                            updatedAt: new Date().toISOString()
                        });
                        showMessage("Skillset updated successfully");
                    } else {
                        await setDoc(doc(skillsetsRef), {
                            name: formData.name,
                            rooms: formData.rooms,
                            assignedLFs: formData.assignedLFs,
                            createdAt: new Date().toISOString()
                        });
                        showMessage("Skillset added successfully");
                    }
                    setShowModal(false);
                } catch (error) {
                    showMessage("Error saving skillset: " + error.message, "error");
                }
                setLoading(false);
            };

            const handleDelete = async (id) => {
                if (!window.confirm("Are you sure you want to delete this skillset?")) return;
                setLoading(true);
                try {
                    await deleteDoc(doc(db, "artifacts", APP_ID, "public", "data", "bstpSkillsets", id));
                    showMessage("Skillset deleted successfully");
                } catch (error) {
                    showMessage("Error deleting skillset: " + error.message, "error");
                }
                setLoading(false);
            };

            const toggleRoom = (roomName) => {
                const currentRooms = [...formData.rooms];
                if (currentRooms.includes(roomName)) {
                    setFormData({...formData, rooms: currentRooms.filter(r => r !== roomName)});
                } else {
                    setFormData({...formData, rooms: [...currentRooms, roomName]});
                }
            };

            const toggleLF = (formattedName) => {
                const currentLFs = [...formData.assignedLFs];
                if (currentLFs.includes(formattedName)) {
                    setFormData({...formData, assignedLFs: currentLFs.filter(lf => lf !== formattedName)});
                } else {
                    if (currentLFs.length >= 4) {
                        showMessage("Maximum of 4 LFs can be assigned.", "warning");
                        return;
                    }
                    setFormData({...formData, assignedLFs: [...currentLFs, formattedName]});
                }
            };

            return (
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-bold">Manage Skillsets</h2>
                            <p className="text-slate-500 text-sm">Create and assign skillsets to rooms and Learning Facilitators.</p>
                        </div>
                        <button onClick={() => {
                            setFormData({ id: '', name: '', rooms: [], assignedLFs: [] });
                            setIsEditing(false);
                            setShowModal(true);
                        }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition-colors">
                            <Plus size={18} /> Add Skillset
                        </button>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                                    <tr>
                                        <th className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => requestSort('name')}>
                                            Skillset {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => requestSort('rooms')}>
                                            Rooms {sortConfig.key === 'rooms' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => requestSort('assignedLFs')}>
                                            Assigned LFs {sortConfig.key === 'assignedLFs' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {sortedSkillsets.map(s => (
                                        <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{s.name}</td>
                                            <td className="p-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {(s.rooms || []).length > 0 ? s.rooms.map((r, i) => (
                                                        <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 text-xs rounded-full font-medium">{r}</span>
                                                    )) : <span className="text-slate-400 italic text-xs">No rooms</span>}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {(s.assignedLFs || []).length > 0 ? s.assignedLFs.map((lf, i) => (
                                                        <span key={i} className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 text-xs rounded-full font-medium">{lf}</span>
                                                    )) : <span className="text-slate-400 italic text-xs">No LFs</span>}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => {
                                                        setFormData({ id: s.id, name: s.name, rooms: s.rooms || [], assignedLFs: s.assignedLFs || [] });
                                                        setIsEditing(true);
                                                        setShowModal(true);
                                                    }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                                                        <Edit size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(s.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {sortedSkillsets.length === 0 && !loading && (
                                        <tr>
                                            <td colSpan="4" className="p-8 text-center text-slate-500 italic">No skillsets found. Add one to get started!</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {showModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
                                    <h3 className="font-bold text-lg">{isEditing ? 'Edit Skillset' : 'Add Skillset'}</h3>
                                    <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={20} /></button>
                                </div>
                                <div className="p-6 overflow-y-auto">
                                    <form id="skillsetForm" onSubmit={handleSave} className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Skillset Name</label>
                                            <input type="text" required className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                placeholder="e.g. Welding 101"
                                                value={formData.name}
                                                onChange={e => setFormData({...formData, name: e.target.value})}
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Assigned Rooms</label>
                                            <div className="relative">
                                                <div 
                                                    onClick={() => setShowRoomDropdown(!showRoomDropdown)}
                                                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 cursor-pointer flex justify-between items-center bg-white dark:bg-slate-900 transition-all hover:border-blue-400"
                                                >
                                                    <span className={formData.rooms.length > 0 ? "text-slate-800 dark:text-slate-200 text-sm font-medium truncate" : "text-slate-400 text-sm"}>
                                                        {formData.rooms.length > 0 ? formData.rooms.join(', ') : "Select Rooms..."}
                                                    </span>
                                                    <ChevronDown size={18} className={`text-slate-400 transition-transform ${showRoomDropdown ? 'rotate-180' : ''}`} />
                                                </div>
                                                
                                                {showRoomDropdown && (
                                                    <div className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                                        {venues.length === 0 ? <div className="p-3 text-sm text-slate-500 text-center">No rooms available.</div> : venues.map(v => (
                                                            <label key={v.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 transition-colors">
                                                                <input type="checkbox" 
                                                                    checked={formData.rooms.includes(v.name)}
                                                                    onChange={() => toggleRoom(v.name)}
                                                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                                />
                                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{v.name}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Assigned LFs <span className="text-xs font-normal text-slate-500">(Max 4)</span></label>
                                            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                                                {lfs.length === 0 ? <p className="text-xs text-slate-500">No LFs found.</p> : lfs.map(lf => {
                                                    const formattedName = lf.initials ? `${lf.name} (${lf.initials})` : lf.name;
                                                    return (
                                                    <label key={lf.id} className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                                                        <input type="checkbox" 
                                                            checked={formData.assignedLFs.includes(formattedName)}
                                                            onChange={() => toggleLF(formattedName)}
                                                            disabled={!formData.assignedLFs.includes(formattedName) && formData.assignedLFs.length >= 4}
                                                            className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
                                                        />
                                                        <span className={`text-sm font-medium ${(!formData.assignedLFs.includes(formattedName) && formData.assignedLFs.length >= 4) ? 'opacity-50' : ''}`}>{formattedName}</span>
                                                    </label>
                                                )})}
                                            </div>
                                        </div>
                                    </form>
                                </div>
                                <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex justify-end gap-3">
                                    <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                                    <button type="submit" form="skillsetForm" disabled={loading} className="px-6 py-2 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2">
                                        {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                        {isEditing ? 'Save Changes' : 'Add Skillset'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        // --- MAIN APP ---

        function OverviewTab({ showMessage, globalData, setGlobalData }) {
    const { PieChart, Pie, Cell, Tooltip: RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ComposedChart, Line } = Recharts;

    const [attendanceData, setAttendanceData] = React.useState({});
    const [isFetching, setIsFetching] = React.useState(false);
    const [lastUpdated, setLastUpdated] = React.useState(null);
    const [groupBy, setGroupBy] = React.useState('shift'); // 'shift' or 'adviser'

    const activeTrainees = React.useMemo(() => {
        return (globalData?.trainees || []).filter(t => {
            if (t.Level !== 'BSTP' || !t.isRegistered) return false;
            const status = (t.currentbstpStatus || t.Status || t.status || '').toLowerCase();
            return status !== 'loa';
        });
    }, [globalData?.trainees]);

    // Helper to determine week parity
    const getWeekNumber = (d) => {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
    };

    const fetchAttendance = async () => {
        setIsFetching(true);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayIsoStart = today.toISOString();
        
        try {
            const appId = 'dualtech-ojt-portal';
            
            const q = query(
                collection(db, 'artifacts', appId, 'public', 'data', 'bstpAttendance'),
                where('timestamp', '>=', todayIsoStart)
            );
            
            const snap = await getDocs(q);
            
            // Map logs by studentNo
            const logsByStudent = {};
            snap.forEach(doc => {
                const d = doc.data();
                if (!d.studentNo) return;
                
                if (!logsByStudent[d.studentNo]) {
                    logsByStudent[d.studentNo] = { inRecs: [], outRecs: [] };
                }
                
                if (d.type === 'IN') {
                    logsByStudent[d.studentNo].inRecs.push(d);
                } else if (d.type === 'OUT') {
                    logsByStudent[d.studentNo].outRecs.push(d);
                }
            });
            
            setAttendanceData(logsByStudent);
            setLastUpdated(new Date());
            showMessage("Attendance data refreshed successfully!");
        } catch(e) {
            console.error(e);
            showMessage("Error refreshing attendance data", "error");
        } finally {
            setIsFetching(false);
        }
    };

    // Auto-fetch on mount if not fetched
    React.useEffect(() => {
        if (activeTrainees.length > 0 && !lastUpdated && !isFetching) {
            fetchAttendance();
        }
    }, [activeTrainees]);

    // Derived Statistics
    const stats = React.useMemo(() => {
        const groups = {
            'Currently Clocked In': [],
            'Completed Shift': [],
            'No Clock Ins': []
        };
        
        activeTrainees.forEach(t => {
            const studentNo = t.studentNo || t.studentId || t.idNumber || t.id_number || t.id;
            const stuLogs = attendanceData[studentNo];
            
            let groupKey = 'Unknown';
            if (groupBy === 'shift') groupKey = (t.shift || t.bstpshiftName || 'No Shift');
            else if (groupBy === 'adviser') groupKey = (t.adviser || 'No Adviser');
            else if (groupBy === 'section') groupKey = (t.section || t.Section || 'No Section');
            else if (groupBy === 'status') groupKey = (t.currentbstpStatus || t.Status || t.status || 'No Status');
            
            let status = 'No Clock Ins';
            let isLate = false;
            let isUndertime = false;
            let logToDisplay = null;

            if (stuLogs && stuLogs.inRecs.length > 0) {
                // Sort by latest IN
                stuLogs.inRecs.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
                const latestIn = stuLogs.inRecs[0];
                logToDisplay = { timeIn: latestIn.timestamp };
                
                let latestOut = null;
                if (stuLogs.outRecs.length > 0) {
                    status = 'Completed Shift';
                    stuLogs.outRecs.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
                    latestOut = stuLogs.outRecs[0];
                    logToDisplay.timeOut = latestOut.timestamp;
                } else {
                    status = 'Currently Clocked In';
                }
                
                // Calculate if Late based on Shift
                let targetShiftId = t.bstpshiftId;
                if (!targetShiftId && t.shift && globalData?.shifts) {
                    const found = globalData.shifts.find(s => s.name === t.shift);
                    if (found) targetShiftId = found.id;
                }
                if (targetShiftId && globalData?.shifts) {
                    const shift = globalData.shifts.find(s => s.id === targetShiftId);
                    if (shift) {
                        const weekNum = getWeekNumber(new Date(latestIn.timestamp));
                        const isEvenWeek = weekNum % 2 === 0;
                        const startTimeStr = isEvenWeek ? shift.evenWeekStartTime : shift.oddWeekStartTime;
                        const endTimeStr = isEvenWeek ? shift.evenWeekEndTime : shift.oddWeekEndTime;
                        
                        if (startTimeStr) {
                            const [shiftHH, shiftMM] = startTimeStr.split(':').map(Number);
                            const inDate = new Date(latestIn.timestamp);
                            const shiftMins = (shiftHH * 60) + shiftMM;
                            const inMins = (inDate.getHours() * 60) + inDate.getMinutes();
                            if (inMins > shiftMins) isLate = true;
                        }
                        
                        if (endTimeStr && latestOut) {
                            const [shiftHH, shiftMM] = endTimeStr.split(':').map(Number);
                            const outDate = new Date(latestOut.timestamp);
                            const shiftMins = (shiftHH * 60) + shiftMM;
                            const outMins = (outDate.getHours() * 60) + outDate.getMinutes();
                            if (outMins < shiftMins) isUndertime = true;
                        }
                    }
                }
            }

            const item = { ...t, log: logToDisplay, isLate, isUndertime, groupKey };
            groups[status].push(item);
        });

        return groups;
    }, [activeTrainees, attendanceData, groupBy, globalData?.shifts]);

    // Chart Data Preparation
    const pieData = [
        { name: 'Clocked In', value: stats['Currently Clocked In'].length, color: '#3b82f6' },
        { name: 'Completed', value: stats['Completed Shift'].length, color: '#10b981' },
        { name: 'No Clock In', value: stats['No Clock Ins'].length, color: '#94a3b8' }
    ];

    const barDataMap = {};
    activeTrainees.forEach(t => {
        let groupKey = 'Unknown';
            if (groupBy === 'shift') groupKey = (t.shift || t.bstpshiftName || 'No Shift');
            else if (groupBy === 'adviser') groupKey = (t.adviser || 'No Adviser');
            else if (groupBy === 'section') groupKey = (t.section || t.Section || 'No Section');
            else if (groupBy === 'status') groupKey = (t.currentbstpStatus || t.Status || t.status || 'No Status');
        if (!barDataMap[groupKey]) {
            barDataMap[groupKey] = { name: groupKey, OnTime: 0, Late: 0, NoClockIn: 0, Total: 0 };
        }
        barDataMap[groupKey].Total++;
    });

    [...stats['Currently Clocked In'], ...stats['Completed Shift']].forEach(item => {
        if (item.isLate) barDataMap[item.groupKey].Late++;
        else barDataMap[item.groupKey].OnTime++;
    });
    
    stats['No Clock Ins'].forEach(item => {
        barDataMap[item.groupKey].NoClockIn++;
    });

    const barData = Object.values(barDataMap).map(d => {
        return {
            ...d,
            Rate: d.Total > 0 ? parseFloat(((d.OnTime / d.Total) * 100).toFixed(1)) : 0
        };
    });

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                <div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Lucide.Users className="text-blue-500" /> BSTP Trainee Attendance Overview
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Monitoring {activeTrainees.length} active trainees. 
                        {lastUpdated && <span className="ml-2 inline-flex items-center gap-1"><Lucide.Clock size={12}/> Last updated: {lastUpdated.toLocaleTimeString()}</span>}
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <select 
                        value={groupBy} 
                        onChange={e => setGroupBy(e.target.value)}
                        className="bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300 rounded-lg px-3 py-2 border-none focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="shift">Group by Shift</option>
                        <option value="adviser">Group by Adviser</option>
                        <option value="section">Group by Section</option>
                        <option value="status">Group by Status</option>
                    </select>
                    <button 
                        onClick={fetchAttendance}
                        disabled={isFetching}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 whitespace-nowrap shadow-sm"
                    >
                        <Lucide.RefreshCw size={16} className={isFetching ? "animate-spin" : ""} /> Refresh
                    </button>
                </div>
            </div>

            {Recharts && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col items-center">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Overall Status</h3>
                        <div className="w-full h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                    </Pie>
                                    <RechartsTooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Punctuality by {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}</h3>
                        <div className="w-full h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                    <XAxis dataKey="name" tick={{fontSize: 12}} />
                                    <YAxis yAxisId="left" tick={{fontSize: 12}} allowDecimals={false} />
                                    <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12}} domain={[0, 100]} />
                                    <RechartsTooltip cursor={{fill: 'transparent'}} />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="OnTime" name="On Time" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                                    <Bar yAxisId="left" dataKey="Late" name="Late" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                                    <Bar yAxisId="left" dataKey="NoClockIn" name="No Clock In" stackId="a" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                                    <Line yAxisId="right" type="monotone" dataKey="Rate" name="Punctuality Rate %" stroke="#3b82f6" strokeWidth={3} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <StatusColumn title="Currently Clocked In" color="blue" items={stats['Currently Clocked In']} groupBy={groupBy} />
                <StatusColumn title="Completed Shift" color="emerald" items={stats['Completed Shift']} groupBy={groupBy} />
                <StatusColumn title="No Clock Ins" color="slate" items={stats['No Clock Ins']} groupBy={groupBy} />
            </div>
        </div>
    );
}

function StatusColumn({ title, color, items, groupBy }) {
    const grouped = items.reduce((acc, item) => {
        if (!acc[item.groupKey]) acc[item.groupKey] = [];
        acc[item.groupKey].push(item);
        return acc;
    }, {});

    const colorClasses = {
        blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
        emerald: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
        slate: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700"
    };

    return (
        <div className="flex flex-col gap-3">
            <div className={`px-4 py-3 rounded-lg border font-bold flex items-center justify-between ${colorClasses[color]}`}>
                <span>{title}</span>
                <span className="bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-full text-sm">{items.length}</span>
            </div>
            
            {Object.keys(grouped).sort().map(key => (
                <div key={key} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                    <div className="bg-slate-50 dark:bg-slate-800/50 px-3 py-2 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase flex justify-between">
                        <span>{key}</span>
                        <span>{grouped[key].length} Trainees</span>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
                        {grouped[key].map(item => (
                            <div key={item.id} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.name || item.firstName + ' ' + item.lastName}</span>
                                    <span className="text-[10px] text-slate-500">{item.shift || item.bstpshiftName || 'No Shift'}</span>
                                </div>
                                {item.log && (
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="flex gap-1">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.isLate ? 'bg-red-100 text-red-700 dark:bg-red-900/30' : 'bg-green-100 text-green-700 dark:bg-green-900/30'}`}>
                                                {item.isLate ? 'LATE' : 'ON TIME'}
                                            </span>
                                            {item.log.timeOut && (
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.isUndertime ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30'}`}>
                                                    {item.isUndertime ? 'UNDERTIME' : 'COMPLETED'}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-slate-400">
                                            {new Date(item.log.timeIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            {item.log.timeOut && ` - ${new Date(item.log.timeOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            
            {items.length === 0 && (
                <div className="p-6 text-center text-slate-400 text-sm border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    No trainees in this category.
                </div>
            )}
        </div>
    );
}


function App() {
            const [user, setUser] = useState(null);
            const [adminData, setAdminData] = useState(null);
            const [loading, setLoading] = useState(true);
            const [activeTab, setActiveTab] = useState('overview');
            
            const [email, setEmail] = useState('');
            const [password, setPassword] = useState('');
            const [errorMsg, setErrorMsg] = useState('');
            const [loginLoading, setLoginLoading] = useState(false);
            const [showPassword, setShowPassword] = useState(false);
            const [resetLoading, setResetLoading] = useState(false);
            
            const [theme, setTheme] = useState(localStorage.getItem('theme') || 'system');
            const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
            const [showNotifications, setShowNotifications] = useState(false);
            const [showMessages, setShowMessages] = useState(false);
            const [totalUnread, setTotalUnread] = useState(0);
            const [notifications, setNotifications] = useState([]);

            useEffect(() => {
                const unsub = onAuthStateChanged(auth, async (u) => {
                    if (u) {
                        try {
                            const q = query(collection(db, "admins"), where("email", "==", u.email));
                            const adminSnaps = await getDocs(q);
                            
                            if (!adminSnaps.empty) {
                                const adminSnap = adminSnaps.docs[0];
                                if (adminSnap.data().allowedPortals?.includes('bstp_admin_portal')) {
                                    setUser(u);
                                    setAdminData({ id: adminSnap.id, ...adminSnap.data() });
                                } else {
                                    await signOut(auth);
                                    const portals = adminSnap.data().allowedPortals || [];
                                    setErrorMsg(`Access Denied: You do not have permissions. Your portals: [${portals.join(', ')}]`);
                                }
                            } else {
                                await signOut(auth);
                                setErrorMsg(`Access Denied: Admin record not found for email ${u.email}`);
                            }
                        } catch(e) {
                            console.error(e);
                        }
                    } else {
                        setUser(null);
                        setAdminData(null);
                    }
                    setLoading(false);
                });
                return () => unsub();
            }, []);

            useEffect(() => {
                if (!adminData?.id) return;
                const q = query(collection(db, "chat_conversations"), where("participants", "array-contains", adminData.id));
                const unsub = onSnapshot(q, (snap) => {
                    let total = 0;
                    snap.forEach(d => {
                        total += (d.data().unreadCount?.[adminData.id] || 0);
                    });
                    setTotalUnread(total);
                });
                return () => unsub();
            }, [adminData?.id]);

            useEffect(() => {
                if (user && adminData) {
                    const q = query(collection(db, "bstpNotifications"), orderBy("timestamp", "desc"), limit(50));
                    const unsub = onSnapshot(q, (snap) => {
                        const notifs = [];
                        const dismissed = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
                        snap.forEach(d => {
                            if (dismissed.includes(d.id)) return;
                            const data = d.data();
                            
                            if (data.targetGroup === "LF" || (data.targetInitials && data.targetInitials !== "ADMIN")) {
                                return;
                            }
                            
                            let timeStr = "Just now";
                            if (data.timestamp) {
                                const date = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
                                timeStr = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                            }
                            notifs.push({ id: d.id, ...data, time: timeStr });
                        });
                        setNotifications(notifs);
                    });
                    return () => unsub();
                }
            }, [user, adminData]);

            const dismissNotification = (id) => {
                const dismissed = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
                if (!dismissed.includes(id)) {
                    dismissed.push(id);
                    localStorage.setItem('dismissed_notifications', JSON.stringify(dismissed));
                }
                setNotifications(prev => prev.filter(n => n.id !== id));
            };

            const [globalData, setGlobalData] = useState({
                trainees: [],
                lfs: [],
                shifts: [],
                skillsets: [],
                venues: []
            });
            const [isFetchingData, setIsFetchingData] = useState(false);

            const openDB = () => new Promise((resolve, reject) => {
                const request = indexedDB.open('bstpadmin_cache', 1);
                request.onupgradeneeded = (e) => {
                    e.target.result.createObjectStore('data');
                };
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
            const setCache = async (key, val) => {
                try {
                    const db = await openDB();
                    const tx = db.transaction('data', 'readwrite');
                    tx.objectStore('data').put(val, key);
                    return new Promise(resolve => tx.oncomplete = resolve);
                } catch(e) { console.error(e); }
            };

            const [syncStatus, setSyncStatus] = useState({ active: false, progress: 0, message: '' });
            const getCache = async (key) => {
                try {
                    const db = await openDB();
                    const tx = db.transaction('data', 'readonly');
                    const req = tx.objectStore('data').get(key);
                    return new Promise(resolve => {
                        req.onsuccess = () => resolve(req.result);
                        req.onerror = () => resolve(null);
                    });
                } catch(e) { return null; }
            };

            const fetchGlobalData = async (forceRefresh = false) => {
                setIsFetchingData(true);
                setSyncStatus({ active: true, progress: 10, message: 'Checking Cache...' });
                try {
                    if (!forceRefresh) {
                        const cachedData = await getCache('bstpadmin_globalData');
                        const cachedTime = await getCache('bstpadmin_globalData_timestamp');
                        if (cachedData && cachedTime) {
                            const now = new Date().getTime();
                            if (now - parseInt(cachedTime) < 5 * 60 * 1000) { 
                                try {
                                    setGlobalData(JSON.parse(cachedData));
                                    setIsFetchingData(false);
                                    setSyncStatus({ active: true, progress: 100, message: 'Loaded from Cache' });
                                    setTimeout(() => setSyncStatus(s => ({...s, active: false})), 1500);
                                    return;
                                } catch(e) {
                                    console.error('Cache parse error', e);
                                }
                            }
                        }
                    }

                    setSyncStatus({ active: true, progress: 20, message: 'Fetching Trainees...' });
                    const traineesRef = collection(db, "artifacts", "dualtech-ojt-portal", "public", "data", "trainees");
                    const qTrainees = query(traineesRef, where("Level", "==", "BSTP"));
                    const traineesSnap = await getDocs(qTrainees);
                    const traineesList = [];
                    traineesSnap.forEach(d => traineesList.push({ id: d.id, ...d.data() }));

                    setSyncStatus({ active: true, progress: 40, message: 'Fetching LFs...' });
                    const qLFs = query(collection(db, "bstpUsers"), where("status", "!=", "Deleted"));
                    const lfsSnap = await getDocs(qLFs);
                    const lfsList = [];
                    lfsSnap.forEach(d => lfsList.push({ id: d.id, ...d.data() }));

                    setSyncStatus({ active: true, progress: 60, message: 'Fetching Shifts...' });
                    const shiftsRef = collection(db, "artifacts", "dualtech-ojt-portal", "public", "data", "bstpShifts");
                    const shiftsSnap = await getDocs(shiftsRef);
                    const shiftsList = [];
                    shiftsSnap.forEach(d => shiftsList.push({ id: d.id, ...d.data() }));

                    setSyncStatus({ active: true, progress: 80, message: 'Fetching Skillsets...' });
                    const skillsetsRef = collection(db, "artifacts", "dualtech-ojt-portal", "public", "data", "bstpSkillsets");
                    const skillsetsSnap = await getDocs(skillsetsRef);
                    const skillsetsList = [];
                    skillsetsSnap.forEach(d => skillsetsList.push({ id: d.id, ...d.data() }));

                    setSyncStatus({ active: true, progress: 95, message: 'Fetching Venues...' });
                    const venuesRef = collection(db, "artifacts", "dualtech-ojt-portal", "public", "data", "bstpVenues");
                    const venuesSnap = await getDocs(venuesRef);
                    const venuesList = [];
                    venuesSnap.forEach(d => venuesList.push({ id: d.id, ...d.data() }));

                    const dataToSet = {
                        trainees: traineesList,
                        lfs: lfsList,
                        shifts: shiftsList,
                        skillsets: skillsetsList,
                        venues: venuesList
                    };
                    setGlobalData(dataToSet);
                    await setCache('bstpadmin_globalData', JSON.stringify(dataToSet));
                    await setCache('bstpadmin_globalData_timestamp', new Date().getTime().toString());
                    
                    setSyncStatus({ active: true, progress: 100, message: 'Sync Complete!' });
                    setTimeout(() => setSyncStatus(s => ({...s, active: false})), 2000);
                } catch(e) {
                    console.error("Error fetching global data:", e);
                    setSyncStatus({ active: true, progress: 100, message: 'Sync Error!' });
                    setTimeout(() => setSyncStatus(s => ({...s, active: false})), 3000);
                    showMessage("Error fetching data.", "error");
                }
                setIsFetchingData(false);
            };

            useEffect(() => {
                if (user && adminData) {
                    fetchGlobalData();
                }
            }, [user, adminData]);

            const [toast, setToast] = useState(null);
            const showMessage = (msg, type='success') => {
                setToast({ msg, type });
                setTimeout(() => setToast(null), 3000);
            };

            const handleResetPassword = async () => {
                if (!email) {
                    setErrorMsg("Please enter your email address first.");
                    return;
                }
                setResetLoading(true);
                try {
                    await sendPasswordResetEmail(auth, email.trim());
                    setErrorMsg("Password reset email sent! Check your inbox.");
                } catch(e) {
                    setErrorMsg("Failed to send reset email: " + e.message);
                }
                setResetLoading(false);
            };

            const handleLogin = async (e) => {
                e.preventDefault();
                setLoginLoading(true);
                setErrorMsg('');
                try {
                    await signInWithEmailAndPassword(auth, email.trim(), password);
                } catch(e) {
                    setErrorMsg("Invalid credentials. Please try again.");
                }
                setLoginLoading(false);
            };

            useEffect(() => {
                const root = window.document.documentElement;
                root.classList.remove('light', 'dark');
                if (theme === 'system') {
                    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    root.classList.add(systemTheme);
                } else {
                    root.classList.add(theme);
                }
                localStorage.setItem('theme', theme);
            }, [theme]);

            if (loading) {
                return <div className="h-full flex items-center justify-center bg-slate-100 dark:bg-slate-900"><Loader2 className="animate-spin text-blue-500" size={40}/></div>;
            }

            if (!user) {
                return (
                    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
                        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-center text-white relative overflow-hidden">
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                                <img src="/dualtech-logo.png" alt="Dualtech Logo" className="w-20 mx-auto mb-4 drop-shadow-md hover:scale-105 transition-transform duration-300" />
                                <h1 className="text-3xl font-black tracking-tight">BSTP Admin</h1>
                                <p className="text-blue-100 mt-2 font-medium">Authentication Required</p>
                            </div>
                            <form onSubmit={handleLogin} className="p-8 space-y-5">
                                {errorMsg && <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-bold text-center flex items-center justify-center gap-2 animate-shake"><AlertTriangle size={16}/> {errorMsg}</div>}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                        <input type="email" required className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@dualtech.edu.ph" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                        <input type={showPassword ? "text" : "password"} required className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-end mt-1">
                                    <button
                                        type="button"
                                        onClick={handleResetPassword}
                                        disabled={resetLoading}
                                        className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 flex items-center gap-1 transition-all"
                                    >
                                        {resetLoading && <Loader2 size={12} className="animate-spin" />} Forgot Password?
                                    </button>
                                </div>
                                <button type="submit" disabled={loginLoading} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2">
                                    {loginLoading ? <Loader2 className="animate-spin" size={20}/> : <Lock size={18}/>} Sign In Securely
                                </button>
                            </form>
                        </div>
                    </div>
                );
            }

            return (
                <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
                    {/* Mobile Overlay */}
                    {!isSidebarCollapsed && (
                        <div className="md:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarCollapsed(true)} />
                    )}

                    {/* Sidebar */}
                    <div className={`fixed inset-y-0 left-0 z-50 md:static ${isSidebarCollapsed ? '-translate-x-full md:translate-x-0 md:w-20' : 'translate-x-0 w-64'} flex-shrink-0 bg-slate-50 dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300`}>
                        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700">
                            {!isSidebarCollapsed && <div className="font-bold text-lg text-blue-600 dark:text-blue-400 flex items-center gap-2">
                                <div className="bg-blue-600 p-1.5 rounded-lg"><Shield size={20} className="text-white"/></div>
                                BSTP Admin
                            </div>}
                            {isSidebarCollapsed && <div className="w-full flex justify-center">
                                <div className="bg-blue-600 p-1.5 rounded-lg"><Shield size={20} className="text-white"/></div>
                            </div>}
                            <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="hidden md:block p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md ml-auto">
                                <Menu size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
                            <ul className="space-y-1 px-3">
                                <li className="mb-2">
                                    <button title={isSidebarCollapsed ? "Overview" : ""}
                                        onClick={() => setActiveTab('overview')}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50'}`}>
                                        <Lucide.LayoutDashboard size={18} className={activeTab === 'overview' ? 'text-blue-600 dark:text-blue-400' : ''} />
                                        {!isSidebarCollapsed && <span>Overview</span>}
                                    </button>
                                </li>
                                <li className="mb-2">
                                    <button title={isSidebarCollapsed ? "Manage Users" : ""}
                                        onClick={() => setActiveTab('users')}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50'}`}>
                                        <Users size={18} className={activeTab === 'users' ? 'text-blue-600 dark:text-blue-400' : ''} />
                                        {!isSidebarCollapsed && <span>Manage Users</span>}
                                    </button>
                                </li>
                                <li className="mb-2">
                                    <button title={isSidebarCollapsed ? "Classrooms & Location" : ""}
                                        onClick={() => setActiveTab('classrooms')}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'classrooms' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50'}`}>
                                        <MapPin size={18} className={activeTab === 'classrooms' ? 'text-blue-600 dark:text-blue-400' : ''} />
                                        {!isSidebarCollapsed && <span>Classrooms & Location</span>}
                                    </button>
                                </li>
                                <li className="mb-2">
                                    <button title={isSidebarCollapsed ? "Shift Schedules" : ""}
                                        onClick={() => setActiveTab('shifts')}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'shifts' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50'}`}>
                                        <Clock size={18} className={activeTab === 'shifts' ? 'text-blue-600 dark:text-blue-400' : ''} />
                                        {!isSidebarCollapsed && <span>Shift Schedules</span>}
                                    </button>
                                </li>
                                <li className="mb-2">
                                    <button title={isSidebarCollapsed ? "Skillsets" : ""}
                                        onClick={() => setActiveTab('skillsets')}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'skillsets' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50'}`}>
                                        <Layers size={18} className={activeTab === 'skillsets' ? 'text-blue-600 dark:text-blue-400' : ''} />
                                        {!isSidebarCollapsed && <span>Skillsets</span>}
                                    </button>
                                </li>
                            </ul>
                        </div>

                        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-2">
                            {!isSidebarCollapsed && (
                                <div className="px-2 pb-2 text-xs font-mono text-slate-500 break-words mb-2">Logged in as:<br/><span className="text-slate-700 dark:text-slate-300 font-bold">{user.email}</span></div>
                            )}
                            <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-900 p-1 rounded-full mb-2">
                                <button onClick={() => setTheme('light')} title="Light" className={`flex-1 flex justify-center p-1.5 rounded-full transition ${theme === 'light' ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}><Sun size={14} /></button>
                                <button onClick={() => setTheme('system')} title="System" className={`flex-1 flex justify-center p-1.5 rounded-full transition ${theme === 'system' ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}><Globe size={14} /></button>
                                <button onClick={() => setTheme('dark')} title="Dark" className={`flex-1 flex justify-center p-1.5 rounded-full transition ${theme === 'dark' ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}><Moon size={14} /></button>
                            </div>
                            <button onClick={() => signOut(auth)} title={isSidebarCollapsed ? "Sign Out" : ""} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-2 px-3'} py-2 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 rounded-full font-bold transition-all text-sm`}>
                                <LogOut size={16} />
                                {!isSidebarCollapsed && <span>Sign Out</span>}
                            </button>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white dark:bg-slate-900 relative">
                        <header className="h-16 shrink-0 flex items-center justify-between px-4 md:px-6 border-b border-slate-200 dark:border-slate-700 relative z-50 bg-white dark:bg-slate-900">
                            <div className="flex items-center flex-1">
                                <button onClick={() => setIsSidebarCollapsed(false)} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full mr-2">
                                    <Menu size={20} />
                                </button>
                                <h1 className="text-lg font-black text-slate-800 dark:text-slate-100 ml-2 hidden md:block">BSTP Admin</h1>
                            </div>
                            <div className="flex items-center gap-4 relative">
                                {syncStatus.active && (
                                    <div className="hidden sm:flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800/50">
                                        <Loader2 size={14} className="animate-spin" />
                                        <span className="text-xs font-bold whitespace-nowrap">{syncStatus.message} {syncStatus.progress}%</span>
                                    </div>
                                )}
                                
<button onClick={() => setShowMessages(!showMessages)} className="relative p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors" title="Messages">
    <Lucide.MessageCircle size={20} className={totalUnread > 0 ? "animate-bounce text-blue-500" : ""} />
    {totalUnread > 0 && (
        <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white dark:border-slate-900"></span>
        </span>
    )}
</button>
{showMessages && (
    <div className="absolute top-12 right-12 mt-2 z-[100]">
        <ChatWidget currentUser={{id: adminData.id, name: adminData.name || "BSTP Admin", role: 'ADMIN', profilePhotoUrl: null}} db={db} onClose={() => setShowMessages(false)} />
    </div>
)}

<button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors" title="Notifications">
                                    <Bell size={20} />
                                    {notifications.length > 0 && (
                                        <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white dark:border-slate-900"></span>
                                        </span>
                                    )}
                                </button>
                                <button onClick={() => fetchGlobalData(true)} disabled={isFetchingData} className="text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-sm font-bold shadow-sm">
                                    {isFetchingData ? <Loader2 size={16} className="animate-spin" /> : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>}
                                    Refresh Data
                                </button>
                            {showNotifications && (
                              <div className="absolute top-12 right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-[100] overflow-hidden">
                                  <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                                      <h3 className="font-bold text-slate-800 dark:text-slate-200">Notifications</h3>
                                      {notifications.length > 0 && <span className="bg-blue-100 text-blue-600 text-xs font-bold px-2 py-0.5 rounded-full">{notifications.length}</span>}
                                  </div>
                                  <div className="max-h-80 overflow-y-auto">
                                      {notifications.length === 0 ? (
                                          <div className="p-6 text-center text-slate-500">
                                              <Bell size={24} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                                              <p className="text-sm">No new notifications</p>
                                          </div>
                                      ) : (
                                          notifications.map(n => (
                                              <div key={n.id} className="p-3 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-start gap-3 transition-colors relative group">
                                                  <div className="mt-1 flex-shrink-0">
                                                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                  </div>
                                                  <div className="flex-1 pr-6">
                                                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{n.title}</p>
                                                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                                                      <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>
                                                  </div>
                                                  <button onClick={() => dismissNotification(n.id)} className="absolute top-3 right-2 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all rounded-md">
                                                      <X size={14} />
                                                  </button>
                                              </div>
                                          ))
                                      )}
                                  </div>
                              </div>
                          )}
                          </div>
                        </header>
                        {syncStatus.active && (
                            <div className="absolute top-16 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800 z-50">
                                <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${syncStatus.progress}%` }}></div>
                            </div>
                        )}
                        
                        
                          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 dark:bg-slate-900 custom-scrollbar relative z-10">
                            {activeTab === 'overview' && <OverviewTab showMessage={showMessage} globalData={globalData} setGlobalData={setGlobalData} />}
                            {activeTab === 'users' && <ManageUsersTab showMessage={showMessage} globalData={globalData} setGlobalData={setGlobalData} />}
                            {activeTab === 'classrooms' && <ManageSchoolLocationTab showMessage={showMessage} />}
                            {activeTab === 'shifts' && <ManageShiftsTab showMessage={showMessage} globalData={globalData} setGlobalData={setGlobalData} />}
                            {activeTab === 'skillsets' && <ManageSkillsetsTab showMessage={showMessage} globalData={globalData} setGlobalData={setGlobalData} />}
                            
                            {/* Toast Notification */}
                            {toast && (
                                <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 font-bold z-50 animate-bounce-short ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-500 text-white'}`}>
                                    {toast.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
                                    {toast.msg}
                                </div>
                            )}
                        </main>
                    </div>
                </div>
            );
        }

        const root = createRoot(document.getElementById('root'));
        root.render(<App />);
    