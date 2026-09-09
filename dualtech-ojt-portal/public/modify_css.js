const fs = require('fs');
const path = 'c:/Users/rober/dualtech-ojt-portal/trainee-portal/src/index.css';
let content = fs.readFileSync(path, 'utf8');

const newCSS = `

@layer base {
  .dark input,
  .dark textarea,
  .dark select {
    @apply text-white;
  }
}
`;

content += newCSS;
fs.writeFileSync(path, content);
console.log('index.css modified successfully!');
