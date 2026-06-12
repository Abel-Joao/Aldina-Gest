FROM oven/bun:1.3.5-alpine AS base
WORKDIR /app

# Instalar dependências
COPY package.json bun.lock ./
COPY packages/web/package.json ./packages/web/

RUN bun install

# Copiar código fonte
COPY packages/web ./packages/web
COPY tsconfig.json ./

# Build (Vite) — gera dist/
WORKDIR /app/packages/web
RUN bun run build || (bunx vite build && cp public/landing.html dist/index.html && cp -r public/assets dist/ && cp -r public/app dist/)

# Garantir que public/app está no dist (a app principal)
RUN cp -r public/app dist/ 2>/dev/null || true
RUN cp public/favicon.ico dist/ 2>/dev/null || true
RUN cp public/og-image.png dist/ 2>/dev/null || true

# Imagem final — apenas o necessário para correr
FROM oven/bun:1.3.5-alpine
WORKDIR /app

COPY --from=base /app/packages/web/dist ./packages/web/dist
COPY --from=base /app/packages/web/src ./packages/web/src
COPY --from=base /app/packages/web/package.json ./packages/web/package.json
COPY --from=base /app/node_modules ./node_modules
RUN mkdir -p ./packages/web/node_modules

EXPOSE 3000

CMD ["bun", "run", "packages/web/src/server.ts"]
