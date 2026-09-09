const fs = require('fs');

const lfPath = 'c:/Users/rober/dualtech-ojt-portal/public/lfportal.html';
let content = fs.readFileSync(lfPath, 'utf8');

const targetStr = '<ChatWidget currentUser={{id: lfData?.id';
const newStr = '<ChatWidget isOpen={true} currentUser={{id: lfData?.id';

if (content.includes(targetStr)) {
    content = content.replace(targetStr, newStr);
    
    // While we are here, we should remove the absolute positioning wrapper from ChatWidget in lfportal.html
    // because ChatWidget now provides its own fixed positioning `fixed z-[100] right-4 bottom-20 md:bottom-6`.
    // The wrapper is: <div className="absolute top-12 right-12 mt-2 z-[100]">
    // We should just render ChatWidget directly.
    const wrapperStart = content.indexOf('<div className="absolute top-12 right-12 mt-2 z-[100]">');
    if (wrapperStart > -1) {
        const widgetStr = content.substring(content.indexOf('<ChatWidget isOpen={true}'), content.indexOf('/>', content.indexOf('<ChatWidget')) + 2);
        const wrapperEnd = content.indexOf('</div>', wrapperStart);
        if (wrapperEnd > -1) {
            content = content.substring(0, wrapperStart) + widgetStr + content.substring(wrapperEnd + 6);
        }
    }
    
    fs.writeFileSync(lfPath, content);
    console.log('Fixed isOpen in lfportal.html');
} else {
    console.log('Could not find ChatWidget invocation');
}
