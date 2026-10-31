function slugify(input) {
  const base = String(input || "").toLowerCase().trim();
  return base.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
module.exports = { slugify };
