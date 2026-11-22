// The only file that reads process.env. Every other file receives the object returned here,
// so a value is validated once and a test can run the server without touching the real environment.

import { writeSync } from 'node:fs';

export const NODE_MAJOR_REQUIRED = 24;

const DEFAULT_SHOP_TIME_ZONE = 'Asia/Seoul';
const DEFAULT_PORT = 4173;
const DEFAULT_DB_FILE = 'data/bakery.sqlite';

const ADMIN_PASSWORD_MIN_LENGTH = 12;
const ADMIN_PASSWORD_MAX_LENGTH = 200;
const SESSION_SECRET_MIN_LENGTH = 32;
const SHOP_NAME_MAX_LENGTH = 60;
const PORT_MAX = 65535;

// Reasons carry no numbers and no input, so a start-up failure can be logged anywhere.
const MISSING = 'missing';
const TOO_SHORT = 'too_short';
const INVALID_FORMAT = 'invalid_format';

/**
 * Thrown when the process cannot start with the values it was given.
 * `problems` and `message` hold variable names and reason words only, never a value.
 */
export class EnvironmentError extends Error {
  /** @param {{ name: string, reason: string }[]} problems */
  constructor(problems) {
    const lines = problems.map(({ name, reason }) => `${name} ${reason}`);
    super(['environment_not_usable', ...lines].join('\n'));
    this.name = 'EnvironmentError';
    this.problems = problems;
  }
}

/** An empty string counts as absent: an unfilled line of the example file must not pass as a value. */
function givenText(variables, name) {
  const value = variables[name];
  return typeof value === 'string' && value !== '' ? value : null;
}

/** Lengths are counted in code points, the same unit the menu name rule uses. */
function lengthProblem(value, minLength, maxLength) {
  const length = [...value].length;
  if (length < minLength) return TOO_SHORT;
  if (length > maxLength) return INVALID_FORMAT;
  return null;
}

function isTimeZoneName(name) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: name });
    return true;
  } catch (error) {
    if (error instanceof RangeError) return false;
    throw error;
  }
}

/** Digits only: Number() would also accept '0x50', '8e3' and ' 80 '. */
function parsePort(text) {
  if (!/^[0-9]{1,5}$/.test(text)) return null;
  const port = Number(text);
  return port >= 1 && port <= PORT_MAX ? port : null;
}

/**
 * Reads and validates the six variables and the Node version.
 * Every problem is collected before throwing, so one failed start names all of them.
 *
 * @param {Record<string, string | undefined>} [variables]
 * @param {string} [nodeVersion]
 * @returns {Readonly<{ adminPassword: string, sessionSecret: string, shopName: string,
 *   shopTimeZone: string, port: number, dbFile: string }>}
 * @throws {EnvironmentError}
 */
export function readEnvironment(variables = process.env, nodeVersion = process.versions.node) {
  const problems = [];
  const report = (name, reason) => {
    problems.push({ name, reason });
  };

  if (!(Number.parseInt(nodeVersion, 10) >= NODE_MAJOR_REQUIRED)) {
    report('node', `requires_version_${NODE_MAJOR_REQUIRED}_or_newer`);
  }

  const readRequired = (name, minLength, maxLength, prepare = (text) => text) => {
    const raw = givenText(variables, name);
    if (raw === null) {
      report(name, MISSING);
      return null;
    }
    const value = prepare(raw);
    const reason = lengthProblem(value, minLength, maxLength);
    if (reason !== null) {
      report(name, reason);
      return null;
    }
    return value;
  };

  const adminPassword = readRequired('ADMIN_PASSWORD', ADMIN_PASSWORD_MIN_LENGTH, ADMIN_PASSWORD_MAX_LENGTH);
  const sessionSecret = readRequired('SESSION_SECRET', SESSION_SECRET_MIN_LENGTH, Infinity);
  const shopName = readRequired('SHOP_NAME', 1, SHOP_NAME_MAX_LENGTH, (text) => text.trim());

  const shopTimeZone = givenText(variables, 'SHOP_TIME_ZONE') ?? DEFAULT_SHOP_TIME_ZONE;
  if (!isTimeZoneName(shopTimeZone)) report('SHOP_TIME_ZONE', INVALID_FORMAT);

  const portText = givenText(variables, 'PORT');
  const port = portText === null ? DEFAULT_PORT : parsePort(portText);
  if (port === null) report('PORT', INVALID_FORMAT);

  const dbFile = givenText(variables, 'DB_FILE') ?? DEFAULT_DB_FILE;

  if (problems.length > 0) throw new EnvironmentError(problems);
  return Object.freeze({ adminPassword, sessionSecret, shopName, shopTimeZone, port, dbFile });
}

/**
 * The start point's first call: returns the environment, or names what is wrong on stderr
 * and ends the process with exit code 1.
 */
export function readEnvironmentOrExit() {
  try {
    return readEnvironment();
  } catch (error) {
    if (!(error instanceof EnvironmentError)) throw error;
    // A synchronous write: process.exit() can drop a pending asynchronous write to a pipe.
    writeSync(process.stderr.fd, `${error.message}\n`);
    process.exit(1);
  }
}
