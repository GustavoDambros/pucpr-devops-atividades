/**
 * Tabela de taxas de câmbio fixas, expressas em relação ao dólar (USD = 1).
 *
 * Em produção estes valores viriam de uma API externa. Aqui são fixos de
 * propósito: mantêm a aplicação simples e os testes determinísticos, que é o
 * que interessa para exercitar o pipeline.
 */
const RATES_PER_USD = Object.freeze({
  USD: 1,
  BRL: 5.42,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 157.0,
  ARS: 970.0,
  CAD: 1.37,
});

const CURRENCY_NAMES = Object.freeze({
  USD: 'Dólar americano',
  BRL: 'Real brasileiro',
  EUR: 'Euro',
  GBP: 'Libra esterlina',
  JPY: 'Iene japonês',
  ARS: 'Peso argentino',
  CAD: 'Dólar canadense',
});

/** Códigos ISO suportados, em ordem alfabética. */
function supportedCodes() {
  return Object.keys(RATES_PER_USD).sort();
}

/** Indica se um código de moeda existe na tabela (case-insensitive). */
function isSupported(code) {
  if (typeof code !== 'string') {
    return false;
  }
  return Object.prototype.hasOwnProperty.call(RATES_PER_USD, code.trim().toUpperCase());
}

/** Lista as moedas suportadas com nome e taxa de referência. */
function listCurrencies() {
  return supportedCodes().map((code) => ({
    code,
    name: CURRENCY_NAMES[code],
    ratePerUsd: RATES_PER_USD[code],
  }));
}

module.exports = { RATES_PER_USD, supportedCodes, isSupported, listCurrencies };
