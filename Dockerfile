FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4001
ENV NEXT_PUBLIC_API_BASE_URL=http://192.168.1.16:3010

# Copiar node_modules desde builder para evitar reinstalación
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./

EXPOSE 4001
CMD ["npm", "start"]