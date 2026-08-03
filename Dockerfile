FROM node:18-alpine

WORKDIR /app

# Copy dashboard files
COPY index.html .
COPY data.json .

# Install simple HTTP server
RUN npm install -g http-server
