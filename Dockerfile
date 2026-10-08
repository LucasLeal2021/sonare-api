# Ambiente da API em desenvolvimento. O código é montado por cima de /app.
FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
EXPOSE 3333
