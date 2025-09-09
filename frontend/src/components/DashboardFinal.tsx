import { useState, useCallback, useMemo, useEffect } from "react";
import { 
  Send, Eye, Paperclip, X, ChevronRight, FileText,
  CheckCircle2, Loader2, Code2, Mail, Upload,
  Database, Sun, Moon, Settings,
  Zap,
  TestTube
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MonacoEditor from "@monaco-editor/react";
import { useMailgrid } from "../hooks/useMailgrid";
import { useTheme } from "../context/theme";
import { templateEngine } from '../utils/templateEngine';
import SmtpSection from './sidebar/SmtpSection';
import RecipientsSection from './sidebar/RecipientsSection';
import SchedulingSection from './sidebar/SchedulingSection';

// Sample CSV data for preview
const SAMPLE_DATA = [
  { name: "John Doe", email: "john@example.com", company: "TechCorp", role: "Developer", tier: "pro", age: "28" },
  { name: "Jane Smith", email: "jane@example.com", company: "DesignHub", role: "Designer", tier: "premium", age: "32" },
  { name: "Mike Johnson", email: "mike@example.com", company: "DataFlow", role: "Analyst", tier: "pro", age: "25" },
];

const DEFAULT_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      background: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
      color: white;
      padding: 48px 32px;
      text-align: center;
    }
    .header h1 {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .content {
      padding: 48px 32px;
    }
    .greeting {
      font-size: 24px;
      color: #10b981;
      font-weight: 600;
      margin-bottom: 24px;
    }
    .button {
      display: inline-block;
      padding: 16px 32px;
      background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin-top: 32px;
    }
    .footer {
      background: #f9fafb;
      padding: 24px 32px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to {{.company}}!</h1>
      <p>We're thrilled to have you join our community</p>
    </div>
    <div class="content">
      <div class="greeting">Hello {{.name}} 👋</div>
      <p>As a {{.role}} at {{.company}}, you're now part of our {{.tier}} tier membership.</p>
      <p style="margin-top: 16px;">We've prepared everything for you to get started. Your account is active and ready to explore.</p>
      <a href="#" class="button">Get Started →</a>
    </div>
    <div class="footer">
      <p>© 2024 {{.company}}. All rights reserved.</p>
      <p style="margin-top: 8px; font-size: 12px;">This email was sent to {{.email}}</p>
    </div>
  </div>
</body>
</html>`;

export default function DashboardFinal() {
  const { run, preview, schedule, pickFile, loading } = useMailgrid();
  const { dark, toggle: toggleTheme } = useTheme();
  
  // Core state - All CLI features
  const [envPath, setEnvPath] = useState("");
  const [csvPath, setCsvPath] = useState("");
  const [sheetUrl, setSheetUrl] = useState("");
  const [templatePath, setTemplatePath] = useState("");
  const [useEditor, setUseEditor] = useState(true);
  const [subject, setSubject] = useState("Welcome to {{.company}} - Let's Get Started! 🚀");
  const [templateHTML, setTemplateHTML] = useState(DEFAULT_TEMPLATE);
  const [plainText, setPlainText] = useState("");
  
  // All CLI flags
  const [attachments, setAttachments] = useState<string[]>([]);
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [to, setTo] = useState(""); // Single recipient override
  const [concurrency, setConcurrency] = useState(10);
  const [retries, setRetries] = useState(3);
  const [batchSize, setBatchSize] = useState(50);
  const [filter, setFilter] = useState("");
  const [dryRun, setDryRun] = useState(false);
  const [rateLimit, setRateLimit] = useState(10);
  const [timeout, setTimeout] = useState(5000);
  
  // Scheduling state
  const [scheduleAt, setScheduleAt] = useState("");
  const [interval, setInterval] = useState("");
  const [cron, setCron] = useState("");
  const [jobRetries, setJobRetries] = useState(3);
  const [jobBackoff, setJobBackoff] = useState("2s");
  const [schedulerDB, setSchedulerDB] = useState("mailgrid.db");
  
  // UI state
  const [activeView, setActiveView] = useState<"editor" | "preview" | "data">("editor");
  const [logs, setLogs] = useState<Array<{type: 'info' | 'error' | 'success', msg: string, time: string}>>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dataSource, setDataSource] = useState<"csv" | "sheet">("csv");
  const [previewRecipient, setPreviewRecipient] = useState(0);
  const [csvData, setCsvData] = useState<any[]>(SAMPLE_DATA);
  const [csvContent, setCsvContent] = useState('');
  const [isLoadingCsv, setIsLoadingCsv] = useState(false);
  const [stats, setStats] = useState({ sent: 0, failed: 0, pending: 0, total: 0 });

  // Define addLog first
  const addLog = useCallback((type: 'info' | 'error' | 'success', msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [{type, msg, time}, ...prev].slice(0, 100));
  }, []);

  // Process CSV content when it changes
  useEffect(() => {
    if (csvContent) {
      setIsLoadingCsv(true);
      templateEngine.parseCSV(csvContent)
        .then(data => {
          setCsvData(data.length > 0 ? data : SAMPLE_DATA);
          setPreviewRecipient(0);
          addLog('success', `Loaded ${data.length} recipients from CSV`);
        })
        .catch((err: any) => {
          addLog('error', `Failed to parse CSV: ${err.message}`);
          setCsvData(SAMPLE_DATA);
        })
        .finally(() => setIsLoadingCsv(false));
    }
  }, [csvContent, addLog]);

  // Parse template with actual data using proper Go template engine
  const renderTemplate = useCallback((template: string, data: any) => {
    return templateEngine.processTemplate(template, data);
  }, []);

  const renderedHTML = useMemo(() => {
    const recipient = csvData[previewRecipient] || csvData[0];
    return renderTemplate(templateHTML, recipient);
  }, [templateHTML, csvData, previewRecipient, renderTemplate]);

  const renderedSubject = useMemo(() => {
    const recipient = csvData[previewRecipient] || csvData[0];
    return renderTemplate(subject, recipient);
  }, [subject, csvData, previewRecipient, renderTemplate]);

  const canSend = useMemo(() => {
    const hasData = !!csvPath || !!sheetUrl || !!to;
    const hasTemplate = (useEditor && !!templateHTML) || (!useEditor && !!templatePath) || !!plainText;
    return !!envPath && hasData && hasTemplate && !loading;
  }, [envPath, csvPath, sheetUrl, to, templateHTML, templatePath, plainText, useEditor, loading]);
  
  const canSchedule = useMemo(() => {
    return canSend && (!!scheduleAt || !!interval || !!cron);
  }, [canSend, scheduleAt, interval, cron]);

  const handlePickFile = async (setter: (v: string) => void, title: string, patterns?: string[]) => {
    const path = await pickFile(title, patterns);
    if (path) setter(path);
  };


  const handlePreview = async () => {
    if (!canSend) {
      addLog('error', 'Please complete setup first');
      return;
    }
    addLog('info', 'Starting preview server...');
    try {
      await preview({
        envPath, csvPath, csvContent, sheetUrl, subject,
        templateHTML: useEditor ? templateHTML : "",
        templatePath: useEditor ? "" : templatePath,
        text: plainText, attachments, cc, bcc,
        concurrency, retryLimit: retries,
        batchSize, filter, dryRun,
        showPreview: true, previewPort: 8080, to
      });
      addLog('success', '✨ Preview running at http://localhost:8080');
      window.open('http://localhost:8080', '_blank');
    } catch (e) {
      addLog('error', e instanceof Error ? e.message : String(e));
    }
  };

  const handleSend = async () => {
    if (!canSend) return;
    
    const totalRecipients = to ? 1 : csvData.length;
    setStats({ sent: 0, failed: 0, pending: totalRecipients, total: totalRecipients });
    const action = dryRun ? 'test run' : 'campaign';
    addLog('info', `🚀 Starting ${action} for ${totalRecipients} recipient(s)...`);
    
    try {
      await run({
        envPath, csvPath, csvContent, sheetUrl, subject,
        templateHTML: useEditor ? templateHTML : "",
        templatePath: useEditor ? "" : templatePath,
        text: plainText, attachments, cc, bcc,
        concurrency, retryLimit: retries,
        batchSize, filter, dryRun,
        showPreview: false, previewPort: 8080, to,
        schedulerDB
      });
      setStats({ sent: totalRecipients, failed: 0, pending: 0, total: totalRecipients });
      addLog('success', dryRun ? '✅ Test completed!' : `🎉 All ${totalRecipients} emails sent!`);
    } catch (e) {
      setStats(prev => ({ ...prev, failed: prev.pending, pending: 0 }));
      addLog('error', e instanceof Error ? e.message : String(e));
    }
  };

  const handleSchedule = async () => {
    if (!canSchedule) { addLog('error', 'Please configure schedule'); return; }
    try {
      await schedule({
        envPath, csvPath, csvContent, sheetUrl, subject,
        templateHTML: useEditor ? templateHTML : "",
        templatePath: useEditor ? "" : templatePath,
        text: plainText, attachments, cc, bcc,
        concurrency, retryLimit: retries,
        batchSize, filter, dryRun: false,
        showPreview: false, previewPort: 8080, to,
        scheduleAt, interval, cron,
        jobRetries, jobBackoff, schedulerDB
      });
      addLog('success', '📅 Campaign scheduled');
    } catch (e) {
      addLog('error', e instanceof Error ? e.message : String(e));
    }
  };

  const cardClass = "bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700";
  const inputClass = "w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all";
  const labelClass = "text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block";
  const buttonClass = "px-3 py-2 text-sm font-medium rounded-md transition-all";

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">
      {/* Header - Like AuthScreen */}
      <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="h-full max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">
              <span className="text-green-600 dark:text-green-400">Mail</span>
              <span className="text-blue-600 dark:text-blue-400">grid</span>
            </h1>
            
            {/* Status Pills */}
            <div className="flex items-center gap-3">
              {stats.total > 0 ? (
                <>
                  {stats.sent > 0 && (
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                      {stats.sent} sent
                    </span>
                  )}
                  {stats.pending > 0 && (
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {stats.pending} pending
                    </span>
                  )}
                  {stats.failed > 0 && (
                    <span className="px-2 py-1 text-xs rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                      {stats.failed} failed
                    </span>
                  )}
                </>
              ) : (
                <span className="px-2 py-1 text-xs rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  Ready
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePreview}
              disabled={!canSend}
              className="px-4 py-2 text-sm font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md disabled:opacity-50 transition-colors"
            >
              <Eye className="w-4 h-4 inline mr-2" />
              Preview
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSend}
              disabled={!canSend}
              className={`px-4 py-2 text-sm font-medium rounded-md disabled:opacity-50 transition-all ${
                dryRun 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
              ) : dryRun ? (
                <TestTube className="w-4 h-4 inline mr-2" />
              ) : (
                <Send className="w-4 h-4 inline mr-2" />
              )}
              {dryRun ? 'Test Run' : 'Send Campaign'}
            </motion.button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <aside className="w-80 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Quick Setup */}
            <div className={cardClass + " p-4"}>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                Quick Setup
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {envPath ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <div className="w-4 h-4 rounded-full border-2 border-zinc-300 dark:border-zinc-600" />}
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">SMTP Configuration</span>
                </div>
                <div className="flex items-center gap-2">
                  {(csvPath || sheetUrl || to) ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <div className="w-4 h-4 rounded-full border-2 border-zinc-300 dark:border-zinc-600" />}
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Recipients</span>
                </div>
                <div className="flex items-center gap-2">
                  {(templateHTML || templatePath || plainText) ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <div className="w-4 h-4 rounded-full border-2 border-zinc-300 dark:border-zinc-600" />}
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Email Content</span>
                </div>
              </div>
            </div>

            <SmtpSection
              envPath={envPath}
              setEnvPath={setEnvPath}
              onPickFile={handlePickFile}
              onAddLog={addLog}
              inputClass={inputClass}
              buttonClass={buttonClass}
              cardClass={cardClass}
            />

            <RecipientsSection
              dataSource={dataSource}
              setDataSource={setDataSource}
              csvPath={csvPath}
              setCsvPath={setCsvPath}
              sheetUrl={sheetUrl}
              setSheetUrl={setSheetUrl}
              to={to}
              setTo={setTo}
              csvContent={csvContent}
              setCsvContent={setCsvContent}
              cc={cc}
              setCc={setCc}
              bcc={bcc}
              setBcc={setBcc}
              csvData={csvData}
              isLoadingCsv={isLoadingCsv}
              onPickFile={handlePickFile}
              inputClass={inputClass}
              buttonClass={buttonClass}
              cardClass={cardClass}
            />

            {/* Email Content */}
            <div className={cardClass + " p-4"}>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Content
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className={inputClass}
                  />
                </div>
                
                {/* Template Source Toggle */}
                <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                  <button
                    onClick={() => setUseEditor(true)}
                    className={`py-1.5 text-xs font-medium rounded transition-all ${
                      useEditor 
                        ? "bg-white dark:bg-zinc-700 shadow-sm" 
                        : "hover:bg-white/50 dark:hover:bg-zinc-700/50"
                    }`}
                  >
                    <Code2 className="w-3 h-3 inline mr-1" />
                    Editor
                  </button>
                  <button
                    onClick={() => setUseEditor(false)}
                    className={`py-1.5 text-xs font-medium rounded transition-all ${
                      !useEditor 
                        ? "bg-white dark:bg-zinc-700 shadow-sm" 
                        : "hover:bg-white/50 dark:hover:bg-zinc-700/50"
                    }`}
                  >
                    <FileText className="w-3 h-3 inline mr-1" />
                    File
                  </button>
                </div>
                
                {!useEditor && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={templatePath}
                      onChange={e => setTemplatePath(e.target.value)}
                      placeholder="template.html"
                      className={inputClass + " flex-1"}
                    />
                    <button
                      onClick={() => handlePickFile(setTemplatePath, "Choose template", ["*.html"])}
                      className={buttonClass + " bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"}
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                <div>
                  <label className={labelClass}>Plain Text Alternative</label>
                  <textarea
                    value={plainText}
                    onChange={e => setPlainText(e.target.value)}
                    placeholder="Optional plain text version"
                    rows={3}
                    className={inputClass}
                  />
                </div>
                
                {/* Attachments */}
                <div>
                  <label className={labelClass}>Attachments</label>
                  <div className="space-y-2">
                    {attachments.map((file, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded">
                        <Paperclip className="w-3 h-3 text-zinc-500" />
                        <span className="text-sm flex-1 truncate">{file.split('\\').pop()}</span>
                        <button
                          onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                          className="text-zinc-500 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={async () => {
                        const file = await pickFile("Add attachment");
                        if (file) setAttachments(prev => [...prev, file]);
                      }}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      + Add attachment
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Settings */}
            <div className={cardClass + " p-4"}>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between text-sm font-semibold"
              >
                <span className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Advanced Settings
                </span>
                <ChevronRight className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
              </button>
              
              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-3 space-y-3 overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-zinc-600 dark:text-zinc-400">Workers</label>
                        <input type="number" value={concurrency} onChange={e => setConcurrency(parseInt(e.target.value) || 1)} className={inputClass} />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-600 dark:text-zinc-400">Retries</label>
                        <input type="number" value={retries} onChange={e => setRetries(parseInt(e.target.value) || 0)} className={inputClass} />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-600 dark:text-zinc-400">Batch Size</label>
                        <input type="number" value={batchSize} onChange={e => setBatchSize(parseInt(e.target.value) || 1)} className={inputClass} />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-600 dark:text-zinc-400">Rate Limit/sec</label>
                        <input type="number" value={rateLimit} onChange={e => setRateLimit(parseInt(e.target.value) || 10)} className={inputClass} />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-zinc-600 dark:text-zinc-400">Timeout (ms)</label>
                        <input type="number" value={timeout} onChange={e => setTimeout(parseInt(e.target.value) || 5000)} className={inputClass} />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-xs text-zinc-600 dark:text-zinc-400">Filter Expression</label>
                      <input
                        type="text"
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        placeholder='tier = "pro" and age > 25'
                        className={inputClass}
                      />
                    </div>
                    
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={dryRun}
                        onChange={e => setDryRun(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-zinc-700 dark:text-zinc-300">Dry run (test without sending)</span>
                    </label>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <SchedulingSection
              scheduleAt={scheduleAt}
              setScheduleAt={setScheduleAt}
              interval={interval}
              setInterval={setInterval}
              cron={cron}
              setCron={setCron}
              jobRetries={jobRetries}
              setJobRetries={setJobRetries}
              jobBackoff={jobBackoff}
              setJobBackoff={setJobBackoff}
              schedulerDB={schedulerDB}
              setSchedulerDB={setSchedulerDB}
              onSchedule={handleSchedule}
              onAddLog={addLog}
              loading={loading}
              canSchedule={canSchedule}
              inputClass={inputClass}
              buttonClass={buttonClass}
              cardClass={cardClass}
              labelClass={labelClass}
            />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {/* Tabs */}
          <div className="h-12 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center px-4 gap-4">
            <button
              onClick={() => setActiveView("editor")}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-all ${
                activeView === "editor"
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <Code2 className="w-4 h-4 inline mr-2" />
              Template Editor
            </button>
            <button
              onClick={() => setActiveView("preview")}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-all ${
                activeView === "preview"
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <Eye className="w-4 h-4 inline mr-2" />
              Preview
            </button>
            <button
              onClick={() => setActiveView("data")}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-all ${
                activeView === "data"
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <Database className="w-4 h-4 inline mr-2" />
              Data ({csvData.length})
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {activeView === "editor" && useEditor && (
              <MonacoEditor
                height="100%"
                defaultLanguage="html"
                theme={dark ? "vs-dark" : "vs"}
                value={templateHTML}
                onChange={value => setTemplateHTML(value || "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: "on",
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  padding: { top: 20, bottom: 20 },
                  automaticLayout: true,
                }}
              />
            )}
            
            {activeView === "preview" && (
              <div className="h-full p-6 bg-zinc-50 dark:bg-zinc-950 overflow-auto">
                <div className="max-w-4xl mx-auto">
                  <div className="mb-4 flex items-center justify-between">
                    <select
                      value={previewRecipient}
                      onChange={e => setPreviewRecipient(parseInt(e.target.value))}
                      className={inputClass + " w-auto"}
                    >
                      {csvData.map((r, i) => (
                        <option key={i} value={i}>{r.name} - {r.email}</option>
                      ))}
                    </select>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      Subject: <span className="font-medium">{renderedSubject}</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                    <iframe
                      title="preview"
                      className="w-full h-[600px]"
                      srcDoc={renderedHTML}
                      sandbox="allow-same-origin"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {activeView === "data" && (
              <div className="h-full p-6 bg-zinc-50 dark:bg-zinc-950 overflow-auto">
                <table className="w-full bg-white dark:bg-zinc-900 rounded-lg overflow-hidden">
                  <thead className="bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                    <tr>
                      {Object.keys(csvData[0]).map(key => (
                        <th key={key} className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                    {csvData.map((row, i) => (
                      <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800">
                        {Object.values(row).map((val, j) => (
                          <td key={j} className="px-4 py-3 text-sm">{String(val)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Activity Log */}
          <div className="h-32 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-900 dark:bg-black">
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700">
              <span className="text-xs font-medium text-zinc-400 uppercase">Activity</span>
              <button onClick={() => setLogs([])} className="text-xs text-zinc-500 hover:text-zinc-300">
                Clear
              </button>
            </div>
            <div className="h-20 overflow-y-auto px-4 py-2 font-mono text-xs">
              {logs.length === 0 ? (
                <div className="text-zinc-500">Ready to send emails...</div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {log.type === 'error' && <span className="text-red-400">✗</span>}
                    {log.type === 'success' && <span className="text-green-400">✓</span>}
                    {log.type === 'info' && <span className="text-blue-400">→</span>}
                    <span className="text-zinc-500">{log.time}</span>
                    <span className={
                      log.type === 'error' ? 'text-red-400' :
                      log.type === 'success' ? 'text-green-400' :
                      'text-zinc-300'
                    }>{log.msg}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
