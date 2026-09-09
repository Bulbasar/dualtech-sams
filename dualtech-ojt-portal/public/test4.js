const fs = require('fs'); 
const content = fs.readFileSync('trainee-v2.html', 'utf8'); 
const linesArray = content.split('\n'); 
let start = 0; 
for(let i=0; i<4680; i++) start += linesArray[i].length + 1; 
const end = content.indexOf('function MessageBubble'); 
const code = content.substring(start, end); 

let stack = []; 
let inString = false; 
let stringChar = ''; 
let line = 4681; 

for(let i = 0; i < code.length; i++) { 
    let c = code[i]; 
    if(c === '\n') line++; 

    if(inString) { 
        if(c === stringChar && code[i-1] !== '\\') inString = false; 
    } else { 
        if(c === '"' || c === "'" || c === '`') { 
            inString = true; 
            stringChar = c; 
        } else if(c === '{' || c === '(' || c === '[') { 
            stack.push({char: c, line: line, pos: i}); 
        } else if(c === '}' || c === ')' || c === ']') { 
            if(stack.length === 0) { 
                console.log('Oops ' + c + ' at line ' + line); 
                continue; 
            } 
            let last = stack.pop(); 
            if((c === '}' && last.char !== '{') || (c === ')' && last.char !== '(') || (c === ']' && last.char !== '[')) { 
                console.log('Mismatched ' + c + ' at line ' + line + ' (expected closing for ' + last.char + ' from line ' + last.line + ') near ' + code.substring(Math.max(0, i-20), i+20)); 
                continue; 
            } 
        } 
    } 
} 
console.log('Remaining unclosed: ', stack.slice(-5));
