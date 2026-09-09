const fs = require('fs');
let code = fs.readFileSync('src/pages/tabs/ASTPHomeTab.jsx', 'utf8');

// 1. Revert initiateClockFlow
const original_func_regex = /const initiateClockFlow = async \(actionType\) => \{[\s\S]*?try \{[\s\S]*?if \(\!isActive\)[\s\S]*?maximumAge[\s\S]*?\}\s*\);\s*\}\s*catch[\s\S]*?\}\s*\};/;

const replacement_func = `            const initiateClockFlow = async (actionType) => {
                if (!isActive) return showToast("Your account is not Active. Clocking functions are disabled.", "error");

                // Block clocking from Facebook Messenger in-app browser
                if (isFBMessenger) {
                    setShowClockMessengerWarning(true);
                    return;
                }

                setLoadingLoc(true);

                if (!navigator.geolocation) {
                    setLoadingLoc(false);
                    handleTimeAction(actionType); // Let the normal dispute flow catch it
                    return;
                }

                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        setPreviewLoc({ lat: pos.coords.latitude, lon: pos.coords.longitude, action: actionType });
                        setLoadingLoc(false);
                    },
                    (err) => {
                        setLoadingLoc(false);
                        handleTimeAction(actionType); // Let the original error handling/dispute catch it
                    },
                    { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
                );
            };`;

code = code.replace(original_func_regex, replacement_func);

// 2. Revert Map Preview Modal gpsFailed logic
const modal_regex = /\{previewLoc\.gpsFailed \? \([\s\S]*?\) : \([\s\S]*?\{\/\* Simulated map view focused on trainee location \*\/\}([\s\S]*?<iframe[\s\S]*?<\/iframe>)\s*<\/div>\s*\)\}/;

const replacement_modal = `<div className="w-full h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden mb-6 border-2 border-blue-100 dark:border-blue-900 relative shadow-inner pointer-events-none">
                                        $1
                                    </div>`;

code = code.replace(modal_regex, replacement_modal);

// Fix Confirm Button onClick
const btn_regex = /onClick=\{\(\) => \{\s*const \{ action, lat, lon, gpsFailed \} = previewLoc;\s*setPreviewLoc\(null\);\s*if \(gpsFailed\) \{\s*handleTimeAction\(action, null, null\);\s*\} else \{\s*handleTimeAction\(action, lat, lon\);\s*\}\s*\}\}/;

const btn_replacement = `onClick={() => {
                                        const { action, lat, lon } = previewLoc;
                                        setPreviewLoc(null);
                                        handleTimeAction(action, lat, lon);
                                    }}`;

code = code.replace(btn_regex, btn_replacement);

fs.writeFileSync('src/pages/tabs/ASTPHomeTab.jsx', code);
console.log('ASTPHomeTab Reverted.');
