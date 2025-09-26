FROM node:20-slim

WORKDIR /app

# Install dependencies first
COPY package.json package-lock.json* ./
RUN npm ci --production=false

# Copy source code
COPY . .

EXPOSE 3000

# Use rsbuild dev with proper host binding
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
