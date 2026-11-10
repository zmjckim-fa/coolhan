// Local receiver (127.0.0.1 only): appends JSON lines posted by the logged-in browser page.
const http = require('http'); const fs = require('fs');
const OUT = __dirname + '/members-raw.jsonl';
let n = 0;
http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Headers', '*'); res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => { try { JSON.parse(b); fs.appendFileSync(OUT, b.replace(/\n/g, ' ') + '\n'); n++; res.writeHead(200); res.end('ok ' + n); } catch (e) { res.writeHead(400); res.end('bad'); } });
}).listen(8787, '127.0.0.1', () => console.log('listening'));
