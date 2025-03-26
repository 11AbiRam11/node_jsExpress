FROM node:20-slim

# Install dependencies and Chromium
RUN apt-get update && apt-get install -y \
    chromium \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /server

COPY package*.json ./
COPY views ./

RUN npm install -g
COPY . .

CMD ["npm","run","dev"]
