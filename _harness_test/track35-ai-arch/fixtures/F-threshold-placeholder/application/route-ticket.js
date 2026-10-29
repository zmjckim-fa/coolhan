const { decide } = require('../services/ai/decision.service');
module.exports = async (t) => (await decide(t)).decision;
