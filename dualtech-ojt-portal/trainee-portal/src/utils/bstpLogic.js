import { primaryDb as db } from "../firebase";
import { collection, doc, setDoc, query, where, getDocs, getDoc, deleteDoc } from "firebase/firestore";

// ---------------------------------------------------------
// Haversine Formula for Distance Calculation (meters)
// ---------------------------------------------------------
export function haversine(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371e3; // Earth radius in meters
    const rad = Math.PI / 180;
    const phi1 = lat1 * rad;
    const phi2 = lat2 * rad;
    const deltaPhi = (lat2 - lat1) * rad;
    const deltaLambda = (lon2 - lon1) * rad;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

// ---------------------------------------------------------
// Device ID Management
// ---------------------------------------------------------
export function getOrCreateDeviceId() {
    let id = localStorage.getItem('ams_device_id');
    if (!id) {
        id = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem('ams_device_id', id);
    }
    return id;
}

// ---------------------------------------------------------
// Attendance Logging
// ---------------------------------------------------------
export async function logAttendance(type, skillset, geoToLog, livePosition, remarks, samples, deviceExplanation, profile, status = "active") {
    const ts = new Date().toISOString();
    
    // Build basic fields based on Firebase Firestore REST syntax adapted to standard JS objects for JS SDK
    const logData = {
        studentNo: profile.studentNo || profile.studentId,
        name: profile.name || `${profile.given} ${profile.family}`,
        type: type, // 'IN' | 'OUT' | 'SKILLSET_IN'
        timestamp: ts,
        skillset: skillset || '',
        remarks: remarks || '',
        roomName: geoToLog?.venueName || '',
        deviceExplanation: deviceExplanation || '',
        status: status,
        adviserInitials: profile.adviser || profile.Adviser || profile.assignedIC || ''
    };

    if (livePosition) {
        logData.lat = livePosition.lat;
        logData.lng = livePosition.lng;
        logData.accuracy = livePosition.accuracy;
    }

    if (geoToLog) {
        if (geoToLog.distanceM != null) logData.distanceM = String(geoToLog.distanceM);
        if (geoToLog.insideGeofence != null) logData.insideGeofence = geoToLog.insideGeofence;
        if (geoToLog.venueName) logData.venueName = geoToLog.venueName;
        if (geoToLog.venueId) logData.roomId = geoToLog.venueId;
    }

    // Variance tracking
    if (samples && samples.length > 0) {
        logData.locationSamples = samples.map(s => ({
            lat: s.lat,
            lng: s.lng,
            accuracy: s.accuracy,
            timestamp: s.timestamp,
            insideGeofence: s.insideGeofence ?? false,
            distanceM: String(s.distanceM ?? 0),
            isFallback: s.isFallback ?? false
        }));

        let maxVar = 0;
        for (let i = 0; i < samples.length; i++) {
            for (let j = i + 1; j < samples.length; j++) {
                const d = haversine(samples[i].lat, samples[i].lng, samples[j].lat, samples[j].lng);
                if (d > maxVar) maxVar = d;
            }
        }
        logData.locationVariationM = Math.round(maxVar * 100) / 100;
        
        // Simple spoof detection port
        const hasFallbackSample = samples.some(s => s.isFallback);
        const avgAccLog = samples.reduce((s, p) => s + p.accuracy, 0) / samples.length;
        const anyInsideSampleLog = samples.some(s => s.insideGeofence === true);
        
        logData.locationSpoofingSuspected = (!hasFallbackSample && maxVar < 0.05 && avgAccLog > 15 && anyInsideSampleLog);
    }

    const newLogRef = doc(collection(db, "artifacts", "dualtech-ojt-portal", "public", "data", "bstpAttendance"));
    await setDoc(newLogRef, logData);
    
    // Check if we need to flag it
    const currentDeviceId = getOrCreateDeviceId();
    const isUnregisteredDevice = !!profile.registeredDeviceId && profile.registeredDeviceId !== currentDeviceId;
    
    let flagReasons = [];
    if (logData.insideGeofence === false) flagReasons.push("OUT_OF_LOCATION");
    if (logData.locationSpoofingSuspected) flagReasons.push("LOCATION_SPOOFING_SUSPECTED");
    if (isUnregisteredDevice) flagReasons.push("UNREGISTERED_DEVICE");

    if (flagReasons.length > 0) {
        const flagRef = doc(collection(db, "artifacts", "dualtech-ojt-portal", "public", "data", "bstpAttendanceFlags"));
        await setDoc(flagRef, {
            studentNo: logData.studentNo,
            name: logData.name,
            type: logData.type,
            timestamp: logData.timestamp,
            flaggedAt: new Date().toISOString(),
            flagReasons: flagReasons,
            venueName: logData.venueName || '',
            roomName: logData.roomName || '',
            lat: logData.lat || 0,
            lng: logData.lng || 0,
            distanceM: logData.distanceM || '0',
            insideGeofence: logData.insideGeofence || false,
            locationVariationM: logData.locationVariationM || 0,
            locationSpoofingSuspected: logData.locationSpoofingSuspected || false,
            deviceId: currentDeviceId,
            registeredDeviceId: profile.registeredDeviceId || '',
            isUnregisteredDevice: isUnregisteredDevice,
            deviceExplanation: logData.deviceExplanation || '',
            status: 'Unreviewed'
        });
    }


    if (type === 'OUT') {
        try {
            const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
            const qPending = query(
                collection(db, "artifacts", "dualtech-ojt-portal", "public", "data", "bstpAttendance"),
                where("studentNo", "==", profile.studentNo || profile.studentId),
                where("type", "==", "SKILLSET_IN"),
                where("status", "==", "pending")
            );
            const pendSnap = await getDocs(qPending);
            for (const docSnap of pendSnap.docs) {
                const dDate = new Date(docSnap.data().timestamp).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
                if (dDate === todayStr) {
                    await deleteDoc(doc(db, "artifacts", "dualtech-ojt-portal", "public", "data", "bstpAttendance", docSnap.id));
                }
            }
        } catch(e) {
            console.error("Error clearing pending skillsets on clock out", e);
        }
    }

    return true;

}

// ---------------------------------------------------------
// Attendance Summary Computation
// ---------------------------------------------------------
function parseShiftTime(timeStr) {
    if (!timeStr) return null;
    
    // Check 12-hour AM/PM format
    let m = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (m) {
        let hours = parseInt(m[1], 10);
        const mins = parseInt(m[2], 10);
        const meridiem = m[3].toUpperCase();
        if (meridiem === 'AM' && hours === 12) hours = 0;
        if (meridiem === 'PM' && hours !== 12) hours += 12;
        return { hours, minutes: mins };
    }
    
    // Check 24-hour HH:mm format
    m = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (m) {
        return { hours: parseInt(m[1], 10), minutes: parseInt(m[2], 10) };
    }
    
    return null;
}

function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
}

export async function computeAndSaveSummary(profile, todayRecs) {
    if (!profile || !profile.studentId) return;

    const todayDate = new Date();
    const dateStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth()+1).padStart(2,'0')}-${String(todayDate.getDate()).padStart(2,'0')}`;
    const summaryId = `${dateStr}_${profile.studentId}`;
    
    let shiftTimeIn = null;
    
    // Priority: New BSTP Shift Schedules
    if (profile.bstpshiftId) {
        try {
            const shiftDoc = await getDoc(doc(db, "artifacts", "dualtech-ojt-portal", "public", "data", "bstpShifts", profile.bstpshiftId));
            if (shiftDoc.exists()) {
                const sData = shiftDoc.data();
                const weekNum = getWeekNumber(todayDate);
                
                if (sData.isSameForAllWeeks) {
                    shiftTimeIn = sData.evenWeekStartTime; // Fallback to even week field if it's the same
                } else if (weekNum % 2 === 0) {
                    // Even week
                    shiftTimeIn = sData.evenWeekStartTime;
                } else {
                    // Odd week
                    shiftTimeIn = sData.oddWeekStartTime;
                }
                
                // If the user hasn't fully migrated old shifts, this handles basic fallback
                if (!shiftTimeIn && sData.startTime) {
                    shiftTimeIn = sData.startTime;
                }
            }
        } catch (e) {
            console.warn("Error fetching bstpShifts", e);
        }
    }

    // Fallback: Legacy shiftGroup (ASTP or older structure)
    if (!shiftTimeIn && profile.shiftGroup) {
        try {
            const shiftDoc = await getDoc(doc(db, "artifacts", "dualtech-ojt-portal", "public", "data", "shifts", profile.shiftGroup));
            if (shiftDoc.exists() && shiftDoc.data().timeIn) {
                shiftTimeIn = shiftDoc.data().timeIn;
            } else {
                const q = query(collection(db, "artifacts", "dualtech-ojt-portal", "public", "data", "shifts"), where("shiftGroup", "==", profile.shiftGroup));
                const snaps = await getDocs(q);
                if (!snaps.empty && snaps.docs[0].data().timeIn) {
                    shiftTimeIn = snaps.docs[0].data().timeIn;
                }
            }
        } catch (e) {
            console.warn("Error fetching legacy shift", e);
        }
    }

    const inRecs = todayRecs.filter(r => r.type === 'IN').sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const outRecs = todayRecs.filter(r => r.type === 'OUT').sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    const firstIn = inRecs[0] || null;
    const lastOut = outRecs[0] || null;
    
    let status = 'A';
    let minutesLate = 0;

    if (firstIn) {
        status = lastOut ? 'P' : 'IN';
        
        if (shiftTimeIn) {
            const parsedShift = parseShiftTime(shiftTimeIn);
            if (parsedShift) {
                const shiftStart = new Date(firstIn.timestamp);
                shiftStart.setHours(parsedShift.hours, parsedShift.minutes, 0, 0);
                
                const deadline = new Date(shiftStart.getTime() + (15 * 60000)); // 15 min grace period
                const actualIn = new Date(firstIn.timestamp);

                if (actualIn > deadline) {
                    status = 'L'; // Late overrides P/IN
                    minutesLate = Math.floor((actualIn - shiftStart) / 60000);
                }
            }
        }
    }

    // Check for flags
    const hasFlags = todayRecs.some(r => r.insideGeofence === false || r.locationSpoofingSuspected);
    if (hasFlags) {
        status = 'Q'; // Questionable overrides all
    }

    // Calculate current room ID
    const lastSkillsetIn = todayRecs.filter(r => r.type === 'SKILLSET_IN').sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
    const currentRoomId = (firstIn && !lastOut && lastSkillsetIn && lastSkillsetIn.roomId) ? lastSkillsetIn.roomId : null;

    const summaryRef = doc(db, "artifacts", "dualtech-ojt-portal", "public", "data", "bstpAttendanceSummary", summaryId);
    await setDoc(summaryRef, {
        studentNo: profile.studentId,
        name: profile.name || `${profile.given} ${profile.family}`,
        date: dateStr,
        status: status,
        currentRoomId: currentRoomId,
        firstIn: firstIn ? firstIn.timestamp : null,
        lastOut: lastOut ? lastOut.timestamp : null,
        minutesLate: minutesLate,
        skillsetInCount: todayRecs.filter(r => r.type === 'SKILLSET_IN').length,
        updatedAt: new Date().toISOString()
    }, { merge: true });

    return status;
}

// ---------------------------------------------------------
// Biometric Verification
// ---------------------------------------------------------
export async function verifyBiometrics(biometricCredentialId) {
    if (!window.PublicKeyCredential) {
        console.warn("Biometrics not supported on this browser.");
        return false;
    }

    if (!biometricCredentialId) {
        console.warn("No biometric credential found on this profile.");
        return false;
    }

    try {
        const binaryString = window.atob(biometricCredentialId);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        await navigator.credentials.get({
            publicKey: {
                challenge: window.crypto.getRandomValues(new Uint8Array(32)),
                allowCredentials: [{
                    type: 'public-key',
                    id: bytes.buffer
                }],
                userVerification: "required",
                timeout: 60000
            }
        });

        return true;
    } catch (error) {
        console.error("Biometric error:", error);
        return false;
    }
}

