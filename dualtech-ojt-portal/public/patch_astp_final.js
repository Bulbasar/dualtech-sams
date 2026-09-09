const fs = require('fs');

let code = fs.readFileSync('src/pages/tabs/ASTPHomeTab.jsx', 'utf8');

// 1. Replace initiateClockFlow
const oldFuncRegex = /const initiateClockFlow = async \(actionType\) => \{[\s\S]*?try \{[\s\S]*?\}\s*catch[^\}]*\}\s*\};/;

const oldFuncBackupRegex = /const initiateClockFlow = async \(actionType\) => \{[\s\S]*?navigator\.geolocation\.getCurrentPosition\([\s\S]*?\}\s*\);?\s*\};/;

const newFunc = `            const initiateClockFlow = async (actionType) => {
                if (!isActive) return showToast("Your account is not Active. Clocking functions are disabled.", "error");

                if (isFBMessenger) {
                    setShowClockMessengerWarning(true);
                    return;
                }

                setLoadingLoc(true);

                if (!navigator.geolocation) {
                    setLoadingLoc(false);
                    handleTimeAction(actionType);
                    return;
                }

                // Wrap in a robust Promise to handle mobile browsers that silently hang
                const getLocation = () => new Promise((resolve, reject) => {
                    const timeoutId = setTimeout(() => {
                        reject(new Error("Timeout"));
                    }, 10000); // Strict 10-second timeout

                    navigator.geolocation.getCurrentPosition(
                        (pos) => {
                            clearTimeout(timeoutId);
                            resolve(pos);
                        },
                        (err) => {
                            clearTimeout(timeoutId);
                            reject(err);
                        },
                        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } // maximumAge: 0 forces fresh GPS lock
                    );
                });

                try {
                    const pos = await getLocation();
                    setPreviewLoc({ lat: pos.coords.latitude, lon: pos.coords.longitude, action: actionType });
                    setLoadingLoc(false);
                } catch (error) {
                    setLoadingLoc(false);
                    handleTimeAction(actionType); // Let the normal dispute flow catch the failure
                }
            };`;

if (code.match(oldFuncRegex)) {
    code = code.replace(oldFuncRegex, newFunc);
} else if (code.match(oldFuncBackupRegex)) {
    code = code.replace(oldFuncBackupRegex, newFunc);
} else {
    console.error("Could not find initiateClockFlow");
}

// 2. Add full screen loader
const returnRegex = /(return\s*\(\s*<div className="flex flex-col h-full[^>]*>)/;
const loaderOverlay = `$1
            {/* FULL SCREEN LOCATION LOADER FOR MOBILE */}
            {loadingLoc && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 flex flex-col items-center max-w-xs w-full shadow-2xl">
                        <Loader2 size={48} className="animate-spin text-blue-500 mb-4" />
                        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 text-center mb-2">Acquiring GPS Signal...</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">Please ensure your location services are enabled. This may take a few seconds.</p>
                    </div>
                </div>
            )}`;

if (!code.includes("FULL SCREEN LOCATION LOADER FOR MOBILE")) {
    code = code.replace(returnRegex, loaderOverlay);
}

fs.writeFileSync('src/pages/tabs/ASTPHomeTab.jsx', code);
console.log("Patched ASTPHomeTab.jsx successfully.");
