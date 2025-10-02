import { useState, useCallback, useMemo, useEffect } from "react";
import { 
  Send, Eye, Paperclip, X, FileText,
  CheckCircle2, Loader2, Code2, Mail, Upload,
  Database, Sun, Moon, Terminal,
  TestTube, Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
import MonacoEditor from "@monaco-editor/react";
import { useMailgrid } from "../hooks/useMailgrid";
import { useTheme } from "../context/theme";
import { templateEngine } from '../utils/templateEngine';
import SmtpSection from './sidebar/SmtpSection';
import RecipientsSection from './sidebar/RecipientsSection';

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
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
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
      color: #6366f1;
      font-weight: 600;
      margin-bottom: 24px;
    }
    .button {
      display: inline-block;
      padding: 16px 32px;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
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

export default function WarpDashboard() {
  const { run, preview, schedule, pickFile, loading } = useMailgrid();
  const { dark, toggle: toggleTheme } = useTheme();
  
  // Core state - All CLI features mapped from CLIArgs
  const [envPath, setEnvPath] = useState("");                  // --env
  const [csvPath, setCsvPath] = useState("");                  // --csv
  const [sheetUrl, setSheetUrl] = useState("");                // --sheet-url
  const [templatePath, setTemplatePath] = useState("");        // --template/-t
  const [useEditor, setUseEditor] = useState(true);
  const [subject, setSubject] = useState("Welcome to {{.company}} - Let's Get Started! 🚀"); // --subject/-s
  const [templateHTML, setTemplateHTML] = useState(DEFAULT_TEMPLATE);
  const [plainText, setPlainText] = useState("");              // --text
  
  // All CLI flags with proper state management
  const [attachments, setAttachments] = useState<string[]>([]); // --attach
  const [cc, setCc] = useState("");                            // --cc
  const [bcc, setBcc] = useState("");                          // --bcc
  const [to, setTo] = useState("");                            // --to
  const [concurrency] = useState(1);           // --concurrency/-c
  const [retries] = useState(1);                   // --retries/-r
  const [batchSize] = useState(1);               // --batch-size
  const [filter] = useState("");                    // --filter
  const [dryRun] = useState(false);                 // --dry-run
  
  // Scheduling state - mapped from CLI flags
  const [scheduleAt] = useState("");           // --schedule-at/-A
  const [interval] = useState("");               // --interval/-i
  const [cron] = useState("");                       // --cron/-C
  const [jobRetries] = useState(3);             // --job-retries/-J
  const [jobBackoff] = useState("2s");         // --job-backoff/-B
  const [schedulerDB] = useState("mailgrid.db"); // --scheduler-db/-D
  
  // UI state
  const [activeView, setActiveView] = useState<"editor" | "preview" | "data" | "terminal">("terminal");
  const [logs, setLogs] = useState<Array<{type: 'info' | 'error' | 'success', msg: string, time: string}>>([]);
  const [dataSource, setDataSource] = useState<"csv" | "sheet">("csv");
  const [previewRecipient, setPreviewRecipient] = useState(0);
  const [csvData, setCsvData] = useState<any[]>(SAMPLE_DATA);
  const [csvContent, setCsvContent] = useState('');
  const [isLoadingCsv, setIsLoadingCsv] = useState(false);
  const [stats, setStats] = useState({ sent: 0, failed: 0, pending: 0, total: 0 });
  const [commandInput, setCommandInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

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

  // Command processing
  const processCommand = (command: string) => {
    const cmd = command.trim();
    if (!cmd) return;

    setCommandHistory(prev => [cmd, ...prev.slice(0, 49)]);
    setCommandInput("");
    setHistoryIndex(-1);
    
    addLog('info', `$ ${cmd}`);
    
    // Simple command processing
    const [action] = cmd.split(' ');
    
    switch (action.toLowerCase()) {
      case 'send':
        if (canSend) {
          handleSend();
        } else {
          addLog('error', 'Setup incomplete. Configure SMTP and recipients first.');
        }
        break;
      case 'preview':
        if (canSend) {
          handlePreview();
        } else {
          addLog('error', 'Setup incomplete. Configure SMTP and recipients first.');
        }
        break;
      case 'schedule':
        if (canSchedule) {
          handleSchedule();
        } else {
          addLog('error', 'Configure scheduling options first.');
        }
        break;
      case 'status':
        addLog('info', `Ready: ${canSend ? 'Yes' : 'No'} | Recipients: ${csvData.length} | Template: ${useEditor ? 'Editor' : 'File'}`);
        break;
      case 'clear':
        setLogs([]);
        break;
      case 'help':
        addLog('info', 'Available commands: send, preview, schedule, status, clear, help');
        break;
      default:
        addLog('error', `Unknown command: ${action}. Type 'help' for available commands.`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      processCommand(commandInput);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCommandInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommandInput(commandHistory[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommandInput("");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1117] text-gray-100">
      {/* Warp-style Header */}
      <header className="h-12 border-b border-gray-800 bg-[#161B22] backdrop-blur-xl">
        <div className="h-full max-w-full mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Traffic lights */}
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            
            <h1 className="text-sm font-medium text-gray-300">
              <span className="text-indigo-400">Mail</span>
              <span className="text-purple-400">grid</span>
              <span className="text-gray-500 ml-2">~/mailgrid-ui</span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Status indicators */}
            {stats.total > 0 && (
              <div className="flex items-center gap-2 text-xs">
                {stats.sent > 0 && (
                  <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {stats.sent} sent
                  </span>
                )}
                {stats.pending > 0 && (
                  <span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {stats.pending} pending
                  </span>
                )}
                {stats.failed > 0 && (
                  <span className="px-2 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                    {stats.failed} failed
                  </span>
                )}
              </div>
            )}
            
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md hover:bg-gray-800 transition-colors"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-3rem)]">
        {/* Warp-style Sidebar */}
        <aside className="w-80 border-r border-gray-800 bg-[#0D1117] overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Quick Setup Panel */}
            <div className="bg-[#161B22] rounded-lg border border-gray-800 p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-gray-200">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                Quick Setup
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {envPath ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-600" />}
                  <span className="text-sm text-gray-400">SMTP Configuration</span>
                </div>
                <div className="flex items-center gap-2">
                  {(csvPath || sheetUrl || to) ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-600" />}
                  <span className="text-sm text-gray-400">Recipients</span>
                </div>
                <div className="flex items-center gap-2">
                  {(templateHTML || templatePath || plainText) ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-600" />}
                  <span className="text-sm text-gray-400">Email Content</span>
                </div>
              </div>
            </div>

            <SmtpSection
              envPath={envPath}
              setEnvPath={setEnvPath}
              onPickFile={handlePickFile}
              onAddLog={addLog}
              inputClass="w-full px-3 py-2 text-sm bg-[#0D1117] border border-gray-700 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
              buttonClass="px-3 py-2 text-sm font-medium rounded-md transition-all"
              cardClass="bg-[#161B22] rounded-lg border border-gray-800"
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
              inputClass="w-full px-3 py-2 text-sm bg-[#0D1117] border border-gray-700 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
              buttonClass="px-3 py-2 text-sm font-medium rounded-md transition-all"
              cardClass="bg-[#161B22] rounded-lg border border-gray-800"
            />

            {/* Email Content */}
            <div className="bg-[#161B22] rounded-lg border border-gray-800 p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-gray-200">
                <Mail className="w-4 h-4" />
                Email Content
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1.5 block">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#0D1117] border border-gray-700 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
                
                {/* Template Source Toggle */}
                <div className="grid grid-cols-2 gap-1 p-1 bg-[#0D1117] rounded-lg border border-gray-800">
                  <button
                    onClick={() => setUseEditor(true)}
                    className={`py-1.5 text-xs font-medium rounded transition-all ${
                      useEditor 
                        ? "bg-[#161B22] border border-gray-700 text-white" 
                        : "hover:bg-[#161B22]/50 text-gray-400"
                    }`}
                  >
                    <Code2 className="w-3 h-3 inline mr-1" />
                    Editor
                  </button>
                  <button
                    onClick={() => setUseEditor(false)}
                    className={`py-1.5 text-xs font-medium rounded transition-all ${
                      !useEditor 
                        ? "bg-[#161B22] border border-gray-700 text-white" 
                        : "hover:bg-[#161B22]/50 text-gray-400"
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
                      className="w-full px-3 py-2 text-sm bg-[#0D1117] border border-gray-700 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all flex-1"
                    />
                    <button
                      onClick={() => handlePickFile(setTemplatePath, "Choose template", ["*.html"])}
                      className="px-3 py-2 text-sm font-medium rounded-md transition-all bg-gray-800 hover:bg-gray-700"
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1.5 block">Plain Text Alternative</label>
                  <textarea
                    value={plainText}
                    onChange={e => setPlainText(e.target.value)}
                    placeholder="Optional plain text version"
                    rows={3}
                    className="w-full px-3 py-2 text-sm bg-[#0D1117] border border-gray-700 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
                
                {/* Attachments */}
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1.5 block">Attachments</label>
                  <div className="space-y-2">
                    {attachments.map((file, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-[#0D1117] border border-gray-700 rounded">
                        <Paperclip className="w-3 h-3 text-gray-500" />
                        <span className="text-sm flex-1 truncate">{file.split('\\').pop()}</span>
                        <button
                          onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                          className="text-gray-500 hover:text-red-400"
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
                      className="text-sm text-indigo-400 hover:text-indigo-300"
                    >
                      + Add attachment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {/* Tab Bar */}
          <div className="h-10 border-b border-gray-800 bg-[#0D1117] flex items-center px-4 gap-1">
            {[
              { id: "terminal", label: "Terminal", icon: Terminal },
              { id: "editor", label: "Editor", icon: Code2 },
              { id: "preview", label: "Preview", icon: Eye },
              { id: "data", label: `Data (${csvData.length})`, icon: Database },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveView(id as any)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
                  activeView === id
                    ? "bg-[#161B22] border border-gray-700 text-white"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            {activeView === "terminal" && (
              <div className="h-full flex flex-col bg-[#0D1117]">
                {/* Terminal Header */}
                <div className="h-8 bg-[#161B22] border-b border-gray-800 flex items-center justify-between px-4">
                  <span className="text-xs text-gray-400 font-mono">mailgrid@terminal</span>
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handlePreview}
                      disabled={!canSend}
                      className="px-3 py-1 text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded disabled:opacity-50 transition-all"
                    >
                      <Eye className="w-3 h-3 inline mr-1" />
                      Preview
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSend}
                      disabled={!canSend}
                      className={`px-3 py-1 text-xs rounded disabled:opacity-50 transition-all ${
                        dryRun 
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {loading ? (
                        <Loader2 className="w-3 h-3 inline mr-1 animate-spin" />
                      ) : dryRun ? (
                        <TestTube className="w-3 h-3 inline mr-1" />
                      ) : (
                        <Send className="w-3 h-3 inline mr-1" />
                      )}
                      {dryRun ? 'Test' : 'Send'}
                    </motion.button>
                  </div>
                </div>

                {/* Terminal Content */}
                <div className="flex-1 p-4 font-mono text-sm overflow-y-auto">
                  {logs.length === 0 ? (
                    <div className="text-gray-500">
                      <div className="mb-2">Welcome to Mailgrid Terminal 🚀</div>
                      <div className="mb-2">Type 'help' to see available commands.</div>
                      <div className="text-xs text-gray-600">Tip: Use ↑/↓ arrows to navigate command history</div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {logs.slice().reverse().map((log, i) => (
                        <div key={i} className="flex items-start gap-2">
                          {log.type === 'error' && <span className="text-red-400 mt-0.5">✗</span>}
                          {log.type === 'success' && <span className="text-emerald-400 mt-0.5">✓</span>}
                          {log.type === 'info' && <span className="text-blue-400 mt-0.5">•</span>}
                          <span className="text-gray-500 text-xs mt-0.5 w-20 shrink-0">{log.time}</span>
                          <span className={
                            log.type === 'error' ? 'text-red-400' :
                            log.type === 'success' ? 'text-emerald-400' :
                            'text-gray-200'
                          }>{log.msg}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Command Input */}
                <div className="border-t border-gray-800 bg-[#0D1117] p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-mono">$</span>
                    <input
                      type="text"
                      value={commandInput}
                      onChange={e => setCommandInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Enter command (send, preview, status, help...)"
                      className="flex-1 bg-transparent border-none outline-none font-mono text-gray-200 placeholder-gray-500"
                      autoFocus
                    />
                  </div>
                </div>
              </div>
            )}
            
            {activeView === "editor" && useEditor && (
              <MonacoEditor
                height="100%"
                defaultLanguage="html"
                theme="vs-dark"
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
                  fontFamily: "JetBrains Mono, Fira Code, monospace",
                }}
              />
            )}
            
            {activeView === "preview" && (
              <div className="h-full p-6 bg-[#0D1117] overflow-auto">
                <div className="max-w-4xl mx-auto">
                  <div className="mb-4 flex items-center justify-between">
                    <select
                      value={previewRecipient}
                      onChange={e => setPreviewRecipient(parseInt(e.target.value))}
                      className="px-3 py-2 text-sm bg-[#161B22] border border-gray-700 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                    >
                      {csvData.map((r, i) => (
                        <option key={i} value={i}>{r.name} - {r.email}</option>
                      ))}
                    </select>
                    <div className="text-sm text-gray-400">
                      Subject: <span className="font-medium text-gray-200">{renderedSubject}</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-2xl overflow-hidden border border-gray-700">
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
              <div className="h-full p-6 bg-[#0D1117] overflow-auto">
                <div className="bg-[#161B22] rounded-lg border border-gray-800 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-[#0D1117] border-b border-gray-800">
                      <tr>
                        {Object.keys(csvData[0]).map(key => (
                          <th key={key} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {csvData.map((row, i) => (
                        <tr key={i} className="hover:bg-[#0D1117] transition-colors">
                          {Object.values(row).map((val, j) => (
                            <td key={j} className="px-4 py-3 text-sm text-gray-200">{String(val)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}