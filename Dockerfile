FROM node:20-slim

# Install git as it's required for some dependencies (baileys, etc)
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# Create directory for WhatsApp auth session
RUN mkdir -p auth_info_baileys && chmod 777 auth_info_baileys

EXPOSE 3000

CMD ["node", "app.js"]
