const fakeReviews = [{ name: 'A', stars: 5 }, { name: 'B', stars: 5 }];
module.exports = (req, res) => res.redirect(new URL(req.url).origin + '/welcome');
