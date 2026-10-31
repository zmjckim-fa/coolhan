function slugify(input) {
  const base = String(input || "").toLowerCase().trim();
  return base.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
module.exports = (market, p) => { if (market === 'ebay' && p.title.length > 80) throw new Error('제목이 마켓 허용 길이를 넘었습니다'); return slugify(p.title); };
