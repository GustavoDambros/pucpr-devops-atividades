const express = require('express');

const { listCurrencies } = require('./rates');
const { convert } = require('./converter');
const { parseConversionInput, ValidationError } = require('./validation');

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
app.get('/api/convert', (req, res, next) => {
  try {
    const { from, to, amount } = parseConversionInput(req.query);
    res.json(convert(from, to, amount));
  } catch (error) {
    next(error);
  }
});

/**
 * Mesma conversão, com os parâmetros no corpo da requisição.
 */
app.post('/api/convert', (req, res, next) => {
  try {
    const { from, to, amount } = parseConversionInput(req.body);
    res.json(convert(from, to, amount));
  } catch (error) {
    next(error);
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.', path: req.originalUrl });
});

// Tratador de erros central. Precisa dos quatro parâmetros para o Express
// reconhecê-lo como middleware de erro, mesmo que "next" não seja usado.
// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  if (error instanceof ValidationError) {
    return res.status(error.status).json({ error: error.message });
  }

  // Corpo enviado com JSON malformado.
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Corpo da requisição não é um JSON válido.' });
  }

  console.error('Erro não tratado:', error);
  return res.status(500).json({ error: 'Erro interno do servidor.' });
});

module.exports = app;
