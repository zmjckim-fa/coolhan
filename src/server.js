'use strict';

/**
 * App server (spec §0.1) — wires Health API + Status page.
 *
 * Routes:
 *   GET /api/health  -> JSON HealthStatus      (src/routes/health.js)
 *   GET /status      -> HTML status page        (src/pages/status.html)
 *
 * Env: PORT (listen port, default 3000), APP_VERSION (version injection).
 * No DB / external dependency (intended design, spec §10.2).
 */

const path = require('path');
const express = require('express');
const healthRouter = require('./routes/health');

function createApp() {
  const app = express();
  app.disable('x-powered-by'); // do not leak server internals (spec §4.1)

  // Health API.
  app.use(healthRouter);

  // Status page (single HTML file).
  app.get('/status', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'status.html'));
  });

  // Root convenience redirect.
  app.get('/', (req, res) => res.redirect('/status'));

  // Standard 404 (spec §9).
  app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });

  return app;
}

function start(port) {
  const listenPort = Number(port || process.env.PORT || 3000);
  const app = createApp();
  const server = app.listen(listenPort, () => {
    // Startup log to stdout for evidence (spec §8, appendix A).
    // eslint-disable-next-line no-console
    console.log(
      `[server] ${new Date().toISOString()} listening on http://localhost:${listenPort} (status: /status, health: /api/health)`
    );
  });
  return server;
}

// Start only when run directly (allows import in tests without binding a port).
if (require.main === module) {
  start();
}

module.exports = { createApp, start };
