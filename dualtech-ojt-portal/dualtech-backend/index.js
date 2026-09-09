const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require("firebase-admin");

const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

admin.initializeApp();
const db = getFirestore();

exports.autoClockOutTrainees = onSchedule({
  schedule: '0 0 * * *',
  timeZone: 'Asia/Manila'
}, async (event) => {
    console.log("Starting Auto Clock-Out Cron Job...");

    const now = new Date();
    // 15 hours in milliseconds
    const FIFTEEN_HOURS_MS = 15 * 60 * 60 * 1000;
    
    // We only need to check recent records. Let's check records from the last 2-3 days 
    // to avoid scanning the entire database, but large enough to catch long-forgotten sessions.
    // 3 days = 72 hours
    const threeDaysAgo = new Date(now.getTime() - (72 * 60 * 60 * 1000));
    
    // Query attendance records
    const attendanceRef = db.collection("artifacts").doc("dualtech-ojt-portal").collection("public").doc("data").collection("bstpAttendance");
    
    const recentLogsSnapshot = await attendanceRef
      .where("timestamp", ">=", threeDaysAgo.toISOString())
      .get();
      
    console.log(`Fetched ${recentLogsSnapshot.size} recent attendance logs.`);

    const logsByStudent = {};
    recentLogsSnapshot.forEach(docSnap => {
      const data = docSnap.data();
      const studentNo = data.studentNo || data.studentId;
      if (!studentNo) return;
      
      if (!logsByStudent[studentNo]) {
        logsByStudent[studentNo] = [];
      }
      logsByStudent[studentNo].push({ id: docSnap.id, ...data });
    });

    const batch = db.batch();
    let autoClockOuts = 0;

    for (const [studentNo, logs] of Object.entries(logsByStudent)) {
      // Sort logs by timestamp ascending
      logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      // Track active sessions
      let activeIn = null;
      let activeSkillsetIn = null;

      for (let i = 0; i < logs.length; i++) {
        const log = logs[i];
        
        if (log.type === "IN") {
          activeIn = log;
        } else if (log.type === "OUT") {
          activeIn = null;
          activeSkillsetIn = null; // Normally closed out on main OUT
        } else if (log.type === "SKILLSET_IN") {
          activeSkillsetIn = log;
        } else if (log.type === "SKILLSET_OUT") {
          activeSkillsetIn = null;
        }
      }

      // Check threshold for remaining active sessions
      if (activeSkillsetIn) {
         const inTime = new Date(activeSkillsetIn.timestamp).getTime();
         if (now.getTime() - inTime >= FIFTEEN_HOURS_MS) {
            const outTimestamp = new Date(inTime + FIFTEEN_HOURS_MS).toISOString();
            const newDocRef = attendanceRef.doc();
            
            const skillsetOutData = {
              studentNo: activeSkillsetIn.studentNo,
              name: activeSkillsetIn.name,
              type: "SKILLSET_OUT",
              timestamp: outTimestamp,
              skillset: activeSkillsetIn.skillset || "",
              remarks: "Auto-clocked out by system (exceeded 15 hours)",
              roomName: activeSkillsetIn.roomName || "",
              status: activeSkillsetIn.status || "active"
            };
            
            batch.set(newDocRef, skillsetOutData);
            autoClockOuts++;
            console.log(`Auto Skillset Out for ${studentNo} at ${outTimestamp}`);
         }
      }

      if (activeIn) {
         const inTime = new Date(activeIn.timestamp).getTime();
         if (now.getTime() - inTime >= FIFTEEN_HOURS_MS) {
            const outTimestamp = new Date(inTime + FIFTEEN_HOURS_MS).toISOString();
            const newDocRef = attendanceRef.doc();
            
            const outData = {
              studentNo: activeIn.studentNo,
              name: activeIn.name,
              type: "OUT",
              timestamp: outTimestamp,
              remarks: "Auto-clocked out by system (exceeded 15 hours)",
              roomName: activeIn.roomName || "",
              status: activeIn.status || "active"
            };
            
            batch.set(newDocRef, outData);
            autoClockOuts++;
            console.log(`Auto Clock Out for ${studentNo} at ${outTimestamp}`);
         }
      }
    }

    if (autoClockOuts > 0) {
      // Note: Firestore batch has a limit of 500 operations. 
      // Assuming autoClockOuts is < 500 per run. If it's larger, we'd need to chunk the batch.
      await batch.commit();
      console.log(`Successfully committed ${autoClockOuts} auto-clock-out records.`);
    } else {
      console.log("No users found exceeding the 15-hour threshold.");
    }
    
    return null;
  });

exports.deleteUserAuth = onCall(async (request) => {
  const data = request.data;
  const email = data.email;
  
  if (!email) {
    throw new HttpsError('invalid-argument', 'Email is required');
  }
  
  try {
    const authInstance = getAuth();
    const userRecord = await authInstance.getUserByEmail(email);
    await authInstance.deleteUser(userRecord.uid);
    console.log(`Successfully deleted user with email: ${email}, uid: ${userRecord.uid}`);
    return { success: true, message: `Successfully deleted ${email}` };
  } catch (error) {
    console.error("Error deleting user auth:", error);
    if (error.code === 'auth/user-not-found') {
        throw new HttpsError('not-found', 'User not found in Firebase Auth');
    }
    throw new HttpsError('internal', 'Error deleting user auth');
  }
});



/**
 * AUTO CLOCK-OUT FOR ASTP TRAINEES (Scheduled at 3:00 PM PHT every day)
 * Scans active IN sessions in artifacts/dualtech-ojt-portal/users/{uid}/attendanceLogs
 * If a session has no matching OUT and has been open for > 15 hours, automatically clock out.
 */
async function processAutoClockOutASTP() {
  const appId = "dualtech-ojt-portal";
  const now = new Date();
  const nowMs = now.getTime();
  const FIFTEEN_HOURS_MS = 15 * 60 * 60 * 1000;
  const MAX_LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000; // Check up to 7 days back

  console.log(`[ASTP Auto Clock-Out] Starting job at ${now.toISOString()} (${now.toLocaleString('en-US', { timeZone: 'Asia/Manila' })} PHT)...`);

  const helperTimestampMs = (val) => {
    if (val === null || val === undefined) return null;
    if (typeof val === 'number') return val;
    if (typeof val.toMillis === 'function') return val.toMillis();
    if (typeof val.toDate === 'function') return val.toDate().getTime();
    if (typeof val.seconds === 'number') return val.seconds * 1000;
    const parsed = new Date(val).getTime();
    return isNaN(parsed) ? null : parsed;
  };

  // Fetch all IN attendance logs across all users
  const inLogsSnapshot = await db.collectionGroup("attendanceLogs")
    .where("type", "==", "IN")
    .get();

  console.log(`[ASTP Auto Clock-Out] Found ${inLogsSnapshot.size} total IN logs in collectionGroup.`);

  const traineeCache = new Map();
  const resolveTrainee = async (uid) => {
    if (traineeCache.has(uid)) return traineeCache.get(uid);

    let studentId = '';
    let name = '';
    let company = 'Unassigned';
    let assignedIC = 'Unassigned';
    let level = 'ASTP'; // Default assumption for users in trainee-portal attendanceLogs

    try {
      const profileRef = db.collection("artifacts").doc(appId).collection("users").doc(uid).collection("profile").doc("main");
      const profileSnap = await profileRef.get();
      if (profileSnap.exists) {
        const pData = profileSnap.data();
        studentId = pData.studentId || pData['Student ID#'] || '';
        name = `${pData.given || pData.firstName || ''} ${pData.family || pData.lastName || ''}`.trim();
        company = pData.companyName || pData.company || company;
        assignedIC = pData.assignedIC || assignedIC;
        if (pData.level || pData.Level) level = (pData.level || pData.Level).toUpperCase();
      }

      // If level is not determined or studentId found, check trainees masterlist
      if (studentId) {
        const tSnap = await db.collection("artifacts").doc(appId).collection("public").doc("data").collection("trainees")
          .where("studentId", "==", studentId)
          .limit(1)
          .get();
        if (!tSnap.empty) {
          const tData = tSnap.docs[0].data();
          if (tData.Level || tData.level || tData.LEVEL) {
            level = (tData.Level || tData.level || tData.LEVEL).toUpperCase();
          }
          if (!name) name = `${tData.firstName || tData.given || ''} ${tData.lastName || tData.family || ''}`.trim();
          if (company === 'Unassigned') company = tData.companyName || tData.company || 'Unassigned';
          if (assignedIC === 'Unassigned') assignedIC = tData.assignedIC || 'Unassigned';
        }
      }
    } catch (err) {
      console.warn(`[ASTP Auto Clock-Out] Warning resolving profile for ${uid}:`, err);
    }

    const result = { studentId, name: name || 'ASTP Trainee', company, assignedIC, level };
    traineeCache.set(uid, result);
    return result;
  };

  let autoClockOutCount = 0;
  let skippedAlreadyClosed = 0;

  for (const docSnap of inLogsSnapshot.docs) {
    const data = docSnap.data();

    // 1. Skip if already closed on the doc itself
    if (data.timeOut || data.clockOutDetails) {
      skippedAlreadyClosed++;
      continue;
    }

    // 2. Validate path: artifacts/{appId}/users/{uid}/attendanceLogs/{logId}
    const parts = docSnap.ref.path.split('/');
    if (parts.length < 6 || parts[0] !== 'artifacts' || parts[2] !== 'users' || parts[4] !== 'attendanceLogs') {
      continue;
    }
    const uid = parts[3];

    // 3. Extract timeIn timestamp
    const inTimeMs = helperTimestampMs(data.timeIn) || helperTimestampMs(data.timestamp);
    if (!inTimeMs) continue;

    const elapsedMs = nowMs - inTimeMs;

    // Check if 15-hour threshold reached and within lookback window
    if (elapsedMs < FIFTEEN_HOURS_MS || elapsedMs > MAX_LOOKBACK_MS) {
      continue;
    }

    // 4. Verify ASTP level
    const traineeInfo = await resolveTrainee(uid);
    if (traineeInfo.level === 'BSTP') {
      // BSTP uses separate bstpAttendance collection, skip
      continue;
    }

    // 5. Check if user already logged an OUT later in this attendanceLogs subcollection
    const subsequentOuts = await docSnap.ref.parent
      .where("type", "==", "OUT")
      .where("timestamp", ">=", inTimeMs)
      .limit(1)
      .get();

    if (!subsequentOuts.empty) {
      const outData = subsequentOuts.docs[0].data();
      const existingOutMs = helperTimestampMs(outData.timeOut) || helperTimestampMs(outData.timestamp) || nowMs;
      await docSnap.ref.set({
        timeOut: existingOutMs,
        clockOutDetails: outData.clockOutDetails || {
          type: "OUT",
          statusRemark: "Closed by System (Matched existing OUT)",
          deviceUsed: "System Auto-Sync"
        }
      }, { merge: true });
      console.log(`[ASTP Auto Clock-Out] Linked open IN session to existing OUT for ${traineeInfo.name || uid}`);
      continue;
    }

    // 6. Perform Auto Clock-Out at exact 15-hour limit
    const autoOutTimeMs = inTimeMs + FIFTEEN_HOURS_MS;
    const autoOutDate = new Date(autoOutTimeMs);
    const y = autoOutDate.getFullYear();
    const m = String(autoOutDate.getMonth() + 1).padStart(2, '0');
    const d = String(autoOutDate.getDate()).padStart(2, '0');
    const dateString = `${y}-${m}-${d}`;
    const elapsedHours = (elapsedMs / (1000 * 60 * 60)).toFixed(1);

    const autoPayload = {
      statusRemark: "Auto-Clock Out (System Exceeded 15 hours)",
      type: "OUT",
      deviceUsed: "System Auto-Trigger (Backend 3PM PHT Cron)",
      location: { lat: 0, lon: 0 },
      notes: `Auto-clocked out at 3:00 PM PHT check. Shift exceeded 15 hours (${elapsedHours} hrs elapsed since clock-in).`
    };

    // A. Update the IN log
    await docSnap.ref.set({
      timeOut: autoOutTimeMs,
      clockOutDetails: autoPayload
    }, { merge: true });

    // B. Add the corresponding OUT document
    await docSnap.ref.parent.add({
      dateString: dateString,
      timestamp: autoOutTimeMs,
      timeOut: autoOutTimeMs,
      clockOutDetails: autoPayload,
      type: "OUT"
    });

    // C. Add an entry in ic_reports for Industry Coordinator review
    try {
      const reportsRef = db.collection("artifacts").doc(appId).collection("public").doc("data").collection("ic_reports");
      await reportsRef.add({
        date: new Date().toLocaleDateString('en-US'),
        timestamp: nowMs,
        category: 'Attendance Issue',
        details: `Trainee ${traineeInfo.name || traineeInfo.studentId || uid} logged IN at ${new Date(inTimeMs).toLocaleString('en-US', { timeZone: 'Asia/Manila' })} PHT and exceeded 15 hours without clocking out.\n\nSystem auto-clocked out at ${autoOutDate.toLocaleString('en-US', { timeZone: 'Asia/Manila' })} PHT (15-hour limit).`,
        reportedBy: 'System (ASTP Auto-Clock-Out 3PM Cron)',
        company: traineeInfo.company,
        traineeId: uid,
        traineeName: traineeInfo.name || 'ASTP Trainee',
        assignedIC: traineeInfo.assignedIC,
        status: 'Unread'
      });
    } catch (reportErr) {
      console.warn("[ASTP Auto Clock-Out] Warning logging IC report:", reportErr);
    }

    autoClockOutCount++;
    console.log(`[ASTP Auto Clock-Out] Auto clocked out trainee: ${traineeInfo.name || uid} (Elapsed: ${elapsedHours}h)`);
  }

  console.log(`[ASTP Auto Clock-Out] Finished. Auto clocked out ${autoClockOutCount} trainees. (Skipped ${skippedAlreadyClosed} already closed).`);
  return { success: true, autoClockOutCount };
}

exports.autoClockOutASTPTrainees = onSchedule({
  schedule: '0 15 * * *',
  timeZone: 'Asia/Manila'
}, async (event) => {
  return await processAutoClockOutASTP();
});

exports.runAutoClockOutASTPManual = onCall(async (request) => {
  return await processAutoClockOutASTP();
});


// ============================================================================
// 5. Search Unofficial Google Sheet for Pre-BSTP Trainee Registration
// ============================================================================
exports.searchUnofficialTrainee = onCall({ cors: true }, async (request) => {
    const data = request.data || {};
    const searchName = String(data.name || "").trim().toLowerCase();
    const searchSection = String(data.section || "").trim().toLowerCase();
    const searchStudentNo = String(data.studentNo || "").trim();

    if (!searchName && !searchStudentNo) {
        throw new HttpsError('invalid-argument', 'Please provide a trainee name or student number to search.');
    }

    try {
        const url = "https://docs.google.com/spreadsheets/d/1zfAUE3ZRmg2fU_2VEJ2vGKdug0twV0jSuRt88lqIKBs/gviz/tq?tqx=out:csv&sheet=Unofficial";
        
        const response = await fetch(url, {
            headers: { "User-Agent": "Dualtech-Backend/1.0" }
        });
        
        if (!response.ok) {
            throw new Error(`Google Sheets responded with status ${response.status}`);
        }
        
        const csvText = await response.text();
        const lines = csvText.split(/\r?\n/);
        
        if (lines.length <= 1) {
            return { success: false, found: false, message: "Unofficial sheet is empty." };
        }

        // CSV line parser handling quotes
        const parseLine = (line) => {
            const result = [];
            let cur = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const c = line[i];
                if (c === '"') {
                    if (inQuotes && line[i+1] === '"') {
                        cur += '"';
                        i++;
                    } else {
                        inQuotes = !inQuotes;
                    }
                } else if (c === ',' && !inQuotes) {
                    result.push(cur.trim());
                    cur = '';
                } else {
                    cur += c;
                }
            }
            result.push(cur.trim());
            return result;
        };

        const normalize = (str) => {
            return String(str || "").toLowerCase()
                .replace(/[^a-z0-9]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        };

        const normSearchName = normalize(searchName);
        const normSearchSection = normalize(searchSection);

        // Header: "Student no.","Names","Section","SC Adv","KC Adv","Proctor","Mentor","Training Status","Group ","Skills Sets"
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const cols = parseLine(line);
            if (cols.length < 8) continue;
            
            const rowStudentNo = cols[0] || "";
            const rowName = cols[1] || "";
            const rowSection = cols[2] || "";
            const rowTrainingStatus = cols[7] || "";

            let matches = false;

            // Match by Student No if provided
            if (searchStudentNo && rowStudentNo && rowStudentNo.toLowerCase() === searchStudentNo.toLowerCase()) {
                matches = true;
            }

            // Match by Name
            if (!matches && normSearchName) {
                const normRowName = normalize(rowName);
                // Check if all tokens of search name are present in row name
                const searchTokens = normSearchName.split(' ').filter(Boolean);
                const allTokensMatch = searchTokens.length > 0 && searchTokens.every(token => normRowName.includes(token));

                if (allTokensMatch) {
                    // If section was also provided, check section match
                    if (normSearchSection) {
                        const normRowSection = normalize(rowSection);
                        if (normRowSection.includes(normSearchSection) || normSearchSection.includes(normRowSection)) {
                            matches = true;
                        }
                    } else {
                        matches = true;
                    }
                }
            }

            if (matches) {
                const statusClean = rowTrainingStatus.trim();
                const statusUpper = statusClean.toUpperCase();
                const isAllowed = statusUpper.includes("ACTIVE") || statusUpper.includes("PRE-BSTP");

                if (!isAllowed) {
                    return {
                        success: false,
                        found: true,
                        invalidStatus: true,
                        status: statusClean,
                        traineeName: rowName,
                        message: `Record found for ${rowName}, but Training Status is "${statusClean}". Only Active or Pre-BSTP trainees can register.`
                    };
                }

                // Extract given/family names if possible (Format in sheet: "Lastname, Firstname Middle Suffix")
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
                    success: true,
                    found: true,
                    trainee: {
                        studentNo: rowStudentNo,
                        name: rowName,
                        given: given,
                        family: family,
                        section: rowSection,
                        scAdv: cols[3] || "",
                        kcAdv: cols[4] || "",
                        adviser: cols[3] || cols[4] || "",
                        proctor: cols[5] || "",
                        mentor: cols[6] || "",
                        trainingStatus: statusClean,
                        group: cols[8] || "",
                        skillSets: cols[9] || ""
                    }
                };
            }
        }

        return {
            success: false,
            found: false,
            message: "No matching record found in the Unofficial masterlist. Please verify your Name and Section."
        };
    } catch (err) {
        console.error("Error searching Unofficial sheet:", err);
        throw new HttpsError('internal', `Failed to search Unofficial sheet: ${err.message}`);
    }
});
