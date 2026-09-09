const fs = require('fs');
const path = 'c:/Users/rober/dualtech-ojt-portal/trainee-portal/src/pages/tabs/BSTPHomeTab.jsx';
let content = fs.readFileSync(path, 'utf8');

const clockInCheckRegex = /\} else if \(profile\.deviceId !== navigator\.userAgent\) \{\s*alert\("Unrecognized Device\. You are not allowed to clock in\/out using this device\. Please use your registered device\."\);\s*return;\s*\}/;

const newClockInCheck = `} else if (profile.deviceId !== navigator.userAgent) {
                const getHardwareSignature = (ua) => {
                    if (/iPhone|iPad|iPod/i.test(ua)) return "Apple Mobile Device";
                    const androidMatch = ua.match(/Android[^;]*;([^)]+)/);
                    if (androidMatch) return androidMatch[1].replace(/wv/ig, '').trim();
                    return ua.split(' ')[0];
                };
                
                const trustedList = profile.trustedDevices || [];
                const currentHardware = getHardwareSignature(navigator.userAgent);
                const isTrusted = trustedList.some(trusted => getHardwareSignature(trusted) === currentHardware);
                
                if (!isTrusted) {
                    alert("Unrecognized Device. You are not allowed to clock in/out using this device. Please use your registered device.");
                    return;
                }
            }`;

content = content.replace(clockInCheckRegex, newClockInCheck);

const uiWarningRegex = /\{\/\* DEVICE RECOGNITION WARNING \*\/\}\s*\{profile\?\.deviceId && profile\.deviceId !== navigator\.userAgent && \(/;

const newUiWarning = `{/* DEVICE RECOGNITION WARNING */}
            {profile?.deviceId && profile.deviceId !== navigator.userAgent && 
             !(profile.trustedDevices || []).some(trusted => {
                 const getHardwareSignature = (ua) => {
                     if (/iPhone|iPad|iPod/i.test(ua)) return "Apple Mobile Device";
                     const androidMatch = ua.match(/Android[^;]*;([^)]+)/);
                     if (androidMatch) return androidMatch[1].replace(/wv/ig, '').trim();
                     return ua.split(' ')[0];
                 };
                 return getHardwareSignature(trusted) === getHardwareSignature(navigator.userAgent);
             }) && (`;

content = content.replace(uiWarningRegex, newUiWarning);

fs.writeFileSync(path, content);
console.log('BSTPHomeTab.jsx modified successfully!');
