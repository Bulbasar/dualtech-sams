path = 'c:/Users/rober/dualtech-ojt-portal/trainee-portal/src/pages/tabs/ASTPSchoolingTab.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_submit = """                    const [compressedVfl, compressedLsce, compressedDr] = await Promise.all([
                        compressImage(vflFile),
                        compressImage(lsceFile),
                        compressImage(drEntryFile)
                    ]);

                    const [vflBase64, lsceBase64, drBase64] = await Promise.all([
                        fileToBase64(compressedVfl),
                        fileToBase64(compressedLsce),
                        fileToBase64(compressedDr)
                    ]);"""

new_submit = """                    // compressImage returns a data URL string, so extract base64 directly
                    const [compressedVfl, compressedLsce, compressedDr] = await Promise.all([
                        compressImage(vflFile),
                        compressImage(lsceFile),
                        compressImage(drEntryFile)
                    ]);

                    const vflBase64 = compressedVfl.split(',')[1];
                    const lsceBase64 = compressedLsce.split(',')[1];
                    const drBase64 = compressedDr.split(',')[1];"""

if old_submit in content:
    content = content.replace(old_submit, new_submit, 1)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fix applied successfully")
else:
    print("ERROR: Block not found")
