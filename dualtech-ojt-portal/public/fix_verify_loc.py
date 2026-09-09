path = 'c:/Users/rober/dualtech-ojt-portal/trainee-portal/src/pages/tabs/ASTPHomeTab.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_block = """                        status = await verifyLocationAndDevice(lat, lon);

                        if (status.toLowerCase().includes("blocked") || status.toLowerCase().includes("geofence")) {
                            setPendingAction(type);
                            setDisputeType('Location');
                            setDisputeReason('');
                            setDisputedLoc({ lat, lon }); // FIX: Save coordinates for the override
                            setShowDisputeModal(true);
                            setLoadingLoc(false);
                            return;
                        }

                        if (status === "UnrecognizedDevice") {
                            setPendingAction(type);
                            setLoadingLoc(false);
                            if (profile.totpSecret) { setRequireTotp(true); } else { setIsDisputed(true); }
                            return;
                        }"""

new_block = """                        // Device verification (replaces old verifyLocationAndDevice)
                        if (!isSameDevice) {
                            status = 'UnrecognizedDevice';
                            setPendingAction(type);
                            setLoadingLoc(false);
                            if (profile.totpSecret) { setRequireTotp(true); } else { setIsDisputed(true); }
                            return;
                        }"""

if old_block in content:
    content = content.replace(old_block, new_block, 1)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fix applied successfully")
else:
    print("ERROR: Block not found")
