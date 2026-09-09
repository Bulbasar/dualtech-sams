const fs = require('fs'); 
const content = fs.readFileSync('trainee-v2.html', 'utf8'); 
const start = content.indexOf('return (', content.indexOf('function Dashboard')); 
const end = content.indexOf('function MessageBubble'); 
const code = content.substring(start, end); 

let stack = []; 
let inString = false; 
let stringChar = ''; 
let line = 4681; 

for(let i = 0; i < code.length; i++) { 
    let c = code[i]; 
    if(c === '\n') line++; 
    
    // Ignore regex literals roughly
    if (c === '/' && !inString && code[i-1] !== '<' && code[i+1] !== '/' && code[i+1] !== '>') {
        // very rough skip for regex, let's just not do this and hope regex doesn't contain unbalanced parens
    }

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
                console.log('Extra closing ' + c + ' at line ' + line); 
                break; 
            } 
            let last = stack.pop(); 
            if((c === '}' && last.char !== '{') || (c === ')' && last.char !== '(') || (c === ']' && last.char !== '[')) { 
                console.log('Mismatched ' + c + ' at line ' + line + ' (expected closing for ' + last.char + ' from line ' + last.line + ') near ' + code.substring(Math.max(0, i-20), i+20)); 
                break; 
            } 
        } 
    } 
} 
console.log('Remaining unclosed: ', stack.slice(-5));
