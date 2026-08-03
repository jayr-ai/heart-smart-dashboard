FROM node:18-alpine

WORKDIR /app

# Copy dashboard files
COPY index.html .
COPY data.json .
COPY railway.json .

# Install simple HTTP server
RUN npm install -g http-server

# Start server on Railway's PORT environment variable
CMD http-server -p ${PORT:-3000} -c-1
