'use strict';

/**
 * Health Check & Status tests — 00_health_check_system.md §5.
 *
 * Runner: Node built-in (node:test) — no extra dev deps required.
 *   $ node --test __tests__/health.test.js
 *
 * Coverage:
 *   Unit (spec §5.1): uptime int>=0, ISO-8601 timestamp, non-empty version, status==="ok"
 *   Integration (spec §5.2): real HTTP 200, JSON content-type, 4-field whitelist, Cache-Control,
 *                            404 on unknown path, /status HTML page served.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const { buildHealth, getUptimeSeconds, resolveVersion } = require('../src/health');
const { createApp } = require('../src/server');

const ISO_8601_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

// --- Helpers -------------------------------------------------------------

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer(createApp());
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function request(server, pathName) {
  const { port } = server.address();
  return new Promise((resolve, reject) => {
    const req = http.get({ host: '127.0.0.1', port, path: pathName }, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () =>
        resolve({ status: res.statusCode, headers: res.headers, body: raw })
      );
    });
    req.on('error', reject);
  });
}

// --- Unit tests (spec §5.1) ---------------------------------------------

test('unit: uptime_seconds is an integer >= 0', () => {
  const u = getUptimeSeconds();
  assert.ok(Number.isInteger(u), 'uptime should be an integer');
  assert.ok(u >= 0, 'uptime should be >= 0');
});

test('unit: timestamp is valid ISO-8601 UTC', () => {
  const { body } = buildHealth();
  assert.match(body.timestamp, ISO_8601_UTC);
  assert.ok(!Number.isNaN(Date.parse(body.timestamp)), 'timestamp parses to a Date');
});

test('unit: version is a non-empty string', () => {
  const v = resolveVersion();
  assert.equal(typeof v, 'string');
  assert.ok(v.trim().length > 0, 'version should not be empty');
});

test('unit: happy path returns status === "ok" and HTTP 200', () => {
  const result = buildHealth();
  assert.equal(result.body.status, 'ok');
  assert.equal(result.httpStatus, 200);
  assert.equal(result.ok, true);
});

test('unit: response body is whitelist-fixed to exactly 4 fields', () => {
  const { body } = buildHealth();
  assert.deepEqual(
    Object.keys(body).sort(),
    ['status', 'timestamp', 'uptime_seconds', 'version']
  );
});

// --- Integration tests (spec §5.2) --------------------------------------

test('integration: GET /api/health -> 200 application/json with ok status', async () => {
  const server = await startServer();
  try {
    const res = await request(server, '/api/health');
    assert.equal(res.status, 200);
    assert.match(res.headers['content-type'], /application\/json/);
    assert.equal(res.headers['cache-control'], 'no-store');

    const json = JSON.parse(res.body);
    assert.equal(json.status, 'ok');
    assert.ok('uptime_seconds' in json);
    assert.ok('version' in json);
    assert.ok('timestamp' in json);
    assert.match(json.timestamp, ISO_8601_UTC);
  } finally {
    server.close();
  }
});

test('integration: GET /status serves HTML page', async () => {
  const server = await startServer();
  try {
    const res = await request(server, '/status');
    assert.equal(res.status, 200);
    assert.match(res.headers['content-type'], /text\/html/);
    assert.match(res.body, /System Status/);
    assert.match(res.body, /\/api\/health/);
  } finally {
    server.close();
  }
});

test('integration: unknown path returns 404', async () => {
  const server = await startServer();
  try {
    const res = await request(server, '/does-not-exist');
    assert.equal(res.status, 404);
  } finally {
    server.close();
  }
});
