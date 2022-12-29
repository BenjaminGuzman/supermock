package main

import (
	authpb "auth/protobuf"
	"context"
	"encoding/base64"
	"encoding/json"
	"github.com/golang-jwt/jwt/v4"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"log"
	"reflect"
	"strings"
	"sync"
	"testing"
)

var globalMutex sync.Mutex
var serverStarted = false

type jwtPayload struct {
	UserId string `json:"userId"`
	jwt.RegisteredClaims
}

func startServer() {
	if serverStarted {
		return
	}

	globalMutex.Lock()
	go main()
	serverStarted = true
	globalMutex.Unlock()
}

func connect2Server() (authpb.AuthServiceClient, *grpc.ClientConn) {
	startServer()
	conn, err := grpc.Dial(getServerAddress(), grpc.WithBlock(), grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("couldn't connect to server. %s", err)
	}
	client := authpb.NewAuthServiceClient(conn)
	return client, conn
}

func extractJWTPayload(jwt *authpb.JWT) string {
	jwtStr := jwt.Jwt
	payloadStr := strings.Split(jwtStr, ".")[1]
	return payloadStr
}

func validatePayload(jwt *authpb.JWT, expectedPayloadStr *string) (bool, string) {
	payloadStr := extractJWTPayload(jwt)
	decoded, err := base64.RawStdEncoding.DecodeString(payloadStr)
	if err != nil {
		log.Fatalf("failed to decode JWT payload. %s\n", err)
	}

	var expectedPayload jwtPayload
	var actualPayload jwtPayload
	if err := json.Unmarshal([]byte(*expectedPayloadStr), &expectedPayload); err != nil {
		log.Fatalf("failed to unmarshal expected payload. %s\n", err)
	}
	if err := json.Unmarshal(decoded, &actualPayload); err != nil {
		return false, string(decoded)
	}

	// test user id custom claim is correct
	if expectedPayload.UserId != actualPayload.UserId {
		return false, string(decoded)
	}

	// test actual payload has some JWT claims
	if reflect.ValueOf(actualPayload.ExpiresAt).IsZero() {
		return false, "expires at claim is missing"
	}
	if reflect.ValueOf(actualPayload.IssuedAt).IsZero() {
		return false, "issued at claim is missing"
	}

	return true, string(decoded)
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
			token, err := client.CreateJWT(context.Background(), &authpb.UserId{
				UserId: tt.userId,
			})
			if ok, decodedPayload := validatePayload(token, &tt.expectedPayload); err != nil || !ok {
				t.Errorf(
					"CreateJWT() = %s (full JWT: %s, encoded payload: %s), want %s (encoded payload: %s). possible cause: %s",
					decodedPayload,
					token,
					base64.RawStdEncoding.EncodeToString([]byte(decodedPayload)),
					tt.expectedPayload,
					base64.RawStdEncoding.EncodeToString([]byte(tt.expectedPayload)),
					err,
				)
			}
		})
	}
}
