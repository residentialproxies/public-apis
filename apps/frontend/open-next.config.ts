import { defineCloudflareConfig } from "@opennextjs/cloudflare/config";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import kvNextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/kv-next-tag-cache";

export default defineCloudflareConfig({
  // R2 for ISR cache - stores pre-rendered pages
  incrementalCache: r2IncrementalCache,

  // KV for tag-based revalidation
  tagCache: kvNextTagCache,

  // Direct queue processing (no Durable Objects needed)
  queue: "direct",
});
