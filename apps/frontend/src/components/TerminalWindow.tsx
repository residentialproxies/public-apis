type TerminalWindowProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
};

export function TerminalWindow({
  title,
  children,
  className = "",
}: TerminalWindowProps) {
  return (
    <div className={`terminal-surface overflow-hidden ${className}`}>
      <div className="terminal-header rounded-t-lg">
        <div className="flex items-center gap-1.5">
          <span className="terminal-dot terminal-dot-red" />
          <span className="terminal-dot terminal-dot-yellow" />
          <span className="terminal-dot terminal-dot-green" />
        </div>
        <span className="ml-3 font-mono text-xs text-[var(--text-muted)]">
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}
