const jwt = require('jsonwebtoken');
module.exports = (token) => jwt.decode(token);
module.exports.debugOpen = process.env.NODE_ENV !== 'production';
