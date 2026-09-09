const fs = require('fs');
const content = fs.readFileSync('c:/Users/rober/dualtech-ojt-portal/public/trainee.html', 'utf8');
const scriptMatch = content.match(/<script type="text\/babel" data-type="module">([\s\S]*?)<\/script>/);
if (scriptMatch) {
  let code = scriptMatch[1];
  
  // Strip block comments
  code = code.replace(/\/\*[\s\S]*?\*\//g, '');
  // Strip line comments
  code = code.replace(/\/\/.*/g, '');
  // Strip strings (basic)
  code = code.replace(/"(\\.|[^"])*"/g, '""');
  code = code.replace(/'(\\.|[^'])*'/g, "''");
  code = code.replace(/`(\\.|[^`])*`/g, '``');
  
  let brackets = 0;
  let lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    for (let char of lines[i]) {
      if (char === '{') brackets++;
      if (char === '}') brackets--;
    }
    if (lines[i].includes('function App')) console.log('App start count:', brackets);
    if (lines[i].includes('function Dashboard')) console.log('Dashboard start count:', brackets);
    if (lines[i].includes('function MessageBubble')) console.log('MessageBubble start count:', brackets);
  }
  console.log('Final unclosed braces:', brackets);
}
