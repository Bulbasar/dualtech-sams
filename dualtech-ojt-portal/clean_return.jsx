            return (
                <div className="space-y-6 pb-20">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2"><BookOpen className="text-emerald-600"/> Schooling & PDS</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                            {isOnlineAssigned 
                                ? "Complete your online schooling activities and submit your output here." 
                                : "Scan the Room QR code to log attendance."}
                        </p>
                    </div>

                    {!isOnlineAssigned && (
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 text-center">
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex justify-center items-center gap-2">
                                <QrCode size={20} className="text-emerald-500" /> Scan Schooling Venue QR
                            </h3>
                            
                            <div className="flex flex-col items-center">
                                {scanError && <p className="text-red-500 text-xs font-bold mb-3 bg-red-50 p-2 rounded-lg border border-red-100">{scanError}</p>}
                                
                                {scannedData ? (
                                    <div className="text-left w-full max-w-sm mx-auto bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                                        <div className="mb-4 text-center">
                                            <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 p-3 rounded-full inline-block mb-2">
                                                <CheckCircle2 size={32} />
                                            </div>
                                            <h4 className="font-bold text-slate-800 dark:text-slate-100">Venue QR Scanned!</h4>
                                            <p className="text-xs text-slate-500">You are at: <span className="font-bold">{scannedData.venueName}</span></p>
                                        </div>
                                        <button onClick={handleSubmitAttendance} disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition flex justify-center items-center gap-2">
                                            {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Submit Attendance
                                        </button>
                                        <button onClick={() => setScannedData(null)} disabled={submitting} className="w-full mt-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold py-3 rounded-xl transition">
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-full max-w-xs mx-auto aspect-square bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-600 relative">
                                        {loadingLoc && <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex flex-col justify-center items-center z-10">
                                            <Loader2 size={32} className="animate-spin text-emerald-600 mb-2" />
                                            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Verifying Location...</p>
                                        </div>}
                                        <div id="trainee-qr-reader" className="w-full h-full object-cover"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <History size={18} className="text-emerald-600" /> Schooling History
                        </h3>
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                            {history.length === 0 ? (
                                <p className="text-sm text-slate-400 italic text-center py-4">No attendance records found.</p>
                            ) : (
                                history.map(h => (
                                    <div key={h.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{h.topic || h.activityType || 'Schooling Log'}</p>
                                                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><MapPin size={12}/> {h.venueName || h.hub || h.venue || 'Hub Not Specified'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{h.date || (h.timestamp ? new Date(h.timestamp).toLocaleDateString() : '')}</p>
                                                {h.time && <p className="text-[10px] text-slate-400">{h.time}</p>}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            );
