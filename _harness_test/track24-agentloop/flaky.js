// Passes only when the marker file exists — simulates "developer fixed the bug between iterations".
const fs = require('fs');
if (fs.existsSync(__dirname + '/fixed.marker')) { console.log('ok'); process.exit(0); }
console.error('FAIL: feature broken (marker absent)');
process.exit(1);
