import re

with open('c:/Users/rober/dualtech-ojt-portal/public/bstpadmin.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports
import_old = r"import \{ getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, getDoc, getDocs, query, where, updateDoc \} from 'firebase/firestore';"
import_new = r"import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, getDoc, getDocs, query, where, updateDoc, orderBy, limit } from 'firebase/firestore';"
if "orderBy, limit" not in content:
    content = re.sub(import_old, import_new, content)

# 2. Update notifications state and listener
state_old = r'''const \[notifications, setNotifications\] = useState\(\[
\s*\{ id: 1, title: 'Notification Placeholder', message: 'This is a placeholder for LF clock-ins or TSD announcements\.', time: 'Just now' \}
\s*\]\);
\s*const dismissNotification = \(id\) => \{
\s*setNotifications\(prev => prev\.filter\(n => n\.id !== id\)\);
\s*\};'''

state_new = r'''const [notifications, setNotifications] = useState([]);
              
              React.useEffect(() => {
                  if (user && adminData) {
                      const q = query(collection(db, "bstpNotifications"), orderBy("timestamp", "desc"), limit(50));
                      const unsub = onSnapshot(q, (snap) => {
                          const notifs = [];
                          snap.forEach(d => {
                              const data = d.data();
                              let timeStr = "Just now";
                              if (data.timestamp) {
                                  const date = data.timestamp.toDate();
                                  timeStr = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                              }
                              notifs.push({ id: d.id, ...data, time: timeStr });
                          });
                          setNotifications(notifs);
                      });
                      return () => unsub();
                  }
              }, [user, adminData]);

              const dismissNotification = async (id) => {
                  try {
                      await deleteDoc(doc(db, "bstpNotifications", id));
                  } catch (e) {
                      console.error("Failed to dismiss notification", e);
                  }
              };'''

content = re.sub(state_old, state_new, content)

with open('c:/Users/rober/dualtech-ojt-portal/public/bstpadmin.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated bstpadmin successfully')
