import sys

path = 'c:/Users/rober/dualtech-ojt-portal/trainee-portal/src/pages/tabs/ASTPHomeTab.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# FIX: Replace the inner geolocation call inside handleClock with a version
# that has a hard safety timeout fallback so loadingLoc never stays stuck.
old_gps = """                // Attempt to get location.
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
                    { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
                );"""

new_gps = """                // Attempt to get location with a hard safety timeout
                // so loadingLoc never gets stuck on mobile.
                let gpsDone = false;
                const gpsTimeout = setTimeout(() => {
                    if (!gpsDone) {
                        gpsDone = true;
                        setPendingAction(type);
                        setDisputeType('Location Disabled');
                        setDisputeReason('');
                        setShowDisputeModal(true);
                        setLoadingLoc(false);
                    }
                }, 6000); // 1s longer than the GPS timeout as a safety net

                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        if (gpsDone) return;
                        gpsDone = true;
                        clearTimeout(gpsTimeout);
                        processAttendanceRecord(position.coords.latitude, position.coords.longitude);
                    },
                    (err) => {
                        if (gpsDone) return;
                        gpsDone = true;
                        clearTimeout(gpsTimeout);
                        // Allow the dispute bypass to temporarily save data if GPS fails
                        setPendingAction(type);
                        setDisputeType('Location Disabled');
                        setDisputeReason('');
                        setShowDisputeModal(true);
                        setLoadingLoc(false);
                    },
                    { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
                );"""

if old_gps in content:
    content = content.replace(old_gps, new_gps)
    print("GPS fix applied")
else:
    print("ERROR: Could not find GPS block to replace")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
