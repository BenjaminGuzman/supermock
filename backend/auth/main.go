package main

import (
	authpb "auth/protobuf"
	"auth/server"
	"fmt"
	"github.com/joho/godotenv"
	"google.golang.org/grpc"
	"io"
	"log"
	"net"
	"os"
	"strconv"
)

const DefaultPort = "9000"
const DefaultBindIP = "127.0.0.1"

func getServerPort() int16 {
	portStr := os.Getenv("PORT")
	if portStr == "" {
		portStr = DefaultPort
	}

	port, err := strconv.ParseInt(portStr, 10, 16)
	if err != nil {
		log.Fatalf("Port \"%s\" is not a valid port. %s\n", portStr, err)
	}

	if port < 0 {
		log.Fatalf("Port must be an unsigned 4-bit integer (actual port: %d)\n", port)
	}

	return int16(port)
}

func getBindIP() string {
	bindIP := os.Getenv("BIND_IP")
	if bindIP == "" {
		bindIP = DefaultBindIP
	}

	return bindIP
}

func getServerAddress() string {
	return fmt.Sprintf("%s:%d", getBindIP(), getServerPort())
}

func getJWTSecret() []byte {
	secretFile := os.Getenv("SECRET_FILE")
	if secretFile == "" {
		log.Fatalln("SECRET_FILE key is not set in .env")
	}
	file, err := os.OpenFile(secretFile, os.O_RDONLY, 0000)
	if err != nil {
		log.Fatalf("couldn't open secret file. %s\n", err)
	}
	defer file.Close()

	secret, err := io.ReadAll(file)
	if err != nil {
		log.Fatalf("couldn't read recret file. %s\n", err)
	}
	return secret
}

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatalf("Error loading .env file. %s\n", err)
	}

	listener, err := net.Listen("tcp", getServerAddress())
	if err != nil {
		log.Fatal(err)
	}

	grpcServer := grpc.NewServer()
	authServer := server.NewAuthServer(getJWTSecret())
	authpb.RegisterAuthServer(grpcServer, authServer)

	log.Printf("server is listening @ %s\n", listener.Addr().String())
	if err := grpcServer.Serve(listener); err != nil {
		log.Fatal(err)
	}
}
