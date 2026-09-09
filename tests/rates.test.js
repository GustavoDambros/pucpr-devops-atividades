const {
  RATES_PER_USD,
  supportedCodes,
  isSupported,
  listCurrencies,
} = require('../src/rates');

describe('supportedCodes', () => {
  it('devolve os códigos em ordem alfabética', () => {
    const codigos = supportedCodes();

    expect(codigos).toEqual([...codigos].sort());
  });

  it('cobre todas as moedas declaradas na tabela de taxas', () => {
    expect(supportedCodes()).toHaveLength(Object.keys(RATES_PER_USD).length);
  });
});

describe('isSupported', () => {
  it('aceita o código em minúsculo e com espaços em volta', () => {
    expect(isSupported(' brl ')).toBe(true);
  });

  it('rejeita um código que não existe na tabela', () => {
    expect(isSupported('XYZ')).toBe(false);
  });

  // A função recebe dados que vêm da query string e do corpo da requisição,
  // onde o tipo não é garantido: precisa responder false em vez de estourar.
  it.each([
    ['número', 42],
    ['nulo', null],
    ['indefinido', undefined],
    ['objeto', { code: 'BRL' }],
    ['array', ['BRL']],
  ])('rejeita entrada do tipo %s sem lançar exceção', (_descricao, entrada) => {
    expect(isSupported(entrada)).toBe(false);
  });
});

describe('listCurrencies', () => {
  it('descreve cada moeda com código, nome e taxa positiva', () => {
    for (const moeda of listCurrencies()) {
      expect(typeof moeda.code).toBe('string');
      expect(moeda.name.length).toBeGreaterThan(0);
      expect(moeda.ratePerUsd).toBeGreaterThan(0);
    }
  });

  it('usa o dólar como base da tabela', () => {
    const dolar = listCurrencies().find((moeda) => moeda.code === 'USD');

    expect(dolar.ratePerUsd).toBe(1);
  });
});
