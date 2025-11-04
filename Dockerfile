FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./

# ✅ Alternativa: usar npm install con --legacy-peer-deps
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4001

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./

RUN npm install --omit=dev --legacy-peer-deps

USER nextjs

EXPOSE 4001
CMD ["npm", "start"]