// A-05 and A-06: reading the seven weekday rows (T-01) and saving all seven at once.
// The week is checked by the shared input rule before anything is written, and the seven
// updates share one transaction: either the whole week is saved or no row changes.

import { checkBusinessWeek, WEEKDAY_COUNT } from '../web/input-rules.js';
import { ApiFailure } from './json-exchange.js';
import { readBusinessHours } from './public-overview.js';

/** A-05 handler. */
export function readHours({ database }) {
  return { status: 200, body: { business_hour: readBusinessHours(database) } };
}

/** A-06 handler. The answer is the week read back from the database after the save. */
export function saveHours({ database, now }, { body }) {
  const week = body.business_hour;
  const rule = checkBusinessWeek(week);
  if (!rule.ok) throw new ApiFailure(rule.code);

  const updatedAt = now().toISOString();
  database.transaction(() => {
    const update = database.prepare('UPDATE business_hour SET opens_at = ?, closes_at = ?, is_day_off = ?, updated_at = ? WHERE weekday = ?');
    let changed = 0;
    for (const { weekday, opens_at, closes_at, is_day_off } of week) {
      changed += Number(update.run(opens_at, closes_at, is_day_off, updatedAt, weekday).changes);
    }
    if (changed !== WEEKDAY_COUNT) throw new Error('business_hour does not hold one row for each weekday');
  });
  return readHours({ database });
}
