import React from "react";

type Props = React.HTMLAttributes<HTMLDivElement> & {
  title?: string;
  description?: string;
};

export default function Card({ title, description, className = "", children, ...props }: Props) {
  return (
    <div className={`rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 ${className}`} {...props}>
      {(title || description) && (
        <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-800">
          {title && <div className="text-sm font-medium">{title}</div>}
          {description && <div className="text-xs text-zinc-500 dark:text-zinc-400">{description}</div>}
        </div>
      )}
      <div className="p-3">{children}</div>
    </div>
  );
}

