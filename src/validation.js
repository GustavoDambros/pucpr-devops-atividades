const { isSupported, supportedCodes } = require('./rates');

/** Teto arbitrário, só para evitar respostas com notação científica. */
const MAX_AMOUNT = 1e12;

/** Erro de entrada do cliente: vira HTTP 400 no tratador central. */
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }
}

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

function parseCurrency(raw, field) {
  if (isBlank(raw)) {
    throw new ValidationError(`O parâmetro "${field}" é obrigatório.`);
  }

  const code = String(raw).trim().toUpperCase();

  if (!isSupported(code)) {
    throw new ValidationError(
      `Moeda "${code}" não suportada. Moedas disponíveis: ${supportedCodes().join(', ')}.`,
    );
  }

  return code;
}

function parseAmount(raw) {
  if (isBlank(raw)) {
    throw new ValidationError('O parâmetro "amount" é obrigatório.');
  }

  const amount = Number(raw);

  if (!Number.isFinite(amount)) {
    throw new ValidationError(`O parâmetro "amount" precisa ser um número. Recebido: "${raw}".`);
  }
  if (amount < 0) {
    throw new ValidationError('O parâmetro "amount" não pode ser negativo.');
  }
  if (amount > MAX_AMOUNT) {
    throw new ValidationError(`O parâmetro "amount" não pode ser maior que ${MAX_AMOUNT}.`);
  }

  return amount;
}

/**
 * Valida e normaliza os parâmetros de conversão, venham eles da query string
 * ou do corpo da requisição. Lança ValidationError na primeira inconsistência.
 */
function parseConversionInput(source = {}) {
  return {
    from: parseCurrency(source.from, 'from'),
    to: parseCurrency(source.to, 'to'),
    amount: parseAmount(source.amount),
  };
}

module.exports = { ValidationError, parseConversionInput, MAX_AMOUNT };
