const fs = require('fs');

const replacementEffect = `    useEffect(() => {
        if (!currentUser?.id) return;
        if (currentUser.role !== 'BSTP' && currentUser.role !== 'LF') return;
        
        const fetchContacts = async () => {
            const newContacts = [];
            if (currentUser.role === 'BSTP') {
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

                if (currentUser.adviserInitial) {
                    try {
                        const lfQ = query(collection(db, "bstpUsers"), where("initials", "==", currentUser.adviserInitial));
                        const lfSnap = await getDocs(lfQ);
                        lfSnap.forEach(d => {
                            const data = d.data();
                            newContacts.push({
                                id: d.id,
                                name: data.name || 'LF ' + data.initials,
                                role: "LF",
                                photoUrl: null
                            });
                        });
                    } catch(e) { console.error(e); }
                }
            } else if (currentUser.role === 'LF' && currentUser.initials) {
                try {
                    const traineesQ = query(
                        collection(db, "artifacts", "dualtech-ojt-portal", "public", "data", "trainees"),
                        where("adviser", "==", currentUser.initials)
                    );
                    const snap = await getDocs(traineesQ);
                    snap.forEach(d => {
                        const data = d.data();
                        const bstpStatus = (data.bstp_status || "").toLowerCase();
                        if (["active", "pre-bstp", "post-bstp"].includes(bstpStatus)) {
                            newContacts.push({
                                id: data.studentId || d.id,
                                name: data.Name || data.name || "Trainee",
                                role: "BSTP",
                                section: data.section || data.Section || "",
                                bstp_status: data.bstp_status,
                                photoUrl: data.profilePhotoUrl || null
                            });
                        }
                    });
                } catch (e) { console.error(e); }
            }
            setContacts(newContacts);
        };
        fetchContacts();
    }, [currentUser, db]);`;

function applyFix(file) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Find the useEffect for fetchContacts
    const startMarker = 'useEffect(() => {\n        if (!currentUser?.id || currentUser.role !== \\\'BSTP\\\') return;\n        const fetchContacts = async () => {';
    // Let's use regex to find the block
    const effectRegex = /useEffect\(\(\) => \{\s*if \(!currentUser\?\.id \|\| currentUser\.role !== 'BSTP'\) return;[\s\S]*?fetchContacts\(\);\s*\}, \[currentUser, db\]\);/;
    
    if (effectRegex.test(content)) {
        content = content.replace(effectRegex, replacementEffect);
        
        // Also we need to show Contacts section for LF
        // Currently it says: {currentUser.role === 'BSTP' && (
        const uiRegex = /\{currentUser\.role === 'BSTP' && \(/g;
        // There are multiple places. We only want the Contacts one!
        // The contacts one looks like:
        // {currentUser.role === 'BSTP' && (
        //   <div className="border-t border-slate-100 dark:border-slate-800">
        //      <div className="px-3 py-2 ...>Contacts</div>
        const contactsUIRegex = /\{currentUser\.role === 'BSTP' && \(\s*<div className="border-t border-slate-100 dark:border-slate-800">\s*<div className="px-3 py-2 bg-slate-50 dark:bg-slate-800\/50 text-xs font-bold text-slate-500 uppercase tracking-wider">Contacts<\/div>/;
        
        if (contactsUIRegex.test(content)) {
            content = content.replace(contactsUIRegex, `{(currentUser.role === 'BSTP' || currentUser.role === 'LF') && (
                                <div className="border-t border-slate-100 dark:border-slate-800">
                                    <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 text-xs font-bold text-slate-500 uppercase tracking-wider">Contacts</div>`);
        }
        
        // Also update the display of the contact to include section and bstp_status if role === LF
        // Currently it says: <div className="text-[10px] text-slate-500">{c.role === 'ADMIN' ? 'Admin' : 'Adviser'}</div>
        // Let's replace that rendering.
        const roleRenderRegex = /<div className="text-\[10px\] text-slate-500">\{c\.role === 'ADMIN' \? 'Admin' : 'Adviser'\}<\/div>/;
        if (roleRenderRegex.test(content)) {
            content = content.replace(roleRenderRegex, `<div className="text-[10px] text-slate-500 flex items-center gap-1">
                                                    {c.role === 'ADMIN' ? 'Admin' : c.role === 'LF' ? 'Adviser' : (
                                                        <>
                                                            <span className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">{c.section || 'No Section'}</span>
                                                            <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">{c.bstp_status || 'Unknown'}</span>
                                                        </>
                                                    )}
                                                </div>`);
        }

        fs.writeFileSync(file, content);
        console.log('Fixed ' + file);
    } else {
        console.log('Could not find fetchContacts effect in ' + file);
    }
}

applyFix('c:/Users/rober/dualtech-ojt-portal/trainee-portal/src/components/ChatWidget.jsx');
applyFix('c:/Users/rober/dualtech-ojt-portal/public/lfportal.html');
applyFix('c:/Users/rober/dualtech-ojt-portal/public/bstpadmin.html');
