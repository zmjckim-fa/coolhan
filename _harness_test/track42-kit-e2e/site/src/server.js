// Start point. Opens the database, reads the web folder, and serves HTTP on 127.0.0.1.
// Tests call startServer(settings) with their own environment, clock and log sinks.
// Run directly (node src/server.js), it reads the environment first and exits with code 1 on a bad value.

import { writeSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { createPasswordCheck } from './admin-login.js';
import { createAdminSessions } from './admin-session.js';
import { openDatabase, SchemaVersionError } from './database.js';
import { readEnvironmentOrExit } from './environment.js';
import { sendError } from './json-exchange.js';
import { createRouter, pathOf } from './route-table.js';
import { loadStaticFiles } from './static-file.js';

const LISTEN_HOST = '127.0.0.1';
const HEADERS_TIMEOUT_MS = 5000;
const REQUEST_TIMEOUT_MS = 10000;
const DEFAULT_WEB_ROOT = path.join(import.meta.dirname, '..', 'web');

function listen(server, port) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, LISTEN_HOST, () => {
      server.off('error', reject);
      resolve();
    });
  });
}

/**
 * @param {{
 *   environment: ReturnType<typeof import('./environment.js').readEnvironment>,
 *   webRoot?: string,
 *   now?: () => Date,
 *   writeLog?: (line: string) => void,
 *   writeError?: (line: string) => void,
 * }} settings
 * @returns {Promise<{ port: number, close: () => Promise<void> }>} `port` is the port actually opened.
 */
export async function startServer({
  environment,
  webRoot = DEFAULT_WEB_ROOT,
  now = () => new Date(),
  writeLog = (line) => process.stdout.write(`${line}\n`),
  writeError = (line) => process.stderr.write(`${line}\n`),
} = {}) {
  if (environment === null || typeof environment !== 'object') throw new TypeError('startServer needs an environment');

  const database = openDatabase({ dbFile: environment.dbFile, now });
  let server;
  try {
    const staticFiles = loadStaticFiles({ webRoot, shopName: environment.shopName });
    const sessions = createAdminSessions({ environment, database, now });
    const passwordMatches = await createPasswordCheck(environment.adminPassword);
    const app = Object.freeze({ database, environment, now, sessions, passwordMatches });
    const route = createRouter({ staticFiles, sessions, app, writeError, now });

    server = http.createServer((request, response) => {
      const receivedAt = now();
      const startedAt = performance.now();
      // One line per request: time, method, path without the query, status, duration. Nothing else.
      response.once('finish', () => {
        const elapsedMs = Math.round(performance.now() - startedAt);
        writeLog(`${receivedAt.toISOString()} ${request.method} ${pathOf(request.url)} ${response.statusCode} ${elapsedMs}ms`);
      });
      route(request, response).catch((error) => {
        writeError(`${receivedAt.toISOString()} ${request.method} ${pathOf(request.url)} ${error instanceof Error ? error.stack : String(error)}`);
        if (response.headersSent) response.destroy();
        else sendError(response, 'server_error');
      });
    });
    server.headersTimeout = HEADERS_TIMEOUT_MS;
    server.requestTimeout = REQUEST_TIMEOUT_MS;
    await listen(server, environment.port);
  } catch (error) {
    database.close();
    throw error;
  }

  let closing = null;
  const close = () => {
    closing ??= new Promise((resolve, reject) => {
      server.close((error) => {
        try {
          database.close();
        } catch (closeError) {
          reject(closeError);
          return;
        }
        if (error) reject(error);
        else resolve();
      });
      server.closeAllConnections();
    });
    return closing;
  };

  return { port: server.address().port, close };
}

/** Names what stopped the start without printing a value. Unknown failures keep their own report. */
function startFailureLine(error) {
  if (error instanceof SchemaVersionError) return `cannot start: ${error.message}`;
  if (error !== null && typeof error === 'object' && error.code === 'EADDRINUSE') return 'cannot start: PORT in_use';
  return null;
}

async function runFromCommandLine() {
  const environment = readEnvironmentOrExit();
  let running;
  try {
    running = await startServer({ environment });
  } catch (error) {
    const line = startFailureLine(error);
    if (line === null) throw error;
    writeSync(process.stderr.fd, `${line}\n`);
    process.exit(1);
  }
  process.stdout.write(`listening on http://${LISTEN_HOST}:${running.port}\n`);
  const stop = () => {
    running.close().then(() => process.exit(0), () => process.exit(1));
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runFromCommandLine();
}
