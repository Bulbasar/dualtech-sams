import React, { useState, useEffect } from "react";
import ASTPLayout from "../components/layout/ASTPLayout";
import ASTPProfileTab from "./tabs/ASTPProfileTab";
import ASTPHomeTab from "./tabs/ASTPHomeTab";
import ASTPHistoryTab from "./tabs/ASTPHistoryTab";
import ASTPAbsenceTab from "./tabs/ASTPAbsenceTab";
import ASTPSchoolingTab from "./tabs/ASTPSchoolingTab";
import ASTPDiligenceTab from "./tabs/ASTPDiligenceTab";
import { primaryDb, primaryStorage, primaryAuth } from "../firebase";
import { doc, getDoc, collection, query, where, getDocs, onSnapshot, orderBy, addDoc, setDoc, serverTimestamp } from "firebase/firestore";

export default function ASTPDashboard({ user, level, status, onLogout }) {
  const [activeTab, setActiveTab] = useState('home');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showToast, setShowToast] = useState(false);

  const triggerGlobalRefresh = () => {
    fetchLogs();
    setRefreshTrigger(p => p + 1);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allLogs, setAllLogs] = useState([]);
  
  // States originally populated inside fetchLogs
  const [attendanceDisputes, setAttendanceDisputes] = useState([]);
  const [absenceLogs, setAbsenceLogs] = useState([]);
  const [makeupLogs, setMakeupLogs] = useState([]);

  const appId = "dualtech-ojt-portal";

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileRef = doc(primaryDb, "artifacts", appId, "users", user.uid, "profile", "main");
        const profileSnap = await getDoc(profileRef);
        
        let profileData = { email: user.email };
        let studentId = user.uid;

        if (profileSnap.exists()) {
          profileData = { ...profileData, ...profileSnap.data() };
          studentId = profileData.studentId || profileData['Student ID#'] || user.uid;
        }

        const traineesRef = collection(primaryDb, "artifacts", appId, "public", "data", "trainees");
        const tq = query(traineesRef, where("studentId", "==", studentId));
        const ts = await getDocs(tq);

        if (!ts.empty) {
           profileData = { ...profileData, ...ts.docs[0].data() };
        } else {
           const traineeSnap = await getDoc(doc(traineesRef, studentId));
           if (traineeSnap.exists()) {
              profileData = { ...profileData, ...traineeSnap.data() };
           }
        }
        
        setProfile(profileData);
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [user]);

  const fetchLogs = async () => {
      try {
          const logsCollectionRef = collection(primaryDb, 'artifacts', appId, 'users', user.uid, 'attendanceLogs');
          const q = query(logsCollectionRef, orderBy('timestamp', 'desc'));
          const snap = await getDocs(q);
          const logs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          let modifiedLogs = [...logs];
          
          // Auto-clock out logic
          const activeLog = modifiedLogs.find(log => log.type === 'IN' && !log.clockOutDetails);

          if (activeLog) {
              const now = Date.now();
              const timeInMs = activeLog.timestamp;
              const FIFTEEN_HOURS_MS = 15 * 60 * 60 * 1000;
              
              if (timeInMs && (now - timeInMs > FIFTEEN_HOURS_MS)) {
                  console.log("Session exceeded 15 hours. Auto-clocking out...");
                  const autoOutTimeMs = timeInMs + FIFTEEN_HOURS_MS;
                  
                  const logRef = doc(primaryDb, 'artifacts', appId, 'users', user.uid, 'attendanceLogs', activeLog.id);
                  const autoPayload = {
                      statusRemark: "Auto-Clock Out (Exceeded 15 hours)",
                      type: "OUT",
                      deviceUsed: "System Auto-Trigger",
                      location: { lat: 0, lon: 0 }
                  };
                  
                  try {
                      await setDoc(logRef, { timeOut: autoOutTimeMs, clockOutDetails: autoPayload }, { merge: true });
                      
                      await addDoc(collection(primaryDb, 'artifacts', appId, 'users', user.uid, 'attendanceLogs'), {
                          dateString: new Date(autoOutTimeMs).toLocaleDateString('en-CA'),
                          timestamp: autoOutTimeMs,
                          timeOut: autoOutTimeMs,
                          clockOutDetails: autoPayload,
                          type: 'OUT'
                      });
                      
                      // Restart fetch
                      const snap2 = await getDocs(q);
                      modifiedLogs = snap2.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                  } catch (err) {
                      console.error("Auto-clock out failed:", err);
                  }
              }
          }
          
          setAllLogs(modifiedLogs);


          // Fetch Absences and Disputes
          const requestsRef = collection(primaryDb, 'artifacts', appId, 'public', 'data', 'requests');
          const reqQ = query(requestsRef, where('uid', '==', user.uid));
          const reqSnap = await getDocs(reqQ);

          const allReqs = reqSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          allReqs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

          setAttendanceDisputes(allReqs.filter(r => r.type === 'Dispute' && r.category === 'Missing Log / Absence'));

          // UPDATED: Filter absence records
          let regDate = profile?.registeredAt?.toDate ? profile.registeredAt.toDate() : (profile?.registeredAt ? new Date(profile.registeredAt) : null);
          const startDateStr = profile['IPT Date Start'] || profile.iptDateStart || profile.startDate || '';
          const iptStart = startDateStr ? new Date(startDateStr) : null;
          if (iptStart && !isNaN(iptStart.getTime())) {
              if (regDate) {
                  if (iptStart > regDate) regDate = iptStart;
              } else {
                  regDate = iptStart;
              }
          }

          const absReqs = allReqs.filter(r => {
              const isAbsenceType = r.type === 'Scheduled Absence' || r.type === 'Emergency Absence';
              if (!isAbsenceType) return false;
              if (!regDate) return true; 

              const logDate = new Date(r.absenceDate || r.date || r.createdAt);
              const normalizedRegTime = new Date(regDate.getFullYear(), regDate.getMonth(), regDate.getDate()).getTime();
              const normalizedLogTime = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate()).getTime();

              return normalizedLogTime >= normalizedRegTime;
          });

          setAbsenceLogs(absReqs);

          // Fetch Make-ups
          const makeupsRef = collection(primaryDb, 'artifacts', appId, 'users', user.uid, 'makeups');
          const mSnap = await getDocs(query(makeupsRef, orderBy('timestamp', 'desc')));
          setMakeupLogs(mSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
          console.error("Error fetching logs:", err);
      }
  };

  useEffect(() => {
      if (!user || !profile) return;
      fetchLogs();
  }, [user.uid, profile]); // Added profile as dependency to ensure regDate works

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ASTPLayout 
      user={user} 
      onRefresh={triggerGlobalRefresh} 
      profile={profile} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
        allLogs={allLogs}
        absenceLogs={absenceLogs}
    >
      {activeTab === 'home' && <ASTPHomeTab profile={profile} user={user} db={primaryDb} appId={appId} allLogs={allLogs} fetchLogs={fetchLogs} refreshTrigger={refreshTrigger} />}
      
      {activeTab === 'history' && <ASTPHistoryTab profile={profile} user={user} db={primaryDb} appId={appId} allLogs={allLogs} attendanceDisputes={attendanceDisputes} absenceLogs={absenceLogs} fetchLogs={fetchLogs} refreshTrigger={refreshTrigger} />}

      {activeTab === 'absence' && <ASTPAbsenceTab profile={profile} user={user} db={primaryDb} storage={primaryStorage} appId={appId} isActive={profile?.status === 'Active'} absenceLogs={absenceLogs} fetchLogs={fetchLogs} refreshTrigger={refreshTrigger} />}

      {activeTab === 'schooling' && <ASTPSchoolingTab profile={profile} user={user} db={primaryDb} storage={primaryStorage} appId={appId} isActive={profile?.status === 'Active'} masterStatus={profile?.status} refreshTrigger={refreshTrigger} onRefresh={triggerGlobalRefresh} />}

      {activeTab === 'diligence' && <ASTPDiligenceTab profile={profile} user={user} db={primaryDb} appId={appId} refreshTrigger={refreshTrigger} />}

      {activeTab === 'profile' && <ASTPProfileTab profile={profile} user={user} db={primaryDb} appId={appId} auth={primaryAuth} />}

      {/* Floating Refresh Toast */}
      {showToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-3 text-sm font-bold z-[100] animate-bounce">
          <svg className="animate-spin h-4 w-4 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          Refreshing data...
        </div>
      )}
    </ASTPLayout>
  );
}
