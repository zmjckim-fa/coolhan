// Simulates one real headless CoolHan session: completes exactly one todo unit per invocation.
const fs = require('fs');
const p = process.env.NS_WS + '/_backlog.md';
let md = fs.readFileSync(p, 'utf8');
md = md.replace('| todo |', '| done ✅ |'); // first todo → done (verification cell already named)
fs.writeFileSync(p, md);
console.log('fake session: completed one unit');
