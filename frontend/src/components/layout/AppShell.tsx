import React from "react";
import { Sun, Moon } from "lucide-react";
import Button from "../../ui/Button";
import ProfileMenu from "../dashboard/ProfileMenu";
import { ThemeProvider, useTheme } from "../../context/theme";

function HeaderBar() {
  const { dark, toggle } = useTheme();
  return (
    <div className="sticky top-0 z-40 bg-white dark:bg-[#1e1e1e] border-b border-zinc-200 dark:border-[#2d2d30]">
      <div className="px-4 h-12 flex items-center justify-between">
        <div className="text-sm font-semibold tracking-tight">Mailgrid</div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" aria-label="Toggle Theme" onClick={toggle}>
            {dark ? <Sun size={16}/> : <Moon size={16}/>}
          </Button>
          <ProfileMenu onConfigSaved={()=>{}}/>
        </div>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-[#1e1e1e] dark:text-[#cccccc]">
        <HeaderBar />
        <main className="p-2">
          {children}
        </main>
      </div>
    </ThemeProvider>
  );
}

