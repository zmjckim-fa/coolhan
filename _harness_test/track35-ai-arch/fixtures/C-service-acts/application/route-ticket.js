const { decide } = require('../services/ai/decision.service');
const AUTO_THRESHOLD = 0.9;
async function route(ticket) { const r = await decide(ticket); if (r.confidence >= AUTO_THRESHOLD) return assign(r.decision); return review(r); }
function assign(q) { return q; } function review(r) { return r; } module.exports = { route };
