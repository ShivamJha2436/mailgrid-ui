import React from "react";

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
};

export default function TextArea({ className = "", label, rows = 3, ...props }: Props) {
  const cls = `w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white ${className}`.trim();
  if (label) {
    return (
      <label className="grid gap-1 text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
        <textarea className={cls} rows={rows} {...props} />
      </label>
    );
  }
  return <textarea className={cls} rows={rows} {...props} />;
}

