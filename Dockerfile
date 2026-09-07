# Dockerfile para Aquar.IA no Google Cloud Run
# Build multi-estagio: primeiro builda o frontend, depois o servidor.

FROM node:22-alpine AS builder

WORKDIR /app

# Copia arquivos de dependencia
COPY package.json package-lock.json* ./

# Instala dependencias (inclui devDependencies para build)
RUN npm install

# Copia o restante do codigo
COPY . .

# Builda o frontend (Vite -> dist/) e o bundle do servidor (Express -> dist/server.mjs)
RUN npm run build

# Estagio final
FROM node:22-alpine

WORKDIR /app

# Copia arquivos de dependencia
COPY package.json package-lock.json* ./

# Instala apenas dependencias de producao
RUN npm install --omit=dev

# Copia artefatos do build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Variaveis de ambiente padrao
ENV NODE_ENV=production
ENV PORT=8080

# Cloud Run exige que o container escute na porta definida por PORT
EXPOSE 8080

# Comando de inicializacao
CMD ["node", "dist/server.mjs"]
