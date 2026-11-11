const { round2 } = require('../money/round');
const RATES = require('../money/rates');
module.exports = function quote(items) {
  const rate = RATES.current();
  if (rate === undefined) throw new Error('RATE_UNAVAILABLE');
  return round2(items.reduce((sum, it) => sum + it.qty * RATES.priceOf(it.sku), 0) * rate);
};
