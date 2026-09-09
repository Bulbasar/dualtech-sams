const fs = require('fs');
const content = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/ic-management.html', 'utf8');
const scriptMatch = content.match(/<script type="text\/babel"[^>]*>([\s\S]*?)<\/script>/i);
if (scriptMatch) {
    fs.writeFileSync('temp_script.jsx', scriptMatch[1]);
    console.log('Extracted JSX to temp_script.jsx');
} else {
    console.log('Could not find script block');
}
