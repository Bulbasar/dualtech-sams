import os
import shutil
import subprocess

file_path = "C:/Users/rober/dualtech-ojt-portal/trainee-portal/src/pages/tabs/ASTPHomeTab.jsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update initiateClockFlow
target1 = """const initiateClockFlow = async (actionType) => {
                if (window._isProcessingClockASTP) return;
                window._isProcessingClockASTP = true;
                setTimeout(() => { window._isProcessingClockASTP = false; }, 3000);
                if (!isActive) return showToast("Your account is not Active. Clocking functions are disabled.", "error");

                // Block clocking from Facebook Messenger in-app browser
                if (isFBMessenger) {
                    setShowClockMessengerWarning(true);
                    return;
                }

                setLoadingLoc(true);

                if (latestLoc && Date.now() - latestLoc.timestamp < 15000) {
                    setPreviewLoc({ lat: latestLoc.lat, lon: latestLoc.lon, action: actionType });
                    setLoadingLoc(false);
                    return;
                }

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
                    { enableHighAccuracy: true, timeout: 10000 }
                );
            }"""

replacement1 = """const initiateClockFlow = async (actionType) => {
                if (window._isProcessingClockASTP) return;
                window._isProcessingClockASTP = true;
                setTimeout(() => { window._isProcessingClockASTP = false; }, 3000);
                if (!isActive) return showToast("Your account is not Active. Clocking functions are disabled.", "error");

                // Block clocking from Facebook Messenger in-app browser
                if (isFBMessenger) {
                    setShowClockMessengerWarning(true);
                    return;
                }

                setLoadingLoc(true);

                // Use the latest location if we received a ping within the last 30 minutes. 
                // This prevents the UI from freezing/timing out if GPS is weak in the user's current spot
                if (latestLoc && Date.now() - latestLoc.timestamp < 1800000) {
                    setPreviewLoc({ lat: latestLoc.lat, lon: latestLoc.lon, action: actionType });
                    setLoadingLoc(false);
                    return;
                }

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
                        // Fallback: If we couldn't get a new high-accuracy lock but we DO have a previous lock, use it
                        if (latestLoc && latestLoc.lat) {
                            setPreviewLoc({ lat: latestLoc.lat, lon: latestLoc.lon, action: actionType });
                        } else {
                            handleTimeAction(actionType); // Let the original error handling/dispute catch it
                        }
                        setLoadingLoc(false);
                    },
                    { enableHighAccuracy: true, timeout: 10000 }
                );
            }"""


# 2. Update handleClock
target2 = """                // Attempt to get location.
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        processAttendanceRecord(position.coords.latitude, position.coords.longitude);
                    },
                    (err) => {
                        // Allow the dispute bypass to temporarily save data if GPS fails
                        setPendingAction(type);
                        setDisputeType('Location Disabled');
                        setDisputeReason('');
                        setShowDisputeModal(true);
                        setLoadingLoc(false);
                    },
                    { enableHighAccuracy: true, timeout: 10000 }
                );"""

replacement2 = """                // Attempt to get location.
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        processAttendanceRecord(position.coords.latitude, position.coords.longitude);
                    },
                    (err) => {
                        // Fallback to latest location if we have it
                        if (latestLoc && latestLoc.lat) {
                            processAttendanceRecord(latestLoc.lat, latestLoc.lon);
                        } else {
                            // Allow the dispute bypass to temporarily save data if GPS fails
                            setPendingAction(type);
                            setDisputeType('Location Disabled');
                            setDisputeReason('');
                            setShowDisputeModal(true);
                            setLoadingLoc(false);
                        }
                    },
                    { enableHighAccuracy: true, timeout: 10000 }
                );"""

if target1 in content:
    content = content.replace(target1, replacement1)
    print("Replaced initiateClockFlow")
else:
    print("Failed to replace initiateClockFlow")

if target2 in content:
    content = content.replace(target2, replacement2)
    print("Replaced handleClock")
else:
    print("Failed to replace handleClock")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Building trainee-portal...")
os.chdir("C:/Users/rober/dualtech-ojt-portal/trainee-portal")
subprocess.run(["npm", "run", "build"], shell=True, check=True)

src_dir = "C:/Users/rober/dualtech-ojt-portal/trainee-portal/dist"
dst_dir = "C:/Users/rober/dualtech-ojt-portal/public/trainee-portal"
if os.path.exists(dst_dir):
    shutil.rmtree(dst_dir)
shutil.copytree(src_dir, dst_dir)
print("Done!")
