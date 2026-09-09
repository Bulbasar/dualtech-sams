const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, orderBy, limit } = require('firebase/firestore');

const firebaseConfig = { apiKey: "AIzaSyAPpy4VcR2uTIPmH01aJ3GvegSDzNNpM9U", authDomain: "dualtech-ojt-portal.firebaseapp.com", projectId: "dualtech-ojt-portal", appId: "1:255242185978:web:2f07c554fad2e3a78ead43" };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testIndex() {
    try {
        const q = query(
            collection(db, 'artifacts', 'dualtech-ojt-portal', 'public', 'data', 'mentoring_attendance'),
            where('activityType', '==', 'Online Schooling'),
            where('status', '==', 'Verified'),
            orderBy('timestamp', 'desc'),
            limit(10)
        );
        const snap = await getDocs(q);
        console.log("SUCCESS! Fetched " + snap.docs.length + " docs.");
    } catch (e) {
        console.error("ERROR:");
        console.error(e.message);
    }
}
testIndex();
