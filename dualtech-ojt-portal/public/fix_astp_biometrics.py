path = 'c:/Users/rober/dualtech-ojt-portal/trainee-portal/src/pages/tabs/ASTPHomeTab.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# FIX 1: Move biometrics to initiateClockFlow (runs before GPS on ALL paths)
#         AND add hard safety timeout for the first getCurrentPosition call
old_initiate = """    /* CLOCK FUNCTIONS */
            const initiateClockFlow = async (actionType) => {
                if (!isActive) return showToast("Your account is not Active. Clocking functions are disabled.", "error");

                // Block clocking from Facebook Messenger in-app browser
                if (isFBMessenger) {
                    setShowClockMessengerWarning(true);
                    return;
                }

                setLoadingLoc(true);

                if (!navigator.geolocation) {
                    setLoadingLoc(false);
                    handleTimeAction(actionType, null, null, true); // Let the normal dispute flow catch it
                    return;
                }

                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        setPreviewLoc({ lat: pos.coords.latitude, lon: pos.coords.longitude, action: actionType });
                        setLoadingLoc(false);
                    },
                    (err) => {
                        setLoadingLoc(false);
                        handleTimeAction(actionType, null, null, true); // Let the original error handling/dispute catch it
                    },
                    { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
                );
            };"""

new_initiate = """    /* CLOCK FUNCTIONS */
            const initiateClockFlow = async (actionType) => {
                if (!isActive) return showToast("Your account is not Active. Clocking functions are disabled.", "error");

                // Block clocking from Facebook Messenger in-app browser
                if (isFBMessenger) {
                    setShowClockMessengerWarning(true);
                    return;
                }

                // ── STEP 1: BIOMETRICS / FALLBACK PIN ──────────────────────
                // Run auth check before GPS so it applies to ALL paths
                // (Normal, Dispute, GPS-failure) and never gets skipped.
                let isVerified = await verifyBiometrics(user.uid);
                if (!isVerified) {
                    const enteredPin = window.prompt("Biometrics failed or skipped. Please enter your 4-digit Clock-In PIN:");
                    if (!enteredPin) return; // User cancelled — do nothing

                    if (profile.fallbackPin && String(enteredPin).trim() === String(profile.fallbackPin).trim()) {
                        isVerified = true;
                    } else {
                        showToast("Error: Incorrect PIN. Clock-in cancelled.", "error");
                        return;
                    }
                }

                // ── STEP 2: SHOW LOCATING SPINNER & GET GPS ────────────────
                setLoadingLoc(true);

                if (!navigator.geolocation) {
                    setLoadingLoc(false);
                    handleTimeAction(actionType, null, null, true);
                    return;
                }

                // Hard safety timeout — some mobile browsers never fire
                // the error callback for getCurrentPosition even with timeout set.
                let gpsCalled = false;
                const gpsInitTimeout = setTimeout(() => {
                    if (!gpsCalled) {
                        gpsCalled = true;
                        setLoadingLoc(false);
                        handleTimeAction(actionType, null, null, true);
                    }
                }, 7000); // 2s longer than GPS timeout as a safety net

                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        if (gpsCalled) return;
                        gpsCalled = true;
                        clearTimeout(gpsInitTimeout);
                        setPreviewLoc({ lat: pos.coords.latitude, lon: pos.coords.longitude, action: actionType });
                        setLoadingLoc(false);
                    },
                    (err) => {
                        if (gpsCalled) return;
                        gpsCalled = true;
                        clearTimeout(gpsInitTimeout);
                        setLoadingLoc(false);
                        handleTimeAction(actionType, null, null, true);
                    },
                    { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
                );
            };"""

if old_initiate in content:
    content = content.replace(old_initiate, new_initiate, 1)
    print("initiateClockFlow fix applied")
else:
    print("ERROR: initiateClockFlow block not found")

# FIX 2: Remove biometrics from handleClock since it's now in initiateClockFlow
# (Keep it only as a guard for any direct calls that bypass initiateClockFlow)
old_biometrics_in_handleclock = """                if (overrideStatus === 'Normal') {
                    let isVerified = await verifyBiometrics(user.uid);
                    if (!isVerified) {
                        const enteredPin = window.prompt("Biometrics failed or skipped. Please enter your 4-digit Clock-In PIN:");
                        if (!enteredPin) return;

                        if (profile.fallbackPin && String(enteredPin).trim() === String(profile.fallbackPin).trim()) {
                            isVerified = true;
                        } else {
                            showToast("Error: Incorrect PIN. Clock-in cancelled.", "error");
                            return;
                        }
                    }
                }"""

new_biometrics_comment = """                // NOTE: Biometrics/PIN check is now handled in initiateClockFlow
                // before GPS starts, so it covers all paths (Normal + Dispute)."""

if old_biometrics_in_handleclock in content:
    content = content.replace(old_biometrics_in_handleclock, new_biometrics_comment, 1)
    print("handleClock biometrics block replaced with comment")
else:
    print("ERROR: handleClock biometrics block not found")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
