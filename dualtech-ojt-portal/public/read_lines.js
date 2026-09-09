const fs = require('fs');
const content = fs.readFileSync('temp_script.jsx', 'utf8');
const lines = content.split('\n');
for(let i = 180; i < 200; i++) {
    console.log((i+1) + ': ' + lines[i]);
}
