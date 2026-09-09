const { RATES_PER_USD } = require('./rates');

const RATE_PRECISION = 6;
const AMOUNT_PRECISION = 2;

/** Arredonda para um número fixo de casas decimais, evitando dízimas binárias. */
function round(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Taxa de conversão entre duas moedas.
 *
 * Como todas as taxas da tabela são relativas ao dólar, converter de A para B
 * é simplesmente a razão entre as duas taxas — o USD funciona como pivô.
 */
function rateBetween(from, to) {
  return RATES_PER_USD[to] / RATES_PER_USD[from];
}

/**
 * Converte um valor entre duas moedas já validadas.
 *
 * Função pura: não conhece HTTP nem valida entrada, o que a torna trivial de
 * testar isoladamente.
 */
function convert(from, to, amount) {
  const rate = rateBetween(from, to);

  return {
    from,
    to,
    amount,
    rate: round(rate, RATE_PRECISION),
    result: round(amount * rate, AMOUNT_PRECISION),
  };
}

module.exports = { convert, rateBetween, round };
