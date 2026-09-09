const fs = require('fs');

const extractComponent = (content, componentName) => {
    let startIdx = content.indexOf(`function ${componentName}(`);
    if (startIdx === -1) {
        startIdx = content.indexOf(`const ${componentName} =`);
    }
    if (startIdx === -1) return null;

    let braceCount = 0;
    let inComponent = false;
    let endIdx = -1;

    for (let i = startIdx; i < content.length; i++) {
        if (content[i] === '{') {
            braceCount++;
            inComponent = true;
        } else if (content[i] === '}') {
            braceCount--;
        }

        if (inComponent && braceCount === 0) {
            endIdx = i;
            break;
        }
    }

    if (endIdx !== -1) {
        return content.substring(startIdx, endIdx + 1);
    }
    return null;
};

const mentoringContent = fs.readFileSync('public/mentoring.html', 'utf8');
const mentoringLogin = extractComponent(mentoringContent, 'MentoringLogin');

fs.writeFileSync('mentoringLogin.js', mentoringLogin || 'NOT FOUND');
console.log('MentoringLogin extracted.');
