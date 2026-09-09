const app = require('./app');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`conversor-de-moedas ouvindo em http://${HOST}:${PORT}`);
});

// Encerramento gracioso: o Docker envia SIGTERM ao parar o container.
for (const sinal of ['SIGTERM', 'SIGINT']) {
  process.on(sinal, () => {
    console.log(`Recebido ${sinal}, encerrando o servidor...`);
    server.close(() => process.exit(0));
  });
}

module.exports = server;
