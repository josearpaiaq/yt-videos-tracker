package auth

import (
	"context"

	"google.golang.org/api/idtoken"
)

type GoogleIdentity struct {
	Subject string
	Email   string
	Name    string
	Picture string
}

type GoogleVerifier interface {
	Verify(ctx context.Context, credential string) (GoogleIdentity, error)
}

type googleVerifier struct {
	clientID string
}

func NewGoogleVerifier(clientID string) GoogleVerifier {
	return googleVerifier{clientID: clientID}
}

// Verify validates a Google Identity Services ID token issued for our client ID.
func (g googleVerifier) Verify(ctx context.Context, credential string) (GoogleIdentity, error) {
	payload, err := idtoken.Validate(ctx, credential, g.clientID)
	if err != nil {
		return GoogleIdentity{}, err
	}
	claim := func(name string) string {
		v, _ := payload.Claims[name].(string)
		return v
	}
	return GoogleIdentity{
		Subject: payload.Subject,
		Email:   claim("email"),
		Name:    claim("name"),
		Picture: claim("picture"),
	}, nil
}
