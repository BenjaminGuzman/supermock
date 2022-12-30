# stage 1: build angular app
FROM node:18-alpine3.15 as builder

# Install dependencies
COPY ["package.json", "package-lock.json", "/usr/src/"]
WORKDIR /usr/src
RUN npm ci

# Build the application
COPY [".", "/usr/src"]
RUN npm run build

# stage 2: build production image. Configure nginx
FROM nginx:alpine

COPY --from=builder ["/usr/src/dist/", "/var/www/html/"]
COPY ["gateway.conf", "/etc/nginx/conf.d/"]
COPY ["000-setup.sh", "/docker-entrypoint.d/"]
RUN chmod a+x /docker-entrypoint.d/000-setup.sh

# For some strange reason the setup script is not executed if it is just placed in docker-entrypoint.d
# So, execute it directly in here
CMD ["sh", "-c", "/docker-entrypoint.d/000-setup.sh && nginx -g 'daemon off;'"]
