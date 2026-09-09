const fs = require('fs');
const path = 'c:/Users/rober/dualtech-ojt-portal/public/lfportal.html';
let content = fs.readFileSync(path, 'utf8');

// 1. Firebase Auth import
const targetAuthImport = `      updateProfile,
    } from "firebase/auth";`;
const replacementAuthImport = `      updateProfile,
      sendPasswordResetEmail
    } from "firebase/auth";`;
content = content.replace(targetAuthImport, replacementAuthImport);

// 2. Lucide imports
const targetLucideImport = `      Lock,
      Mail,
      Shield,`;
const replacementLucideImport = `      Lock,
      Mail,
      Shield,
      Eye,
      EyeOff,`;
content = content.replace(targetLucideImport, replacementLucideImport);

// 3. States inside component
const targetStates = `      const [loginLoading, setLoginLoading] = useState(false);`;
const replacementStates = `      const [loginLoading, setLoginLoading] = useState(false);
      const [showPassword, setShowPassword] = useState(false);
      const [resetLoading, setResetLoading] = useState(false);`;
content = content.replace(targetStates, replacementStates);

// 4. Reset password handler
const targetHandleLogin = `      const handleLogin = async (e) => {`;
const replacementHandleLogin = `      const handleResetPassword = async () => {
        if (!email) {
          showMessage("Please enter your email address first.", "error");
          return;
        }
        setResetLoading(true);
        try {
          await sendPasswordResetEmail(auth, email);
          showMessage("Password reset email sent! Check your inbox.", "success");
        } catch (err) {
          showMessage("Failed to send reset email: " + err.message, "error");
        } finally {
          setResetLoading(false);
        }
      };

      const handleLogin = async (e) => {`;
content = content.replace(targetHandleLogin, replacementHandleLogin);

// 5. Login Header Logo
const targetHeader = `<div className="bg-blue-600 p-10 text-white text-center">
                <Shield size={48} className="mx-auto mb-4 opacity-90" />
                <h2 className="text-3xl font-black mb-2">LF Portal</h2>
                <p className="text-blue-100 font-medium">
                  Learning Facilitator Access
                </p>
              </div>`;
const replacementHeader = `<div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-10 text-white text-center relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                <img src="/dualtech-logo.png" alt="Dualtech Logo" className="w-20 mx-auto mb-4 drop-shadow-md hover:scale-105 transition-transform duration-300" />
                <h2 className="text-3xl font-black mb-2 tracking-tight">LF Portal</h2>
                <p className="text-blue-100 font-medium">
                  Learning Facilitator Access
                </p>
              </div>`;
content = content.replace(targetHeader, replacementHeader);

// 6. Password Input and Forgot Password
const targetPassword = `<div className="relative">
                    <Lock
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      size={20}
                    />
                    <input
                      required
                      type="password"
                      placeholder="Password"
                      className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>`;
const replacementPassword = `<div className="relative">
                    <Lock
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      size={20}
                    />
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      className="w-full pl-12 pr-12 py-4 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <div className="flex justify-end mt-2">
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
console.log('Fixed LF Portal Login Screen UI');
