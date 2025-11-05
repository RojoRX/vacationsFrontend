# =============================
# Etapa 1: Build del frontend
# =============================
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# ✅ Instalar dependencias
RUN npm install

# 👇 Recibe el argumento desde docker-compose
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

# Copiar todo el código del proyecto
COPY . .

# ✅ Construir el proyecto Next.js con la variable de entorno
RUN npm run build

# =============================
# Etapa 2: Producción
# =============================
FROM node:20-alpine

WORKDIR /app

# Copiar artefactos generados
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./

# ✅ Instalar dependencias necesarias para producción
RUN npm install --omit=dev

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=4001

EXPOSE 4001

# ✅ Iniciar servidor Next.js
CMD ["npm", "start"]
