FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci --production

# Copy backend source code
COPY . .

# Railway sets PORT automatically
EXPOSE ${PORT:-3001}

# Start the WhatsApp + Telegram server
WORKDIR /app/whatsapp
CMD ["node", "whatsapp_server.js"]
