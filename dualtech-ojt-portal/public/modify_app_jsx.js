const fs = require('fs');
const path = 'c:/Users/rober/dualtech-ojt-portal/trainee-portal/src/App.jsx';
let content = fs.readFileSync(path, 'utf8');

const AccessPendingWithLoader = `
const AccessPendingWithLoader = ({ onLogout }) => {
  const [showLoader, setShowLoader] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setShowLoader(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (showLoader) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="relative flex justify-center items-center mb-6">
          <div className="absolute animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-blue-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
        </div>
        <h2 className="text-xl font-bold text-slate-800 animate-pulse">Authenticating...</h2>
        <p className="text-sm text-slate-500 mt-2">Preparing your workspace</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 text-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md transform transition-all animate-in fade-in zoom-in duration-300">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
          <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-800 mb-2">Access Pending</h1>
        <p className="text-slate-500 mb-6">Your account is registered, but you do not have an active ASTP or BSTP level yet. Please contact administration.</p>
        <button onClick={onLogout} className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">Logout</button>
      </div>
    </div>
  );
};
`;

content = content.replace('function App() {', AccessPendingWithLoader + '\nfunction App() {');

const regex = /\} else \{\s*return \(\s*<div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 text-center">[\s\S]*?<h1 className="text-xl font-bold text-slate-800 mb-2">Access Pending<\/h1>[\s\S]*?<\/div>\s*\);\s*\}/;

content = content.replace(regex, '} else {\n      return <AccessPendingWithLoader onLogout={handleLogout} />;\n    }');

fs.writeFileSync(path, content);
console.log('App.jsx modified successfully!');
