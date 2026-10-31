const { slugify } = require('../lib/text');
const { t } = require('../i18n/ko');
module.exports = (market, p) => p.title.length > market.maxTitle ? { error: t('export.titleTooLong') } : { slug: slugify(p.title) };
