const fs = require('fs');
const content = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/trainee.html', 'utf8');
const scriptMatch = content.match(/<script type="text\/babel" data-type="module">([\s\S]*?)<\/script>/);
if (scriptMatch) {
  let code = scriptMatch[1];
  
  // Mask strings and comments with spaces so line lengths and counts remain the same
  code = code.replace(/\/\*[\s\S]*?\*\//g, match => ' '.repeat(match.length));
  code = code.replace(/\/\/.*/g, match => ' '.repeat(match.length));
  code = code.replace(/"(\\.|[^"])*"/g, match => ' '.repeat(match.length));
  code = code.replace(/'(\\.|[^'])*'/g, match => ' '.repeat(match.length));
  code = code.replace(/`(\\.|[^`])*`/g, match => ' '.repeat(match.length));
  
  let stack = [];
  let lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    for (let char of lines[i]) {
      if (char === '{') stack.push(i + 1 + 107); // 107 is the offset for the script tag
      if (char === '}') {
        if (stack.length > 0) stack.pop();
        else console.log('Unmatched } at line', i + 1 + 107);
      }
    }
  }
  console.log('Unclosed { at lines:', stack);
}
