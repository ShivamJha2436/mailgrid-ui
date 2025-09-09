import { useState, useCallback, useMemo } from "react";
import { 
  Send, Eye, Paperclip, X, ChevronDown,
  FileText, Cloud, Zap, AlertCircle, 
  CheckCircle2, Loader2, Code2, Mail
} from "lucide-react";
import MonacoEditor from "@monaco-editor/react";
import { useMailgrid } from "../hooks/useMailgrid";
import { useTheme } from "../context/theme";

export default function Dashboard2() {
  const { run, preview, pickFile, loading } = useMailgrid();
  const { dark } = useTheme();
  
  // Core state
  const [envPath, setEnvPath] = useState("");
  const [csvPath, setCsvPath] = useState("");
  const [sheetUrl, setSheetUrl] = useState("");
  const [subject, setSubject] = useState("Welcome to {{.company}}");
  const [templateHTML, setTemplateHTML] = useState(`<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    h1 { color: #1a73e8; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Hi {{.name}},</h1>
    <p>Welcome to {{.company}}! We're excited to have you on board.</p>
    <p>Best regards,<br>The Team</p>
  </div>
</body>
</html>`);

  // Advanced settings
  const [attachments, setAttachments] = useState<string[]>([]);
  const [cc] = useState("");
  const [bcc] = useState("");
  const [concurrency, setConcurrency] = useState(10);
  const [retries, setRetries] = useState(3);
  const [batchSize, setBatchSize] = useState(50);
  const [filter, setFilter] = useState("");
  const [dryRun, setDryRun] = useState(false);
  
  // UI state
  const [activeTab, setActiveTab] = useState<"compose" | "preview">("compose");
  const [logs, setLogs] = useState<Array<{type: 'info' | 'error' | 'success', msg: string, time: string}>>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dataSource, setDataSource] = useState<"csv" | "sheet">("csv");

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
      addLog('error', 'Missing required fields');
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
      addLog('success', 'Preview running at http://localhost:8080');
    } catch (e) {
      addLog('error', e instanceof Error ? e.message : String(e));
    }
  };

  const handleSend = async () => {
    if (!canSend) return;
    
    const action = dryRun ? 'dry run' : 'sending';
    addLog('info', `Starting ${action}...`);
    
    try {
      await run({
        envPath, csvPath, sheetUrl, subject,
        templateHTML, templatePath: "",
        text: "", attachments, cc, bcc,
        concurrency, retryLimit: retries,
        batchSize, filter, dryRun,
        showPreview: false, previewPort: 8080, to: ""
      });
      addLog('success', dryRun ? 'Dry run completed' : 'Emails sent successfully');
    } catch (e) {
      addLog('error', e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="h-14 border-b bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 flex items-center px-4">
        <div className="flex items-center gap-3 flex-1">
          <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h1 className="text-lg font-semibold">Mailgrid</h1>
          <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full">
            Ready
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreview}
            disabled={!canSend}
            className="px-3 py-1.5 text-sm flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md disabled:opacity-50"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={`px-4 py-1.5 text-sm flex items-center gap-2 rounded-md font-medium ${
              dryRun 
                ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            } disabled:opacity-50`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {dryRun ? 'Test Run' : 'Send'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 space-y-4 overflow-y-auto flex-1">
            {/* Configuration */}
            <section>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Configuration
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">SMTP Config</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={envPath}
                      onChange={e => setEnvPath(e.target.value)}
                      placeholder="config.json"
                      className="flex-1 px-3 py-1.5 text-sm border rounded-md bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => handlePickFile(setEnvPath, "Choose config", ["*.json"])}
                      className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600"
                    >
                      Browse
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Data Source */}
            <section>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Recipients
              </h3>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setDataSource("csv")}
                  className={`flex-1 px-3 py-1.5 text-sm rounded-md border ${
                    dataSource === "csv"
                      ? "bg-blue-50 dark:bg-blue-900 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300"
                      : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <FileText className="w-4 h-4 inline mr-1" />
                  CSV File
                </button>
                <button
                  onClick={() => setDataSource("sheet")}
                  className={`flex-1 px-3 py-1.5 text-sm rounded-md border ${
                    dataSource === "sheet"
                      ? "bg-blue-50 dark:bg-blue-900 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300"
                      : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <Cloud className="w-4 h-4 inline mr-1" />
                  Google Sheet
                </button>
              </div>
              
              {dataSource === "csv" ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={csvPath}
                    onChange={e => setCsvPath(e.target.value)}
                    placeholder="recipients.csv"
                    className="flex-1 px-3 py-1.5 text-sm border rounded-md bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                  />
                  <button
                    onClick={() => handlePickFile(setCsvPath, "Choose CSV", ["*.csv"])}
                    className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600"
                  >
                    Browse
                  </button>
                </div>
              ) : (
                <input
                  type="text"
                  value={sheetUrl}
                  onChange={e => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/..."
                  className="w-full px-3 py-1.5 text-sm border rounded-md bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                />
              )}
            </section>

            {/* Email Settings */}
            <section>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Email Settings
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Email subject (supports {{.variables}})"
                    className="w-full px-3 py-1.5 text-sm border rounded-md bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                  />
                </div>
                
                {/* Attachments */}
                <div>
                  <label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">Attachments</label>
                  <div className="space-y-2">
                    {attachments.map((file, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded">
                        <Paperclip className="w-3 h-3 text-gray-500" />
                        <span className="text-sm flex-1 truncate">{file}</span>
                        <button
                          onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                          className="text-gray-500 hover:text-red-500"
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
            </section>

            {/* Advanced Settings */}
            <section>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                Advanced Settings
              </button>
              
              {showAdvanced && (
                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400">Workers</label>
                      <input
                        type="number"
                        value={concurrency}
                        onChange={e => setConcurrency(parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400">Retries</label>
                      <input
                        type="number"
                        value={retries}
                        onChange={e => setRetries(parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400">Batch</label>
                      <input
                        type="number"
                        value={batchSize}
                        onChange={e => setBatchSize(parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400">Filter Expression</label>
                    <input
                      type="text"
                      value={filter}
                      onChange={e => setFilter(e.target.value)}
                      placeholder='e.g., status = "active" and age > 25'
                      className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={dryRun}
                      onChange={e => setDryRun(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Dry run (test without sending)</span>
                  </label>
                </div>
              )}
            </section>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {/* Tabs */}
          <div className="h-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4">
            <button
              onClick={() => setActiveTab("compose")}
              className={`px-3 py-1 text-sm font-medium rounded-t-md -mb-px ${
                activeTab === "compose"
                  ? "bg-gray-50 dark:bg-gray-900 border-b-2 border-blue-500"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <Code2 className="w-4 h-4 inline mr-1" />
              Template Editor
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`px-3 py-1 text-sm font-medium rounded-t-md -mb-px ml-2 ${
                activeTab === "preview"
                  ? "bg-gray-50 dark:bg-gray-900 border-b-2 border-blue-500"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <Eye className="w-4 h-4 inline mr-1" />
              Preview
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex">
            {activeTab === "compose" ? (
              <div className="flex-1">
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
                    padding: { top: 16, bottom: 16 },
                    automaticLayout: true,
                  }}
                />
              </div>
            ) : (
              <div className="flex-1 bg-white dark:bg-gray-900">
                <iframe
                  title="preview"
                  className="w-full h-full"
                  srcDoc={templateHTML}
                  sandbox="allow-same-origin"
                />
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div className="h-32 bg-gray-900 dark:bg-black border-t border-gray-700">
            <div className="flex items-center justify-between px-3 py-1 border-b border-gray-700">
              <span className="text-xs text-gray-400">Activity Log</span>
              <button
                onClick={() => setLogs([])}
                className="text-xs text-gray-500 hover:text-gray-300"
              >
                Clear
              </button>
            </div>
            <div className="h-24 overflow-y-auto px-3 py-1">
              {logs.length === 0 ? (
                <div className="text-xs text-gray-500">No activity yet</div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="text-xs flex items-start gap-2 py-0.5">
                    {log.type === 'error' && <AlertCircle className="w-3 h-3 text-red-400 mt-0.5" />}
                    {log.type === 'success' && <CheckCircle2 className="w-3 h-3 text-green-400 mt-0.5" />}
                    {log.type === 'info' && <Zap className="w-3 h-3 text-blue-400 mt-0.5" />}
                    <span className="text-gray-500">{log.time}</span>
                    <span className={
                      log.type === 'error' ? 'text-red-400' :
                      log.type === 'success' ? 'text-green-400' :
                      'text-gray-300'
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
