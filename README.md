# Conversor de Moedas — API REST

Projeto prático da disciplina de **DevOps** (PUCPR).

API HTTP simples, em Node.js + Express, que converte valores entre moedas a
partir de uma tabela de taxas fixa. A aplicação é propositalmente enxuta: o
objetivo do trabalho é o **pipeline** (Git, CI/CD e Docker), não a
complexidade do código.

## Como rodar localmente

Requisitos: Node.js 20 ou superior.

```bash
npm ci
npm start
```

A API sobe em `http://localhost:3000`.

```bash
curl http://localhost:3000/health
```

## Testes

```bash
npm test
```

## Licença

MIT.
