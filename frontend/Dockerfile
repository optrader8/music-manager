FROM node:20-slim

WORKDIR /app

# Install dependencies first
COPY package.json package-lock.json* ./
RUN npm ci --production=false

# Copy source code
COPY . .

EXPOSE 32001

# Use vite dev with proper host binding
CMD ["npm", "run", "dev"]
