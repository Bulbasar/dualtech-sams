const fs = require('fs');

const replaceInFile = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    const target = '<Lucide.MessageCircle size={20} />';
    const replacement = '<Lucide.MessageCircle size={20} className={totalUnread > 0 ? "animate-bounce text-blue-500" : ""} />';
    
    if (content.includes(target)) {
        content = content.replace(target, replacement);
        fs.writeFileSync(filePath, content);
        console.log('Added animation to ' + filePath);
    } else {
        console.log('Could not find target in ' + filePath);
    }
};

replaceInFile('c:/Users/rober/dualtech-ojt-portal/public/lfportal.html');
replaceInFile('c:/Users/rober/dualtech-ojt-portal/public/bstpadmin.html');
