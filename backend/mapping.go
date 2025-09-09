package backend

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/bravo1goingdark/mailgrid/cli"
)

// toCLIArgs maps UIArgs to cli.CLIArgs. It persists TemplateHTML to a temp file if needed.
func toCLIArgs(in UIArgs, forcePreview bool) (cli.CLIArgs, func(), error) {
	cleanup := func() {}

	// validate env file exists to avoid fatal in library
	if in.EnvPath == "" {
		return cli.CLIArgs{}, cleanup, fmt.Errorf("SMTP config path is required")
	}
	if _, err := os.Stat(in.EnvPath); err != nil {
		return cli.CLIArgs{}, cleanup, fmt.Errorf("SMTP config not found: %s", in.EnvPath)
	}

	// Ensure we have a template path. If TemplateHTML provided, write to a temp file.
	templatePath := in.TemplatePath
	if strings.TrimSpace(in.TemplateHTML) != "" {
		dir := os.TempDir()
		f, err := os.CreateTemp(dir, "mailgrid-ui-*.html")
		if err != nil {
			return cli.CLIArgs{}, cleanup, fmt.Errorf("failed to create temp template: %w", err)
		}
		if _, err := f.WriteString(in.TemplateHTML); err != nil {
			_ = f.Close()
			return cli.CLIArgs{}, cleanup, fmt.Errorf("failed to write temp template: %v", err)
		}
		_ = f.Close()
		templatePath = f.Name()
		cleanup = func() { _ = os.Remove(templatePath) }
	}

	// Handle CSV content - write to temp file if provided
	csvPath := in.CsvPath
	if strings.TrimSpace(in.CsvContent) != "" && csvPath == "" {
		dir := os.TempDir()
		f, err := os.CreateTemp(dir, "mailgrid-ui-*.csv")
		if err != nil {
			cleanup()
			return cli.CLIArgs{}, cleanup, fmt.Errorf("failed to create temp CSV: %w", err)
		}
		if _, err := f.WriteString(in.CsvContent); err != nil {
			_ = f.Close()
			cleanup()
			return cli.CLIArgs{}, cleanup, fmt.Errorf("failed to write temp CSV: %v", err)
		}
		_ = f.Close()
		csvPath = f.Name()
		origCleanup := cleanup
		cleanup = func() {
			origCleanup()
			_ = os.Remove(csvPath)
		}
	}

	// Normalize attachments (dedupe) and expand any relative paths (best-effort)
	uniq := make(map[string]struct{})
	var attachments []string
	for _, a := range in.Attachments {
		if a == "" { continue }
		abs := a
		if !filepath.IsAbs(a) {
			if p, err := filepath.Abs(a); err == nil { abs = p }
		}
		if _, ok := uniq[abs]; !ok {
			uniq[abs] = struct{}{}
			attachments = append(attachments, abs)
		}
	}

	return cli.CLIArgs{
		EnvPath:      in.EnvPath,
		CSVPath:      csvPath,
		TemplatePath: templatePath,
		Subject:      in.Subject,
		DryRun:       in.DryRun,
		ShowPreview:  forcePreview || in.ShowPreview,
		PreviewPort:  ifZero(in.PreviewPort, 8080),
		Concurrency:  ifZero(in.Concurrency, 1),
		RetryLimit:   ifZero(in.RetryLimit, 1),
		BatchSize:    ifZero(in.BatchSize, 1),
		SheetURL:     in.SheetUrl,
		Filter:       in.Filter,
		Attachments:  attachments,
		Cc:           in.Cc,
		Bcc:          in.Bcc,
		To:           in.To,
		Text:         in.Text,
		// Scheduling fields
		ScheduleAt:   in.ScheduleAt,
		Interval:     in.Interval,
		Cron:         in.Cron,
		JobRetries:   ifZero(in.JobRetries, 3),
		JobBackoff:   ifEmpty(in.JobBackoff, "2s"),
		SchedulerDB:  ifEmpty(in.SchedulerDB, "mailgrid.db"),
	}, cleanup, nil
}

func ifZero[T ~int](v T, def T) T { if v == 0 { return def }; return v }

func ifEmpty(v, def string) string { if strings.TrimSpace(v) == "" { return def }; return v }

