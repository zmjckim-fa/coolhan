const Anthropic = require('@anthropic-ai/sdk');
module.exports = async (o) => (await new Anthropic().messages.create({ messages: [o] })).content;
