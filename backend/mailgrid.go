package backend

import (
	"context"
	"github.com/bravo1goingdark/mailgrid/cli"
)

type MailgridService struct {
	ctx context.Context
}

// NewMailgridService Wails requires this method
func NewMailgridService() *MailgridService {
	return &MailgridService{}
}

func (m *MailgridService) SendTestEmail(ctx context.Context, to string, subject string, body string) error {
	// Use your existing CLI logic
	return cli.HasMissingFields(to) // Assuming you have this function
}
