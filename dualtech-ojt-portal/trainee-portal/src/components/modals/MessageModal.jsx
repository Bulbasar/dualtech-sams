import React from 'react';
import { X, MessageCircle } from 'lucide-react';

export default function MessageModal({ onClose }) {
    return (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl w-full max-w-md shadow-2xl relative p-6">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <X size={20} />
                </button>
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                    <MessageCircle className="text-blue-600" /> Messages
                </h3>
                <div className="text-center py-10 text-slate-500">
                    <p className="font-medium">Messaging feature is currently being ported.</p>
                </div>
            </div>
        </div>
    );
}