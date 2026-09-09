import React, { useState, useEffect, useRef } from "react";
import { primaryAuth, primaryDb, secondaryAuth, secondaryDb, primaryFunctions } from "../firebase";
import { httpsCallable } from "firebase/functions";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, fetchSignInMethodsForEmail, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc, setDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { Eye, EyeOff, CheckCircle2, ShieldCheck, User, Lock, AlertCircle, AlertTriangle, Loader2, Smartphone, MapPin, X } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMessengerBrowser, setIsMessengerBrowser] = useState(false);

  // Login brute-force protection
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(null);
  const [lockoutCountdown, setLockoutCountdown] = useState(0);
  const lockoutTimerRef = useRef(null);


  useEffect(() => {
      const ua = navigator.userAgent || navigator.vendor || window.opera;
      if (/FBAV|FBAN|FBIOS|FB_IAB|FB4A|MessengerForiOS|MESSENGER/i.test(ua)) {
          setIsMessengerBrowser(true);
      }
  }, []);

  // Lockout countdown timer
  useEffect(() => {
      if (lockoutUntil) {
          const tick = () => {
              const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
              if (remaining <= 0) {
                  setLockoutUntil(null);
                  setLockoutCountdown(0);
                  clearInterval(lockoutTimerRef.current);
              } else {
                  setLockoutCountdown(remaining);
              }
          };
          tick();
          lockoutTimerRef.current = setInterval(tick, 1000);
          return () => clearInterval(lockoutTimerRef.current);
      }
  }, [lockoutUntil]);

  // --- Registration Wizard States ---
  const [regStep, setRegStep] = useState(1);
  const [studentIdInput, setStudentIdInput] = useState("");
  const [foundTrainee, setFoundTrainee] = useState(null);
  const [isAlreadyBstpRegistered, setIsAlreadyBstpRegistered] = useState(false);
  
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  
  const [regContact, setRegContact] = useState({ messenger: "", email: "", phone: "", emergencyName: "", emergencyPhone: "" });
  const [regSecurity, setRegSecurity] = useState({ password: "", confirmPass: "", pin: "", confirmPin: "" });
  const [showRegPass, setShowRegPass] = useState(false);
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [regMode, setRegMode] = useState("official"); // 'official' | 'unofficial'
  const [unofficialName, setUnofficialName] = useState("");
  const [unofficialSection, setUnofficialSection] = useState("");
  const [officialIdNotFound, setOfficialIdNotFound] = useState(false);
  const [regSuccessCountdown, setRegSuccessCountdown] = useState(null);

  // Helpers
    const appId = "dualtech-ojt-portal";
  const syntheticEmail = (id) => `${id.trim().toLowerCase()}@fst-att-26.internal`;

  const handleIdentifierChange = (e) => {
      let val = e.target.value;
      if (/^[\d-]+$/.test(val)) {
          let v = val.replace(/\D/g, '');
          if (v.length > 4) v = v.substring(0,4) + '-' + v.substring(4);
          if (v.length > 7) v = v.substring(0,7) + '-' + v.substring(7);
          setIdentifier(v.substring(0,12));
      } else {
          setIdentifier(val);
      }
  };

  const handleStudentIdChange = (e) => {
      let val = e.target.value;
      let v = val.replace(/\D/g, '');
      if (v.length > 4) v = v.substring(0,4) + '-' + v.substring(4);
      if (v.length > 7) v = v.substring(0,7) + '-' + v.substring(7);
      setStudentIdInput(v.substring(0, 12));
  };

  const resetWizard = () => {
      setRegStep(1);
      setStudentIdInput("");
      setFoundTrainee(null);
      setIsAlreadyBstpRegistered(false);
      setShowVerifyModal(false);
      setPrivacyAccepted(false);
      setRegContact({ messenger: "", email: "", phone: "", emergencyName: "", emergencyPhone: "" });
      setRegSecurity({ password: "", confirmPass: "", pin: "", confirmPin: "" });
      setError("");
  };

  const handleForgotPassword = async () => {
      if (!identifier) {
          alert("Please enter your email address or Student ID in the field above first, then click 'Forgot Password?'.");
          return;
      }
      try {
          setLoading(true);
          let targetEmail = identifier.trim();
          const isEmail = identifier.includes("@");

          if (!isEmail) {
             const traineesRef = collection(primaryDb, "artifacts", appId, "public", "data", "trainees");
             const tq = query(traineesRef, where("studentId", "==", targetEmail));
             const ts = await getDocs(tq);
             
             if (!ts.empty) {
                targetEmail = ts.docs[0].data().email || ts.docs[0].data().Email || "";
             } else {
                const traineeSnap = await getDoc(doc(traineesRef, targetEmail));
                if (traineeSnap.exists()) {
                   targetEmail = traineeSnap.data().email || traineeSnap.data().Email || "";
                }
             }
             if (!targetEmail) {
                 throw new Error("Student ID not found or no associated email.");
             }
          }

          await sendPasswordResetEmail(primaryAuth, targetEmail);
          alert(`Password reset link sent to ${targetEmail}! Please check your inbox and spam folder.`);
      } catch (error) {
          alert("Failed to send reset email: " + error.message);
      } finally {
          setLoading(false);
      }
  };


  // --- LOGIN LOGIC ---
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_DURATIONS = [30, 60, 120, 300]; // seconds: 30s, 1m, 2m, 5m (escalating)

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Check lockout
    if (lockoutUntil && Date.now() < lockoutUntil) {
        const secs = Math.ceil((lockoutUntil - Date.now()) / 1000);
        setError(`Too many failed attempts. Please wait ${secs} seconds before trying again.`);
        return;
    }

    setLoading(true);

    try {
      let targetEmail = identifier.trim();
      let targetStudentId = identifier.trim();
      
      const isEmail = identifier.includes("@");

      if (!isEmail) {
         // User entered a Student ID. We need to find their email for primaryAuth.
         const traineesRef = collection(primaryDb, "artifacts", appId, "public", "data", "trainees");
         const tq = query(traineesRef, where("studentId", "==", targetStudentId));
         const ts = await getDocs(tq);
         
         if (!ts.empty) {
            targetEmail = ts.docs[0].data().email || ts.docs[0].data().Email || "";
         } else {
            const traineeSnap = await getDoc(doc(traineesRef, targetStudentId));
            if (traineeSnap.exists()) {
               targetEmail = traineeSnap.data().email || traineeSnap.data().Email || "";
            }
         }
         
         if (!targetEmail) {
             throw new Error("Student ID not found or no associated email.");
         }
      } else {
         // User entered an Email
         const traineesRef = collection(primaryDb, "artifacts", appId, "public", "data", "trainees");
         const tq = query(traineesRef, where("email", "==", targetEmail));
         const ts = await getDocs(tq);
         if (!ts.empty) {
             targetStudentId = ts.docs[0].data().studentId || ts.docs[0].data().studentId;
         }
      }

      // 1. Sign in to Primary Auth
      const userCredential = await signInWithEmailAndPassword(primaryAuth, targetEmail, password);
      const user = userCredential.user;
      
      // 2. Fetch Level/Status from Primary DB
      let level = "UNKNOWN";
      let status = "UNKNOWN";
      
      const profileRef = doc(primaryDb, "artifacts", appId, "users", user.uid, "profile", "main");
      const profileSnap = await getDoc(profileRef);
      
      let finalStudentId = user.uid; // fallback
      let isTempUser = false;
      if (profileSnap.exists()) {
        const profileData = profileSnap.data();
        finalStudentId = profileData.studentId || profileData['Student ID#'] || user.uid;
        isTempUser = !!(profileData.isTemporary || String(finalStudentId).startsWith('TEMP-') || (profileData.level || '').toUpperCase() === 'BSTP');
      }

      if (isTempUser) {
         level = "BSTP";
         status = profileSnap.data()?.status || profileSnap.data()?.trainingStatus || "Pre-BSTP";
      } else {
         const traineesRef = collection(primaryDb, "artifacts", appId, "public", "data", "trainees");
         const tq = query(traineesRef, where("studentId", "==", finalStudentId));
         const ts = await getDocs(tq);

         if (!ts.empty) {
            const data = ts.docs[0].data();
            level = data.Level || data.level || "UNKNOWN";
            status = data.Status || data.status || "UNKNOWN";
         } else {
            const traineeSnap = await getDoc(doc(traineesRef, finalStudentId));
            if (traineeSnap.exists()) {
               const data = traineeSnap.data();
               level = data.Level || data.level || "UNKNOWN";
               status = data.Status || data.status || "UNKNOWN";
            } else if (profileSnap.exists() && (profileSnap.data()?.isTemporary || profileSnap.data()?.level === "BSTP")) {
               level = "BSTP";
               status = profileSnap.data()?.status || "Pre-BSTP";
               isTempUser = true;
            }
         }
      }
      
      // 3. If BSTP, silently sign in to Secondary Auth
      if (level === 'BSTP') {
          try {
             await signInWithEmailAndPassword(secondaryAuth, syntheticEmail(finalStudentId), password);
          } catch(err) {
             console.log("Secondary login failed: ", err);
          }
      }

      setFailedAttempts(0);
      setLockoutUntil(null);
      onLoginSuccess(user, level, status, isTempUser);
    } catch (err) {
      const isAuthError = err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-email' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.message.includes('password') || err.message.includes('not found');

      if (isAuthError) {
         const newAttempts = failedAttempts + 1;
         setFailedAttempts(newAttempts);

         if (newAttempts >= MAX_ATTEMPTS) {
             const lockoutIndex = Math.min(Math.floor((newAttempts - MAX_ATTEMPTS) / MAX_ATTEMPTS), LOCKOUT_DURATIONS.length - 1);
             const lockoutSecs = LOCKOUT_DURATIONS[lockoutIndex];
             const until = Date.now() + lockoutSecs * 1000;
             setLockoutUntil(until);
             setError(`Too many failed attempts (${newAttempts}). Account locked for ${lockoutSecs} seconds.`);
         } else {
             const remaining = MAX_ATTEMPTS - newAttempts;
             setError(`Invalid ID/Email or Password. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining before lockout.`);
         }
      } else if (err.code === 'auth/too-many-requests') {
         setError("This account has been temporarily disabled due to many failed login attempts. Please try again later or reset your password.");
      } else {
         setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Direct Google Sheets fallback parser
  const searchGoogleSheetDirect = async (searchName, searchSection, searchSid) => {
      const url = "https://docs.google.com/spreadsheets/d/1zfAUE3ZRmg2fU_2VEJ2vGKdug0twV0jSuRt88lqIKBs/gviz/tq?tqx=out:csv&sheet=Unofficial";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Could not reach Google Sheets.");
      const text = await res.text();
      const lines = text.split(/\r?\n/);

      const parseCsvLine = (line) => {
          const result = [];
          let cur = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
              const c = line[i];
              if (c === '"') {
                  if (inQuotes && line[i+1] === '"') { cur += '"'; i++; }
                  else { inQuotes = !inQuotes; }
              } else if (c === ',' && !inQuotes) {
                  result.push(cur.trim()); cur = '';
              } else { cur += c; }
          }
          result.push(cur.trim());
          return result;
      };

      const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
      const normName = norm(searchName);
      const normSec = norm(searchSection);

      for (let i = 1; i < lines.length; i++) {
          const l = lines[i].trim();
          if (!l) continue;
          const cols = parseCsvLine(l);
          if (cols.length < 8) continue;
          const rowSid = cols[0] || "";
          const rowName = cols[1] || "";
          const rowSec = cols[2] || "";
          const rowStatus = cols[7] || "";

          let match = false;
          if (searchSid && rowSid && rowSid.toLowerCase() === searchSid.toLowerCase()) match = true;
          if (!match && normName) {
              const rNorm = norm(rowName);
              const tokens = normName.split(' ').filter(Boolean);
              if (tokens.length > 0 && tokens.every(t => rNorm.includes(t))) {
                  if (normSec) {
                      const rSecNorm = norm(rowSec);
                      if (rSecNorm.includes(normSec) || normSec.includes(rSecNorm)) match = true;
                  } else {
                      match = true;
                  }
              }
          }

          if (match) {
              let family = "";
              let given = "";
              if (rowName.includes(',')) {
                  const parts = rowName.split(',');
                  family = parts[0].trim();
                  given = parts.slice(1).join(',').trim();
              } else {
                  const parts = rowName.split(' ');
                  family = parts[parts.length - 1];
                  given = parts.slice(0, parts.length - 1).join(' ');
              }
              return {
                  found: true,
                  trainee: {
                      studentNo: rowSid,
                      name: rowName,
                      given: given,
                      family: family,
                      section: rowSec,
                      adviser: cols[3] || cols[4] || "",
                      proctor: cols[5] || "",
                      trainingStatus: rowStatus,
                      skillSets: cols[9] || ""
                  }
              };
          }
      }
      return { found: false };
  };

  const handleSearchUnofficial = async () => {
      setError("");
      setLoading(true);
      try {
          const name = unofficialName.trim();
          const section = unofficialSection.trim();
          const sid = studentIdInput.trim();

          if (!name && !sid) {
              throw new Error("Please enter your Full Name (as listed in class) to search.");
          }

          let result = null;
          try {
              const searchFn = httpsCallable(primaryFunctions, "searchUnofficialTrainee");
              const res = await searchFn({ name, section, studentNo: sid });
              result = res.data;
          } catch (fnErr) {
              console.warn("Callable search failed, falling back to direct sheet fetch:", fnErr);
              result = await searchGoogleSheetDirect(name, section, sid);
          }

          if (!result || !result.found || !result.trainee) {
              throw new Error(result?.message || "No matching record found in the Unofficial masterlist. Please check the spelling of your Name and Section.");
          }

          const matched = result.trainee;
          const statusClean = String(matched.trainingStatus || "").trim();
          const statusUpper = statusClean.toUpperCase();

          if (!statusUpper.includes("ACTIVE") && !statusUpper.includes("PRE-BSTP")) {
              throw new Error(`Record found for ${matched.name}, but Training Status is "${statusClean}". Only Active or Pre-BSTP trainees are allowed to register.`);
          }

          // Format temporary ID: TEMP-MM-#### to mirror ####-##-####
          const curMonth = String(new Date().getMonth() + 1).padStart(2, '0');
          const randNum = Math.floor(1000 + Math.random() * 9000);
          const tempId = matched.studentNo && matched.studentNo.trim() ? matched.studentNo.trim() : `TEMP-${curMonth}-${randNum}`;

          setFoundTrainee({
              isTemporary: true,
              isBstp: true,
              studentId: tempId,
              studentNo: tempId,
              name: matched.name,
              Given: matched.given || matched.name,
              Family: matched.family || "",
              section: matched.section,
              adviser: matched.adviser,
              proctor: matched.proctor,
              trainingStatus: statusClean,
              status: statusClean,
              Level: "BSTP",
              level: "BSTP",
              skillSets: matched.skillSets || ""
          });

          setIsAlreadyBstpRegistered(false);
          setShowVerifyModal(true);
      } catch (err) {
          setError(err.message);
      } finally {
          setLoading(false);
      }
  };

  // --- REGISTRATION LOGIC ---
  const handleVerifyStudent = async () => {
      setError("");
      setLoading(true);
      try {
          const sid = studentIdInput.trim();
          if (!sid) throw new Error("Please enter a Student ID");

          // 1. Query Primary Database (Masterlist)
          const traineesRef = collection(primaryDb, "artifacts", appId, "public", "data", "trainees");
          const tq = query(traineesRef, where("studentId", "==", sid));
          const ts = await getDocs(tq);
          
          let traineeData = null;
          let traineeDocId = null;

          if (!ts.empty) {
              traineeData = ts.docs[0].data();
              traineeDocId = ts.docs[0].id;
          } else {
              const traineeSnap = await getDoc(doc(traineesRef, sid));
              if (traineeSnap.exists()) {
                  traineeData = traineeSnap.data();
                  traineeDocId = traineeSnap.id;
              }
          }

          if (!traineeData) {
              setOfficialIdNotFound(true);
              throw new Error("Student ID not found in the official database. If you are a Pre-BSTP trainee, click below to search the Unofficial list.");
          }

          const isBstp = (traineeData.Level || traineeData.level || "").toUpperCase() === "BSTP";
          
          let secondaryRegistered = false;
          if (isBstp) {
              try {
                  // We use a temporary create/delete hack to reliably bypass cross-project Firebase continue_uri blocks
                  const tempPassword = "Temp_Password_" + Math.random().toString(36).substring(2, 10) + "!";
                  const userCred = await createUserWithEmailAndPassword(secondaryAuth, syntheticEmail(sid), tempPassword);
                  // If it succeeded, it means the user was NOT registered.
                  // We immediately clean up this temporary account.
                  if (userCred && userCred.user) {
                      const { deleteUser } = await import('firebase/auth');
                      await deleteUser(userCred.user);
                  }
                  secondaryRegistered = false;
              } catch (err) {
                  // If we hit email-already-in-use, we have successfully proven the account exists!
                  if (err.code === "auth/email-already-in-use") {
                      secondaryRegistered = true;
                  } else {
                      console.warn("Could not check secondary auth via creation test:", err);
                      // In case of other weird errors, assume false so they can proceed
                      secondaryRegistered = false;
                  }
              }
          }

          // Check if they have an auth account linked to their primary email
          if (traineeData.email || traineeData.Email) {
             const emailToCheck = String(traineeData.email || traineeData.Email).trim();
             if (emailToCheck.includes('@')) {
                 try {
                     const methods = await fetchSignInMethodsForEmail(primaryAuth, emailToCheck);
                     if (methods.length > 0) {
                         throw new Error("This account is already registered in the Primary Portal.");
                     }
                 } catch (apiErr) {
                     // If it's a 400 error due to invalid email format from DB, ignore. Otherwise, bubble up the "already registered" error.
                     if (apiErr.message === "This account is already registered in the Primary Portal.") {
                         throw apiErr;
                     }
                     console.warn("Could not check existing email methods:", apiErr);
                 }
             }
          }

          setFoundTrainee({ ...traineeData, docId: traineeDocId, isBstp });
          setIsAlreadyBstpRegistered(secondaryRegistered);
          setShowVerifyModal(true);
      } catch (err) {
          if (err.code === 'auth/email-already-in-use') {
              setError("This email is already registered to another account. Please log in or use a different email.");
          } else {
              setError(err.message);
          }
      } finally {
          setLoading(false);
      }
  };

  const submitRegistration = async () => {
      setError("");      
      const { email, phone, messenger, emergencyName, emergencyPhone } = regContact;
      const { password, pin } = regSecurity;
      const sid = foundTrainee.studentId || foundTrainee['Student ID#'];
      let bioId = null;

      // 0. BIOMETRIC ENROLLMENT (Must be first to capture user gesture)
      try {
          if (window.PublicKeyCredential) {
              const cred = await navigator.credentials.create({
                  publicKey: {
                      challenge: window.crypto.getRandomValues(new Uint8Array(32)),
                      rp: { name: "Dualtech Portal" },
                      user: {
                          id: window.crypto.getRandomValues(new Uint8Array(16)),
                          name: email.toLowerCase(),
                          displayName: foundTrainee.Given || foundTrainee.FirstName || foundTrainee.name || "Trainee"
                      },
                      pubKeyCredParams: [{ type: "public-key", alg: -7 }],
                      authenticatorSelection: {
                          authenticatorAttachment: "platform",
                          userVerification: "required"
                      },
                      timeout: 60000
                  }
              });

              if (cred) {
                  bioId = btoa(String.fromCharCode(...new Uint8Array(cred.rawId)));
                  localStorage.setItem(`bio_${email.toLowerCase()}`, bioId);
              }
          }
      } catch (bioErr) {
          console.warn("Biometric enrollment skipped or failed during registration:", bioErr);
      }
      setLoading(true);

      try {
          

          // 1. PRIMARY AUTH CREATION (ALWAYS HAPPENS)
          const primaryCred = await createUserWithEmailAndPassword(primaryAuth, email, password);
          const uid = primaryCred.user.uid;

          // 2. PRIMARY DB UPDATE
          const profileRef = doc(primaryDb, "artifacts", appId, "users", uid, "profile", "main");
          await setDoc(profileRef, {
              biometricCredentialId: bioId || null,
              ...foundTrainee,
              isTemporary: !!foundTrainee.isTemporary,
              given: foundTrainee.Given || foundTrainee.FirstName || foundTrainee.name || "",
              family: foundTrainee.Family || foundTrainee.LastName || "",
              middle: foundTrainee.Middle || "",
              suffix: foundTrainee.Suffix || "",
              companyName: foundTrainee['Company Name'] || foundTrainee.companyName || "",
              assignedIC: foundTrainee['Assigned IC'] || foundTrainee.assignedIC || "",
              uid: uid,
              adviser: "",
                    proctor: "",
                    email: email,
              phone: phone,
              messenger: messenger,
              contactPerson: emergencyName,
              contactPersonNo: emergencyPhone,
              fallbackPin: pin,
              studentId: sid,
              createdAt: serverTimestamp(),
              role: 'trainee',
              deviceId: navigator.userAgent
          });

          // Also update the masterlist trainee document with the email (if it was missing)
          if (foundTrainee.docId) {
             const traineeDocRef = doc(primaryDb, "artifacts", appId, "public", "data", "trainees", foundTrainee.docId);
             await setDoc(traineeDocRef, { 
                 adviser: "",
                 proctor: "",
                 email: email, 
                 isRegistered: true,
                 initialRegisteredAt: foundTrainee.initialRegisteredAt || foundTrainee.registeredAt || new Date().toISOString(),
                 registeredAt: new Date().toISOString()
             }, { merge: true });
          }

          // 3. SECONDARY AUTH & DB (ONLY IF BSTP AND NOT ALREADY REGISTERED THERE)
          if (foundTrainee.isBstp && !isAlreadyBstpRegistered) {
              // Create in secondary auth
              const secondaryCred = await createUserWithEmailAndPassword(secondaryAuth, syntheticEmail(sid), password);
              
              // Patch secondary DB student record
              const secStudentRef = doc(secondaryDb, "students", sid);
                const extractedName = `${foundTrainee.Given || foundTrainee.FirstName || ''} ${foundTrainee.Family || foundTrainee.LastName || ''}`.trim() || foundTrainee.name || foundTrainee.Name || "Trainee";
                
                try {
                    await setDoc(secStudentRef, {
                        biometricCredentialId: bioId || null,
                        authUid: secondaryCred.user.uid,
                        name: extractedName,
                        adviser: "",
                        proctor: "",
                        status: foundTrainee.Status || foundTrainee.status || 'Active',
                        accountStatus: 'Active',
                        email: email,
                        phone: phone,
                        messenger: messenger,
                        isRegistered: true,
                        initialRegisteredAt: foundTrainee.initialRegisteredAt || foundTrainee.registeredAt || new Date().toISOString(),
                        registeredAt: new Date().toISOString(),
                        approvalStatus: 'Approved',
                        deviceId: navigator.userAgent
                    }, { merge: true });
                } catch (secErr) {
                    console.warn("Secondary students update failed (likely missing permissions to create), proceeding with registration.", secErr);
                }
  
                // Create secondary DB registration record
                await setDoc(doc(collection(secondaryDb, "registrations")), {
                    studentNo: sid,
                    name: extractedName,
                    adviser: "",
                    proctor: "",
                    email: email,
                    phone: phone,
                    messenger: messenger,
                    registrationStatus: 'Approved',
                    trainingStatus: foundTrainee.Status || foundTrainee.status || 'Active',
                    submittedAt: serverTimestamp()
                });
          }

          // 5. Show custom pop-up with 3-second countdown before directing to account
          setRegSuccessCountdown(3);
          let countdown = 3;
          const interval = setInterval(() => {
              countdown -= 1;
              if (countdown > 0) {
                  setRegSuccessCountdown(countdown);
              } else {
                  clearInterval(interval);
                  onLoginSuccess(primaryCred.user, foundTrainee.isBstp ? "BSTP" : "ASTP", foundTrainee.Status || "Active");
              }
          }, 1000);

      } catch (err) {
          setError(err.message);
      } finally {
          setLoading(false);
      }
  };

  const getPasswordStrength = (pw) => {
      let s = 0;
      if (pw.length >= 8) s++;
      if (/[A-Z]/.test(pw)) s++;
      if (/[0-9]/.test(pw)) s++;
      if (/[^A-Za-z0-9]/.test(pw)) s++;
      return s;
  };

  const strengthColor = ['bg-slate-200 dark:bg-slate-700', 'bg-red-500', 'bg-orange-500', 'bg-emerald-500', 'bg-blue-600'];
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const curStrength = getPasswordStrength(regSecurity.password);

  const renderWizardStep = () => {
      if (regStep === 1) {
          return (
              <div className="space-y-4 animate-fade-in">
                  <div className="text-center mb-4">
                      <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">Verify Identity</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          {regMode === "official" ? "Enter your official Student ID to begin" : "Search Unofficial List (Pre-BSTP Registration)"}
                      </p>
                  </div>

                  {/* Mode Toggle Tabs */}
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-bold mb-2">
                      <button
                          type="button"
                          onClick={() => { setRegMode("official"); setError(""); }}
                          className={`flex-1 py-2.5 rounded-xl transition-all ${regMode === "official" ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 hover:text-slate-800 dark:text-slate-300"}`}
                      >
                          Official Student ID
                      </button>
                      <button
                          type="button"
                          onClick={() => { setRegMode("unofficial"); setError(""); }}
                          className={`flex-1 py-2.5 rounded-xl transition-all ${regMode === "unofficial" ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 hover:text-slate-800 dark:text-slate-300"}`}
                      >
                          Pre-BSTP / Unofficial
                      </button>
                  </div>

                  {regMode === "official" ? (
                      <div className="space-y-3">
                          <div>
                              <input 
                                  type="text" 
                                  placeholder="e.g. 2026-08-3012"
                                  value={studentIdInput}
                                  onChange={handleStudentIdChange}
                                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-mono text-center text-lg uppercase tracking-wider text-slate-700 dark:text-slate-200"
                              />
                              <p className="text-[10px] text-slate-400 text-center mt-1 font-mono">Format: ####-##-####</p>
                          </div>
                          <button 
                              onClick={handleVerifyStudent}
                              disabled={loading}
                              className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-md shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-70 flex justify-center items-center gap-2"
                          >
                              {loading ? <><Loader2 className="animate-spin" size={18} /> Verifying...</> : "Verify Official ID"}
                          </button>

                          {officialIdNotFound && (
                              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl text-xs text-amber-800 dark:text-amber-200 space-y-2">
                                  <p className="font-bold">Don't have an official Student ID yet?</p>
                                  <p className="text-[11px] leading-relaxed">
                                      If you are enrolled as a Pre-BSTP trainee, you can register temporarily by matching your name in the Unofficial masterlist.
                                  </p>
                                  <button
                                      type="button"
                                      onClick={() => { setRegMode("unofficial"); setError(""); }}
                                      className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
                                  >
                                      Search Unofficial List
                                  </button>
                              </div>
                          )}
                      </div>
                  ) : (
                      <div className="space-y-3">
                          <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl text-xs text-blue-800 dark:text-blue-300">
                              <p className="font-bold mb-0.5">Pre-BSTP Temporary Registration</p>
                              <p className="text-[11px] leading-relaxed">
                                  Enter your Full Name and Section as recorded with Dualtech. Status must be <strong>Active</strong> or <strong>Pre-BSTP</strong>.
                              </p>
                          </div>

                          <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 ml-2">Full Name (Lastname, Firstname)</label>
                              <input 
                                  type="text" 
                                  placeholder="e.g. Abejo, Sam Angelo"
                                  value={unofficialName}
                                  onChange={(e) => setUnofficialName(e.target.value)}
                                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 text-sm font-medium text-slate-800 dark:text-slate-100"
                              />
                          </div>

                          <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 ml-2">Section (e.g. D-1096.1)</label>
                              <input 
                                  type="text" 
                                  placeholder="e.g. D-1096.1 or D-1097"
                                  value={unofficialSection}
                                  onChange={(e) => setUnofficialSection(e.target.value)}
                                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 text-sm font-medium text-slate-800 dark:text-slate-100 uppercase"
                              />
                          </div>

                          <button 
                              onClick={handleSearchUnofficial}
                              disabled={loading}
                              className="w-full bg-blue-600 text-white font-black py-3.5 rounded-2xl shadow-md shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-70 flex justify-center items-center gap-2 text-sm"
                          >
                              {loading ? <><Loader2 className="animate-spin" size={18} /> Searching Unofficial Sheet...</> : "Verify & Check Eligibility"}
                          </button>
                      </div>
                  )}

                  {showVerifyModal && foundTrainee && (
                      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in text-left">
                          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-700 space-y-4 relative">
                              <div className="text-center space-y-1">
                                  {foundTrainee.isTemporary ? (
                                      <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                          Pre-BSTP (Temporary)
                                      </span>
                                  ) : (
                                      <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                                          Official Record
                                      </span>
                                  )}
                                  <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 pt-1">Confirm Details</h3>
                              </div>

                              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm space-y-2.5 text-slate-700 dark:text-slate-200">
                                  <div className="font-bold text-lg text-center text-slate-900 dark:text-white">
                                      {foundTrainee.name || `${foundTrainee.Given || ''} ${foundTrainee.Family || ''}`.trim()}
                                  </div>
                                  {foundTrainee.section && (
                                      <div className="flex justify-between text-xs">
                                          <span className="text-slate-400 font-bold">Section:</span>
                                          <span className="font-bold">{foundTrainee.section}</span>
                                      </div>
                                  )}
                                  <div className="flex justify-between text-xs">
                                      <span className="text-slate-400 font-bold">Student ID:</span>
                                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{foundTrainee.studentId}</span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                      <span className="text-slate-400 font-bold">Status:</span>
                                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{foundTrainee.trainingStatus || foundTrainee.status || "Active"}</span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                      <span className="text-slate-400 font-bold">Level:</span>
                                      <span className="font-black text-blue-600 dark:text-blue-400">{foundTrainee.isBstp ? "BSTP" : "ASTP"}</span>
                                  </div>
                              </div>

                              {foundTrainee.isTemporary && (
                                  <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800 text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
                                      <strong>Notice:</strong> You will be registered as a Temporary BSTP Trainee. Once Dualtech issues your official Student Number, you will be prompted upon login to link your official record.
                                  </div>
                              )}

                              <div className="flex gap-3 pt-2">
                                  <button onClick={() => setShowVerifyModal(false)} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-sm">Wrong Info</button>
                                  <button onClick={() => { setShowVerifyModal(false); setRegStep(2); }} className="flex-[2] bg-blue-600 text-white font-bold py-3 rounded-xl shadow-md shadow-blue-200 hover:bg-blue-700 transition-all text-sm">Yes, Proceed</button>
                              </div>
                          </div>
                      </div>
                  )}
              </div>
          );
      }

      if (regStep === 2) {
          return (
              <div className="space-y-4 animate-fade-in">
                  <div className="text-center mb-4">
                      <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">Data Privacy Consent</h2>
                  </div>
                  
                  {isAlreadyBstpRegistered && (
                      <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 p-4 rounded-xl text-sm mb-4 flex gap-3 font-medium">
                          <AlertCircle className="shrink-0 mt-0.5" size={18} />
                          <p>You are previously registered in Dualtech Unified  SAMS Portal. The system will now create your trainee account to access again the portal.</p>
                      </div>
                  )}

                  <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl h-48 overflow-y-auto text-xs text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
                      <p className="font-bold text-slate-800 dark:text-slate-100">DATA PRIVACY ACT OF THE PHILIPPINES (R.A. 10173)</p>
                      <p>By proceeding with this registration, you grant Dualtech Training Center permission to collect, store, and process your personal information.</p>
                      <p>The information collected includes but is not limited to: your name, contact details, biometric data (if applicable), and attendance records.</p>
                      <p>Your data will be used strictly for: <br/>1. Verifying your identity.<br/>2. Tracking your OJT attendance and diligence.<br/>3. Official communication regarding your training program.</p>
                      <p>Dualtech Training Center is committed to protecting your privacy. Your data will not be shared with unauthorized third parties without your explicit consent.</p>
                  </div>
                  
                  <label className="flex items-start gap-3 p-2 cursor-pointer group">
                      <div className={`w-6 h-6 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${privacyAccepted ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 group-hover:border-blue-400'}`}>
                          {privacyAccepted && <CheckCircle2 size={16} className="text-white" />}
                      </div>
                      <span className="text-sm text-slate-700 dark:text-slate-200 select-none">I have read and agree to the Data Privacy terms, and I allow the system to collect my personal information.</span>
                      <input type="checkbox" className="hidden" checked={privacyAccepted} onChange={() => setPrivacyAccepted(!privacyAccepted)} />
                  </label>

                  <div className="flex gap-3 pt-2">
                      <button onClick={() => setRegStep(1)} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold py-4 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700">Back</button>
                      <button onClick={() => setRegStep(3)} disabled={!privacyAccepted} className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-md shadow-blue-200 hover:bg-blue-700 disabled:opacity-50">Continue</button>
                  </div>
              </div>
          );
      }

      if (regStep === 3) {
          return (
              <div className="space-y-5 animate-fade-in">
                  <div className="text-center mb-6">
                      <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">Contact Information</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">How can your coordinator reach you?</p>
                  </div>
                  <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-2">Email Address (Used for Login)</label>
                      <input type="email" value={regContact.email} onChange={e => setRegContact({...regContact, email: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-700 dark:text-slate-200" required />
                  </div>
                  <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-2">Phone Number</label>
                      <input type="tel" value={regContact.phone} onChange={e => setRegContact({...regContact, phone: e.target.value})} placeholder="09XXXXXXXXX" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-700 dark:text-slate-200" required />
                  </div>
                  <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-2">Emergency Contact Name</label>
                      <input type="text" value={regContact.emergencyName} onChange={e => setRegContact({...regContact, emergencyName: e.target.value})} placeholder="Full Name" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-700 dark:text-slate-200" required />
                  </div>
                  <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-2">Emergency Contact No.</label>
                      <input type="tel" value={regContact.emergencyPhone} onChange={e => setRegContact({...regContact, emergencyPhone: e.target.value})} placeholder="09XXXXXXXXX" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-700 dark:text-slate-200" required />
                  </div>
                  <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-2">Messenger Link (Optional)</label>
                      <input type="url" value={regContact.messenger} onChange={e => setRegContact({...regContact, messenger: e.target.value})} placeholder="https://m.me/..." className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-700 dark:text-slate-200" />
                  </div>

                  <div className="flex gap-3 pt-4">
                      <button onClick={() => setRegStep(2)} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold py-4 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700">Back</button>
                      <button onClick={async () => {
                          if (!regContact.email || !regContact.email.includes('@')) return setError("Valid email required.");
                          if (!regContact.phone || regContact.phone.length < 10) return setError("Valid phone required.");
                          if (!regContact.emergencyName) return setError("Emergency contact name required.");
                          if (!regContact.emergencyPhone || regContact.emergencyPhone.length < 10) return setError("Valid emergency phone required.");
                          
                          try {
                              setLoading(true);
                              const methods = await fetchSignInMethodsForEmail(primaryAuth, regContact.email.trim());
                              if (methods.length > 0) {
                                  setLoading(false);
                                  return setError("This email is already registered to another account.");
                              }
                          } catch (err) {
                              console.warn("Could not verify email:", err);
                          }
                          setLoading(false);
                          setError(""); setRegStep(4);
                      }} disabled={loading} className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-md shadow-blue-200 hover:bg-blue-700 disabled:opacity-50">
                          {loading ? "Checking..." : "Continue"}
                      </button>
                  </div>
              </div>
          );
      }

      if (regStep === 4) {
          return (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 animate-fade-in">
                  <div className="text-center mb-6">
                      <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">Security</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Secure your account credentials</p>
                  </div>

                  {/* Password Section */}
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                      <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-2">Account Password</label>
                          <div className="relative">
                              <input type={showRegPass ? "text" : "password"} value={regSecurity.password} onChange={e => setRegSecurity({...regSecurity, password: e.target.value})} className="w-full px-5 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:border-blue-500 text-slate-700 dark:text-slate-200" placeholder="Min 8 characters" />
                              <button type="button" onClick={() => setShowRegPass(!showRegPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600">
                                  {showRegPass ? <EyeOff size={20} /> : <Eye size={20} />}
                              </button>
                          </div>
                      </div>
                      
                      {regSecurity.password && (
                          <div className="px-2">
                              <div className="flex gap-1 h-1.5 mb-1">
                                  {[1,2,3,4].map(i => <div key={i} className={`flex-1 rounded-full ${i <= curStrength ? strengthColor[curStrength] : 'bg-slate-200 dark:bg-slate-700 transition-colors'}`}></div>)}
                              </div>
                              <p className={`text-xs font-bold text-right ${strengthColor[curStrength].replace('bg-', 'text-').replace(' dark:bg-slate-700', '')}`}>{strengthLabel[curStrength]}</p>
                          </div>
                      )}

                      <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-2">Confirm Password</label>
                          <input type={showRegPass ? "text" : "password"} value={regSecurity.confirmPass} onChange={e => setRegSecurity({...regSecurity, confirmPass: e.target.value})} className="w-full px-5 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:border-blue-500 text-slate-700 dark:text-slate-200" />
                      </div>
                  </div>

                  {/* 4-Digit PIN Section */}
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                      <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-2">Clock-in PIN (4 Digits)</label>
                          <input type="password" maxLength="4" pattern="\d{4}" inputMode="numeric" value={regSecurity.pin} onChange={e => setRegSecurity({...regSecurity, pin: e.target.value.replace(/\D/g, '')})} className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:border-blue-500 text-center tracking-[0.5em] font-mono text-xl font-black text-slate-700 dark:text-slate-200" placeholder="0000" />
                          <p className="text-[10px] text-slate-400 ml-2 mt-1">Fallback if biometric login is unavailable.</p>
                      </div>
                      <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-2">Confirm PIN</label>
                          <input type="password" maxLength="4" pattern="\d{4}" inputMode="numeric" value={regSecurity.confirmPin} onChange={e => setRegSecurity({...regSecurity, confirmPin: e.target.value.replace(/\D/g, '')})} className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:border-blue-500 text-center tracking-[0.5em] font-mono text-xl font-black text-slate-700 dark:text-slate-200" placeholder="0000" />
                      </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                      <button onClick={() => setRegStep(3)} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold py-4 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700">Back</button>
                      <button onClick={() => {
                          if (regSecurity.password.length < 8) return setError("Password must be at least 8 characters.");
                          if (regSecurity.password !== regSecurity.confirmPass) return setError("Passwords do not match.");
                          if (regSecurity.pin.length !== 4) return setError("PIN must be exactly 4 digits.");
                          if (regSecurity.pin !== regSecurity.confirmPin) return setError("PINs do not match.");
                          setError(""); setRegStep(5);
                      }} className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-md shadow-blue-200 hover:bg-blue-700">Continue</button>
                  </div>
              </div>
          );
      }

      if (regStep === 5) {
          return (
              <div className="space-y-4 animate-fade-in">
                  <div className="text-center mb-6">
                      <div className="bg-blue-50 dark:bg-blue-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400">
                          <CheckCircle2 size={40} />
                      </div>
                      <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">Ready to Submit</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Please review your details</p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm space-y-3 text-slate-700 dark:text-slate-200">
                      <div><span className="text-xs font-bold text-slate-400 uppercase block mb-0.5">Student ID</span> <span className="font-semibold">{foundTrainee.studentId || studentIdInput}</span></div>
                      <div><span className="text-xs font-bold text-slate-400 uppercase block mb-0.5">Name</span> <span className="font-semibold">{`${foundTrainee.Given || foundTrainee.FirstName || ''} ${foundTrainee.Family || foundTrainee.LastName || ''}`.trim() || foundTrainee.name || foundTrainee.Name}</span></div>
                      <div><span className="text-xs font-bold text-slate-400 uppercase block mb-0.5">Level</span> <span className="font-semibold text-blue-600 dark:text-blue-400">{foundTrainee.isBstp ? "BSTP" : "ASTP"}</span></div>
                      <hr className="border-slate-200 dark:border-slate-700" />
                      <div><span className="text-xs font-bold text-slate-400 uppercase block mb-0.5">Email</span> <span className="font-semibold">{regContact.email}</span></div>
                      <div><span className="text-xs font-bold text-slate-400 uppercase block mb-0.5">Phone</span> <span className="font-semibold">{regContact.phone}</span></div>
                  </div>

                  <div className="flex gap-3 pt-4">
                      <button onClick={() => setRegStep(4)} disabled={loading} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold py-4 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50">Back</button>
                      <button onClick={submitRegistration} disabled={loading} className="flex-[2] bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-md shadow-blue-200 hover:bg-blue-700 disabled:opacity-70 flex justify-center items-center gap-2">
                          {loading ? <><Loader2 className="animate-spin" size={18} /> Submitting...</> : "Submit"}
                      </button>
                  </div>
              </div>
          );
      }
  };


  if (isMessengerBrowser) {
      return (
          <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center">
              <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl max-w-sm w-full border border-slate-700">
                  <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <AlertTriangle className="text-red-500" size={32} />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-4">Unsupported Browser</h2>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">
                      You are using Facebook Messenger's internal browser, which blocks critical features required for registration and attendance tracking.
                  </p>
                  <p className="text-white font-semibold text-sm bg-slate-700/50 py-4 px-4 rounded-xl">
                      Please tap the <strong className="text-blue-400">3 dots</strong> at the top right and select <strong className="text-blue-400">"Open in Chrome"</strong> or <strong className="text-blue-400">"Open in Browser"</strong>.
                  </p>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-700 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-xl sm:rounded-2xl shadow-xl max-w-md w-full border border-slate-200 dark:border-slate-700 relative overflow-hidden animate-fade-in">
        
        {/* SUCCESS MODAL OVERLAY */}
        {regSuccessCountdown !== null && (
            <div className="absolute inset-0 bg-white dark:bg-slate-900/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                <CheckCircle2 size={64} className="text-emerald-500 mb-6 animate-bounce" />
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">Registration Successful!</h3>
                <p className="text-slate-600 dark:text-slate-300 font-medium">Redirecting to your account in {regSuccessCountdown} seconds...</p>
            </div>
        )}

        {/* blue Accent Bar */}
        <div className="absolute top-0 left-0 w-full h-2 bg-blue-600">
           {isRegistering && regStep > 1 && (
             <div className="h-full bg-blue-400 transition-all duration-300" style={{width: `${(regStep/5)*100}%`}}></div>
           )}
        </div>

        {/* Global Error Banner */}
        {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm mb-6 flex items-start gap-2 animate-fade-in border border-red-200 dark:border-red-800 mt-2 font-medium">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
            </div>
        )}

        {isRegistering ? (
            <div>
               <div className="text-center mb-6">
                   <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2 tracking-tight">Trainee Portal</h1>
                   <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Register your account</p>
               </div>
               {renderWizardStep()}
            </div>
        ) : (
            <div className="animate-fade-in">
                <div className="text-center mb-8">
                    <div className="bg-blue-50 dark:bg-blue-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400">
                        <img src="/dualtech-logo.png" alt="Dualtech Logo" className="w-16 h-16 object-contain" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-2 tracking-tight">Trainee Portal</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Sign in to your account</p>
                </div>
                <form onSubmit={handleLoginSubmit} className="space-y-5">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider ml-2">Email Address or Student ID</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={identifier}
                                onChange={handleIdentifierChange}
                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-700 dark:text-slate-200"
                                placeholder="Email Address or 19-XXXX"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider ml-2">Password</label>
                        <div className="relative">
                            <input 
                                type={showLoginPass ? "text" : "password"} 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-700 dark:text-slate-200 pr-12"
                                placeholder="••••••••"
                                required
                            />
                            <button type="button" onClick={() => setShowLoginPass(!showLoginPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors outline-none">
                                {showLoginPass ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex justify-end mt-1">
                        <button type="button" onClick={handleForgotPassword} className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
                            Forgot Password?
                        </button>
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-md shadow-blue-200 hover:bg-blue-700 transition-all mt-6 disabled:opacity-70 flex justify-center items-center gap-2"
                    >
                        {loading ? <><Loader2 className="animate-spin" size={20} /> Please wait...</> : "Secure Sign In"}
                    </button>
                </form>
            </div>
        )}
        
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase cursor-pointer hover:text-blue-600"
            onClick={() => {
                if (isRegistering) resetWizard();
                setIsRegistering(!isRegistering);
            }}
          >
            {isRegistering ? "Back to Login" : "Create New Account"}
          </p>
        </div>
      </div>
    </div>
  );
}
