const request = require('supertest');

const app = require('../src/app');

describe('GET /health', () => {
  it('responde 200 e identifica o serviço', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('conversor-de-moedas');
    expect(typeof res.body.uptime).toBe('number');
  });
});

describe('GET /api/currencies', () => {
  it('lista as moedas suportadas com código, nome e taxa', async () => {
    const res = await request(app).get('/api/currencies');

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(res.body.currencies.length);
    expect(res.body.currencies.map((c) => c.code)).toEqual(
      expect.arrayContaining(['BRL', 'EUR', 'USD']),
    );
    expect(res.body.currencies[0]).toHaveProperty('name');
    expect(res.body.currencies[0]).toHaveProperty('ratePerUsd');
  });
});

describe('GET /api/convert', () => {
  it('converte com os parâmetros na query string', async () => {
    const res = await request(app).get('/api/convert').query({ from: 'USD', to: 'BRL', amount: 10 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ from: 'USD', to: 'BRL', amount: 10, rate: 5.42, result: 54.2 });
  });

  it('aceita códigos de moeda em minúsculo', async () => {
    const res = await request(app).get('/api/convert').query({ from: 'usd', to: 'brl', amount: 1 });

    expect(res.status).toBe(200);
    expect(res.body.from).toBe('USD');
  });

  it('responde 400 quando o valor não é informado', async () => {
    const res = await request(app).get('/api/convert').query({ from: 'USD', to: 'BRL' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/"amount" é obrigatório/);
  });

  it('responde 400 e sugere as moedas válidas quando a moeda não existe', async () => {
    const res = await request(app).get('/api/convert').query({ from: 'USD', to: 'XYZ', amount: 1 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/não suportada/);
    expect(res.body.error).toContain('BRL');
  });

  it('responde 400 para valor negativo', async () => {
    const res = await request(app).get('/api/convert').query({ from: 'USD', to: 'BRL', amount: -5 });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/convert', () => {
  it('converte com os parâmetros no corpo da requisição', async () => {
    const res = await request(app).post('/api/convert').send({ from: 'BRL', to: 'USD', amount: 542 });

    expect(res.status).toBe(200);
    expect(res.body.result).toBeCloseTo(100, 1);
  });

  it('responde 400 quando o corpo não é um JSON válido', async () => {
    const res = await request(app)
      .post('/api/convert')
      .set('Content-Type', 'application/json')
      .send('{ isso nao e json');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/JSON válido/);
  });
});

describe('rotas inexistentes', () => {
  it('responde 404 informando o caminho solicitado', async () => {
    const res = await request(app).get('/rota-que-nao-existe');

    expect(res.status).toBe(404);
    expect(res.body.path).toBe('/rota-que-nao-existe');
  });
});
