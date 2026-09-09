const { convert, rateBetween, round } = require('../src/converter');
const { RATES_PER_USD } = require('../src/rates');

describe('round', () => {
  it('arredonda para o número de casas decimais pedido', () => {
    expect(round(1.23456, 2)).toBe(1.23);
    expect(round(1.23456, 4)).toBe(1.2346);
  });

  it('preserva valores que já cabem na precisão', () => {
    expect(round(54.2, 2)).toBe(54.2);
  });
});

describe('rateBetween', () => {
  it('retorna 1 quando origem e destino são a mesma moeda', () => {
    expect(rateBetween('BRL', 'BRL')).toBe(1);
  });

  it('usa a tabela do dólar diretamente quando a origem é USD', () => {
    expect(rateBetween('USD', 'BRL')).toBe(RATES_PER_USD.BRL);
  });

  it('é simétrico: ida multiplicada pela volta resulta em 1', () => {
    expect(rateBetween('BRL', 'JPY') * rateBetween('JPY', 'BRL')).toBeCloseTo(1, 10);
  });
});

describe('convert', () => {
  it('converte de dólar para real', () => {
    expect(convert('USD', 'BRL', 10)).toEqual({
      from: 'USD',
      to: 'BRL',
      amount: 10,
      rate: 5.42,
      result: 54.2,
    });
  });

  it('converte entre duas moedas que não são o dólar', () => {
    const { result } = convert('BRL', 'EUR', 100);
    expect(result).toBeCloseTo(100 * (RATES_PER_USD.EUR / RATES_PER_USD.BRL), 2);
  });

  it('mantém o valor quando origem e destino são iguais', () => {
    expect(convert('JPY', 'JPY', 1234.56).result).toBe(1234.56);
  });

  it('converte zero para zero', () => {
    expect(convert('USD', 'ARS', 0).result).toBe(0);
  });
});
