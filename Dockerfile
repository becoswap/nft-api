FROM node:16
ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev --legacy-peer-deps


COPY dist/ .


EXPOSE 8080
CMD [ "node", "app.js" ]