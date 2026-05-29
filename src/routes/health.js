'use strict';

/**
 * GET /api/health route (spec §2.1).
 *
 * Returns HealthStatus JSON. No request params (no query/body/header deps).
 * Headers: Cache-Control: no-store, Content-Type: application/json; charset=utf-8.
 * 200 on ok, 503 on internal health-compute failure.
 */

const express = require('express');
const { buildHealth } = require('../health');

const router = express.Router();

router.get('/api/health', (req, res) => {
  const result = buildHealth();

  // Always real-time (spec §4.3 / §2.1): never cache health.
  res.set('Cache-Control', 'no-store');
  res.type('application/json; charset=utf-8');

  // Structured request log to stdout for evidence (spec §8, appendix A).
  // No sensitive data — only status + http code + duration marker.
  // eslint-disable-next-line no-console
  console.log(
    `[health] ${new Date().toISOString()} GET /api/health -> ${result.httpStatus} status=${result.body.status} uptime=${result.body.uptime_seconds}s`
  );

  res.status(result.httpStatus).json(result.body);
});

module.exports = router;
