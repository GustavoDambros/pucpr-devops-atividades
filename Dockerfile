# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Estágio 1 — dependências de produção
#
# Resolvido separadamente para que a instalação só rode de novo quando o
# package-lock.json mudar, e para que devDependencies (Jest, Supertest) nunca
# cheguem à imagem final.
# ---------------------------------------------------------------------------
FROM node:24-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev && npm cache clean --force

# ---------------------------------------------------------------------------
# Estágio 2 — imagem final
#
# Base oficial Alpine: enxuta e mantida pelo time do Node.
# ---------------------------------------------------------------------------
FROM node:24-alpine AS runtime

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app

# A imagem oficial já traz o usuário "node", sem privilégios de root.
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node src ./src

USER node

EXPOSE 3000

# O wget vem do BusyBox, então não é preciso instalar nada só para o healthcheck.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1

CMD ["node", "src/server.js"]
