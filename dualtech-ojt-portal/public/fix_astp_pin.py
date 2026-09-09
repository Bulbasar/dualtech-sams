path = 'c:/Users/rober/dualtech-ojt-portal/trainee-portal/src/pages/tabs/ASTPHomeTab.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add showPinModal and pinInput states + pinResolveRef after mapRef
old_state = """    const mapRef = useRef(null);
    const [loadingLoc, setLoadingLoc] = useState(false);"""
new_state = """    const mapRef = useRef(null);
    const pinResolveRef = useRef(null);
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [loadingLoc, setLoadingLoc] = useState(false);"""
content = content.replace(old_state, new_state, 1)

# 2. Add requestPin helper after showToast
old_toast = """    const showToast = (message, type = 'info') => {
        alert(message);
    };"""
new_toast = """    const showToast = (message, type = 'info') => {
        alert(message);
    };

    // Returns a Promise that resolves with the entered PIN (string) or null if cancelled.
    const requestPin = () => new Promise((resolve) => {
        pinResolveRef.current = resolve;
        setPinInput('');
        setShowPinModal(true);
    });

    const handlePinKey = (key) => {
        setPinInput(prev => {
            if (key === 'DEL') return prev.slice(0, -1);
            if (prev.length >= 4) return prev;
            return prev + key;
        });
    };

    const handlePinSubmit = () => {
        setShowPinModal(false);
        if (pinResolveRef.current) { pinResolveRef.current(pinInput); pinResolveRef.current = null; }
    };

    const handlePinCancel = () => {
        setShowPinModal(false);
        if (pinResolveRef.current) { pinResolveRef.current(null); pinResolveRef.current = null; }
    };"""
content = content.replace(old_toast, new_toast, 1)

# 3. Replace window.prompt with requestPin
old_prompt = """                    const enteredPin = window.prompt("Biometrics failed or skipped. Please enter your 4-digit Clock-In PIN:");"""
new_prompt = """                    const enteredPin = await requestPin();"""
content = content.replace(old_prompt, new_prompt, 1)

# 4. Add PIN modal JSX just before previewLoc modal
old_previewLoc_start = """                        {previewLoc && (
                            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">"""

new_previewLoc_start = """                        {/* ── CUSTOM PIN ENTRY MODAL ── */}
                        {showPinModal && (
                            <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden animate-in zoom-in-95 duration-200">
                                    {/* Header */}
                                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-6 pt-6 pb-8 text-center">
                                        <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                                            <ShieldCheck size={28} className="text-white" />
                                        </div>
                                        <h3 className="text-white font-black text-lg">Enter Your PIN</h3>
                                        <p className="text-blue-100 text-xs mt-1">4-digit Clock-In PIN required</p>
                                        {/* PIN dots */}
                                        <div className="flex justify-center gap-4 mt-5">
                                            {[0,1,2,3].map(i => (
                                                <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${pinInput.length > i ? 'bg-white border-white scale-110' : 'bg-transparent border-blue-300'}`} />
                                            ))}
                                        </div>
                                    </div>
                                    {/* Number pad */}
                                    <div className="p-4 grid grid-cols-3 gap-2">
                                        {['1','2','3','4','5','6','7','8','9'].map(k => (
                                            <button key={k} onClick={() => handlePinKey(k)}
                                                className="py-3 rounded-xl text-xl font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 active:scale-95 transition-all">
                                                {k}
                                            </button>
                                        ))}
                                        <button onClick={handlePinCancel}
                                            className="py-3 rounded-xl text-sm font-bold text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 active:scale-95 transition-all">
                                            Cancel
                                        </button>
                                        <button onClick={() => handlePinKey('0')}
                                            className="py-3 rounded-xl text-xl font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 active:scale-95 transition-all">
                                            0
                                        </button>
                                        <button onClick={() => handlePinKey('DEL')}
                                            className="py-3 rounded-xl text-sm font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 active:scale-95 transition-all">
                                            ⌫
                                        </button>
                                    </div>
                                    {/* Confirm */}
                                    <div className="px-4 pb-4">
                                        <button onClick={handlePinSubmit} disabled={pinInput.length < 4}
                                            className="w-full py-3 rounded-xl font-black text-white bg-gradient-to-r from-blue-600 to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2">
                                            <CheckCircle2 size={18}/> Confirm
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {previewLoc && (
                            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">"""

content = content.replace(old_previewLoc_start, new_previewLoc_start, 1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

checks = ['showPinModal', 'pinResolveRef', 'requestPin', 'handlePinKey', 'handlePinSubmit', 'handlePinCancel', 'pinInput.length < 4']
for c in checks:
    status = 'OK' if c in content else 'MISSING'
    print(f'{status}: {c}')
