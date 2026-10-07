# Etapa 1: Build de la aplicacion
FROM node:22-alpine AS build

WORKDIR /app

# Instalar dependencias primero para aprovechar la cache de capas
COPY package*.json ./
RUN npm ci

# Copiar codigo fuente y compilar bundle de produccion
COPY . .
RUN npm run build

# Etapa 2: Servidor web ligero en produccion
FROM nginx:alpine

# Copiar configuracion optimizada para SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar artefactos estaticos compilados
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
