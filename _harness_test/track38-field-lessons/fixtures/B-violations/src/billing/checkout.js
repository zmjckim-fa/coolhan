module.exports = async (req, res) => {
  const total = req.body.amount;            // client-sent amount trusted
  const fx = settings.exchangeRate || 1500;  // numeric fallback
  const vat = (total * 0.19).toFixed(2);     // ad-hoc rounding
  await ledger.insert({ total, vat }).catch(() => {});   // swallowed write error
  res.json({ ok: true });
};
