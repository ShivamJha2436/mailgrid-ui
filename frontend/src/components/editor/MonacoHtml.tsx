import { useEffect } from "react";
import Editor from "@monaco-editor/react";

export default function MonacoHtml({ value, onChange, dark }: { value: string; onChange: (v: string) => void; dark: boolean }) {
  useEffect(() => {
    // Ensure theme aligns with current mode
  }, [dark]);

  return (
    <Editor
      height="100%"
      defaultLanguage="html"
      theme={dark ? "vs-dark" : "light"}
      value={value}
      onChange={(v: string | undefined) => onChange(v ?? "")}
      options={{
        minimap: { enabled: false },
        wordWrap: "on",
        fontSize: 13,
        lineNumbers: "on",
        automaticLayout: true,
        scrollBeyondLastLine: false,
        tabSize: 2,
        padding: { top: 8, bottom: 8 },
      }}
    />
  );
}
