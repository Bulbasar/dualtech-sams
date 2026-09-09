import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, getDocs, deleteDoc, setDoc, increment } from 'firebase/firestore';
import { MessageCircle, X, Send, ChevronLeft, Search, Check, CheckCheck, Trash2 } from 'lucide-react';

export default function ChatWidget({ currentUser, db, isOpen, onClose, onUnreadChange }) {
    
    const [activeConv, setActiveConv] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [contacts, setContacts] = useState([]); 
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
        if (!currentUser?.id) return;
        if (currentUser.role !== 'BSTP' && currentUser.role !== 'LF') return;
        
        const fetchContacts = async () => {
            const newContacts = [];
            if (currentUser.role === 'BSTP') {
                try {
                    const adminQ = query(collection(db, "admins"), where("allowedPortals", "array-contains", "bstp_admin_portal"));
                    const adminSnap = await getDocs(adminQ);
                    adminSnap.forEach(d => {
                        const data = d.data();
                        newContacts.push({
                            id: d.id,
                            name: data.name || "BSTP Admin",
                            role: "ADMIN",
                            photoUrl: null
                        });
                    });
                } catch(e) { console.error(e); }

                if (currentUser.adviserInitial) {
                    try {
                        const lfQ = query(collection(db, "bstpUsers"), where("initials", "==", currentUser.adviserInitial));
                        const lfSnap = await getDocs(lfQ);
                        lfSnap.forEach(d => {
                            const data = d.data();
                            newContacts.push({
                                id: d.id,
                                name: data.name || 'LF ' + data.initials,
                                role: "LF",
                                photoUrl: null
                            });
                        });
                    } catch(e) { console.error(e); }
                }
            } else if (currentUser.role === 'LF' && currentUser.initials) {
                try {
                    const traineesQ = query(
                        collection(db, "artifacts", "dualtech-ojt-portal", "public", "data", "trainees"),
                        where("adviser", "==", currentUser.initials)
                    );
                    const snap = await getDocs(traineesQ);
                    snap.forEach(d => {
                        const data = d.data();
                        const bstpStatus = (data.bstp_status || "").toLowerCase();
                        if (["active", "pre-bstp", "post-bstp"].includes(bstpStatus)) {
                            newContacts.push({
                                id: data.studentId || d.id,
                                name: data.Name || data.name || "Trainee",
                                role: "BSTP",
                                section: data.section || data.Section || "",
                                bstp_status: data.bstp_status,
                                photoUrl: data.profilePhotoUrl || null
                            });
                        }
                    });
                } catch (e) { console.error(e); }
            }
            setContacts(newContacts);
        };
        fetchContacts();
    }, [currentUser, db]);

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
                    if (!adv.includes(currentUser.adviserInitial?.toLowerCase() || '---')) return;
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
            await setDoc(doc(db, "chat_conversations", activeConv.id), {
                lastMessage: msgText,
                lastMessageTime: serverTimestamp(),
                ['unreadCount.' + otherUserId]: increment(1)
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

    const totalUnread = conversations.reduce((acc, conv) => acc + (conv.unreadCount?.[currentUser.id] || 0), 0);

    useEffect(() => {
        if (onUnreadChange) onUnreadChange(totalUnread);
    }, [totalUnread, onUnreadChange]);

    return (
        <div className="fixed z-[100] right-4 bottom-20 md:bottom-6 flex flex-col items-end">
            {isOpen && (
                <div className="w-[340px] h-[500px] mb-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 text-left">
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
                            {(currentUser.role === 'ADMIN' || currentUser.role === 'LF') && (
                                <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                                    <button onClick={() => setView('new_chat')} className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                                        <MessageCircle size={18} /> New Message
                                    </button>
                                </div>
                            )}
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
                            {(currentUser.role === 'BSTP' || currentUser.role === 'LF') && (
                                <div className="border-t border-slate-100 dark:border-slate-800">
                                    <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 text-xs font-bold text-slate-500 uppercase tracking-wider">Contacts</div>
                                    {contacts.map(c => (
                                        <div key={c.id} onClick={() => startConversation(c)}
                                             className="p-3 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 cursor-pointer transition-colors">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm overflow-hidden">
                                                {c.photoUrl ? <img src={c.photoUrl} alt="" className="w-full h-full object-cover" /> : c.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{c.name}</div>
                                                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                                    {c.role === 'ADMIN' ? 'Admin' : c.role === 'LF' ? 'Adviser' : (
                                                        <>
                                                            <span className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">{c.section || 'No Section'}</span>
                                                            <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">{c.bstp_status || 'Unknown'}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
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
            )}
            
        </div>
    );
}
