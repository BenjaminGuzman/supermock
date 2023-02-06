# build executable
FROM golang:1.19-alpine as builder
RUN apk add build-base # install gcc

WORKDIR /usr/src

COPY [".", "/usr/src"]

#ENV CGO_ENABLED=0 # executable seems to be slow if CGO is disabled
RUN go build -o captcha

# build production image
FROM alpine

WORKDIR /

COPY --from=builder ["/usr/src/captcha", "/captcha"]

VOLUME ["/.env"]

ENTRYPOINT ["/captcha"]