const fs = require('fs');
const path = require('path');

const diligencePath = path.join(__dirname, '../trainee-portal/src/pages/tabs/ASTPDiligenceTab.jsx');
let content = fs.readFileSync(diligencePath, 'utf8');

const diligenceRegex = /const snapTrainee = await getDocs\(collection\(db,\s*'artifacts',\s*appId,\s*'public',\s*'data',\s*'trainees'\)\);\s*const match = snapTrainee\.docs\.find\(doc => \{\s*const d = doc\.data\(\);\s*return \(d\.studentId === profile\.studentId\) \|\| \(d\['Student ID#'\] === profile\.studentId\);\s*\}\);/m;

const diligenceReplacement = `// OPTIMIZED: Fetching only the matching trainee instead of the entire collection
                    const traineesRef = collection(db, 'artifacts', appId, 'public', 'data', 'trainees');
                    const q1 = query(traineesRef, where('studentId', '==', profile.studentId));
                    const q2 = query(traineesRef, where('Student ID#', '==', profile.studentId));
                    
                    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
                    
                    let match = null;
                    if (!snap1.empty) match = snap1.docs[0];
                    else if (!snap2.empty) match = snap2.docs[0];`;

if (diligenceRegex.test(content)) {
    content = content.replace(diligenceRegex, diligenceReplacement);
    fs.writeFileSync(diligencePath, content, 'utf8');
    console.log("Successfully patched ASTPDiligenceTab.jsx");
} else {
    console.log("ASTPDiligenceTab.jsx regex did not match.");
}

const schoolingPath = path.join(__dirname, '../trainee-portal/src/pages/tabs/ASTPSchoolingTab.jsx');
let schoolingContent = fs.readFileSync(schoolingPath, 'utf8');

const schoolingRegex = /const q = query\(collection\(db,\s*'artifacts',\s*appId,\s*'public',\s*'data',\s*'schooling_calendar'\)\);\s*const snap = await getDocs\(q\);\s*const todayStr = getLocalYYYYMMDD\(new Date\(\)\);/m;

const schoolingReplacement = `const todayStr = getLocalYYYYMMDD(new Date());
                    // OPTIMIZED: Only fetch currently active or future events
                    const q = query(
                        collection(db, 'artifacts', appId, 'public', 'data', 'schooling_calendar'),
                        where('viewableUntil', '>=', todayStr)
                    );
                    const snap = await getDocs(q);`;

if (schoolingRegex.test(schoolingContent)) {
    schoolingContent = schoolingContent.replace(schoolingRegex, schoolingReplacement);
    fs.writeFileSync(schoolingPath, schoolingContent, 'utf8');
    console.log("Successfully patched ASTPSchoolingTab.jsx");
} else {
    console.log("ASTPSchoolingTab.jsx regex did not match.");
}
