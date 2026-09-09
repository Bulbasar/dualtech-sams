import re

with open('c:/Users/rober/dualtech-ojt-portal/public/lfportal.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Firestore imports (serverTimestamp)
js_import_old = r"import \{ getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, updateDoc, addDoc \} from 'firebase/firestore';"
js_import_new = r"import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';"
if "serverTimestamp" not in content:
    content = re.sub(js_import_old, js_import_new, content)

# 2. Add sendNotification helper in App
send_notify_func = r'''
            const sendNotification = async (title, message) => {
                try {
                    await addDoc(collection(db, "bstpNotifications"), {
                        title,
                        message,
                        timestamp: serverTimestamp(),
                        sender: user.email,
                        lfName: lfData ? `${lfData.firstName} ${lfData.lastName}` : user.email
                    });
                } catch (e) {
                    console.error("Failed to send notification", e);
                }
            };
'''
if "sendNotification = async" not in content:
    app_func = r'const \[clockInTime, setClockInTime\] = useState\(null\);'
    content = re.sub(app_func, app_func + send_notify_func, content)

# 3. Trigger on Clock In
clockin_old = r'setIsClockedIn\(true\);\n\s*setClockInTime\(new Date\(\)\);'
clockin_new = r'setIsClockedIn(true);\n                          setClockInTime(new Date());\n                          sendNotification("LF Clocked In", `${lfData.firstName} ${lfData.lastName} has clocked in at Dualtech Campus.`);'
content = re.sub(clockin_old, clockin_new, content, count=1)

# 4. Trigger on Clock Out
clockout_old = r'showMessage\("Clocked out successfully.", "success"\);'
clockout_new = r'showMessage("Clocked out successfully.", "success");\n                  sendNotification("LF Clocked Out", `${lfData.firstName} ${lfData.lastName} has clocked out.`);'
content = re.sub(clockout_old, clockout_new, content, count=1)

# 5. Pass sendNotification to Dashboard
dashboard_old = r'clockInTime=\{clockInTime\} handleClockOut=\{handleClockOut\} showNotifications=\{showNotifications\} setShowNotifications=\{setShowNotifications\} notifications=\{notifications\} dismissNotification=\{dismissNotification\} />'
dashboard_new = r'clockInTime={clockInTime} handleClockOut={handleClockOut} showNotifications={showNotifications} setShowNotifications={setShowNotifications} notifications={notifications} dismissNotification={dismissNotification} sendNotification={sendNotification} />'
content = re.sub(dashboard_old, dashboard_new, content, count=1)

# Update Dashboard props
dash_props_old = r'const \{ user, lfData, showMessage, onLogout, isClockedIn, showClockInModal, schoolLocation, clockingIn, handleClockIn, setShowClockInModal, clockInTime, handleClockOut, showNotifications, setShowNotifications, notifications, dismissNotification \} = props;'
dash_props_new = r'const { user, lfData, showMessage, onLogout, isClockedIn, showClockInModal, schoolLocation, clockingIn, handleClockIn, setShowClockInModal, clockInTime, handleClockOut, showNotifications, setShowNotifications, notifications, dismissNotification, sendNotification } = props;'
content = re.sub(dash_props_old, dash_props_new, content, count=1)

# 6. Trigger on Scan Room
scan_old = r'fetchClassRoster\(promptModal\.qrRoom\.roomId\);\n\s*setPromptModal\(\{ show: false, qrRoom: null \}\);'
scan_new = r'fetchClassRoster(promptModal.qrRoom.roomId);\n                                                  setPromptModal({ show: false, qrRoom: null });\n                                                  sendNotification("LF Scanned Room", `${lfData.firstName} ${lfData.lastName} started a class session in ${rmName} for ${promptModal.qrRoom.skillset}.`);'
content = re.sub(scan_old, scan_new, content, count=1)

# 7. Trigger on Leave Room
leave_old = r'setRoomName\(\'\'\);\n\s*setRoomSkillset\(\'\'\);'
leave_new = r'setRoomName(\'\');\n                  setRoomSkillset(\'\');\n                  sendNotification("LF Left Room", `${lfData.firstName} ${lfData.lastName} ended the class session in ${roomName}.`);'
content = re.sub(leave_old, leave_new, content, count=1)

with open('c:/Users/rober/dualtech-ojt-portal/public/lfportal.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated lfportal successfully')
