import React, { useState, useCallback, useEffect, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Send, Upload, Download, Play, Settings, Database,
  FileText, Users, Clock, Zap, Shield, Code, Table,
  Loader2, RefreshCw, Plus, Trash2,
  ChevronRight, ChevronLeft, Filter, Moon, Sun,
  Server, User, AtSign, Lock, Globe, Layers, Activity, Terminal
} from 'lucide-react';
import { cn } from '../utils/cn';
import { templateEngine } from '../utils/templateEngine';
import { Button, Input, Textarea, Card, Badge, Switch } from './ui';
// import { CallMailgrid } from '../../wailsjs/go/main/App';

// Lazy load Monaco Editor for better performance
const MonacoEditor = lazy(() => import('@monaco-editor/react'));

interface DashboardProps {}

export const DashboardUltimate: React.FC<DashboardProps> = () => {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  // Core states
  const [activeTab, setActiveTab] = useState<'compose' | 'data' | 'settings' | 'logs'>('compose');
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<Array<{ time: string; type: 'info' | 'success' | 'warning' | 'error'; message: string }>>([]);

  // Email template states
  const [templateSource, setTemplateSource] = useState<'editor' | 'file'>('editor');
  const [templateContent, setTemplateContent] = useState(`<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; }
        .content { padding: 20px; }
        .footer { color: #666; font-size: 12px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Hello {{.Name}}</h1>
    </div>
    <div class="content">
        <p>Dear {{.Name}},</p>
        <p>Welcome to our platform! Your email is {{.Email}}.</p>
        {{if .Company}}
        <p>We're excited to work with {{.Company}}!</p>
        {{end}}
        <p>Best regards,<br>The Team</p>
    </div>
    <div class="footer">
        <p>© 2024 Your Company. All rights reserved.</p>
    </div>
</body>
</html>`);
  const [templateFile, setTemplateFile] = useState('');
  const [subject, setSubject] = useState('Welcome to Our Platform - {{.Name}}');
  const [plainText, setPlainText] = useState('');

  // Data source states
  const [dataSource, setDataSource] = useState<'csv' | 'sheets' | 'single'>('csv');
  const [csvContent, setCsvContent] = useState(`Name,Email,Company
John Doe,john@example.com,Acme Corp
Jane Smith,jane@example.com,Tech Solutions
Bob Wilson,bob@example.com,StartupXYZ`);
  const [csvFile, setCsvFile] = useState('');
  const [sheetsUrl, setSheetsUrl] = useState('');
  const [singleRecipient, setSingleRecipient] = useState('');
  const [csvData, setCsvData] = useState<any[]>([]);
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState(0);

  // SMTP Configuration
  const [smtpConfig, setSmtpConfig] = useState({
    host: 'smtp.gmail.com',
    port: '587',
    username: '',
    password: '',
    from: '',
    replyTo: ''
  });

  // Advanced settings
  const [advancedSettings, setAdvancedSettings] = useState({
    attachments: [] as string[],
    concurrency: '10',
    retries: '3',
    retryDelay: '5',
    batchSize: '50',
    delayBetweenBatches: '10',
    rateLimit: '100',
    timeout: '30',
    filter: '',
    dryRun: false,
    verbose: true
  });

  // Parse CSV data whenever content changes
  useEffect(() => {
    if (dataSource === 'csv' && csvContent) {
      templateEngine.parseCSV(csvContent)
        .then(data => {
          setCsvData(data);
          setSelectedPreviewIndex(0);
          addLog('info', `Loaded ${data.length} recipients from CSV`);
        })
        .catch(err => {
          addLog('error', `Failed to parse CSV: ${err.message}`);
        });
    }
  }, [csvContent, dataSource]);

  // Apply theme
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Logging helper
  const addLog = useCallback((type: 'info' | 'success' | 'warning' | 'error', message: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [{ time, type, message }, ...prev].slice(0, 100));
  }, []);

  // Process template with current data
  const processedTemplate = useMemo(() => {
    if (csvData.length > 0 && selectedPreviewIndex < csvData.length) {
      return templateEngine.processTemplate(templateContent, csvData[selectedPreviewIndex]);
    }
    return templateContent;
  }, [templateContent, csvData, selectedPreviewIndex]);

  // Process subject with current data
  const processedSubject = useMemo(() => {
    if (csvData.length > 0 && selectedPreviewIndex < csvData.length) {
      return templateEngine.processTemplate(subject, csvData[selectedPreviewIndex]);
    }
    return subject;
  }, [subject, csvData, selectedPreviewIndex]);

  // File handlers
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>, type: 'template' | 'csv') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (type === 'template') {
        setTemplateContent(content);
        setTemplateFile(file.name);
        addLog('success', `Loaded template: ${file.name}`);
      } else {
        setCsvContent(content);
        setCsvFile(file.name);
        addLog('success', `Loaded CSV: ${file.name}`);
      }
    };
    reader.readAsText(file);
  }, [addLog]);

  // Send campaign
  const handleSendCampaign = useCallback(async (testMode: boolean = false) => {
    setIsLoading(true);
    addLog('info', testMode ? 'Starting test campaign...' : 'Starting email campaign...');

    try {
      // Prepare arguments
      const args: any = {
        template: templateSource === 'file' ? templateFile : undefined,
        templateContent: templateSource === 'editor' ? templateContent : undefined,
        subject,
        smtpHost: smtpConfig.host,
        smtpPort: parseInt(smtpConfig.port),
        smtpUsername: smtpConfig.username,
        smtpPassword: smtpConfig.password,
        from: smtpConfig.from,
        replyTo: smtpConfig.replyTo || undefined,
        dryRun: testMode || advancedSettings.dryRun,
        verbose: advancedSettings.verbose
      };

      // Add data source
      if (dataSource === 'csv') {
        if (csvFile) {
          args.csvFile = csvFile;
        } else {
          args.csvContent = csvContent;
        }
      } else if (dataSource === 'sheets') {
        args.sheetsUrl = sheetsUrl;
      } else {
        args.recipients = [singleRecipient];
      }

      // Add optional parameters
      if (plainText) args.plainText = plainText;
      if (advancedSettings.attachments.length > 0) args.attachments = advancedSettings.attachments;
      if (advancedSettings.concurrency) args.concurrency = parseInt(advancedSettings.concurrency);
      if (advancedSettings.retries) args.retries = parseInt(advancedSettings.retries);
      if (advancedSettings.retryDelay) args.retryDelay = parseInt(advancedSettings.retryDelay);
      if (advancedSettings.batchSize) args.batchSize = parseInt(advancedSettings.batchSize);
      if (advancedSettings.delayBetweenBatches) args.delayBetweenBatches = parseInt(advancedSettings.delayBetweenBatches);
      if (advancedSettings.rateLimit) args.rateLimit = parseInt(advancedSettings.rateLimit);
      if (advancedSettings.timeout) args.timeout = parseInt(advancedSettings.timeout);
      if (advancedSettings.filter) args.filter = advancedSettings.filter;

      // Mock implementation - replace with actual backend call
      const result = await new Promise<any>((resolve) => {
        setTimeout(() => {
          resolve({ 
            success: true, 
            message: testMode ? 'Test email sent successfully!' : `Campaign sent to ${csvData.length} recipients!` 
          });
        }, 2000);
      });
      
      if (result.success) {
        addLog('success', testMode ? 'Test completed successfully!' : 'Campaign sent successfully!');
        if (result.message) addLog('info', result.message);
      } else {
        addLog('error', `Failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      addLog('error', `Error: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [templateSource, templateFile, templateContent, subject, smtpConfig, dataSource, csvFile, csvContent, sheetsUrl, singleRecipient, plainText, advancedSettings, addLog]);

  // Save SMTP config
  const handleSaveSmtpConfig = useCallback(() => {
    const config = JSON.stringify(smtpConfig, null, 2);
    const blob = new Blob([config], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'smtp-config.json';
    a.click();
    URL.revokeObjectURL(url);
    addLog('success', 'SMTP configuration saved');
  }, [smtpConfig, addLog]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Mailgrid</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Email Campaign Manager</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {csvData.length > 0 && (
                <Badge variant="info" className="px-3 py-1">
                  <Users className="w-3 h-3 mr-1" />
                  {csvData.length} Recipients
                </Badge>
              )}
              
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          {[
            { id: 'compose', label: 'Compose', icon: FileText },
            { id: 'data', label: 'Recipients', icon: Database },
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'logs', label: 'Activity', icon: Terminal }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-all',
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Compose Tab */}
          {activeTab === 'compose' && (
            <motion.div
              key="compose"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Template Editor */}
              <Card title="Email Template" description="Design your email with Go template syntax">
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTemplateSource('editor')}
                      className={cn(
                        'flex-1 py-2 px-4 rounded-lg font-medium transition-all',
                        templateSource === 'editor'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      )}
                    >
                      <Code className="w-4 h-4 inline mr-2" />
                      Editor
                    </button>
                    <button
                      onClick={() => setTemplateSource('file')}
                      className={cn(
                        'flex-1 py-2 px-4 rounded-lg font-medium transition-all',
                        templateSource === 'file'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      )}
                    >
                      <Upload className="w-4 h-4 inline mr-2" />
                      File
                    </button>
                  </div>

                  <Input
                    label="Subject Line"
                    placeholder="Email subject with {{.Variables}}"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    icon={Mail}
                  />

                  {templateSource === 'editor' ? (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <Suspense fallback={
                        <div className="h-96 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                      }>
                        <MonacoEditor
                          height="400px"
                          language="html"
                          theme={isDarkMode ? 'vs-dark' : 'vs'}
                          value={templateContent}
                          onChange={(value) => setTemplateContent(value || '')}
                          options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            wordWrap: 'on',
                            automaticLayout: true
                          }}
                        />
                      </Suspense>
                    </div>
                  ) : (
                    <div>
                      <label className="block">
                        <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer">
                          <div className="text-center">
                            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {templateFile || 'Click to upload HTML template'}
                            </p>
                          </div>
                        </div>
                        <input
                          type="file"
                          accept=".html,.htm"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'template')}
                        />
                      </label>
                    </div>
                  )}

                  <Textarea
                    label="Plain Text Alternative (Optional)"
                    placeholder="Plain text version of your email..."
                    value={plainText}
                    onChange={(e) => setPlainText(e.target.value)}
                    rows={4}
                  />
                </div>
              </Card>

              {/* Preview */}
              <Card 
                title="Live Preview" 
                description={processedSubject}
                headerAction={
                  csvData.length > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedPreviewIndex(Math.max(0, selectedPreviewIndex - 1))}
                        disabled={selectedPreviewIndex === 0}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedPreviewIndex + 1} / {csvData.length}
                      </span>
                      <button
                        onClick={() => setSelectedPreviewIndex(Math.min(csvData.length - 1, selectedPreviewIndex + 1))}
                        disabled={selectedPreviewIndex === csvData.length - 1}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )
                }
              >
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="info">To:</Badge>
                      <span className="text-gray-700 dark:text-gray-300">
                        {csvData[selectedPreviewIndex]?.Email || 'recipient@example.com'}
                      </span>
                    </div>
                  </div>
                  <div className="h-96 overflow-auto bg-white dark:bg-gray-900">
                    <iframe
                      srcDoc={processedTemplate}
                      className="w-full h-full"
                      title="Email Preview"
                      sandbox="allow-same-origin"
                    />
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Data Tab */}
          {activeTab === 'data' && (
            <motion.div
              key="data"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <Card title="Data Source" description="Choose how to load recipient data">
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'csv', label: 'CSV', icon: FileText },
                      { id: 'sheets', label: 'Google Sheets', icon: Table },
                      { id: 'single', label: 'Single Email', icon: User }
                    ].map(source => (
                      <button
                        key={source.id}
                        onClick={() => setDataSource(source.id as any)}
                        className={cn(
                          'p-3 rounded-lg border-2 transition-all',
                          dataSource === source.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        )}
                      >
                        <source.icon className="w-5 h-5 mx-auto mb-1" />
                        <p className="text-sm font-medium">{source.label}</p>
                      </button>
                    ))}
                  </div>

                  {dataSource === 'csv' && (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <label className="flex-1">
                          <Button variant="secondary" className="w-full">
                            <Upload className="w-4 h-4 mr-2" />
                            {csvFile || 'Upload CSV File'}
                          </Button>
                          <input
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, 'csv')}
                          />
                        </label>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setCsvFile('');
                            setCsvContent(`Name,Email,Company
John Doe,john@example.com,Acme Corp
Jane Smith,jane@example.com,Tech Solutions
Bob Wilson,bob@example.com,StartupXYZ`);
                          }}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>

                      <Textarea
                        label="CSV Data"
                        placeholder="Name,Email,..."
                        value={csvContent}
                        onChange={(e) => setCsvContent(e.target.value)}
                        rows={8}
                        className="font-mono text-sm"
                      />
                    </div>
                  )}

                  {dataSource === 'sheets' && (
                    <Input
                      label="Google Sheets URL"
                      placeholder="https://docs.google.com/spreadsheets/..."
                      value={sheetsUrl}
                      onChange={(e) => setSheetsUrl(e.target.value)}
                      icon={Globe}
                    />
                  )}

                  {dataSource === 'single' && (
                    <Input
                      label="Recipient Email"
                      type="email"
                      placeholder="email@example.com"
                      value={singleRecipient}
                      onChange={(e) => setSingleRecipient(e.target.value)}
                      icon={AtSign}
                    />
                  )}
                </div>
              </Card>

              {/* Data Preview */}
              {csvData.length > 0 && (
                <Card title="Data Preview" description={`${csvData.length} recipients loaded`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-2 px-3 font-medium text-gray-700 dark:text-gray-300">#</th>
                          {Object.keys(csvData[0] || {}).map(key => (
                            <th key={key} className="text-left py-2 px-3 font-medium text-gray-700 dark:text-gray-300">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvData.slice(0, 10).map((row, idx) => (
                          <tr 
                            key={idx}
                            className={cn(
                              'border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer',
                              selectedPreviewIndex === idx && 'bg-blue-50 dark:bg-blue-900/20'
                            )}
                            onClick={() => setSelectedPreviewIndex(idx)}
                          >
                            <td className="py-2 px-3 text-gray-500 dark:text-gray-400">{idx + 1}</td>
                            {Object.values(row).map((value: any, i) => (
                              <td key={i} className="py-2 px-3 text-gray-900 dark:text-gray-100">
                                {String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {csvData.length > 10 && (
                      <p className="text-center py-3 text-sm text-gray-500 dark:text-gray-400">
                        ... and {csvData.length - 10} more recipients
                      </p>
                    )}
                  </div>
                </Card>
              )}
            </motion.div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* SMTP Configuration */}
              <Card title="SMTP Configuration" description="Configure your email server">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="SMTP Host"
                      placeholder="smtp.gmail.com"
                      value={smtpConfig.host}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                      icon={Server}
                    />
                    <Input
                      label="Port"
                      placeholder="587"
                      value={smtpConfig.port}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, port: e.target.value })}
                      icon={Globe}
                    />
                  </div>

                  <Input
                    label="Username"
                    placeholder="your-email@gmail.com"
                    value={smtpConfig.username}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, username: e.target.value })}
                    icon={User}
                  />

                  <Input
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    value={smtpConfig.password}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, password: e.target.value })}
                    icon={Lock}
                  />

                  <Input
                    label="From Address"
                    type="email"
                    placeholder="sender@example.com"
                    value={smtpConfig.from}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, from: e.target.value })}
                    icon={Mail}
                  />

                  <Input
                    label="Reply-To Address (Optional)"
                    type="email"
                    placeholder="reply@example.com"
                    value={smtpConfig.replyTo}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, replyTo: e.target.value })}
                    icon={Mail}
                  />

                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={handleSaveSmtpConfig}
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Config
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.json';
                        input.onchange = (e: any) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              try {
                                const config = JSON.parse(e.target?.result as string);
                                setSmtpConfig(config);
                                addLog('success', 'SMTP configuration loaded');
                              } catch {
                                addLog('error', 'Invalid configuration file');
                              }
                            };
                            reader.readAsText(file);
                          }
                        };
                        input.click();
                      }}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Import
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Advanced Settings */}
              <Card title="Advanced Settings" description="Fine-tune campaign behavior">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Concurrency"
                      type="number"
                      placeholder="10"
                      value={advancedSettings.concurrency}
                      onChange={(e) => setAdvancedSettings({ ...advancedSettings, concurrency: e.target.value })}
                      icon={Zap}
                    />
                    <Input
                      label="Retries"
                      type="number"
                      placeholder="3"
                      value={advancedSettings.retries}
                      onChange={(e) => setAdvancedSettings({ ...advancedSettings, retries: e.target.value })}
                      icon={RefreshCw}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Batch Size"
                      type="number"
                      placeholder="50"
                      value={advancedSettings.batchSize}
                      onChange={(e) => setAdvancedSettings({ ...advancedSettings, batchSize: e.target.value })}
                      icon={Layers}
                    />
                    <Input
                      label="Batch Delay (s)"
                      type="number"
                      placeholder="10"
                      value={advancedSettings.delayBetweenBatches}
                      onChange={(e) => setAdvancedSettings({ ...advancedSettings, delayBetweenBatches: e.target.value })}
                      icon={Clock}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Rate Limit (per hour)"
                      type="number"
                      placeholder="100"
                      value={advancedSettings.rateLimit}
                      onChange={(e) => setAdvancedSettings({ ...advancedSettings, rateLimit: e.target.value })}
                      icon={Activity}
                    />
                    <Input
                      label="Timeout (s)"
                      type="number"
                      placeholder="30"
                      value={advancedSettings.timeout}
                      onChange={(e) => setAdvancedSettings({ ...advancedSettings, timeout: e.target.value })}
                      icon={Clock}
                    />
                  </div>

                  <Input
                    label="Filter Expression (Optional)"
                    placeholder="e.g., Company == 'Acme Corp'"
                    value={advancedSettings.filter}
                    onChange={(e) => setAdvancedSettings({ ...advancedSettings, filter: e.target.value })}
                    icon={Filter}
                  />

                  <div className="space-y-2">
                    <Switch
                      checked={advancedSettings.dryRun}
                      onChange={(checked) => setAdvancedSettings({ ...advancedSettings, dryRun: checked })}
                      label="Dry Run (simulate without sending)"
                    />
                    <Switch
                      checked={advancedSettings.verbose}
                      onChange={(checked) => setAdvancedSettings({ ...advancedSettings, verbose: checked })}
                      label="Verbose Logging"
                    />
                  </div>

                  {/* Attachments */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Attachments
                    </label>
                    <div className="space-y-2">
                      {advancedSettings.attachments.map((attachment, idx) => (
                        <div key={idx} className="flex gap-2">
                          <Input
                            placeholder="path/to/file.pdf"
                            value={attachment}
                            onChange={(e) => {
                              const newAttachments = [...advancedSettings.attachments];
                              newAttachments[idx] = e.target.value;
                              setAdvancedSettings({ ...advancedSettings, attachments: newAttachments });
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newAttachments = advancedSettings.attachments.filter((_, i) => i !== idx);
                              setAdvancedSettings({ ...advancedSettings, attachments: newAttachments });
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAdvancedSettings({
                            ...advancedSettings,
                            attachments: [...advancedSettings.attachments, '']
                          });
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Attachment
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <motion.div
              key="logs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card 
                title="Activity Log" 
                description="Real-time campaign activity"
                headerAction={
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLogs([])}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                }
              >
                <div className="h-96 overflow-y-auto bg-gray-50 dark:bg-gray-900 rounded-lg p-4 font-mono text-sm">
                  {logs.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                      <Terminal className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No activity yet</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {logs.map((log, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            'flex items-start gap-3 py-1',
                            log.type === 'error' && 'text-red-600 dark:text-red-400',
                            log.type === 'warning' && 'text-yellow-600 dark:text-yellow-400',
                            log.type === 'success' && 'text-green-600 dark:text-green-400',
                            log.type === 'info' && 'text-blue-600 dark:text-blue-400'
                          )}
                        >
                          <span className="text-gray-500 dark:text-gray-500">{log.time}</span>
                          <span className="flex-1">{log.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Bar */}
        <div className="mt-8 flex items-center justify-between p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            {advancedSettings.dryRun && (
              <Badge variant="warning" className="px-3 py-1">
                <Shield className="w-3 h-3 mr-1" />
                Dry Run Mode
              </Badge>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Ready to send to {csvData.length || 0} recipients
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => handleSendCampaign(true)}
              disabled={isLoading || csvData.length === 0}
            >
              <Play className="w-4 h-4 mr-2" />
              Test Send
            </Button>
            <Button
              variant="primary"
              onClick={() => handleSendCampaign(false)}
              disabled={isLoading || csvData.length === 0}
              loading={isLoading}
            >
              <Send className="w-4 h-4 mr-2" />
              Send Campaign
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};
