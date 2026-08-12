# Stage 1: Build React/Vite App
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
ENV VITE_ALGORAND_NETWORK=testnet
ENV VITE_ALGORAND_APP_ID=769036041
RUN npm run build

# Stage 2: Serve via Nginx Production Server
FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
