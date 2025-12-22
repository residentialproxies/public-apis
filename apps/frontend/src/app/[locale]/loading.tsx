export default function Loading() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center px-6 py-20">
      <div className="terminal-surface overflow-hidden p-8 text-center">
        <div className="font-mono text-sm text-[var(--text-muted)]">
          <span className="text-[var(--accent-cyan)]">$</span> loading
          <span className="ml-1 inline-block animate-pulse">...</span>
        </div>
        <div className="mt-4 flex justify-center gap-1">
          <span
            className="size-2 animate-bounce rounded-full bg-[var(--accent-green)]"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="size-2 animate-bounce rounded-full bg-[var(--accent-green)]"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="size-2 animate-bounce rounded-full bg-[var(--accent-green)]"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </main>
  );
}
