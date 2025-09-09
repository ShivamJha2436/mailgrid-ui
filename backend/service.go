package backend

import (
	"github.com/bravo1goingdark/mailgrid/cli"
)

// Run executes the Mailgrid workflow using provided UIArgs.
func (m *MailgridService) Run(args UIArgs) error {
	cliArgs, cleanup, err := toCLIArgs(args, false)
	if err != nil { return err }
	defer cleanup()
	return cli.Run(cliArgs)
}

// Preview starts the preview server using the first recipient and the template.
func (m *MailgridService) Preview(args UIArgs) error {
	cliArgs, cleanup, err := toCLIArgs(args, true)
	if err != nil { return err }
	defer cleanup()
	return cli.Run(cliArgs)
}

// ScheduleJob schedules an email job for later execution.
func (m *MailgridService) ScheduleJob(args UIArgs) error {
	cliArgs, cleanup, err := toCLIArgs(args, false)
	if err != nil { return err }
	defer cleanup()
	return cli.Run(cliArgs)
}

// ListJobs returns a list of scheduled jobs.
func (m *MailgridService) ListJobs(dbPath string) ([]map[string]interface{}, error) {
	cliArgs := cli.CLIArgs{
		ListJobs:    true,
		SchedulerDB: ifEmpty(dbPath, "mailgrid.db"),
	}
	// This will need modification in the CLI to return structured data instead of printing
	// For now, we'll return an empty list and the CLI will print to stdout
	err := cli.Run(cliArgs)
	return []map[string]interface{}{}, err
}

// CancelJob cancels a scheduled job by ID.
func (m *MailgridService) CancelJob(jobID, dbPath string) error {
	cliArgs := cli.CLIArgs{
		CancelJobID: jobID,
		SchedulerDB: ifEmpty(dbPath, "mailgrid.db"),
	}
	return cli.Run(cliArgs)
}

// RunScheduler starts the scheduler daemon in the background.
func (m *MailgridService) RunScheduler(dbPath string) error {
	// This should be run in a separate goroutine in a real implementation
	cliArgs := cli.CLIArgs{
		SchedulerRun: true,
		SchedulerDB:  ifEmpty(dbPath, "mailgrid.db"),
	}
	return cli.Run(cliArgs)
}

