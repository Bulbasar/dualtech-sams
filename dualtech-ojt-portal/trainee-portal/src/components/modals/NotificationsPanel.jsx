import React, { useState } from 'react';
import { X, Bell, Loader2, AlertCircle, AlertTriangle, Megaphone, BellOff, Trash2 } from 'lucide-react';

import { primaryDb } from '../../firebase';
import { deleteDoc, doc } from 'firebase/firestore';


export default function NotificationsPanel({ user, profile, onClose, enrichedAnnouncements = [], enrichedUnacknowledged = [] }) {
    const [acknowledging, setAcknowledging] = useState(false);

    const [dismissingId, setDismissingId] = useState(null);

    const handleDismissPersonal = async (ann) => {
        if (!ann.actualDocId) return;
        setDismissingId(ann.id);
        try {
            await deleteDoc(doc(primaryDb, 'artifacts', 'dualtech-ojt-portal', 'public', 'data', 'notifications', ann.actualDocId));
            window.location.reload();
        } catch(e) {
            console.error("Error dismissing", e);
            setDismissingId(null);
        }
    };


    const handleAcknowledgeAll = async () => {
        setAcknowledging(true);
        await onClose(); // onClose handles the logic in ASTPLayout
        setAcknowledging(false);
    };

    return (
        <div className="fixed inset-0 top-0 left-0 w-full h-[100dvh] bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85dvh] m-auto">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                    <div className="flex items-center gap-3 text-blue-600 dark:text-blue-500">
                        <Bell size={24} />
                        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">Notifications</h2>
                    </div>
                    <button onClick={() => onClose()} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                    {enrichedAnnouncements.length === 0 ? (
                        <div className="text-center text-slate-500 dark:text-slate-400 py-10 flex flex-col items-center">
                            <BellOff size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
                            <p className="font-semibold text-lg">No Notifications</p>
                            <p className="text-sm mt-1">You're all caught up!</p>
                        </div>
                    ) : (
                        enrichedAnnouncements.map((ann, idx) => (
                            <div key={ann.id || idx} className={`border p-4 rounded-xl flex items-start gap-4 text-slate-800 dark:text-slate-200 relative ${ann.id === 'system_absences_exceeded' ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' : ann.id === 'system_missing_logs' ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                                {/* Unread indicator dot if it's unacknowledged */}
                                {enrichedUnacknowledged.some(u => u.id === ann.id) && (
                                    <div className="absolute top-4 right-4 w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-sm"></div>
                                )}
                                <div className={`p-2.5 rounded-xl shrink-0 ${ann.id === 'system_absences_exceeded' ? 'bg-red-100 dark:bg-red-900/30' : ann.id === 'system_missing_logs' ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                                    {ann.id === 'system_absences_exceeded' ? <AlertTriangle className="text-red-600 dark:text-red-400" size={20} /> : ann.id === 'system_missing_logs' ? <AlertTriangle className="text-amber-600 dark:text-amber-400" size={20} /> : <Megaphone className="text-blue-600 dark:text-blue-400" size={20} />}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg mb-1 pr-6">{ann.title}</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">
                                        {ann.content || ann.message}
                                    </p>
                                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-400 px-2 py-0.5 rounded-md">
                                            {ann.isSystem ? 'System Update' : 'Announcement'}
                                        </span>

                                        {ann.isPersonal && (
                                            <button 
                                                onClick={() => handleDismissPersonal(ann)}
                                                disabled={dismissingId === ann.id}
                                                className="ml-auto flex items-center justify-center p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                title="Dismiss Notification"
                                            >
                                                {dismissingId === ann.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 mt-4">
                    <button 
                        onClick={handleAcknowledgeAll}
                        disabled={acknowledging}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md flex justify-center items-center gap-2"
                    >
                        {acknowledging ? <Loader2 className="animate-spin" size={18} /> : null}
                        {enrichedUnacknowledged.length > 0 ? 'Acknowledge & Close' : 'Close'}
                    </button>
                </div>
            </div>
        </div>
    );
}