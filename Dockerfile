FROM node:18-alpine

WORKDIR /app

# Copy dashboard files
COPY index.html .
COPY data.json .

# Install simple HTTP server
RUN npm install -g http-server

# Expose port
EXPOSE 3000

# Start server
CMD ["http-server", "-p", "3000", "-c-1"]
