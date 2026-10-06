FROM node:22-alpine

WORKDIR /app

# Instalar dependencias primero
COPY package*.json ./
RUN npm install

# Copiar el resto del proyecto
COPY . .

# Exponer el puerto de Vite
EXPOSE 5173

# Arrancar Vite escuchando en todas las interfaces de red
CMD ["npm", "run", "dev", "--", "--host"]
