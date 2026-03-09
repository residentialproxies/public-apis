import { defineCloudflareConfig } from "@opennextjs/cloudflare/config";

export default defineCloudflareConfig({
  // No persistent R2/KV cache — pages render from live origin.
  // Eliminates all R2 PutObject writes to api-navigator-inc-cache.
  incrementalCache: "dummy",
  tagCache: "dummy",

  // Direct queue processing (no Durable Objects needed)
  queue: "direct",
});
