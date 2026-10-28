# Dockerfile para la aplicación de Préstamo de Equipamiento Audiovisual - UNLa
FROM node:20-alpine AS base

# Dependencias necesarias para librerías nativas y fuentes
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Dependencias
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Código fuente
COPY . .

# Construcción de Next.js
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# Imagen final de ejecución
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=base /app/public ./public
COPY --from=base --chown=nextjs:nodejs /app/.next ./.next
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/data ./data

USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
