const express = require('express');

const { listCurrencies } = require('./rates');
const { convert } = require('./converter');

/** Normaliza os parâmetros vindos da query string ou do corpo da requisição. */
function normalizeInput(source = {}) {
  return {
    from: String(source.from).trim().toUpperCase(),
    to: String(source.to).trim().toUpperCase(),
    amount: Number(source.amount),
  };
}

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

/**
 * Conversão via query string: /api/convert?from=USD&to=BRL&amount=10
 */
app.get('/api/convert', (req, res) => {
  const { from, to, amount } = normalizeInput(req.query);
  res.json(convert(from, to, amount));
});

/**
 * Mesma conversão, com os parâmetros no corpo da requisição.
 */
app.post('/api/convert', (req, res) => {
  const { from, to, amount } = normalizeInput(req.body);
  res.json(convert(from, to, amount));
});

module.exports = app;
