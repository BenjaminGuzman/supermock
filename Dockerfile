# stage 1
FROM node:18-alpine3.15 as builder

# install dependencies required for build
COPY ["package.json", "package-lock.json", "/usr/src/"]
WORKDIR /usr/src
RUN npm ci

# build the application
COPY [".", "/usr/src"]
RUN npm run build

# delete dev dependencies
RUN npm prune --omit=dev

# stage 2: build production image
FROM node:18-alpine3.15

VOLUME ["/usr/src/.env"]

WORKDIR /usr/src
EXPOSE 3000

COPY --from=builder ["/usr/src/", "/usr/src/"]

ENTRYPOINT ["node", "dist/main.js"]
