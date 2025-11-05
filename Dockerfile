# =============================
# Etapa 1: build
# =============================
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

# ✅ Variables de entorno para BUILD
ENV NEXT_PUBLIC_API_BASE_URL=http://192.168.1.16:3010
ENV NODE_ENV=production
ENV PORT=4001

COPY . .
RUN npm run build

# =============================
# Etapa 2: producción
# =============================
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4001
# ✅ Variable para RUNTIME (puede ser diferente del build)
ENV NEXT_PUBLIC_API_BASE_URL=http://192.168.1.16:3010

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./

RUN npm install --omit=dev --legacy-peer-deps

EXPOSE 4001
CMD ["npm", "start"]