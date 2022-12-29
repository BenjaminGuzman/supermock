# stage 1: build angular app
FROM node:18-alpine3.15 as builder
WORKDIR /usr/src

COPY ["package.json", "package-lock.json", "/usr/src/"]
RUN npm install

COPY [".", "/usr/src"]
RUN npm run build

# stage 2: build production image. Configure nginx
FROM nginx:alpine

COPY --from=builder ["/usr/src/dist/", "/var/www/html/"]
COPY ["gateway.conf", "/etc/nginx/conf.d/"]

# Replace default domain in "compiled environment.prod.ts" when container starts
CMD ["sh", "-c", "find /var/www/html/webmock -not -type d | xargs sed -i \"s|https://test.benjaminguzman.dev|$GATEWAY_BASE_URL|g\"; nginx -g 'daemon off;'"]
