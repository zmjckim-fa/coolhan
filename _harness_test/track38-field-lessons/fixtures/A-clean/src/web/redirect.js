const { PUBLIC_ORIGIN } = require('../settings');
module.exports = (res, p) => res.redirect(PUBLIC_ORIGIN + p);
