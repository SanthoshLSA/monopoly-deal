FROM node:20-alpine

WORKDIR /app

# Copy package manifests
COPY package.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies for client and server
RUN npm --prefix client install
RUN npm --prefix server install

# Copy full application code
COPY . .

# Build frontend production bundle
RUN npm --prefix client run build

# Expose port (default 3001, also supports cloud PORT env)
EXPOSE 3001
ENV PORT=3001
ENV NODE_ENV=production

# Start unified Node.js server
CMD ["node", "server/index.js"]
