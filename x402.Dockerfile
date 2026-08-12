FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY server/ ./server/

EXPOSE 4020
ENV PORT=4020
ENV HOST=0.0.0.0

CMD ["node", "server/x402Server.js"]
