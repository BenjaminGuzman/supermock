# build executable
FROM golang:1.18-alpine as builder
RUN apk add build-base # install gcc

WORKDIR /usr/src

COPY . /usr/src

#ENV CGO_ENABLED=0 # executable seems to be slow if CGO is disabled
RUN mv .env.test .env && go test
RUN go build -o auth


# build production image
FROM alpine

WORKDIR /

COPY --from=builder ["/usr/src/auth", "/auth"]

VOLUME ["/.env"]

ENTRYPOINT ["/auth"]