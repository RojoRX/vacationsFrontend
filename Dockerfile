# =============================
# Etapa 1: build
# =============================
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

# ⚠️ Recibe la variable y la exporta al entorno del build
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

COPY . .
RUN npm run build

# =============================
# Etapa 2: producción
# =============================
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app ./
RUN npm install --omit=dev

ENV NODE_ENV=production
ENV PORT=4001

# ⚠️ Vuelve a exportarla para runtime
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

EXPOSE 4001
CMD ["npm", "start"]
