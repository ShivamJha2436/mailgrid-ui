package main

import (
	"context"
	"fmt"
	"os"
	"strings"
	"encoding/json"
	"io/ioutil"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	"mailgrid-ui/backend"
)

// App struct
type App struct {
	ctx context.Context
	mailgrid *backend.MailgridService
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		mailgrid: &backend.MailgridService{},
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// OpenFile opens a file picker and returns the selected path.
func (a *App) OpenFile(title string, patterns []string) (string, error) {
	opts := runtime.OpenDialogOptions{Title: title}
	if len(patterns) > 0 {
		opts.Filters = []runtime.FileFilter{{DisplayName: "Allowed Files", Pattern: strings.Join(patterns, ";")}}
	}
	path, err := runtime.OpenFileDialog(a.ctx, opts)
	if err != nil {
		return "", err
	}
	return path, nil
}

// OpenSaveFile opens a save file dialog and returns the destination path.
func (a *App) OpenSaveFile(title string, defaultName string, patterns []string) (string, error) {
	opts := runtime.SaveDialogOptions{Title: title, DefaultFilename: defaultName}
	if len(patterns) > 0 {
		opts.Filters = []runtime.FileFilter{{DisplayName: "Allowed Files", Pattern: strings.Join(patterns, ";")}}
	}
	path, err := runtime.SaveFileDialog(a.ctx, opts)
	if err != nil {
		return "", err
	}
	return path, nil
}

// SaveTextFile writes the given content to the provided path.
func (a *App) SaveTextFile(path string, content string) error {
	return os.WriteFile(path, []byte(content), 0o644)
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

// CallMailgrid executes the mailgrid email campaign
func (a *App) CallMailgrid(args backend.UIArgs) map[string]interface{} {
	err := a.mailgrid.Run(args)
	if err != nil {
		return map[string]interface{}{
			"success": false,
			"error": err.Error(),
		}
	}
	return map[string]interface{}{
		"success": true,
		"message": "Campaign executed successfully",
	}
}

// PreviewMailgrid starts the preview server
func (a *App) PreviewMailgrid(args backend.UIArgs) map[string]interface{} {
	err := a.mailgrid.Preview(args)
	if err != nil {
		return map[string]interface{}{
			"success": false,
			"error": err.Error(),
		}
	}
	return map[string]interface{}{
		"success": true,
		"message": "Preview server started",
	}
}

// SaveSMTPConfig saves SMTP configuration to a JSON file
func (a *App) SaveSMTPConfig(config map[string]interface{}, path string) error {
	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return err
	}
	return ioutil.WriteFile(path, data, 0644)
}

// LoadSMTPConfig loads SMTP configuration from a JSON file
func (a *App) LoadSMTPConfig(path string) (map[string]interface{}, error) {
	data, err := ioutil.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var config map[string]interface{}
	err = json.Unmarshal(data, &config)
	if err != nil {
		return nil, err
	}
	return config, nil
}

// ScheduleMailgrid schedules an email campaign
func (a *App) ScheduleMailgrid(args backend.UIArgs) map[string]interface{} {
	err := a.mailgrid.ScheduleJob(args)
	if err != nil {
		return map[string]interface{}{
			"success": false,
			"error": err.Error(),
		}
	}
	return map[string]interface{}{
		"success": true,
		"message": "Campaign scheduled successfully",
	}
}

// ListScheduledJobs lists all scheduled jobs
func (a *App) ListScheduledJobs(dbPath string) map[string]interface{} {
	jobs, err := a.mailgrid.ListJobs(dbPath)
	if err != nil {
		return map[string]interface{}{
			"success": false,
			"error": err.Error(),
			"jobs": []map[string]interface{}{},
		}
	}
	return map[string]interface{}{
		"success": true,
		"jobs": jobs,
	}
}

// CancelScheduledJob cancels a scheduled job
func (a *App) CancelScheduledJob(jobID, dbPath string) map[string]interface{} {
	err := a.mailgrid.CancelJob(jobID, dbPath)
	if err != nil {
		return map[string]interface{}{
			"success": false,
			"error": err.Error(),
		}
	}
	return map[string]interface{}{
		"success": true,
		"message": "Job cancelled successfully",
	}
}

// StartScheduler starts the job scheduler daemon
func (a *App) StartScheduler(dbPath string) map[string]interface{} {
	// This should be run in a goroutine to not block the UI
	go func() {
		err := a.mailgrid.RunScheduler(dbPath)
		if err != nil {
			// Log error or emit event to frontend
			fmt.Printf("Scheduler error: %v\n", err)
		}
	}()
	return map[string]interface{}{
		"success": true,
		"message": "Scheduler started",
	}
}
