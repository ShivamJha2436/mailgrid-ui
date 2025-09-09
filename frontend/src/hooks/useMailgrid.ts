import { useCallback, useState } from "react";
import { 
  CallMailgrid, 
  PreviewMailgrid, 
  // ScheduleMailgrid,
  // ListScheduledJobs,
  // CancelScheduledJob,
  // StartScheduler,
  OpenFile as openFileDialog 
} from "../../wailsjs/go/main/App";
import { backend } from "../../wailsjs/go/models";

export type UIArgs = Partial<backend.UIArgs> & { 
  envPath: string;
  scheduleAt?: string;
  interval?: string;
  cron?: string;
  jobRetries?: number;
  jobBackoff?: string;
  schedulerDB?: string;
};

export function useMailgrid() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (args: UIArgs) => {
    setLoading(true); setError(null);
    try { 
      // Fill in defaults for required fields
      const fullArgs = new backend.UIArgs({
        envPath: args.envPath,
        csvPath: args.csvPath || '',
        csvContent: args.csvContent || '',
        sheetUrl: args.sheetUrl || '',
        templatePath: args.templatePath || '',
        templateHTML: args.templateHTML || '',
        subject: args.subject || '',
        text: args.text || '',
        attachments: args.attachments || [],
        cc: args.cc || '',
        bcc: args.bcc || '',
        concurrency: args.concurrency || 10,
        retryLimit: args.retryLimit || 3,
        batchSize: args.batchSize || 50,
        filter: args.filter || '',
        dryRun: args.dryRun || false,
        showPreview: args.showPreview || false,
        previewPort: args.previewPort || 8080,
        to: args.to || '',
        scheduleAt: args.scheduleAt || '',
        interval: args.interval || '',
        cron: args.cron || '',
        jobRetries: args.jobRetries || 3,
        jobBackoff: args.jobBackoff || '2s',
        schedulerDB: args.schedulerDB || 'mailgrid.db'
      });
      const result = await CallMailgrid(fullArgs);
      if (!result.success) {
        throw new Error(result.error || 'Failed to send emails');
      }
    }
    catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); throw e; }
    finally { setLoading(false); }
  }, []);

  const preview = useCallback(async (args: UIArgs) => {
    setLoading(true); setError(null);
    try { 
      // Fill in defaults for required fields
      const fullArgs = new backend.UIArgs({
        envPath: args.envPath,
        csvPath: args.csvPath || '',
        csvContent: args.csvContent || '',
        sheetUrl: args.sheetUrl || '',
        templatePath: args.templatePath || '',
        templateHTML: args.templateHTML || '',
        subject: args.subject || '',
        text: args.text || '',
        attachments: args.attachments || [],
        cc: args.cc || '',
        bcc: args.bcc || '',
        concurrency: args.concurrency || 10,
        retryLimit: args.retryLimit || 3,
        batchSize: args.batchSize || 50,
        filter: args.filter || '',
        dryRun: args.dryRun || false,
        showPreview: true,  // Always true for preview
        previewPort: args.previewPort || 8080,
        to: args.to || '',
        scheduleAt: args.scheduleAt || '',
        interval: args.interval || '',
        cron: args.cron || '',
        jobRetries: args.jobRetries || 3,
        jobBackoff: args.jobBackoff || '2s',
        schedulerDB: args.schedulerDB || 'mailgrid.db'
      });
      const result = await PreviewMailgrid(fullArgs);
      if (!result.success) {
        throw new Error(result.error || 'Failed to start preview');
      }
    }
    catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); throw e; }
    finally { setLoading(false); }
  }, []);

  const schedule = useCallback(async (args: UIArgs) => {
    // Temporarily using regular run method until Wails bindings are regenerated
    return run(args);
  }, [run]);

  // TODO: Uncomment when Wails bindings are regenerated
  // const listJobs = useCallback(async (dbPath: string = 'mailgrid.db') => {
  //   try {
  //     const result = await ListScheduledJobs(dbPath);
  //     if (!result.success) {
  //       throw new Error(result.error || 'Failed to list jobs');
  //     }
  //     return result.jobs || [];
  //   } catch (e: unknown) {
  //     setError(e instanceof Error ? e.message : String(e));
  //     return [];
  //   }
  // }, []);

  // const cancelJob = useCallback(async (jobId: string, dbPath: string = 'mailgrid.db') => {
  //   try {
  //     const result = await CancelScheduledJob(jobId, dbPath);
  //     if (!result.success) {
  //       throw new Error(result.error || 'Failed to cancel job');
  //     }
  //   } catch (e: unknown) {
  //     setError(e instanceof Error ? e.message : String(e));
  //     throw e;
  //   }
  // }, []);

  // const startScheduler = useCallback(async (dbPath: string = 'mailgrid.db') => {
  //   try {
  //     const result = await StartScheduler(dbPath);
  //     if (!result.success) {
  //       throw new Error(result.error || 'Failed to start scheduler');
  //     }
  //   } catch (e: unknown) {
  //     setError(e instanceof Error ? e.message : String(e));
  //     throw e;
  //   }
  // }, []);

  const pickFile = useCallback(async (title: string, patterns?: string[]) => {
    try { const p = await openFileDialog(title, patterns ?? []); return p ?? ""; }
    catch { return ""; }
  }, []);

  return { run, preview, schedule, pickFile, loading, error };
}

