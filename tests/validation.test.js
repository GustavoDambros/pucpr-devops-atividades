const { parseConversionInput, ValidationError, MAX_AMOUNT } = require('../src/validation');

describe('parseConversionInput', () => {
  it('normaliza códigos em minúsculo e com espaços em volta', () => {
    expect(parseConversionInput({ from: ' usd ', to: 'brl', amount: '10' })).toEqual({
      from: 'USD',
      to: 'BRL',
      amount: 10,
    });
  });

  it('aceita o valor exatamente no teto permitido', () => {
    expect(parseConversionInput({ from: 'USD', to: 'USD', amount: MAX_AMOUNT }).amount).toBe(MAX_AMOUNT);
  });

  it.each([
    ['moeda de destino desconhecida', { from: 'USD', to: 'XYZ', amount: 1 }],
    ['parâmetro "from" ausente', { to: 'BRL', amount: 1 }],
    ['parâmetro "to" vazio', { from: 'USD', to: '   ', amount: 1 }],
    ['valor ausente', { from: 'USD', to: 'BRL' }],
    ['valor não numérico', { from: 'USD', to: 'BRL', amount: 'dez' }],
    ['valor negativo', { from: 'USD', to: 'BRL', amount: -1 }],
    ['valor acima do teto', { from: 'USD', to: 'BRL', amount: MAX_AMOUNT + 1 }],
  ])('rejeita %s', (_descricao, entrada) => {
    expect(() => parseConversionInput(entrada)).toThrow(ValidationError);
  });

  it('informa quais moedas existem quando a moeda é inválida', () => {
    expect(() => parseConversionInput({ from: 'USD', to: 'XYZ', amount: 1 })).toThrow(/Moedas disponíveis/);
  });

  it('aceita zero como valor a converter', () => {
    // Zero é falsy: um "if (!amount)" ingênuo recusaria uma conversão válida.
    expect(parseConversionInput({ from: 'USD', to: 'BRL', amount: 0 }).amount).toBe(0);
  });

  it('aceita o valor como texto, que é como ele chega pela query string', () => {
    expect(parseConversionInput({ from: 'USD', to: 'BRL', amount: '12.5' }).amount).toBe(12.5);
  });

  it('exige "from" quando é chamada sem argumento nenhum', () => {
    expect(() => parseConversionInput()).toThrow(/"from" é obrigatório/);
  });

  it('rejeita o mesmo parâmetro repetido na query string', () => {
    // ?from=USD&from=EUR chega ao Express como array.
    expect(() => parseConversionInput({ from: ['USD', 'EUR'], to: 'BRL', amount: 1 }))
      .toThrow(ValidationError);
  });

  it.each([
    ['Infinity', Infinity],
    ['-Infinity', -Infinity],
    ['NaN', NaN],
  ])('rejeita %s, que não representa dinheiro', (_descricao, valor) => {
    expect(() => parseConversionInput({ from: 'USD', to: 'BRL', amount: valor }))
      .toThrow(ValidationError);
  });
});
