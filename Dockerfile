FROM node:22-slim AS base

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
RUN npm install

# Copiar el resto del código
COPY . .

# Compilar la aplicación
RUN npm run build

# Exponer puerto
EXPOSE 4321

# Comando de inicio
CMD ["npm", "start"]

LABEL name="slit-carouser-image" version="1.0"
