const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const db = new DatabaseSync(__dirname + '/thereum_catalog.sqlite', { readOnly: true });
const esc = (v) => v == null ? '' : /[",\n\r]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v);
function dump(file, sql) {
  const rows = db.prepare(sql).all();
  if (!rows.length) return console.log(file, 0);
  const cols = Object.keys(rows[0]);
  fs.writeFileSync(__dirname + '/export/' + file, '\ufeff' + cols.join(',') + '\n' + rows.map((r) => cols.map((c) => esc(r[c])).join(',')).join('\n') + '\n');
  console.log(file, rows.length);
}
dump('products.csv', 'SELECT product_no, product_code, name AS 정식상품명, name_display AS 표시명_태그포함, name_site AS 사이트원래상품명, tag, fulfilment, lead_time_text, consumer_price, price, best_price, kind, grid_cols, grid_rows, panel_mode, has_color_option, min_qty, max_qty, desc_title, description, source_url FROM products ORDER BY product_no');
dump('product_categories.csv', 'SELECT pc.product_no, c.cate_no, c.name AS category FROM product_categories pc JOIN categories c ON c.cate_no=pc.cate_no ORDER BY 1,2');
dump('product_colors_sku.csv', 'SELECT c.item_code, c.product_no, p.name, c.option_value AS color_label, co.name_ko AS color, co.hex, c.lead_note, c.unit_price, c.use_stock, c.stock_number, c.is_display, c.is_selling FROM product_colors c JOIN products p ON p.product_no=c.product_no JOIN colors co ON co.color_id=c.color_id ORDER BY c.product_no, c.item_code');
dump('addon_options_displayed.csv', "SELECT pa.product_no, ap.add_product_no, ap.name AS addon_product, ap.scope, ao.item_code, ao.level1_value AS option1, ao.level2_value AS option2, ao.unit_price, ao.stock_number FROM product_addons pa JOIN addon_products ap ON ap.add_product_no=pa.add_product_no JOIN addon_options ao ON ao.add_product_no=ap.add_product_no WHERE ao.is_display='T' AND ao.is_selling='T' ORDER BY pa.product_no, ap.scope, ao.item_code");
dump('addon_options_all_incl_hidden.csv', "SELECT pa.product_no, ap.add_product_no, ao.item_code, ao.level1_value AS option1, ao.level2_value AS option2, ao.unit_price, ao.is_display, ao.is_selling, ao.stock_number FROM product_addons pa JOIN addon_products ap ON ap.add_product_no=pa.add_product_no JOIN addon_options ao ON ao.add_product_no=ap.add_product_no ORDER BY pa.product_no, ao.item_code");
dump('viewer_assets_urls.csv', 'SELECT product_no, asset_key, color_code, view_kind, url FROM viewer_assets ORDER BY product_no, asset_key');
dump('viewer_bases.csv', 'SELECT * FROM viewer_bases ORDER BY product_no, base_code');
dump('viewer_dimensions.csv', 'SELECT * FROM viewer_dimensions ORDER BY product_no, base_mode');
dump('colors.csv', 'SELECT * FROM colors ORDER BY color_id');
