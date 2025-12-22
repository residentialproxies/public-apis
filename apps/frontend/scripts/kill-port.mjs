import { execSync } from "node:child_process";

function parsePort(raw) {
  const port = Number(raw);
  if (!Number.isFinite(port) || port <= 0 || port > 65535) return null;
  return Math.floor(port);
}

const port = parsePort(process.argv[2]);
const yes = process.argv.includes("--yes") || process.argv.includes("--force");

if (!port) {
  console.error("Usage: node scripts/kill-port.mjs <port> [--yes]");
  process.exit(1);
}

let pids = [];
try {
  const out = execSync(`lsof -t -nP -iTCP:${port} -sTCP:LISTEN`, {
    stdio: ["ignore", "pipe", "ignore"],
  })
    .toString("utf8")
    .trim();
  pids = out
    ? out
        .split(/\s+/)
        .map((v) => Number(v))
        .filter((n) => Number.isFinite(n))
    : [];
} catch {
  // No listener or lsof not available.
  pids = [];
}

if (pids.length === 0) {
  console.log(`[kill-port] No process is listening on port ${port}.`);
  process.exit(0);
}

if (!yes) {
  console.error(
    `[kill-port] Refusing to kill ${pids.length} process(es) without --yes.`,
  );
  console.error(`[kill-port] PIDs: ${pids.join(", ")}`);
  console.error(
    `[kill-port] Re-run with: node scripts/kill-port.mjs ${port} --yes`,
  );
  process.exit(1);
}

for (const pid of pids) {
  try {
    process.kill(pid, "SIGTERM");
  } catch {
    // ignore
  }
}

await new Promise((r) => setTimeout(r, 300));

for (const pid of pids) {
  try {
    process.kill(pid, 0);
    process.kill(pid, "SIGKILL");
  } catch {
    // already gone
  }
}

console.log(
  `[kill-port] Killed ${pids.length} process(es) listening on port ${port}.`,
);
