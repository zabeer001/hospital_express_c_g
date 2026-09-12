FROM node:22-alpine

WORKDIR /app
COPY --chown=node:node package*.json ./
COPY --chown=node:node prisma.config.js ./
COPY --chown=node:node prisma ./prisma
COPY --chown=node:node database ./database
RUN npm ci \
  && npx prisma generate \
  && npm prune --omit=dev
COPY --chown=node:node src ./src

EXPOSE 4000
USER node
CMD ["npm", "start"]
