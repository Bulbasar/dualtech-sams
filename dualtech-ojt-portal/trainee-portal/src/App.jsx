import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { primaryAuth, primaryDb } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  addDoc,
} from "firebase/firestore";

import Login from "./pages/Login";
import ASTPDashboard from "./pages/ASTPDashboard";
import BSTPDashboard from "./pages/BSTPDashboard";

const AccessPendingWithLoader = ({ onLogout }) => {
  const [showLoader, setShowLoader] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setShowLoader(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (showLoader) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="relative flex justify-center items-center mb-6">
          <div className="absolute animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-blue-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
        </div>
        <h2 className="text-xl font-bold text-slate-800 animate-pulse">
          Authenticating...
        </h2>
        <p className="text-sm text-slate-500 mt-2">Preparing your workspace</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 text-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md transform transition-all animate-in fade-in zoom-in duration-300">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
          <svg
            className="h-6 w-6 text-yellow-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-800 mb-2">
          Access Pending
        </h1>
        <p className="text-slate-500 mb-6">
          Your account is registered, but you do not have an active ASTP or BSTP
          level yet. Please contact administration.
        </p>
        <button
          onClick={onLogout}
          className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [level, setLevel] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRegPrompt, setShowRegPrompt] = useState(false);
  const [regDate, setRegDate] = useState("");
  const [traineeDocId, setTraineeDocId] = useState(null);
  const [traineeData, setTraineeData] = useState(null);
  const [isSubmittingRegDate, setIsSubmittingRegDate] = useState(false);

  // Temporary BSTP States
  const [isTemporary, setIsTemporary] = useState(false);
  const [showTemporaryModal, setShowTemporaryModal] = useState(false);
  const [officialIdInput, setOfficialIdInput] = useState("");
  const [verifyingOfficialId, setVerifyingOfficialId] = useState(false);
  const [officialIdError, setOfficialIdError] = useState("");
  const [officialIdSuccess, setOfficialIdSuccess] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(primaryAuth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Apply the logged-in user's saved theme preference
        const savedTheme = localStorage.getItem(`app-theme-${currentUser.uid}`);
        if (savedTheme === "dark") {
          document.documentElement.classList.add("dark");
        } else if (savedTheme === "light") {
          document.documentElement.classList.remove("dark");
        } else {
          // 'system' or no preference — follow OS
          if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }
        // Fetch user data
        try {
          const appId = "dualtech-ojt-portal";

          // 1. Fetch user's profile to get their studentId
          const profileRef = doc(
            primaryDb,
            "artifacts",
            appId,
            "users",
            currentUser.uid,
            "profile",
            "main",
          );
          const profileSnap = await getDoc(profileRef);

          let studentId = currentUser.uid;
          let isTempUser = false;
          let profileData = null;
          if (profileSnap.exists()) {
            profileData = profileSnap.data();
            studentId =
              profileData.studentId ||
              profileData["Student ID#"] ||
              currentUser.uid;
            isTempUser = !!(
              profileData.isTemporary ||
              String(studentId).startsWith("TEMP-") ||
              ((profileData.level || "").toUpperCase() === "BSTP" &&
                (!profileData.studentId ||
                  String(profileData.studentId).startsWith("TEMP-")))
            );
            setIsTemporary(isTempUser);
            if (isTempUser) {
              setShowTemporaryModal(true);
            }
          }

          // If tagged as temporary, guarantee BSTP portal access
          if (isTempUser) {
            setLevel("BSTP");
            setStatus(
              profileData?.status || profileData?.trainingStatus || "Pre-BSTP",
            );
          } else {
            // 2. Query trainees collection synced by adminsystem
            const traineesRef = collection(
              primaryDb,
              "artifacts",
              appId,
              "public",
              "data",
              "trainees",
            );
            const tq = query(traineesRef, where("studentId", "==", studentId));
            const ts = await getDocs(tq);

            if (!ts.empty) {
              const docSnap = ts.docs[0];
              const data = docSnap.data();
              setLevel(data.Level || data.level || "UNKNOWN");
              setStatus(data.Status || data.status || "UNKNOWN");

              if (
                !data.registeredAt &&
                (data.isRegistered === true || data.isRegistered === "true")
              ) {
                setTraineeDocId(docSnap.id);
                setShowRegPrompt(true);
              }
            } else {
              const traineeSnap = await getDoc(doc(traineesRef, studentId));
              if (traineeSnap.exists()) {
                const data = traineeSnap.data();
                setLevel(data.Level || data.level || "UNKNOWN");
                setStatus(data.Status || data.status || "UNKNOWN");

                if (
                  !data.registeredAt &&
                  (data.isRegistered === true || data.isRegistered === "true")
                ) {
                  setTraineeDocId(traineeSnap.id);
                  setShowRegPrompt(true);
                }
              } else {
                // Fallback check: if user profile has BSTP or isTemporary
                if (
                  profileData?.isTemporary ||
                  (profileData?.level || "").toUpperCase() === "BSTP"
                ) {
                  setLevel("BSTP");
                  setStatus(profileData?.status || "Pre-BSTP");
                  setIsTemporary(true);
                } else {
                  setLevel("UNKNOWN");
                  setStatus("UNKNOWN");
                }
              }
            }
          }
        } catch (e) {
          console.error("Error fetching masterlist:", e);
        }
      } else {
        setUser(null);
        setLevel(null);
        setStatus(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (user, level, status, isTemp = false) => {
    setUser(user);
    setLevel(level);
    setStatus(status);
    if (isTemp) {
      setIsTemporary(true);
      setShowTemporaryModal(true);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setLevel(null);
    setStatus(null);
    setShowRegPrompt(false);
    setTraineeDocId(null);
  };

  const submitRegDate = async () => {
    if (!regDate) return;
    setIsSubmittingRegDate(true);
    try {
      const appId = "dualtech-ojt-portal";
      const traineeRef = doc(
        primaryDb,
        "artifacts",
        appId,
        "public",
        "data",
        "trainees",
        traineeDocId,
      );
      // Save as ISO string from start of day
      const isoDate = new Date(regDate).toISOString();
      await updateDoc(traineeRef, { registeredAt: isoDate });
      setShowRegPrompt(false);
    } catch (err) {
      console.error("Failed to update registration date", err);
      alert("Failed to save date. Please try again.");
    } finally {
      setIsSubmittingRegDate(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleOfficialIdChange = (e) => {
    let val = e.target.value;
    let v = val.replace(/\D/g, "");
    if (v.length > 4) v = v.substring(0, 4) + "-" + v.substring(4);
    if (v.length > 7) v = v.substring(0, 7) + "-" + v.substring(7);
    setOfficialIdInput(v.substring(0, 12));
  };

  const handleLinkOfficialId = async () => {
    setOfficialIdError("");
    setOfficialIdSuccess("");
    const id = officialIdInput.trim();
    if (!id) {
      setOfficialIdError("Please enter your official Student Number.");
      return;
    }

    const pattern = /^\d{4}-\d{2}-\d{4}$/;
    if (!pattern.test(id)) {
      setOfficialIdError("Format must be ####-##-#### (e.g. 2026-08-3012).");
      return;
    }

    setVerifyingOfficialId(true);
    try {
      const appId = "dualtech-ojt-portal";
      const traineesRef = collection(
        primaryDb,
        "artifacts",
        appId,
        "public",
        "data",
        "trainees",
      );

      let tq = query(traineesRef, where("studentId", "==", id));
      let ts = await getDocs(tq);
      if (ts.empty) {
        tq = query(traineesRef, where("Student ID#", "==", id));
        ts = await getDocs(tq);
      }

      let officialDoc = null;
      let officialData = null;

      if (!ts.empty) {
        officialDoc = ts.docs[0];
        officialData = officialDoc.data();
      } else {
        const directSnap = await getDoc(doc(traineesRef, id));
        if (directSnap.exists()) {
          officialDoc = directSnap;
          officialData = directSnap.data();
        }
      }

      if (!officialData) {
        setOfficialIdError(
          `Student Number '${id}' is not yet in the official database. Please verify your ID with your adviser or continue as temporary.`,
        );
        return;
      }

      // Update primary user profile: remove isTemporary, set official studentId
      const profileRef = doc(
        primaryDb,
        "artifacts",
        appId,
        "users",
        user.uid,
        "profile",
        "main",
      );
      await updateDoc(profileRef, {
        studentId: id,
        "Student ID#": id,
        isTemporary: false,
        officialLinkedAt: new Date().toISOString(),
        given: officialData.Given || officialData.FirstName || "",
        family: officialData.Family || officialData.LastName || "",
        section: officialData.section || officialData.Section || "",
        proctor: officialData.proctor || officialData.Proctor || "",
        adviser: officialData.adviser || officialData.Adviser || "",
        status: officialData.Status || officialData.status || "Active",
        level: officialData.Level || officialData.level || "BSTP",
      });

      // Update masterlist trainee record
      await updateDoc(doc(traineesRef, officialDoc.id), {
        isRegistered: true,
        registeredAt: new Date().toISOString(),
        email: user.email,
        uid: user.uid,
      });

      setOfficialIdSuccess(
        "🎉 Success! Official Student ID verified. Your temporary status has been removed.",
      );
      setIsTemporary(false);
      setLevel(officialData.Level || officialData.level || "BSTP");
      setStatus(officialData.Status || officialData.status || "Active");

      setTimeout(() => {
        setShowTemporaryModal(false);
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error("Error linking official student ID:", err);
      setOfficialIdError(
        err.message || "Failed to link Student ID. Please try again.",
      );
    } finally {
      setVerifyingOfficialId(false);
    }
  };

  // Unified Routing Logic based on Level/Status
  const renderDashboard = () => {
    if (!user) return <Navigate to="/login" />;

    // As per requirement:
    // ASTP level -> trainee.html functions
    // BSTP level/status -> Trainee Portal (2).html functions

    // If tagged as temporary, or BSTP level/status, route to BSTP Dashboard
    if (
      isTemporary ||
      level === "BSTP" ||
      status === "BSTP" ||
      status === "Pre-BSTP"
    ) {
      return (
        <BSTPDashboard
          user={user}
          level="BSTP"
          status={status || "Pre-BSTP"}
          onLogout={handleLogout}
        />
      );
    } else if (level === "ASTP") {
      return (
        <ASTPDashboard
          user={user}
          level={level}
          status={status}
          onLogout={handleLogout}
        />
      );
    } else {
      return <AccessPendingWithLoader onLogout={handleLogout} />;
    }
  };

  return (
    <>
      {/* Temporary BSTP Trainee Official ID Verification Modal */}
      {showTemporaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-md border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="text-center space-y-1">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                Temporary BSTP Trainee
              </span>
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 pt-2">
                Official Student Number Check
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Your account is currently registered as a Temporary BSTP
                Trainee. If Dualtech has already issued your official Student
                Number, enter it below to link your official record and update
                your credentials.
              </p>
            </div>

            {officialIdError && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-2xl text-xs font-bold leading-relaxed">
                {officialIdError}
              </div>
            )}
            {officialIdSuccess && (
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-2xl text-xs font-bold leading-relaxed">
                {officialIdSuccess}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                Official Student Number (####-##-####)
              </label>
              <input
                type="text"
                placeholder="e.g. 2026-08-3012"
                value={officialIdInput}
                onChange={handleOfficialIdChange}
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-center tracking-wider text-lg font-bold outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 uppercase"
              />
              <p className="text-[10px] text-slate-400 text-center mt-1 font-mono">
                Format: ####-##-####
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleLinkOfficialId}
                disabled={verifyingOfficialId}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl transition-all shadow-md shadow-blue-200 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {verifyingOfficialId
                  ? "Verifying..."
                  : "Verify & Link Official Record"}
              </button>
              <button
                onClick={() => setShowTemporaryModal(false)}
                disabled={verifyingOfficialId}
                className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold py-3 rounded-2xl transition-all text-xs"
              >
                Remind Me Next Time (Continue as Temporary)
              </button>
            </div>
          </div>
        </div>
      )}

      {showRegPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              Registration Date Required
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              We noticed you are missing a registration date on your profile.
              Please provide the date you registered for this portal.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Date Registered
              </label>
              <input
                type="date"
                value={regDate}
                onChange={(e) => setRegDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={submitRegDate}
              disabled={!regDate || isSubmittingRegDate}
              className={`w-full py-2 rounded-lg font-semibold text-white transition-colors ${!regDate || isSubmittingRegDate ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {isSubmittingRegDate ? "Saving..." : "Save Date"}
            </button>
          </div>
        </div>
      )}
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              !user ? (
                <Login onLoginSuccess={handleLoginSuccess} />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route path="/" element={renderDashboard()} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
