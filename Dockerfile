# Etapa 1: builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar package.json e instalar dependencias
COPY package*.json ./
COPY next.config.js ./
RUN npm ci

# Copiar código fuente
COPY . .

# Build de la aplicación
RUN npm run build

# Etapa 2: producción
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4001

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copiar desde la etapa de builder
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./

# Instalar solo dependencias de producción
RUN npm ci --omit=dev

# Cambiar a usuario no-root
USER nextjs

EXPOSE 4001

CMD ["npm", "start"]