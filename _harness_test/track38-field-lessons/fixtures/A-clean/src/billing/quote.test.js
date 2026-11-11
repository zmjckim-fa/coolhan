const quote = require('./quote');
test('quote throws without a rate', () => { expect(() => quote([])).toThrow(); });
