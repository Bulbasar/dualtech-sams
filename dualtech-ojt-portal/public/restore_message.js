const fs = require('fs');
const path = require('path');

const icPath = path.join(__dirname, 'ic-portal.html');
const mentoringPath = path.join(__dirname, 'mentoring.html');

let icContent = fs.readFileSync(icPath, 'utf8');
let mentoringContent = fs.readFileSync(mentoringPath, 'utf8');

const startIndex = icContent.indexOf('function MessageBubble({ userType, user, profile, showToast }) {');
const endIndexStr = '\nfunction App() {';
const endIndex = icContent.indexOf(endIndexStr, startIndex);

let messageBubbleComponent = icContent.substring(startIndex, endIndex);

const injectionPoint = 'function GlobalLackingNotification() {';
const injectionIndex = mentoringContent.indexOf(injectionPoint);

if (startIndex !== -1 && endIndex !== -1 && injectionIndex !== -1) {
    let newMentoringContent = mentoringContent.substring(0, injectionIndex) +
        messageBubbleComponent + '\n\n' +
        mentoringContent.substring(injectionIndex);
        
    fs.writeFileSync(mentoringPath, newMentoringContent, 'utf8');
    console.log("Successfully restored MessageBubble.");
} else {
    console.log("Failed to find boundaries.", { startIndex, endIndex, injectionIndex });
}
