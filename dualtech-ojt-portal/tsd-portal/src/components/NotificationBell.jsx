import React, { useState, useEffect, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, arrayUnion } from 'firebase/firestore';

export default function NotificationBell({ db, APP_ID, currentUser, setActiveView }) {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (!currentUser || !currentUser.email) return;

        // Date 7 days ago
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const notifRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'notifications');
        const q = query(
            notifRef,
            where('createdAt', '>=', sevenDaysAgo),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                // Filter out notifications dismissed by the current user
                if (!data.dismissedBy || !data.dismissedBy.includes(currentUser.email)) {
                    fetched.push({ id: doc.id, ...data });
                }
            });
            setNotifications(fetched);
        }, (error) => {
            console.error("Error fetching notifications:", error);
        });

        return () => unsubscribe();
    }, [currentUser, db, APP_ID]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const dismissNotification = async (id, e) => {
        e.stopPropagation();
        try {
            const docRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'notifications', id);
            await updateDoc(docRef, {
                dismissedBy: arrayUnion(currentUser.email)
            });
        } catch (error) {
            console.error("Error dismissing notification:", error);
        }
    };

    const handleNotificationClick = async (notif) => {
        if (notif.link === 'visitSchedule') {
            setActiveView('visitSchedule');
        }
        setIsOpen(false);
    };

    const hasUnread = notifications.length > 0;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
            >
                <Bell size={20} className={hasUnread ? "text-amber-500" : ""} />
                {hasUnread && (
                    <span className="absolute top-1 right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 border-2 border-white dark:border-slate-900"></span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                                You have no new notifications.
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <div 
                                    key={notif.id} 
                                    onClick={() => handleNotificationClick(notif)}
                                    className="p-4 border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors relative group"
                                >
                                    <div className="pr-6">
                                        <div className="text-sm text-slate-800 dark:text-slate-200">{notif.message}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            {notif.createdAt ? new Date(notif.createdAt.toDate ? notif.createdAt.toDate() : notif.createdAt).toLocaleString() : ''}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={(e) => dismissNotification(notif.id, e)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                        title="Dismiss"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
