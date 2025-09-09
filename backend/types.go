package backend

// UIArgs represents the UI payload coming from the frontend
// Keep json tags in lowerCamelCase to match the existing TS usage
// so that generated models align with the frontend code.
type UIArgs struct {
	EnvPath      string   `json:"envPath"`
	CsvPath      string   `json:"csvPath"`
	CsvContent   string   `json:"csvContent"`
	SheetUrl     string   `json:"sheetUrl"`
	TemplatePath string   `json:"templatePath"`
	TemplateHTML string   `json:"templateHTML"`
	Subject      string   `json:"subject"`
	Text         string   `json:"text"`
	Attachments  []string `json:"attachments"`
	Cc           string   `json:"cc"`
	Bcc          string   `json:"bcc"`
	Concurrency  int      `json:"concurrency"`
	RetryLimit   int      `json:"retryLimit"`
	BatchSize    int      `json:"batchSize"`
	Filter       string   `json:"filter"`
	DryRun       bool     `json:"dryRun"`
	ShowPreview  bool     `json:"showPreview"`
	PreviewPort  int      `json:"previewPort"`
	To           string   `json:"to"`
	
	// Scheduling fields
	ScheduleAt   string   `json:"scheduleAt"`
	Interval     string   `json:"interval"`
	Cron         string   `json:"cron"`
	JobRetries   int      `json:"jobRetries"`
	JobBackoff   string   `json:"jobBackoff"`
	SchedulerDB  string   `json:"schedulerDB"`
}

