package main

import (
	authpb "auth/protobuf"
	"context"
	"encoding/base64"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"log"
	"strings"
	"sync"
	"testing"
)

var globalMutex sync.Mutex
var serverStarted = false

func startServer() {
	if serverStarted {
		return
	}

	globalMutex.Lock()
	go main()
	serverStarted = true
	globalMutex.Unlock()
}

func connect2Server() (authpb.AuthClient, *grpc.ClientConn) {
	startServer()
	conn, err := grpc.Dial(getServerAddress(), grpc.WithBlock(), grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("couldn't connect to server. %s", err)
	}
	client := authpb.NewAuthClient(conn)
	return client, conn
}

func extractJWTPayload(jwt *authpb.JWT) string {
	jwtStr := jwt.Jwt
	payloadStr := strings.Split(jwtStr, ".")[1]
	return payloadStr
}

func validatePayload(jwt *authpb.JWT, expectedPayload *string) bool {
	payloadStr := extractJWTPayload(jwt)
	decoded, err := base64.RawStdEncoding.DecodeString(payloadStr)
	if err != nil {
		log.Fatalf("failed to decode JWT payload. %s\n", err)
	}

	if string(decoded) == *expectedPayload {
		return true
	}
	return false
}

func Test_CreateJWT(t *testing.T) {
	client, conn := connect2Server()
	defer conn.Close()

	tests := []struct {
		name            string
		userId          string
		expectedPayload string
	}{
		{name: "Create dummy JWT", userId: "hola mundo", expectedPayload: "{\"userId\":\"hola mundo\"}"},
		{name: "Payload abuse :)", userId: "{\"abuse\":true}", expectedPayload: "{\"userId\":\"{\\\"abuse\\\":true}\"}"},
		{name: "Create JWT int", userId: "789456", expectedPayload: "{\"userId\":\"789456\"}"},
		{name: "Create JWT uuid", userId: "53d41a1a-215f-493d-90fd-c2d44f0959c1", expectedPayload: "{\"userId\":\"53d41a1a-215f-493d-90fd-c2d44f0959c1\"}"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if jwt, err := client.CreateJWT(context.Background(), &authpb.UserId{
				UserId: tt.userId,
			}); err != nil || !validatePayload(jwt, &tt.expectedPayload) {
				t.Errorf(
					"CreateJWT() = %s, want %s (%s). possible cause: %s",
					jwt,
					tt.expectedPayload,
					base64.RawStdEncoding.EncodeToString([]byte(tt.expectedPayload)),
					err,
				)
			}
		})
	}
}
