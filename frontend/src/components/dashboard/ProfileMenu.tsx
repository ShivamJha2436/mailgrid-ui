import { useMemo, useState } from "react";
import { Save, Settings2 } from "lucide-react";
import { OpenSaveFile, SaveTextFile } from "../../../wailsjs/go/main/App";
import Card from "../../ui/Card";
import Input from "../../ui/Input";
import Button from "../../ui/Button";

export default function ProfileMenu({ onConfigSaved }: { onConfigSaved: (path: string) => void }) {
  const [open, setOpen] = useState(false);
  const [host, setHost] = useState("");
  const [port, setPort] = useState<number>(587);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [from, setFrom] = useState("");

  const disabled = useMemo(() => !host || !port || !username || !password || !from, [host, port, username, password, from]);

  const save = async () => {
    const cfg = {
      smtp: { host, port, username, password, from },
      rate_limit: 10,
      timeout_ms: 5000,
    };
    const path = await OpenSaveFile("Save SMTP config", "mailgrid.config.json", ["*.json"]);
    if (!path) return;
    await SaveTextFile(path, JSON.stringify(cfg, null, 2));
    onConfigSaved(path);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white grid place-items-center text-xs font-semibold select-none">
        MG
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 z-50">
          <Card>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium flex items-center gap-2"><Settings2 className="w-4 h-4"/> SMTP Profile</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Host" value={host} onChange={e=>setHost(e.target.value)} className="col-span-2"/>
                <Input placeholder="Port" type="number" value={port} onChange={e=>setPort(parseInt(e.target.value||"0"))} />
                <Input placeholder="From" value={from} onChange={e=>setFrom(e.target.value)} />
                <Input placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} className="col-span-2"/>
                <Input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} className="col-span-2"/>
              </div>
              <div className="flex justify-end">
                <Button disabled={disabled} onClick={save} size="sm" className="inline-flex items-center gap-2"><Save className="w-3 h-3"/> Save</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
