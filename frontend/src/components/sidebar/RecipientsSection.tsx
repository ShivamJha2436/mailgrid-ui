import { Loader2, FileText, Cloud, Mail, Upload, Users } from "lucide-react";

interface RecipientsSectionProps {
  dataSource: "csv" | "sheet";
  setDataSource: (source: "csv" | "sheet") => void;
  csvPath: string;
  setCsvPath: (path: string) => void;
  sheetUrl: string;
  setSheetUrl: (url: string) => void;
  to: string;
  setTo: (email: string) => void;
  csvContent: string;
  setCsvContent: (content: string) => void;
  cc: string;
  setCc: (cc: string) => void;
  bcc: string;
  setBcc: (bcc: string) => void;
  csvData: any[];
  isLoadingCsv: boolean;
  onPickFile: (setter: (v: string) => void, title: string, patterns?: string[]) => Promise<void>;
  inputClass: string;
  buttonClass: string;
  cardClass: string;
}

export default function RecipientsSection({
  dataSource,
  setDataSource,
  csvPath,
  setCsvPath,
  sheetUrl,
  setSheetUrl,
  to,
  setTo,
  csvContent,
  setCsvContent,
  cc,
  setCc,
  bcc,
  setBcc,
  csvData,
  isLoadingCsv,
  onPickFile,
  inputClass,
  buttonClass,
  cardClass
}: RecipientsSectionProps) {
  return (
    <div className={cardClass + " p-4"}>
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Users className="w-4 h-4" />
        Recipients
      </h3>
      
      {/* Data Source Toggle */}
      <div className="grid grid-cols-3 gap-1 mb-3 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
        <button
          onClick={() => setDataSource("csv")}
          className={`py-1.5 text-xs font-medium rounded transition-all ${
            dataSource === "csv" 
              ? "bg-white dark:bg-zinc-700 shadow-sm" 
              : "hover:bg-white/50 dark:hover:bg-zinc-700/50"
          }`}
        >
          <FileText className="w-3 h-3 inline mr-1" />
          CSV
        </button>
        <button
          onClick={() => setDataSource("sheet")}
          className={`py-1.5 text-xs font-medium rounded transition-all ${
            dataSource === "sheet" 
              ? "bg-white dark:bg-zinc-700 shadow-sm" 
              : "hover:bg-white/50 dark:hover:bg-zinc-700/50"
          }`}
        >
          <Cloud className="w-3 h-3 inline mr-1" />
          Sheet
        </button>
        <button
          onClick={() => {
            setDataSource("csv");
            setTo(to ? "" : "test@example.com");
          }}
          className={`py-1.5 text-xs font-medium rounded transition-all ${
            to ? "bg-white dark:bg-zinc-700 shadow-sm" : "hover:bg-white/50 dark:hover:bg-zinc-700/50"
          }`}
        >
          <Mail className="w-3 h-3 inline mr-1" />
          Single
        </button>
      </div>
      
      {to ? (
        <input
          type="email"
          value={to}
          onChange={e => setTo(e.target.value)}
          placeholder="Single recipient email"
          className={inputClass}
        />
      ) : dataSource === "csv" ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={csvPath}
              onChange={e => setCsvPath(e.target.value)}
              placeholder="recipients.csv"
              className={inputClass + " flex-1"}
            />
            <button
              onClick={() => onPickFile(setCsvPath, "Choose CSV", ["*.csv"])}
              className={buttonClass + " bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"}
            >
              <Upload className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <textarea
              value={csvContent || `name,email,company,role,tier\nJohn Doe,john@example.com,TechCorp,Developer,pro\nJane Smith,jane@example.com,DesignHub,Designer,premium`}
              onChange={e => setCsvContent(e.target.value)}
              placeholder="Paste CSV data here..."
              rows={4}
              className={inputClass + " font-mono text-xs"}
            />
            {isLoadingCsv && (
              <div className="absolute top-2 right-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              </div>
            )}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {csvData.length} recipients loaded
          </div>
        </div>
      ) : (
        <input
          type="text"
          value={sheetUrl}
          onChange={e => setSheetUrl(e.target.value)}
          placeholder="Google Sheets URL"
          className={inputClass}
        />
      )}
      
      {/* CC/BCC */}
      <div className="mt-3 space-y-2">
        <input
          type="text"
          value={cc}
          onChange={e => setCc(e.target.value)}
          placeholder="CC (comma-separated or @file)"
          className={inputClass}
        />
        <input
          type="text"
          value={bcc}
          onChange={e => setBcc(e.target.value)}
          placeholder="BCC (comma-separated or @file)"
          className={inputClass}
        />
      </div>
    </div>
  );
}
