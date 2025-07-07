FROM node:20-alpine AS build
WORKDIR /app
COPY . .
ENV NODE_ENV=production
RUN npm install --legacy-peer-deps && npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"] 