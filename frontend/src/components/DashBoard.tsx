import {useCallback, useMemo, useState} from "react";
import {FolderOpen, Paperclip, Play, Eye, Settings2} from "lucide-react";
import { backend } from "../../wailsjs/go/models";
import MonacoHtml from "./editor/MonacoHtml";
import { useMailgrid } from "../hooks/useMailgrid";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Badge from "../ui/Badge";

import { useTheme } from "../context/theme";

export default function DashBoard() {
  const { run, preview, pickFile, loading, error } = useMailgrid();
  const { dark } = useTheme();
  const [envPath, setEnvPath] = useState("");
  const [csvPath, setCsvPath] = useState("");
  const [sheetUrl, setSheetUrl] = useState("");
  const [templateHTML, setTemplateHTML] = useState<string>("<h1>Hello {{.name}}</h1>\n<p>Welcome to Mailgrid.</p>");
  const [subject, setSubject] = useState("Hello {{.name}}");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [concurrency, setConcurrency] = useState(3);
  const [retries, setRetries] = useState(2);
  const [batchSize, setBatchSize] = useState(10);
  const [filter, setFilter] = useState("");
  const [dryRun, setDryRun] = useState(false);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const addLog = useCallback((msg: string) => setLog(l => [msg, ...l].slice(0, 200)), []);

  const canSend = useMemo(() => {
    const hasData = !!csvPath || !!sheetUrl;
    const hasBody = !!templateHTML || attachments.length > 0;
    return !!envPath && hasData && hasBody && !busy;
  }, [envPath, csvPath, sheetUrl, templateHTML, attachments, busy]);

  const pickFileLocal = async (title: string, patterns?: string[]) => {
    return pickFile(title, patterns);
  };

  const pickAndSet = async (setter: (v: string)=>void, title: string, patterns?: string[]) => {
    const p = await pickFileLocal(title, patterns);
    if (p) setter(p);
  };

  const pickAttachment = async () => {
    const p = await pickFileLocal("Choose attachment");
    if (p) setAttachments(a => Array.from(new Set([...a, p])));
  };

  const payload = (): backend.UIArgs => ({
    envPath, csvPath, csvContent: '', sheetUrl,
    templatePath: "",
    templateHTML: templateHTML,
    subject, text: "",
    attachments, cc, bcc, concurrency, retryLimit: retries, batchSize, filter,
    dryRun,
    showPreview: false,
    previewPort: 8080,
    to: "",
    // Scheduling fields
    scheduleAt: "",
    interval: "",
    cron: "",
    jobRetries: 0,
    jobBackoff: "",
    schedulerDB: ""
  });

  const onPreview = async () => {
    if (!csvPath && !sheetUrl) return addLog("Provide CSV or Sheet URL to preview");
    if (!templateHTML.trim()) return addLog("Add some HTML to preview");
    setBusy(true);
    addLog("Starting preview on http://localhost:8080 ...");
    try {
      await preview({ ...payload(), previewPort: 8080, showPreview: true });
      addLog("Preview served. Open in browser.");
    } catch (e: unknown) {
      addLog(`Preview error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const onSend = async () => {
    if (!canSend) return;
    setBusy(true);
    addLog(dryRun ? "Rendering emails (dry run)..." : "Sending emails...");
    try {
      await run(payload());
      addLog(dryRun ? "Dry run complete." : "Send complete.");
    } catch (e: unknown) {
      addLog(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] min-h-[560px] grid grid-rows-[1fr_auto] gap-2">

        {/* Workbench */}
        <div className="grid grid-cols-[48px_300px_1fr_1fr] gap-2 min-h-0">
          {/* Activity Bar */}
          <div className="flex flex-col items-center gap-2 py-2 bg-zinc-100 dark:bg-[#2d2d30]">
            <Button variant="ghost" size="sm" title="Settings" onClick={()=>{}}><Settings2 className="w-4 h-4"/></Button>
            <div className="h-px w-6 bg-zinc-200 dark:bg-zinc-800"/>
            <Button variant="ghost" size="sm" title="Preview" onClick={onPreview}><Eye className="w-4 h-4"/></Button>
            <Button variant="ghost" size="sm" title="Send" onClick={onSend} disabled={!canSend || loading}><Play className="w-4 h-4"/></Button>
          </div>

          {/* Sidebar */}
          <div className="grid content-start gap-3 p-3 bg-white dark:bg-[#252526] overflow-auto border-r border-zinc-200 dark:border-[#2d2d30]">
            <div>
              <div className="text-[10px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">CONFIG</div>
              <div className="flex gap-2">
                <Input aria-label="SMTP Config JSON" value={envPath} onChange={e=>setEnvPath(e.target.value)} placeholder="SMTP config.json" className="flex-1"/>
                <Button variant="secondary" onClick={()=>pickAndSet(setEnvPath, "Choose SMTP config", ["*.json"]) }><FolderOpen className="w-4 h-4"/></Button>
              </div>
            </div>
            <div>
              <div className="text-[10px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">DATA</div>
              <Input aria-label="CSV path" value={csvPath} onChange={e=>setCsvPath(e.target.value)} placeholder="recipients.csv"/>
              <Button variant="secondary" size="sm" onClick={()=>pickAndSet(setCsvPath, "Choose CSV", ["*.csv"]) } className="inline-flex items-center gap-2 mt-2"><FolderOpen className="w-3 h-3"/> Pick CSV</Button>
              <Input aria-label="Sheet URL" value={sheetUrl} onChange={e=>setSheetUrl(e.target.value)} placeholder="Google Sheet CSV export URL" className="mt-2"/>
            </div>
            <div>
              <div className="text-[10px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">META</div>
              <Input aria-label="Subject" value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Subject (templated)"/>
              <Input aria-label="CC" value={cc} onChange={e=>setCc(e.target.value)} placeholder="CC emails or @file" className="mt-2"/>
              <Input aria-label="BCC" value={bcc} onChange={e=>setBcc(e.target.value)} placeholder="BCC emails or @file" className="mt-2"/>
              <div className="mt-2 space-y-2">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Attachments</div>
                <div className="flex flex-wrap gap-2">
                  {attachments.map((a,i)=>(
                    <Badge key={i}><Paperclip className="w-3 h-3"/>{a}</Badge>
                  ))}
                </div>
                <Button variant="secondary" size="sm" onClick={pickAttachment} className="inline-flex items-center gap-2"><Paperclip className="w-3 h-3"/> Add</Button>
              </div>
            </div>
            <div>
              <div className="text-[10px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">FLAGS</div>
              <div className="grid grid-cols-3 gap-2">
                <Input aria-label="Workers" type="number" min={1} value={concurrency} onChange={e=>setConcurrency(parseInt(e.target.value||"1"))} className="px-2 py-1.5"/>
                <Input aria-label="Retries" type="number" min={0} value={retries} onChange={e=>setRetries(parseInt(e.target.value||"0"))} className="px-2 py-1.5"/>
                <Input aria-label="Batch" type="number" min={1} value={batchSize} onChange={e=>setBatchSize(parseInt(e.target.value||"1"))} className="px-2 py-1.5"/>
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 mt-2">
                <input type="checkbox" checked={dryRun} onChange={e=>setDryRun(e.target.checked)} />
                Dry run
              </label>
              <Input aria-label="Filter" value={filter} onChange={e=>setFilter(e.target.value)} placeholder={'Filter: tier = "pro" and age > 25'} className="mt-2"/>
            </div>
          </div>

          {/* Editor */}
          <div className="overflow-hidden bg-white dark:bg-[#1e1e1e] min-h-0">
            <div className="h-8 border-b border-zinc-200 dark:border-[#2d2d30] flex items-center text-xs">
              <div className="px-3 py-1 bg-zinc-100 dark:bg-[#2d2d30]">template.html</div>
            </div>
            <div className="h-[calc(100%-2rem)]">
              <MonacoHtml value={templateHTML} onChange={setTemplateHTML} dark={dark} />
            </div>
          </div>

          {/* Preview */}
          <div className="overflow-hidden bg-white dark:bg-[#1e1e1e] min-h-0 border-l border-zinc-200 dark:border-[#2d2d30]">
            <div className="h-8 border-b border-zinc-200 dark:border-[#2d2d30] flex items-center text-xs px-3">Preview</div>
            <iframe title="preview" className="w-full h-[calc(100%-2rem)] bg-white dark:bg-[#1e1e1e]" sandbox="allow-same-origin" srcDoc={`<!doctype html><html><head><meta charset='utf-8'></head><body>${templateHTML}</body></html>`}/>
          </div>
        </div>

        {/* Panel */}
        <div className="overflow-hidden bg-white dark:bg-[#252526] border-t border-zinc-200 dark:border-[#2d2d30]">
          <div className="h-8 border-b border-zinc-200 dark:border-[#2d2d30] text-xs flex items-center px-3">Activity</div>
          <div className="p-3 text-xs text-zinc-600 dark:text-[#858585] max-h-40 overflow-auto font-mono">
            {error && <div className="text-red-500">{error}</div>}
            {log.length===0 && !error && <div className="opacity-70">No activity yet.</div>}
            {log.map((l,i)=>(<div key={i}>• {l}</div>))}
          </div>
        </div>
    </div>
  );
}
