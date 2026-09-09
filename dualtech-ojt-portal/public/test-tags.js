const fs = require('fs');
const htmlparser2 = require('htmlparser2');

const content = fs.readFileSync('trainee-v2.html', 'utf8');
const linesArray = content.split('\n');
let start = 0;
for(let i=0; i<4680; i++) start += linesArray[i].length + 1;
const end = content.indexOf('function MessageBubble');
const code = content.substring(start, end);

let stack = [];
let lines = code.split('\n');
let offset = 4681; // line offset for output

const parser = new htmlparser2.Parser({
    onopentag(name, attribs) {
        stack.push({name, line: parser.startIndex}); // We'll map startIndex to line manually later if needed
    },
    onclosetag(name) {
        if(stack.length === 0) {
            console.log('Extra closing tag: ' + name);
        } else {
            const last = stack.pop();
            if(last.name !== name) {
                console.log('Mismatched tag: expected ' + last.name + ' but got ' + name);
            }
        }
    }
}, {xmlMode: true}); // xmlMode handles self-closing tags like <div />

parser.write(code);
parser.end();

if (stack.length > 0) {
    console.log('Unclosed tags remaining:', stack.map(s => s.name));
} else {
    console.log('All tags are perfectly closed!');
}
