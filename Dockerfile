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

# Argumentos de build para variaveis Vite (sao injetadas no build do frontend)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Builda o frontend (Vite -> dist/) e o bundle do servidor (Express -> dist/server.mjs)
RUN npm run build

# Estagio final
FROM node:22-alpine

WORKDIR /app

# Copia node_modules ja resolvidos do builder (evita reinstalar e conflitos de postinstall)
COPY --from=builder /app/node_modules ./node_modules

# Copia artefatos do build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Variaveis de ambiente padrao
ENV NODE_ENV=production
ENV PORT=8080

# Cloud Run exige que o container escute na porta definida por PORT
EXPOSE 8080

# Comando de inicializacao
CMD ["node", "dist/server.mjs"]
