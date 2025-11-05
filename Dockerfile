# =============================
# Etapa 1: Build del frontend
# =============================
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

# 👇 Recibir y exportar la variable en tiempo de build
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

COPY . .
RUN npm run build

# =============================
# Etapa 2: Producción
# =============================
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app ./

RUN npm install --omit=dev

ENV NODE_ENV=production
ENV PORT=4001

# 👇 Asegúrate que también esté disponible en runtime
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

EXPOSE 4001
CMD ["npm", "start"]
