const express = require('express');

const { listCurrencies } = require('./rates');

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

/**
 * Catálogo de moedas suportadas pela API.
 */
app.get('/api/currencies', (req, res) => {
  const currencies = listCurrencies();
  res.json({ total: currencies.length, currencies });
});

module.exports = app;
