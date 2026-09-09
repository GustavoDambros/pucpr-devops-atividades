const express = require('express');

const app = express();

app.use(express.json());

/**
 * Health check usado pelo Docker HEALTHCHECK e pelos smoke tests do pipeline.
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'conversor-de-moedas',
    uptime: Number(process.uptime().toFixed(3)),
    timestamp: new Date().toISOString(),
  });
});

module.exports = app;
