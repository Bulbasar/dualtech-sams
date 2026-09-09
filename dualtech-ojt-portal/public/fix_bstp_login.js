const fs = require('fs');
const path = 'c:/Users/rober/dualtech-ojt-portal/public/bstpadmin.html';
let content = fs.readFileSync(path, 'utf8');

// 1. Firebase Auth import
const targetAuthImport = `import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';`;
const replacementAuthImport = `import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';`;
content = content.replace(targetAuthImport, replacementAuthImport);

// 2. Lucide imports
const targetLucideImport = `const { QrCode, Download, ChevronUp, ChevronDown, Users, MapPin, LogOut, Plus, Trash2, Edit, X, Loader2, Moon, Sun, Lock, Mail, Shield, AlertTriangle, CheckCircle2, Copy , Menu, Globe, Layers, Clock, Bell} = Lucide;`;
const replacementLucideImport = `const { QrCode, Download, ChevronUp, ChevronDown, Users, MapPin, LogOut, Plus, Trash2, Edit, X, Loader2, Moon, Sun, Lock, Mail, Shield, AlertTriangle, CheckCircle2, Copy , Menu, Globe, Layers, Clock, Bell, Eye, EyeOff} = Lucide;`;
content = content.replace(targetLucideImport, replacementLucideImport);

// 3. States inside component
const targetStates = `            const [loginLoading, setLoginLoading] = useState(false);
            const [errorMsg, setErrorMsg] = useState('');`;
const replacementStates = `            const [loginLoading, setLoginLoading] = useState(false);
            const [errorMsg, setErrorMsg] = useState('');
            const [showPassword, setShowPassword] = useState(false);
            const [resetLoading, setResetLoading] = useState(false);`;
content = content.replace(targetStates, replacementStates);

// 4. Reset password handler
const targetHandleLogin = `            const handleLogin = async (e) => {`;
const replacementHandleLogin = `            const handleResetPassword = async () => {
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

            const handleLogin = async (e) => {`;
content = content.replace(targetHandleLogin, replacementHandleLogin);

// 5. Login Header Logo
const targetHeader = `<div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-center text-white">
                                <Shield className="w-16 h-16 mx-auto mb-4 opacity-90" />
                                <h1 className="text-3xl font-black tracking-tight">BSTP Admin</h1>
                                <p className="text-blue-100 mt-2 font-medium">Authentication Required</p>
                            </div>`;
const replacementHeader = `<div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-center text-white relative overflow-hidden">
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                                <img src="/dualtech-logo.png" alt="Dualtech Logo" className="w-20 mx-auto mb-4 drop-shadow-md hover:scale-105 transition-transform duration-300" />
                                <h1 className="text-3xl font-black tracking-tight">BSTP Admin</h1>
                                <p className="text-blue-100 mt-2 font-medium">Authentication Required</p>
                            </div>`;
content = content.replace(targetHeader, replacementHeader);

// 6. Password Input and Forgot Password
const targetPassword = `<div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                        <input type="password" required className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" />
                                    </div>
                                </div>`;
const replacementPassword = `<div>
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
                                </div>`;
content = content.replace(targetPassword, replacementPassword);

fs.writeFileSync(path, content);
console.log('Fixed BSTP Admin Login Screen UI');
