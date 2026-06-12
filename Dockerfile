FROM oven/bun:1.3.5-alpine AS base
WORKDIR /app

# Instalar dependências (raiz + workspaces)
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

# Imagem final
FROM oven/bun:1.3.5-alpine
WORKDIR /app

# Copiar tudo da fase de build — incluindo node_modules instalados
COPY --from=base /app ./

EXPOSE 3000

CMD ["bun", "run", "packages/web/src/server.ts"]
