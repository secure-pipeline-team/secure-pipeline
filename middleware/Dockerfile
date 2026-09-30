FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Disable strict SSL for local dev (network has SSL inspection)
RUN npm config set registry https://registry.npmmirror.com && \
    npm config set strict-ssl false && \
    npm install --omit=dev --no-audit --no-fund

COPY server.js ./

EXPOSE 8080

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

CMD ["node", "server.js"]