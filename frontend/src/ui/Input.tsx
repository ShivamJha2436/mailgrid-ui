import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export default function Input({ className = "", label, ...props }: Props) {
  const cls = `w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white ${className}`.trim();
  if (label) {
    return (
      <label className="grid gap-1 text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
        <input className={cls} {...props} />
      </label>
    );
  }
  return <input className={cls} {...props} />;
}

