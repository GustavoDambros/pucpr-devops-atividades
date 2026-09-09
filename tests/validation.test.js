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
});
