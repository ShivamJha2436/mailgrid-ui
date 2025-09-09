import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Server, FolderOpen, Save } from "lucide-react";

interface SmtpSectionProps {
  envPath: string;
  setEnvPath: (path: string) => void;
  onPickFile: (setter: (v: string) => void, title: string, patterns?: string[]) => Promise<void>;
  onAddLog: (type: 'info' | 'error' | 'success', msg: string) => void;
  inputClass: string;
  buttonClass: string;
  cardClass: string;
}

export default function SmtpSection({ 
  envPath, 
  setEnvPath, 
  onPickFile, 
  onAddLog, 
  inputClass, 
  buttonClass, 
  cardClass 
}: SmtpSectionProps) {
  const [configOpen, setConfigOpen] = useState(false);
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpFrom, setSmtpFrom] = useState("");

  const saveSmtpConfig = async () => {
    const config = {
      smtp: {
        host: smtpHost,
        port: smtpPort,
        username: smtpUser,
        password: smtpPass,
        from: smtpFrom
      }
    };
    
    // Save to temp file
    const configStr = JSON.stringify(config, null, 2);
    const blob = new Blob([configStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mailgrid.config.json';
    a.click();
    URL.revokeObjectURL(url);
    
    onAddLog('success', 'SMTP configuration saved');
    setConfigOpen(false);
  };

  return (
    <div className={cardClass + " p-4"}>
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Server className="w-4 h-4" />
        SMTP Configuration
      </h3>
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={envPath}
            onChange={e => setEnvPath(e.target.value)}
            placeholder="config.json path"
            className={inputClass + " flex-1"}
          />
          <button
            onClick={() => onPickFile(setEnvPath, "Choose config", ["*.json"])}
            className={buttonClass + " bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"}
          >
            <FolderOpen className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={() => setConfigOpen(!configOpen)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          {configOpen ? 'Hide' : 'Create'} SMTP Config
        </button>
        
        <AnimatePresence>
          {configOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-2 overflow-hidden"
            >
              <input 
                type="text" 
                placeholder="SMTP Host" 
                value={smtpHost} 
                onChange={e => setSmtpHost(e.target.value)} 
                className={inputClass} 
              />
              <input 
                type="number" 
                placeholder="Port" 
                value={smtpPort} 
                onChange={e => setSmtpPort(parseInt(e.target.value) || 587)} 
                className={inputClass} 
              />
              <input 
                type="text" 
                placeholder="Username" 
                value={smtpUser} 
                onChange={e => setSmtpUser(e.target.value)} 
                className={inputClass} 
              />
              <input 
                type="password" 
                placeholder="Password" 
                value={smtpPass} 
                onChange={e => setSmtpPass(e.target.value)} 
                className={inputClass} 
              />
              <input 
                type="text" 
                placeholder="From Email" 
                value={smtpFrom} 
                onChange={e => setSmtpFrom(e.target.value)} 
                className={inputClass} 
              />
              <button 
                onClick={saveSmtpConfig} 
                className={buttonClass + " w-full bg-green-600 hover:bg-green-700 text-white"}
              >
                <Save className="w-4 h-4 inline mr-2" />
                Save Config
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
