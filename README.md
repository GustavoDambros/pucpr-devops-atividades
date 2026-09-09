# Conversor de Moedas — API REST

[![CI](https://github.com/GustavoDambros/pucpr-devops-atividades/actions/workflows/ci.yml/badge.svg)](https://github.com/GustavoDambros/pucpr-devops-atividades/actions/workflows/ci.yml)
[![CD](https://github.com/GustavoDambros/pucpr-devops-atividades/actions/workflows/cd.yml/badge.svg)](https://github.com/GustavoDambros/pucpr-devops-atividades/actions/workflows/cd.yml)

Projeto prático da disciplina de **DevOps** (PUCPR).

API HTTP em Node.js + Express que converte valores entre moedas a partir de uma
tabela de taxas fixa. A aplicação é propositalmente enxuta: o objeto de estudo
aqui é o **pipeline** — versionamento com Git, integração e entrega contínuas
com GitHub Actions e empacotamento com Docker — e não a complexidade do código.

## Stack

| Camada | Ferramenta |
| --- | --- |
| Runtime | Node.js 24 (compatível a partir da 20) |
| Framework HTTP | Express 4 |
| Testes | Jest + Supertest |
| CI/CD | GitHub Actions |
| Empacotamento | Docker (imagem `node:24-alpine`, multi-stage) |
| Registry | GitHub Container Registry (`ghcr.io`) |

## Endpoints

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/health` | Health check — usado pelo `HEALTHCHECK` do container e pelos smoke tests do pipeline. |
| `GET` | `/api/currencies` | Lista as moedas suportadas, com nome e taxa de referência. |
| `GET` | `/api/convert?from=&to=&amount=` | Converte um valor, com os parâmetros na query string. |
| `POST` | `/api/convert` | Mesma conversão, com os parâmetros em um corpo JSON. |

### Exemplos

```bash
curl "http://localhost:3000/api/convert?from=USD&to=BRL&amount=10"
```

```json
{ "from": "USD", "to": "BRL", "amount": 10, "rate": 5.42, "result": 54.2 }
```

```bash
curl -X POST http://localhost:3000/api/convert \
  -H "Content-Type: application/json" \
  -d '{"from":"BRL","to":"EUR","amount":250}'
```

Entradas inválidas — moeda desconhecida, valor ausente, não numérico ou
negativo — respondem `400` com uma mensagem que diz o que corrigir:

```json
{ "error": "Moeda \"XYZ\" não suportada. Moedas disponíveis: ARS, BRL, CAD, EUR, GBP, JPY, USD." }
```

As taxas são fixas e ficam em [`src/rates.js`](src/rates.js). Em um sistema
real viriam de uma API externa; aqui são constantes de propósito, para manter
os testes determinísticos.

## Rodando localmente

Requisito: Node.js 20 ou superior.

```bash
npm ci
npm start
```

A API sobe em `http://localhost:3000`. Para trocar a porta, defina `PORT`.

## Rodando com Docker

```bash
# Build da imagem
docker build -t conversor-de-moedas:local .

# Sobe o container em background
docker run -d --name conversor-de-moedas -p 3000:3000 conversor-de-moedas:local

# Confere que está de pé
docker ps
curl http://localhost:3000/health
```

Ou, com Docker Compose:

```bash
docker compose up --build
```

Se a porta 3000 já estiver ocupada na sua máquina, use outra no host:

```bash
docker run -d --name conversor-de-moedas -p 3030:3000 conversor-de-moedas:local
# ou
HOST_PORT=3030 docker compose up --build
```

### Sobre a imagem

O [`Dockerfile`](Dockerfile) usa dois estágios. O primeiro resolve apenas as
dependências de produção a partir do lockfile; o segundo copia o `node_modules`
resultante e o código-fonte. Assim Jest, Supertest e os testes nunca chegam à
imagem final. O container roda com o usuário `node`, sem privilégios de root, e
declara um `HEALTHCHECK` que consulta `/health`.

Imagem publicada a cada merge na `main`:

```bash
docker pull ghcr.io/gustavodambros/pucpr-devops-atividades:latest
```

## Testes

```bash
npm test              # suíte completa
npm run test:coverage # com relatório de cobertura
```

São 29 testes em três suítes:

- [`tests/converter.test.js`](tests/converter.test.js) — a matemática da
  conversão, incluindo simetria entre ida e volta e arredondamento.
- [`tests/validation.test.js`](tests/validation.test.js) — as regras de
  validação e seus casos de borda.
- [`tests/api.test.js`](tests/api.test.js) — os contratos HTTP de cada rota,
  os erros `400` e o `404`, via Supertest.

O Jest está configurado com um piso de cobertura, então o CI falha se código
novo entrar sem teste.

## Pipeline

### CI — [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

Dispara em **todo push e em toda pull request**. Dentro de uma pull request já
aberta, o evento `synchronize` garante que a suíte roda de novo **a cada novo
commit** enviado ao branch. Para cada versão do Node (22 e
24), instala as dependências a partir do lockfile, roda a suíte com cobertura,
sobe a API de verdade e faz um smoke test em `/health` e `/api/convert` — isso
garante que o processo realmente inicia, não apenas que as funções passam nos
testes. O relatório de cobertura fica salvo como artefato da execução.

### CD — [`.github/workflows/cd.yml`](.github/workflows/cd.yml)

Dispara em pull requests para a `main` e em pushes na `main`, e **só avança
depois que o CI passa**: o primeiro job reutiliza o próprio `ci.yml` através de
`workflow_call`, e os jobs seguintes dependem dele via `needs`. Nada é
construído ou entregue com a suíte vermelha.

```
quality-gate (reusa o CI)  ->  image (build + smoke test + push)  ->  deploy (valida o que foi publicado)
```

- **Em pull request:** a imagem é construída e o container é validado no runner,
  mas nada é publicado.
- **Em push na `main`:** a imagem é publicada no GitHub Container Registry
  autenticando com o `GITHUB_TOKEN` — sem necessidade de cadastrar secrets — e o
  job de entrega baixa a imagem **pelo digest** e confirma que ela sobe e
  responde. O que é validado é exatamente o artefato entregue.

### Alertas no Discord — [`.github/workflows/notify.yml`](.github/workflows/notify.yml)

Sempre que o CI ou o CD termina, um embed é publicado em um canal do Discord
com repositório, branch, evento, autor do commit, quem disparou, o resumo do
commit com link e o link direto para os logs da execução. A cor acompanha o
resultado: verde para sucesso, vermelho para falha, cinza para cancelado.

O gatilho é `workflow_run`, e não `push`/`pull_request`, porque a notificação
precisa saber o **resultado** de outra execução — disparando em `push` ela
rodaria em paralelo ao CI, sem ter como saber se a suíte passou. Como o CI já
roda em push e em pull request, os dois casos ficam cobertos.

#### Configuração

A URL do webhook nunca fica no repositório: vem de `secrets.DISCORD_WEBHOOK`.

1. No Discord, na engrenagem do canal → **Integrações** → **Webhooks** →
   **Criar Webhook** → **Copiar URL do Webhook** → **Salvar Alterações**.
2. No GitHub, em **Settings → Secrets and variables → Actions** →
   **New repository secret**, com o nome `DISCORD_WEBHOOK` e a URL como valor.

Sem o secret cadastrado, o workflow registra um aviso e termina verde, em vez
de falhar — um alerta não entregue não é um build quebrado.

> A URL do webhook é uma credencial: quem a tem consegue postar no canal. Se
> vazar, exclua o webhook no Discord e crie outro.

## Estrutura

```
.
├── .github/workflows/
│   ├── ci.yml           # integração contínua
│   ├── cd.yml           # entrega contínua
│   └── notify.yml       # alertas no Discord
├── src/
│   ├── app.js           # rotas, 404 e tratamento central de erros
│   ├── server.js        # bootstrap HTTP e encerramento gracioso
│   ├── converter.js     # conversão (função pura)
│   ├── rates.js         # tabela de taxas e catálogo de moedas
│   └── validation.js    # validação e normalização da entrada
├── tests/
│   ├── api.test.js
│   ├── converter.test.js
│   └── validation.test.js
├── Dockerfile
├── .dockerignore
└── compose.yaml
```

## Requisitos da disciplina

| Requisito | Onde está |
| --- | --- |
| Repositório público com aplicação funcional | Este repositório |
| Branch além da `main` | `feature/conversao-e-pipeline` |
| Cinco ou mais commits incrementais | Histórico do branch de feature |
| Pull request com merge na `main` | Aba *Pull requests* |
| Workflow de CI em push e pull request | [`ci.yml`](.github/workflows/ci.yml) |
| Testes automatizados | [`tests/`](tests/) — 29 testes |
| Workflow de CD após o CI passar | [`cd.yml`](.github/workflows/cd.yml) |
| `Dockerfile` na raiz, base oficial leve | [`Dockerfile`](Dockerfile) |
| `.dockerignore` | [`.dockerignore`](.dockerignore) |
| Desafio opcional: push da imagem para um registry | Job `image` do [`cd.yml`](.github/workflows/cd.yml), publicando no `ghcr.io` |
| Alertas de workflow no Discord (semana 6) | [`notify.yml`](.github/workflows/notify.yml), com a URL em `secrets.DISCORD_WEBHOOK` |

## Licença

MIT.
