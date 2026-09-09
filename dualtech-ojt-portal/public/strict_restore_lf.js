const fs = require('fs');
const path = 'c:/Users/rober/dualtech-ojt-portal/public/lfportal.html';
let content = fs.readFileSync(path, 'utf8');

const anchor1 = '{isRegistering ? (';
const anchor2 = '<div className="text-center mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">';

const startIdx = content.indexOf(anchor1);
const endIdx = content.indexOf(anchor2);

if (startIdx !== -1 && endIdx !== -1) {
    const fixedBlock = `{isRegistering ? (
            <RegistrationForm
              onBack={() => setIsRegistering(false)}
              showMessage={showMessage}
            />
          ) : (
            <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 my-auto h-fit">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-10 text-white text-center relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                <img src="/dualtech-logo.png" alt="Dualtech Logo" className="w-20 mx-auto mb-4 drop-shadow-md hover:scale-105 transition-transform duration-300" />
                <h2 className="text-3xl font-black mb-2 tracking-tight">LF Portal</h2>
                <p className="text-blue-100 font-medium">
                  Learning Facilitator Access
                </p>
              </div>

              <form onSubmit={handleLogin} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="relative">
                    <Mail
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      size={20}
                    />
                    <input
                      required
                      type="email"
                      placeholder="Email Address"
                      className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="relative">
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
                      {resetLoading ? <Loader2 size={12} className="animate-spin" /> : null} Forgot Password?
                    </button>
                  </div>
                </div>
                <button
                  disabled={loginLoading}
                  type="submit"
                  className="w-full bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-black py-4 rounded-xl flex justify-center items-center gap-2 shadow-lg transition-all disabled:opacity-50"
                >
                  {loginLoading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "Log In"
                  )}
                </button>
                `;

    const newContent = content.substring(0, startIdx) + fixedBlock + content.substring(endIdx);
    fs.writeFileSync(path, newContent);
    console.log('Restored LF Portal completely via strict replace!');
} else {
    console.log('Could not find anchors.');
}
