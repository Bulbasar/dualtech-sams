import os
import shutil
import subprocess

file_path = "C:/Users/rober/dualtech-ojt-portal/trainee-portal/src/pages/tabs/ASTPHomeTab.jsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

target = """                try {
                    // FIX: Check if online before fetching geofences to prevent infinite hanging
                    if (!navigator.onLine) {
                        locStatus = "Acknowledged (Offline Log - Geofence validation skipped)";
                    } else {
                        const geofencesRef = collection(db, 'artifacts', appId, 'public', 'data', 'geofences');
                        const q = query(geofencesRef, where('company', '==', profile.companyName));

                        // FIX: Add a 5-second timeout for the company geofence check
                        const snap = await Promise.race([
                            getDocs(q),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
                        ]);

                        if (!snap.empty) {
                            let isWithinAnyBranch = false;
                            let minDistance = Infinity;
                            let matchedBranch = "";

                            snap.docs.forEach(doc => {
                                const fence = doc.data();
                                const dist = getDistanceFromLatLonInM(lat, lon, fence.latitude, fence.longitude);
                                if (dist < minDistance) minDistance = dist;
                                if (dist <= (fence.radius || 500)) {
                                    isWithinAnyBranch = true;
                                    matchedBranch = fence.label || fence.branch || "Company Area";
                                }
                            });

                            if (isWithinAnyBranch) {
                                locStatus = `Verified at ${matchedBranch}`;
                            } else {
                                locWarning = `Outside Geofence by ${Math.round(minDistance)}m. `;
                            }
                        } else {
                            locStatus = "Acknowledged (Company location not yet specified)";
                        }
                    }
                } catch (error) {"""

replacement = """                try {
                    // FIX: Check if online before fetching geofences to prevent infinite hanging
                    if (!navigator.onLine) {
                        locStatus = "Acknowledged (Offline Log - Geofence validation skipped)";
                    } else if (companyGeofences !== null) {
                        if (companyGeofences.length > 0) {
                            let isWithinAnyBranch = false;
                            let minDistance = Infinity;
                            let matchedBranch = "";

                            companyGeofences.forEach(fence => {
                                const dist = getDistanceFromLatLonInM(lat, lon, fence.latitude, fence.longitude);
                                if (dist < minDistance) minDistance = dist;
                                if (dist <= (fence.radius || 500)) {
                                    isWithinAnyBranch = true;
                                    matchedBranch = fence.label || fence.branch || "Company Area";
                                }
                            });

                            if (isWithinAnyBranch) {
                                locStatus = `Verified at ${matchedBranch}`;
                            } else {
                                locWarning = `Outside Geofence by ${Math.round(minDistance)}m. `;
                            }
                        } else {
                            locStatus = "Acknowledged (Company location not yet specified)";
                        }
                    } else {
                        locStatus = "Acknowledged (Location checking unavailable)";
                    }
                } catch (error) {"""

if target in content:
    content = content.replace(target, replacement)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Replaced content in ASTPHomeTab.jsx")
else:
    print("Target content not found in ASTPHomeTab.jsx")

# Build trainee-portal
print("Building trainee-portal...")
os.chdir("C:/Users/rober/dualtech-ojt-portal/trainee-portal")
subprocess.run(["npm", "run", "build"], shell=True, check=True)

# Copy dist to public/trainee-portal
src_dir = "C:/Users/rober/dualtech-ojt-portal/trainee-portal/dist"
dst_dir = "C:/Users/rober/dualtech-ojt-portal/public/trainee-portal"

print(f"Copying from {src_dir} to {dst_dir}...")
if os.path.exists(dst_dir):
    shutil.rmtree(dst_dir)
shutil.copytree(src_dir, dst_dir)
print("Done!")
