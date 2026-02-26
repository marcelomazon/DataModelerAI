# ---------- Etapa 1: Build ----------
FROM node:18-alpine AS build

WORKDIR /app

# Copia package.json e lock
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia o restante do projeto
COPY . .

# Gera build de produção
RUN npm run build


# ---------- Etapa 2: Servir com Nginx ----------
FROM nginx:alpine

# Remove config padrão
RUN rm /etc/nginx/conf.d/default.conf

# Copia build do Vite (dist)
COPY --from=build /app/dist /usr/share/nginx/html

# Copia config customizada do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]