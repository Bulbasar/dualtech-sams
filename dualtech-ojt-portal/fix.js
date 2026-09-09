const fs = require('fs');
let content = fs.readFileSync('public/mentoring.html', 'utf8');
const anchor1 = 'setUploading(false);\r\n                }\r\n            });\r\n        }';
const anchor2 = 'setUploading(false);\n                }\n            });\n        }';

let anchor = content.includes(anchor1) ? anchor1 : (content.includes(anchor2) ? anchor2 : null);

if (anchor) {
    const idx = content.indexOf(anchor);
    const textAfter = content.substring(idx + anchor.length);
    const syncLogsIdx = textAfter.indexOf('setSyncLogs([]);');
    
    if (syncLogsIdx !== -1) {
        const fullIdx = idx + anchor.length + syncLogsIdx;
        const replaceText = `
    };

    const handleCleanupDuplicates = async () => {
        if (!window.confirm("Are you sure you want to scan and delete duplicate records? This optimized process might take a moment but won't time out.")) return;
        
        setUploading(true);
        `;
        content = content.substring(0, fullIdx) + replaceText + content.substring(fullIdx);
        fs.writeFileSync('public/mentoring.html', content);
        console.log('Fixed handleSync and handleCleanupDuplicates successfully');
    } else {
        console.log('Could not find setSyncLogs');
    }
} else {
    console.log('Could not find anchor');
}
