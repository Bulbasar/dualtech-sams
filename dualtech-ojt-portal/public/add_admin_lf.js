const fs = require('fs');

const lfPath = 'c:/Users/rober/dualtech-ojt-portal/public/lfportal.html';
let content = fs.readFileSync(lfPath, 'utf8');

// We want to add Admin fetching to the LF role in fetchContacts.
// The current code has:
/*
            } else if (currentUser.role === 'LF' && currentUser.initials) {
                try {
                    const traineesQ = query(
*/
// We'll replace the start of the LF block to ALSO fetch admins.

const targetStr = `            } else if (currentUser.role === 'LF' && currentUser.initials) {
                try {
                    const traineesQ = query(`;

const replacementStr = `            } else if (currentUser.role === 'LF' && currentUser.initials) {
                try {
                    const adminQ = query(collection(db, "admins"), where("allowedPortals", "array-contains", "bstp_admin_portal"));
                    const adminSnap = await getDocs(adminQ);
                    adminSnap.forEach(d => {
                        const data = d.data();
                        newContacts.push({
                            id: d.id,
                            name: data.name || "BSTP Admin",
                            role: "ADMIN",
                            photoUrl: null
                        });
                    });
                } catch(e) { console.error(e); }
                try {
                    const traineesQ = query(`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    fs.writeFileSync(lfPath, content);
    console.log('Fixed LF fetching admins in lfportal.html');
} else {
    console.log('Could not find target string in lfportal.html');
}
