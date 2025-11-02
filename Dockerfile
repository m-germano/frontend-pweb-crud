# =========================
#  Build (Vite -> dist)
# =========================
FROM node:20-alpine AS build
WORKDIR /app

# deps
COPY package*.json ./
RUN npm ci

# código
COPY . .

# gera build da SPA
# Se quiser forçar uma base, exporte VITE_API_BASE_URL=/api no compose (não é obrigatório se usar proxy)
RUN npm run build

# =========================
#  Runtime (Nginx)
# =========================
FROM nginx:1.27-alpine
WORKDIR /usr/share/nginx/html

# copia build estático
COPY --from=build /app/dist ./

# nginx para SPA + (opcional) proxy de /api → backend
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
