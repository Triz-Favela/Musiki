FROM node:24-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY server.js ./

ENV NODE_ENV=production

USER node
CMD ["node", "server.js"]