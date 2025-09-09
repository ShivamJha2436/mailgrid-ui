package backend

import (
	"context"
)

type MailgridService struct {
	ctx context.Context
}

// NewMailgridService Wails requires this method
func NewMailgridService() *MailgridService {
	return &MailgridService{}
}

// SendTestEmail is a placeholder for future features
func (m *MailgridService) SendTestEmail(ctx context.Context, to string, subject string, body string) error {
	_ = to
	_ = subject
	_ = body
	return nil
}
