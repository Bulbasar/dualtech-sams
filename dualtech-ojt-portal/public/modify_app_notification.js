const fs = require('fs');
const path = 'c:/Users/rober/dualtech-ojt-portal/trainee-portal/src/App.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Update imports
content = content.replace(
    'import { doc, getDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";',
    'import { doc, getDoc, collection, query, where, getDocs, updateDoc, addDoc } from "firebase/firestore";'
);

// 2. Add state
content = content.replace(
    'const [traineeDocId, setTraineeDocId] = useState(null);',
    'const [traineeDocId, setTraineeDocId] = useState(null);\n  const [traineeData, setTraineeData] = useState(null);'
);

// 3. Update data setting in query branch
content = content.replace(
    'setStatus(data.Status || data.status || "UNKNOWN");\n             \n             if (!data.registeredAt',
    'setStatus(data.Status || data.status || "UNKNOWN");\n             setTraineeData(data);\n             \n             if (!data.registeredAt'
);

// 4. Update data setting in doc branch
content = content.replace(
    'setStatus(data.Status || data.status || "UNKNOWN");\n                \n                if (!data.registeredAt',
    'setStatus(data.Status || data.status || "UNKNOWN");\n                setTraineeData(data);\n                \n                if (!data.registeredAt'
);

// 5. Update submitRegDate
const oldSubmit = `  const submitRegDate = async () => {
    if (!regDate) return;
    setIsSubmittingRegDate(true);
    try {
        const appId = "dualtech-ojt-portal";
        const traineeRef = doc(primaryDb, "artifacts", appId, "public", "data", "trainees", traineeDocId);
        // Save as ISO string from start of day
        const isoDate = new Date(regDate).toISOString();
        await updateDoc(traineeRef, { registeredAt: isoDate });
        setShowRegPrompt(false);
    } catch (err) {`;

const newSubmit = `  const submitRegDate = async () => {
    if (!regDate) return;
    setIsSubmittingRegDate(true);
    try {
        const appId = "dualtech-ojt-portal";
        const traineeRef = doc(primaryDb, "artifacts", appId, "public", "data", "trainees", traineeDocId);
        // Save as ISO string from start of day
        const isoDate = new Date(regDate).toISOString();
        await updateDoc(traineeRef, { registeredAt: isoDate });
        setShowRegPrompt(false);
        
        if (level === "BSTP" || status === "BSTP") {
            const fullName = traineeData?.Name || traineeData?.name || "Unknown Name";
            const studNo = traineeData?.studentId || traineeData?.['Student ID#'] || traineeData?.['Student ID'] || "Unknown ID";
            const section = traineeData?.Section || traineeData?.section || "Unknown Section";
            
            await addDoc(collection(primaryDb, "bstpNotifications"), {
                title: "New BSTP Registration",
                message: \`\${fullName} (\${studNo}) from section \${section} has completed their portal registration.\`,
                timestamp: new Date(),
                targetGroup: "ADMIN",
                type: "info"
            });
        }
    } catch (err) {`;

content = content.replace(oldSubmit, newSubmit);

fs.writeFileSync(path, content);
console.log('App.jsx modified successfully!');
