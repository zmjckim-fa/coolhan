// Opens the SQLite file and brings it to the schema this code knows.
// This file never reads a clock: every time it compares comes from the `now` it was given,
// so a test decides what "expired" means.

import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export const SCHEMA_VERSION = 1;

const LOGIN_ATTEMPT_RETENTION_MS = 24 * 60 * 60 * 1000;
const SQL_FOLDER = path.join(import.meta.dirname, '..', 'db');

/** Thrown for a file whose schema number is neither new (0) nor the one this code knows. */
export class SchemaVersionError extends Error {
  /**
   * @param {number} fileVersion
   * @param {number} knownVersion
   */
  constructor(fileVersion, knownVersion) {
    super(`database schema version ${fileVersion} cannot be opened: this code knows version ${knownVersion}`);
    this.name = 'SchemaVersionError';
    this.fileVersion = fileVersion;
    this.knownVersion = knownVersion;
  }
}

function readSchemaVersion(connection) {
  return connection.prepare('PRAGMA user_version').get().user_version;
}

/**
 * Runs `work` inside one BEGIN IMMEDIATE transaction: all of its writes land, or none do.
 * `work` must be synchronous. A promise would let COMMIT run before its writes.
 */
function runInTransaction(connection, work) {
  if (connection.isTransaction) throw new Error('transaction_already_open');
  connection.exec('BEGIN IMMEDIATE');
  try {
    const result = work();
    if (result !== null && typeof result === 'object' && typeof result.then === 'function') {
      throw new TypeError('transaction_work_not_synchronous');
    }
    connection.exec('COMMIT');
    return result;
  } catch (error) {
    // SQLite has already rolled back on some failures; a second ROLLBACK would hide the first error.
    if (connection.isTransaction) connection.exec('ROLLBACK');
    throw error;
  }
}

function createSchema(connection) {
  const schemaSql = readFileSync(path.join(SQL_FOLDER, 'schema.sql'), 'utf8');
  const seedSql = readFileSync(path.join(SQL_FOLDER, 'seed.sql'), 'utf8');
  runInTransaction(connection, () => {
    connection.exec(schemaSql);
    connection.exec(seedSql);
    // PRAGMA takes no bound value, so the number is written in the statement.
    // The read-back keeps this line and SCHEMA_VERSION from drifting apart unnoticed.
    connection.exec('PRAGMA user_version = 1');
    if (readSchemaVersion(connection) !== SCHEMA_VERSION) {
      throw new Error('the user_version statement and SCHEMA_VERSION disagree');
    }
  });
}

function removeExpiredRows(connection, now) {
  const at = now();
  if (!(at instanceof Date) || Number.isNaN(at.getTime())) {
    throw new TypeError('clock_returned_no_date');
  }
  const attemptLimit = new Date(at.getTime() - LOGIN_ATTEMPT_RETENTION_MS);
  runInTransaction(connection, () => {
    connection.prepare('DELETE FROM admin_session WHERE expires_at <= ?').run(at.toISOString());
    connection.prepare('DELETE FROM login_attempt WHERE attempted_at < ?').run(attemptLimit.toISOString());
  });
}

/**
 * Opens `dbFile`, creating its folder, schema and seven weekday rows when the file is new,
 * then removes expired sessions and login attempts past their retention, measured from `now()`.
 * A file with an unknown schema number is left untouched and closed.
 *
 * @param {{ dbFile: string, now: () => Date }} options
 * @returns {Readonly<{
 *   prepare: (sql: string) => import('node:sqlite').StatementSync,
 *   transaction: <T>(work: () => T) => T,
 *   removeExpiredRows: () => void,
 *   close: () => void,
 * }>}
 * @throws {SchemaVersionError}
 */
export function openDatabase({ dbFile, now }) {
  if (typeof dbFile !== 'string' || dbFile === '') throw new TypeError('dbFile must be a file path');
  if (typeof now !== 'function') throw new TypeError('clock_not_a_function');

  mkdirSync(path.dirname(dbFile), { recursive: true });
  const connection = new DatabaseSync(dbFile);
  try {
    const fileVersion = readSchemaVersion(connection);
    if (fileVersion === 0) createSchema(connection);
    else if (fileVersion !== SCHEMA_VERSION) throw new SchemaVersionError(fileVersion, SCHEMA_VERSION);
    removeExpiredRows(connection, now);
  } catch (error) {
    connection.close();
    throw error;
  }

  return Object.freeze({
    prepare: (sql) => connection.prepare(sql),
    transaction: (work) => runInTransaction(connection, work),
    removeExpiredRows: () => removeExpiredRows(connection, now),
    close: () => connection.close(),
  });
}
