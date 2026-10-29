const OpenAI = require('openai');
module.exports = async (p) => (await new OpenAI().chat.completions.create({ messages: [p] })).choices[0].message.content;
