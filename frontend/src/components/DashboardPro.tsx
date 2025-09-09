import { useState, useCallback, useMemo } from "react";
import { 
  Send, Eye, Paperclip, X, ChevronRight, 
  FileText, Cloud, Sparkles, AlertCircle, 
  CheckCircle2, Loader2, Code2, Mail, Upload,
  Database
} from "lucide-react";
import MonacoEditor from "@monaco-editor/react";
import { useMailgrid } from "../hooks/useMailgrid";
import { useTheme } from "../context/theme";

// Sample CSV data for preview
const SAMPLE_DATA = [
  { name: "John Doe", email: "john@example.com", company: "TechCorp", role: "Developer" },
  { name: "Jane Smith", email: "jane@example.com", company: "DesignHub", role: "Designer" },
  { name: "Mike Johnson", email: "mike@example.com", company: "DataFlow", role: "Analyst" },
];

const DEFAULT_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
    }
    .email-container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      font-size: 28px;
      margin-bottom: 10px;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 20px;
      color: #667eea;
      margin-bottom: 20px;
    }
    .message {
      color: #555;
      margin-bottom: 30px;
    }
    .button {
      display: inline-block;
      padding: 14px 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px 30px;
      text-align: center;
      color: #888;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Welcome to {{.company}}!</h1>
      <p>We're excited to have you on board</p>
    </div>
    <div class="content">
      <div class="greeting">Hi {{.name}},</div>
      <div class="message">
        <p>Thank you for joining us! As a {{.role}} at {{.company}}, you're now part of an amazing journey.</p>
        <p style="margin-top: 15px;">We've prepared everything you need to get started. Your account has been set up and you can begin exploring our platform right away.</p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="#" class="button">Get Started</a>
      </div>
    </div>
    <div class="footer">
      <p>© 2024 {{.company}}. All rights reserved.</p>
      <p style="margin-top: 10px;">This email was sent to {{.email}}</p>
    </div>
  </div>
</body>
</html>`;

export default function DashboardPro() {
  const { run, preview, pickFile, loading } = useMailgrid();
  const { dark, toggle: toggleTheme } = useTheme();
  
  // Core state
  const [envPath, setEnvPath] = useState("");
  const [csvPath, setCsvPath] = useState("");
  const [sheetUrl, setSheetUrl] = useState("");
  const [subject, setSubject] = useState("Welcome to {{.company}} - Let's Get Started! 🚀");
  const [templateHTML, setTemplateHTML] = useState(DEFAULT_TEMPLATE);
  
  // Advanced settings
  const [attachments, setAttachments] = useState<string[]>([]);
  const [cc] = useState("");
  const [bcc] = useState("");
  const [concurrency, setConcurrency] = useState(10);
  const [retries, setRetries] = useState(3);
  const [batchSize, setBatchSize] = useState(50);
  const [filter] = useState("");
  const [dryRun, setDryRun] = useState(false);
  
  // UI state
  const [activeView, setActiveView] = useState<"editor" | "preview" | "data">("editor");
  const [logs, setLogs] = useState<Array<{type: 'info' | 'error' | 'success', msg: string, time: string}>>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dataSource, setDataSource] = useState<"csv" | "sheet">("csv");
  const [previewRecipient, setPreviewRecipient] = useState(0);
  const [csvData] = useState(SAMPLE_DATA);
  const [stats, setStats] = useState({ sent: 0, failed: 0, pending: 0 });

  // Parse template with actual data
  const renderTemplate = useCallback((template: string, data: any) => {
    return template.replace(/\{\{\.(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }, []);

  const renderedHTML = useMemo(() => {
    const recipient = csvData[previewRecipient] || csvData[0];
    return renderTemplate(templateHTML, recipient);
  }, [templateHTML, csvData, previewRecipient, renderTemplate]);

  const renderedSubject = useMemo(() => {
    const recipient = csvData[previewRecipient] || csvData[0];
    return renderTemplate(subject, recipient);
  }, [subject, csvData, previewRecipient, renderTemplate]);

  const addLog = useCallback((type: 'info' | 'error' | 'success', msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [{type, msg, time}, ...prev].slice(0, 100));
  }, []);

  const canSend = useMemo(() => {
    return !!envPath && (!!csvPath || !!sheetUrl) && !!templateHTML && !loading;
  }, [envPath, csvPath, sheetUrl, templateHTML, loading]);

  const handlePickFile = async (setter: (v: string) => void, title: string, patterns?: string[]) => {
    const path = await pickFile(title, patterns);
    if (path) setter(path);
  };

  const handlePreview = async () => {
    if (!canSend) {
      addLog('error', 'Please configure SMTP and add recipients');
      return;
    }
    addLog('info', 'Starting preview server...');
    try {
      await preview({
        envPath, csvPath, sheetUrl, subject,
        templateHTML, templatePath: "",
        text: "", attachments, cc, bcc,
        concurrency, retryLimit: retries,
        batchSize, filter, dryRun,
        showPreview: true, previewPort: 8080, to: ""
      });
      addLog('success', '✨ Preview running at http://localhost:8080');
      window.open('http://localhost:8080', '_blank');
    } catch (e) {
      addLog('error', e instanceof Error ? e.message : String(e));
    }
  };

  const handleSend = async () => {
    if (!canSend) return;
    
    setStats({ sent: 0, failed: 0, pending: csvData.length });
    const action = dryRun ? 'test run' : 'sending';
    addLog('info', `🚀 Starting ${action} for ${csvData.length} recipients...`);
    
    try {
      await run({
        envPath, csvPath, sheetUrl, subject,
        templateHTML, templatePath: "",
        text: "", attachments, cc, bcc,
        concurrency, retryLimit: retries,
        batchSize, filter, dryRun,
        showPreview: false, previewPort: 8080, to: ""
      });
      setStats({ sent: csvData.length, failed: 0, pending: 0 });
      addLog('success', dryRun ? '✅ Test run completed successfully!' : `🎉 All ${csvData.length} emails sent successfully!`);
    } catch (e) {
      setStats(prev => ({ ...prev, failed: prev.pending, pending: 0 }));
      addLog('error', e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      {/* Premium Header */}
      <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 flex items-center px-6 shadow-sm">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                Mailgrid Pro
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Email Campaign Manager</p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-6 ml-auto mr-8">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {stats.sent > 0 ? `${stats.sent} Sent` : 'Ready'}
              </span>
            </div>
            {stats.pending > 0 && (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-sm text-slate-600 dark:text-slate-400">{stats.pending} Pending</span>
              </div>
            )}
            {stats.failed > 0 && (
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-slate-600 dark:text-slate-400">{stats.failed} Failed</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            {dark ? '🌙' : '☀️'}
          </button>
          <button
            onClick={handlePreview}
            disabled={!canSend}
            className="px-4 py-2 text-sm flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-all disabled:opacity-50"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={`px-5 py-2 text-sm flex items-center gap-2 rounded-lg font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 ${
              dryRun 
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-orange-500/25' 
                : 'bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/25'
            }`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {dryRun ? 'Test Run' : 'Send Campaign'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Premium Sidebar */}
        <aside className="w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Quick Setup */}
            <section className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-xl blur-2xl"></div>
              <div className="relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  <h3 className="text-sm font-semibold">Quick Setup</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {envPath ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>
                    )}
                    <span className="text-sm">SMTP Configuration</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {(csvPath || sheetUrl) ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>
                    )}
                    <span className="text-sm">Recipients List</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {templateHTML ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>
                    )}
                    <span className="text-sm">Email Template</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Configuration */}
            <section>
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                Configuration
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                    SMTP Config
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={envPath}
                      onChange={e => setEnvPath(e.target.value)}
                      placeholder="config.json"
                      className="flex-1 px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                    />
                    <button
                      onClick={() => handlePickFile(setEnvPath, "Choose config", ["*.json"])}
                      className="px-3 py-2 text-sm border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Recipients */}
            <section>
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                Recipients ({csvData.length})
              </h3>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={() => setDataSource("csv")}
                  className={`px-3 py-2 text-sm rounded-lg border transition-all flex items-center justify-center gap-2 ${
                    dataSource === "csv"
                      ? "bg-violet-50 dark:bg-violet-900/20 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300"
                      : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  CSV
                </button>
                <button
                  onClick={() => setDataSource("sheet")}
                  className={`px-3 py-2 text-sm rounded-lg border transition-all flex items-center justify-center gap-2 ${
                    dataSource === "sheet"
                      ? "bg-violet-50 dark:bg-violet-900/20 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300"
                      : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <Cloud className="w-4 h-4" />
                  Sheets
                </button>
              </div>
              
              {dataSource === "csv" ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={csvPath}
                    onChange={e => setCsvPath(e.target.value)}
                    placeholder="recipients.csv"
                    className="flex-1 px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                  />
                  <button
                    onClick={() => handlePickFile(setCsvPath, "Choose CSV", ["*.csv"])}
                    className="px-3 py-2 text-sm border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <input
                  type="text"
                  value={sheetUrl}
                  onChange={e => setSheetUrl(e.target.value)}
                  placeholder="Google Sheets URL"
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
              )}
            </section>

            {/* Email Settings */}
            <section>
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                Email Settings
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                  />
                </div>
                
                {/* Attachments */}
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Attachments
                  </label>
                  <div className="space-y-2">
                    {attachments.map((file, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <Paperclip className="w-3 h-3 text-slate-500" />
                        <span className="text-sm flex-1 truncate">{file.split('\\').pop()}</span>
                        <button
                          onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                          className="text-slate-400 hover:text-red-500 transition-colors"
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
                      className="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium transition-colors"
                    >
                      + Add attachment
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Advanced Settings */}
            <section>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                <ChevronRight className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
                Advanced Settings
              </button>
              
              {showAdvanced && (
                <div className="mt-3 space-y-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Workers</label>
                      <input
                        type="number"
                        value={concurrency}
                        onChange={e => setConcurrency(parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-1.5 text-sm border rounded-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Retries</label>
                      <input
                        type="number"
                        value={retries}
                        onChange={e => setRetries(parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 text-sm border rounded-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Batch</label>
                      <input
                        type="number"
                        value={batchSize}
                        onChange={e => setBatchSize(parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-1.5 text-sm border rounded-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>
                  
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dryRun}
                      onChange={e => setDryRun(e.target.checked)}
                      className="rounded text-violet-600 focus:ring-violet-500"
                    />
                    <span className="text-slate-700 dark:text-slate-300">Test mode (don't send emails)</span>
                  </label>
                </div>
              )}
            </section>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950">
          {/* View Tabs */}
          <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1 px-4 pt-3">
              <button
                onClick={() => setActiveView("editor")}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${
                  activeView === "editor"
                    ? "bg-slate-50 dark:bg-slate-950 text-violet-600 dark:text-violet-400 border-t border-l border-r border-slate-200 dark:border-slate-800"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Code2 className="w-4 h-4 inline mr-2" />
                Template Editor
              </button>
              <button
                onClick={() => setActiveView("preview")}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${
                  activeView === "preview"
                    ? "bg-slate-50 dark:bg-slate-950 text-violet-600 dark:text-violet-400 border-t border-l border-r border-slate-200 dark:border-slate-800"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Eye className="w-4 h-4 inline mr-2" />
                Live Preview
              </button>
              <button
                onClick={() => setActiveView("data")}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${
                  activeView === "data"
                    ? "bg-slate-50 dark:bg-slate-950 text-violet-600 dark:text-violet-400 border-t border-l border-r border-slate-200 dark:border-slate-800"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Database className="w-4 h-4 inline mr-2" />
                Data ({csvData.length})
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            {activeView === "editor" && (
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
                  renderWhitespace: "selection",
                  scrollBeyondLastLine: false,
                  padding: { top: 20, bottom: 20 },
                  automaticLayout: true,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  fontLigatures: true,
                }}
              />
            )}
            
            {activeView === "preview" && (
              <div className="h-full bg-white dark:bg-slate-900 p-6 overflow-auto">
                <div className="max-w-4xl mx-auto">
                  {/* Preview Controls */}
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Preview as:
                      </label>
                      <select
                        value={previewRecipient}
                        onChange={e => setPreviewRecipient(parseInt(e.target.value))}
                        className="px-3 py-1.5 text-sm border rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                      >
                        {csvData.map((recipient, i) => (
                          <option key={i} value={i}>
                            {recipient.name} ({recipient.email})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Subject: <span className="font-medium text-slate-700 dark:text-slate-300">{renderedSubject}</span>
                    </div>
                  </div>
                  
                  {/* Email Preview */}
                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-xl">
                    <iframe
                      title="preview"
                      className="w-full h-[600px] bg-white"
                      srcDoc={renderedHTML}
                      sandbox="allow-same-origin"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {activeView === "data" && (
              <div className="h-full p-6 overflow-auto">
                <div className="max-w-4xl mx-auto">
                  <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Company</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {csvData.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-100">{row.name}</td>
                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{row.email}</td>
                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{row.company}</td>
                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{row.role}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Activity Log */}
          <div className="h-32 bg-slate-900 dark:bg-black border-t border-slate-700">
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Activity Log</span>
              <button
                onClick={() => setLogs([])}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="h-20 overflow-y-auto px-4 py-2 font-mono text-xs">
              {logs.length === 0 ? (
                <div className="text-slate-500">Ready to send emails...</div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="flex items-start gap-3 py-0.5">
                    {log.type === 'error' && <span className="text-red-400">✗</span>}
                    {log.type === 'success' && <span className="text-green-400">✓</span>}
                    {log.type === 'info' && <span className="text-blue-400">→</span>}
                    <span className="text-slate-500">{log.time}</span>
                    <span className={
                      log.type === 'error' ? 'text-red-400' :
                      log.type === 'success' ? 'text-green-400' :
                      'text-slate-300'
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
