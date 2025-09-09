import React from "react";

type Props = React.HTMLAttributes<HTMLSpanElement>;

export default function Badge({ className = "", ...props }: Props) {
  const cls = `inline-flex items-center gap-1 rounded border border-zinc-300 bg-zinc-100 px-2 py-1 text-[11px] text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 ${className}`.trim();
  return <span className={cls} {...props} />;
}

