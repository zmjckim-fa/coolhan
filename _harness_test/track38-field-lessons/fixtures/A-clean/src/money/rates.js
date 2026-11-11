const table = new Map();
module.exports = { current: () => table.get('fx'), priceOf: (sku) => { if (!table.has(sku)) throw new Error('UNKNOWN_SKU'); return table.get(sku); } };
