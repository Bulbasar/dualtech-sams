import React, { useState, useEffect } from "react";
import BSTPLayout from "../components/layout/BSTPLayout";
import BSTPHomeTab from "./tabs/BSTPHomeTab";
import BSTPHistoryTab from "./tabs/BSTPHistoryTab";
import BSTPProfileTab from "./tabs/BSTPProfileTab";
import BSTPAbsenceTab from "./tabs/BSTPAbsenceTab";

import { primaryDb } from "../firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

export default function BSTPDashboard({ user, level, status, onLogout }) {
  const [activeTab, setActiveTab] = useState('home');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // We can reuse the same logs fetcher from ASTP or keep it simpler for now
  const [allLogs, setAllLogs] = useState([]);
  const [absenceLogs, setAbsenceLogs] = useState([]);
  

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const appId = "dualtech-ojt-portal";
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
           profileData = { ...profileData, ...ts.docs[0].data(), traineeDocId: ts.docs[0].id, id: ts.docs[0].id };
        } else {
           const traineeSnap = await getDoc(doc(traineesRef, studentId));
           if (traineeSnap.exists()) {
              profileData = { ...profileData, ...traineeSnap.data(), traineeDocId: traineeSnap.id, id: traineeSnap.id };
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

  useEffect(() => {
    const fetchLogs = async () => {
      if (!user) return;
      try {
        const appId = "dualtech-ojt-portal";
        const q = query(collection(primaryDb, 'artifacts', appId, 'public', 'data', 'bstpAbsences'), where('uid', '==', user.uid));
        const snap = await getDocs(q);
        const logs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => b.timestamp - a.timestamp);
        setAbsenceLogs(logs);
      } catch (err) {
        console.error("Error fetching absence logs:", err);
      }
    };
    fetchLogs();
  }, [user, refreshTrigger]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><span className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></span></div>;
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'home':
        return <BSTPHomeTab user={user} profile={profile} onRefresh={() => setRefreshTrigger(p => p + 1)} />;
      case 'history':
        return <BSTPHistoryTab user={user} profile={profile} absenceLogs={absenceLogs} />;
      case 'absence':
        return <BSTPAbsenceTab user={user} profile={profile} db={primaryDb} appId="dualtech-ojt-portal" isActive={status === 'Active' || status === 'Pre-BSTP' || !!profile?.isTemporary} absenceLogs={absenceLogs} fetchLogs={() => setRefreshTrigger(p => p + 1)} />;
      case 'profile':
        return <BSTPProfileTab user={user} profile={profile} onProfileUpdate={setProfile} />;
      default:
        return <BSTPHomeTab user={user} profile={profile} />;
    }
  };

  return (
    <BSTPLayout 
      user={user} 
      profile={profile} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      onRefresh={() => setRefreshTrigger(p => p + 1)}
    >
      {renderTab()}
    </BSTPLayout>
  );
}
