FROM node:20-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package.json ./

RUN corepack enable \
  && corepack prepare pnpm@9.15.4 --activate \
  && pnpm install --prod --no-frozen-lockfile

COPY server ./server
COPY shared ./shared
COPY client/dist ./client/dist

EXPOSE 3000

CMD ["node", "server/src/index.js"]
