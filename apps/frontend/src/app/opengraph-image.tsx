import { ImageResponse } from "next/og";

import { fetchPublicApisRepoStats, fallbackRepoStats } from "@/lib/github";
import { formatCompactNumber } from "@/lib/format";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Public API - Discover and Monitor Public APIs";

export default async function OpenGraphImage() {
  const repoStats = await fetchPublicApisRepoStats().catch(() =>
    fallbackRepoStats(),
  );
  const stars = formatCompactNumber(repoStats.stars) ?? "300K+";
  const apiCount = "1,400+";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0f14",
        fontFamily:
          'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
        color: "#e0e8e4",
        position: "relative",
      }}
    >
      {/* Terminal scan line effect */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 136, 0.03) 2px, rgba(0, 255, 136, 0.03) 4px)",
          pointerEvents: "none",
        }}
      />

      {/* Main terminal window */}
      <div
        style={{
          width: 1100,
          height: 530,
          display: "flex",
          flexDirection: "column",
          borderRadius: 16,
          border: "1px solid rgba(0, 255, 136, 0.3)",
          background: "#0f1419",
          boxShadow: "0 0 60px rgba(0, 255, 136, 0.15)",
          overflow: "hidden",
        }}
      >
        {/* Terminal header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 24px",
            background: "#1a1f26",
            borderBottom: "1px solid rgba(0, 255, 136, 0.2)",
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 7,
              background: "#ff5f57",
            }}
          />
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 7,
              background: "#febc2e",
            }}
          />
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 7,
              background: "#28c840",
            }}
          />
          <div style={{ marginLeft: 16, fontSize: 14, color: "#6b7280" }}>
            public-api.org ~ /apis
          </div>
        </div>

        {/* Terminal content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: 40,
            gap: 28,
            flex: 1,
          }}
        >
          {/* Logo and title */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 12,
                border: "2px solid #00ff88",
                background: "#0a0f14",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                fontWeight: 900,
                color: "#00ff88",
              }}
            >
              {"</>"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div
                style={{
                  fontSize: 42,
                  fontWeight: 800,
                  color: "#e0e8e4",
                  letterSpacing: "-1px",
                }}
              >
                Public_API
              </div>
              <div style={{ fontSize: 18, color: "#00d9ff" }}>
                $ discover --apis --health --docs
              </div>
            </div>
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 28,
              color: "#9ca3af",
              lineHeight: 1.4,
            }}
          >
            <span style={{ color: "#00ff88" }}>&gt;</span> Find, compare, and
            integrate public APIs with{" "}
            <span style={{ color: "#00ff88" }}>live health monitoring</span> and{" "}
            <span style={{ color: "#00d9ff" }}>real-time availability</span>
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 20, marginTop: "auto" }}>
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 6,
                padding: 20,
                borderRadius: 12,
                background: "rgba(0, 255, 136, 0.1)",
                border: "1px solid rgba(0, 255, 136, 0.3)",
              }}
            >
              <div style={{ fontSize: 14, color: "#6b7280" }}>APIs Indexed</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#00ff88" }}>
                {apiCount}
              </div>
            </div>
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 6,
                padding: 20,
                borderRadius: 12,
                background: "rgba(0, 217, 255, 0.1)",
                border: "1px solid rgba(0, 217, 255, 0.3)",
              }}
            >
              <div style={{ fontSize: 14, color: "#6b7280" }}>GitHub Stars</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#00d9ff" }}>
                {stars}
              </div>
            </div>
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 6,
                padding: 20,
                borderRadius: 12,
                background: "rgba(255, 170, 0, 0.1)",
                border: "1px solid rgba(255, 170, 0, 0.3)",
              }}
            >
              <div style={{ fontSize: 14, color: "#6b7280" }}>
                Health Checks
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#ffaa00" }}>
                Hourly
              </div>
            </div>
          </div>

          {/* Domain footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: 16,
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <div style={{ fontSize: 16, color: "#6b7280" }}>
              <span style={{ color: "#9333ea" }}>auth</span> |{" "}
              <span style={{ color: "#00d9ff" }}>cors</span> |{" "}
              <span style={{ color: "#00ff88" }}>https</span> |{" "}
              <span style={{ color: "#ffaa00" }}>latency</span> | categories
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#e0e8e4" }}>
              public-api.org
            </div>
          </div>
        </div>
      </div>
    </div>,
    { ...size },
  );
}
