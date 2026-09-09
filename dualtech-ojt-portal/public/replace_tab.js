const fs = require('fs');
const path = require('path');

const tsdPath = path.join(__dirname, 'tsdportal.html');
const mentoringPath = path.join(__dirname, 'mentoring.html');

let tsdContent = fs.readFileSync(tsdPath, 'utf8');
let mentoringContent = fs.readFileSync(mentoringPath, 'utf8');

// 1. Extract AstpSchoolingDashboard
const startIndex = tsdContent.indexOf('const AstpSchoolingDashboard = () => {');
const endIndexStr = '\n        const AnnouncementsView = () => {';
const endIndex = tsdContent.indexOf(endIndexStr, startIndex);
let astpComponent = tsdContent.substring(startIndex, endIndex);

// 2. Transform the component
astpComponent = astpComponent
    .replace(/firebase\.firestore\(\)\.collection\('artifacts'\)\.doc\(APP_ID\)\.collection\('public'\)\.doc\('data'\)\.collection\('trainees'\)/g, "collection(db, 'artifacts', APP_ID, 'public', 'data', 'trainees')")
    .replace(/await traineesRef\.get\(\)/g, "await getDocs(traineesRef)")
    .replace(/const db = firebase\.firestore\(\);/g, "// const db = getFirestore();")
    .replace(/db\.collection\('artifacts'\)\.doc\(APP_ID\)\.collection\('public'\)\.doc\('data'\)\.collection\('mentoring_attendance'\)/g, "collection(db, 'artifacts', APP_ID, 'public', 'data', 'mentoring_attendance')")
    .replace(/db\.collection\('artifacts'\)\.doc\(APP_ID\)\.collection\('public'\)\.doc\('data'\)\.collection\('schooling_credit_applications'\)/g, "collection(db, 'artifacts', APP_ID, 'public', 'data', 'schooling_credit_applications')")
    .replace(/mentoringRef\.where\('studentId', 'in', chunk\)\.get\(\)/g, "getDocs(query(mentoringRef, where('studentId', 'in', chunk)))")
    .replace(/mentoringRef\.where\('Student ID#', 'in', chunk\)\.get\(\)/g, "getDocs(query(mentoringRef, where('Student ID#', 'in', chunk)))")
    .replace(/creditRef\.where\('studentId', 'in', chunk\)\.get\(\)/g, "getDocs(query(creditRef, where('studentId', 'in', chunk)))")
    .replace(/mentoringRef\.where\('uid', 'in', chunk\)\.get\(\)/g, "getDocs(query(mentoringRef, where('uid', 'in', chunk)))")
    .replace(/mentoringRef\.where\('traineeUid', 'in', chunk\)\.get\(\)/g, "getDocs(query(mentoringRef, where('traineeUid', 'in', chunk)))")
    .replace(/<Icon name="columns" size=\{14\} \/>/g, "<Columns size={14} />")
    .replace(/<Icon name="download" size=\{14\} \/>/g, "<Download size={14} />")
    .replace(/<Icon name="search" size=\{14\} className="text-slate-400" \/>/g, "<Search size={14} className=\"text-slate-400\" />")
    .replace(/<Icon name="check-circle" size=\{12\} \/>/g, "<CheckCircle size={12} />")
    .replace(/<Icon name="alert-circle" size=\{12\} \/>/g, "<AlertTriangle size={12} />")
    .replace(/<Icon name="user" size=\{32\} \/>/g, "<User size={32} />")
    .replace(/<Icon name="x" size=\{20\}\/>/g, "<X size={20}/>")
    .replace(/<Icon name="users" size=\{16\}\/>/g, "<Users size={16}/>")
    .replace(/<Icon name="clock" size=\{16\}\/>/g, "<Clock size={16}/>")
    .replace(/<Icon name="calendar" size=\{12\} className="text-slate-400" \/>/g, "<Calendar size={12} className=\"text-slate-400\" />");


// 3. Extract the portion of mentoring.html to replace
const mentoringStart = mentoringContent.indexOf('        // ==========================================\r\n        // SCHOOLING RECORDS DASHBOARD (NEW)');
let actualMentoringStart = mentoringStart;
if (mentoringStart === -1) {
    actualMentoringStart = mentoringContent.indexOf('        // ==========================================\n        // SCHOOLING RECORDS DASHBOARD (NEW)');
}

const mentoringEndStr = 'function GlobalLackingNotification() {';
const mentoringEnd = mentoringContent.indexOf(mentoringEndStr, actualMentoringStart);

if (actualMentoringStart === -1 || mentoringEnd === -1) {
    console.error("Could not find the injection points in mentoring.html");
    console.error("Start: ", actualMentoringStart);
    console.error("End: ", mentoringEnd);
    process.exit(1);
}

// 4. Update tabs
let updatedMentoringContent = mentoringContent.substring(0, actualMentoringStart) +
    "        // ==========================================\n" +
    "        // ASTP SCHOOLING DASHBOARD\n" +
    "        // ==========================================\n" +
    "        " + astpComponent + "\n\n        " + 
    mentoringContent.substring(mentoringEnd);

// update lucide-react imports
updatedMentoringContent = updatedMentoringContent.replace(
    /ClipboardList\n        \} from 'lucide-react';/,
    "ClipboardList, Columns\n        } from 'lucide-react';"
);
updatedMentoringContent = updatedMentoringContent.replace(
    /ClipboardList\r\n        \} from 'lucide-react';/,
    "ClipboardList, Columns\r\n        } from 'lucide-react';"
);

// update tabs array
updatedMentoringContent = updatedMentoringContent.replace(
    /\{ id: 'schooling_records', name: 'Schooling Records', icon: FileText \},/,
    "{ id: 'astp_schooling', name: 'ASTP Schooling', icon: FileText },"
);

// update active tab logic
updatedMentoringContent = updatedMentoringContent.replace(
    /\{activeTab === 'schooling_records' && <SchoolingRecordsTab profiles=\{profiles\} attendance=\{enrichedAttendance\} globalDisputes=\{globalDisputes\} \/>\}/,
    "{activeTab === 'astp_schooling' && <AstpSchoolingDashboard />}"
);

updatedMentoringContent = updatedMentoringContent.replace(
    /const attendanceTabs = \['Personal Development Seminar', 'Retreat', 'import', 'schooling_records', 'schooling_attendance'\];/,
    "const attendanceTabs = ['Personal Development Seminar', 'Retreat', 'import', 'schooling_attendance'];"
);

fs.writeFileSync(mentoringPath, updatedMentoringContent, 'utf8');
console.log("Successfully updated mentoring.html");
