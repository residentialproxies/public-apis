import net from "node:net";

function parsePort(raw) {
  const port = Number(raw);
  if (!Number.isFinite(port) || port <= 0 || port > 65535) return null;
  return Math.floor(port);
}

const port = parsePort(process.argv[2]);
if (!port) {
  console.error("Usage: node scripts/check-port.mjs <port>");
  process.exit(1);
}

const server = net.createServer();
server.unref();

server.once("error", (err) => {
  if (
    err &&
    typeof err === "object" &&
    "code" in err &&
    err.code === "EADDRINUSE"
  ) {
    console.error(`[check-port] Port ${port} is already in use.`);
    console.error(`[check-port] Inspect: lsof -nP -iTCP:${port} -sTCP:LISTEN`);
    console.error(`[check-port] Force kill: pnpm dev:force`);
    process.exit(1);
  }

  console.error("[check-port] Failed to check port:", err);
  process.exit(1);
});

server.listen(port, () => {
  server.close(() => process.exit(0));
});
