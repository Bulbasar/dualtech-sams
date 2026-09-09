const fs = require('fs');
let code = fs.readFileSync('src/pages/tabs/ASTPHomeTab.jsx', 'utf8');

const originalFunc = `            const initiateClockFlow = async (actionType) => {
                if (!isActive) return showToast("Your account is not Active. Clocking functions are disabled.", "error");

                // Block clocking from Facebook Messenger in-app browser
                if (isFBMessenger) {
                    setShowClockMessengerWarning(true);
                    return;
                }

                setLoadingLoc(true);`;

const patchedFunc = `            const initiateClockFlow = async (actionType) => {
                try {
                if (!isActive) return showToast("Your account is not Active. Clocking functions are disabled.", "error");

                // Block clocking from Facebook Messenger in-app browser
                if (isFBMessenger) {
                    setShowClockMessengerWarning(true);
                    return;
                }

                setLoadingLoc(true);`;

code = code.replace(originalFunc, patchedFunc);

const originalEnd = `                );
            };`;

const patchedEnd = `                );
                } catch (err) {
                    showToast("Debug Error: " + (err.message || err.toString()), "error");
                    setLoadingLoc(false);
                }
            };`;

code = code.replace(originalEnd, patchedEnd);

fs.writeFileSync('src/pages/tabs/ASTPHomeTab.jsx', code);
console.log('try-catch added');
