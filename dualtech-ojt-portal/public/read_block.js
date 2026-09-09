const fs = require('fs');
const file = 'c:/Users/rober/dualtech-ojt-portal/public/ic-management.html';
const content = fs.readFileSync(file, 'utf8');
const index1 = content.indexOf('// Data Fetching — single set of listeners');
const index2 = content.indexOf('const uniqueCompanies = useMemo');
const block = content.substring(index1, index2);
console.log(block);
