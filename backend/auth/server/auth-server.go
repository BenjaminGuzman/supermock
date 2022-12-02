package server

import (
	authpb "auth/protobuf"
	"context"
	"errors"
	"fmt"
	"github.com/golang-jwt/jwt/v4"
)

type jwtPayload struct {
	UserId string `json:"userId"`
	jwt.RegisteredClaims
}

type AuthServer struct {
	authpb.UnimplementedAuthServiceServer
	secret []byte
	algo   jwt.SigningMethod
}

func NewAuthServer(secret []byte) *AuthServer {
	return &AuthServer{algo: jwt.SigningMethodHS512, secret: secret}
}

func (server *AuthServer) CreateJWT(ctx context.Context, userId *authpb.UserId) (*authpb.JWT, error) {
	token := jwt.NewWithClaims(server.algo, jwtPayload{UserId: userId.GetUserId()})

	signedToken, err := token.SignedString(server.secret)
	if err != nil {
		return nil, err
	}

	return &authpb.JWT{Jwt: signedToken}, nil
}

func (server *AuthServer) DecodeJWT(ctx context.Context, token *authpb.JWT) (*authpb.JWTVerification, error) {
	parsedToken, err := jwt.ParseWithClaims(
		token.Jwt,
		&jwtPayload{},
		func(token *jwt.Token) (interface{}, error) {
			return server.secret, nil
		},
		jwt.WithValidMethods([]string{server.algo.Alg()}),
	)
	if err != nil {
		return nil, err
	}

	claims, ok := parsedToken.Claims.(jwtPayload)
	if !ok {
		return nil, fmt.Errorf("invalid payload")
	}

	if parsedToken.Valid {
		return &authpb.JWTVerification{UserId: claims.UserId, Status: authpb.VerificationStatus_VALID}, nil
	} else if errors.Is(err, jwt.ErrTokenExpired) {
		return &authpb.JWTVerification{UserId: claims.UserId, Status: authpb.VerificationStatus_EXPIRED}, nil
	} else {
		return &authpb.JWTVerification{UserId: claims.UserId, Status: authpb.VerificationStatus_INVALID}, nil
	}
}
