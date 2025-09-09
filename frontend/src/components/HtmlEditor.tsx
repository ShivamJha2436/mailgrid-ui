import {useEffect, useMemo, useRef} from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  className?: string;
};

export default function HtmlEditor({ value, onChange, className = "" }: Props) {
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const lines = useMemo(() => Math.max(1, value.split("\n").length), [value]);
  const placeholder = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Mailgrid</title>
  </head>
  <body>
    <!-- Use {{.name}} and others from CSV -->
    <h1>Hello {{.name}}</h1>
  </body>
</html>`;

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    const handle = () => {
      ta.style.height = "auto";
      ta.style.height = Math.max(200, ta.scrollHeight) + "px";
    };
    handle();
    const ro = new ResizeObserver(handle);
    ro.observe(ta);
    return () => ro.disconnect();
  }, []);

  return (
    <div className={`grid grid-cols-[3rem,1fr] gap-0 rounded-lg border border-border overflow-hidden bg-card ${className}`}>
      {/* Line numbers */}
      <div className="select-none text-right text-[11px] leading-6 bg-muted text-muted-foreground p-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>

      {/* Textarea */}
      <div className="p-2">
        <textarea
          ref={taRef}
          spellCheck={false}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-full min-h-[200px] resize-none outline-none bg-transparent text-sm font-mono text-foreground"
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}
