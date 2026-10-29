const stripe = require('stripe')(process.env.STRIPE_KEY);
const { z } = require('zod');
const Schema = z.object({ decision: z.enum(['billing','technical','sales']), confidence: z.number() });
async function decide(ctx) { const raw = await fetch('https://api.typesafe.ai/v1/decide', { method: 'POST', body: JSON.stringify(ctx) }); return Schema.parse(await raw.json()); }
module.exports = { decide };
