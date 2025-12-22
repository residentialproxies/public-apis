# 部署指南（Deployment Guide）

> 日期: 2025-12-15  
> 目标: 用“最少组件 + 可回滚 + 可运维”的方式上线（staging → production）

---

## 1. 生产架构（推荐）

- 前端：Cloudflare Workers（OpenNext，Next.js 16，ISR 为主）
- 后端：VPS Docker（Payload CMS + Postgres）
- 定时任务：通过 `POST /api/admin/sync` 与 `POST /api/admin/health` 触发（cron / GitHub Actions）

域名建议：

- `api-navigator.com` → 前端（Workers）
- `cms.api-navigator.com` → 后端（VPS，建议仅暴露必要端口并加反代）

---

## 2. 后端部署（VPS Docker）

### 2.1 基础准备

- Ubuntu 22.04+ / Debian 12+（推荐）
- Docker + Docker Compose
- Postgres 数据盘/卷（必须持久化）

### 2.2 环境变量（生产）

后端至少需要：

- `DATABASE_URI`（指向 Postgres）
- `PAYLOAD_SECRET`（强随机）
- `JOB_TOKEN`（强随机，供 cron 触发 job）
- `CORS_ORIGINS`（建议仅允许前端域名）

### 2.3 docker compose（示例）

> 以下为示例模板，实际镜像名/版本按你的 CI 推送为准。
> 仓库内也提供了可直接复用的模板：`deploy/backend/docker-compose.yml` + `deploy/backend/.env.example`。

```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: payload
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?required}
      POSTGRES_DB: api_navigator
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U payload -d api_navigator"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    image: ghcr.io/your-org/api-navigator-backend:latest
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      NODE_ENV: production
      DATABASE_URI: postgres://payload:${POSTGRES_PASSWORD}@postgres:5432/api_navigator
      PAYLOAD_SECRET: ${PAYLOAD_SECRET:?required}
      JOB_TOKEN: ${JOB_TOKEN:?required}
      CORS_ORIGINS: ${CORS_ORIGINS:-https://api-navigator.com}
      PAYLOAD_DB_PUSH: "false"
      POSTGRES_EXTENSIONS: "pg_trgm"
    ports:
      - "127.0.0.1:3001:3000"
    healthcheck:
      test:
        [
          "CMD",
          "node",
          "-e",
          "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))",
        ]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  pgdata:
```

### 2.4 反向代理（Nginx/Caddy）

建议用 `cms.api-navigator.com` 暴露后端，并在反代层做：

- 强制 HTTPS
- 限制 `POST /api/admin/*` 仅允许运维来源（可选）
- 统一安全头（至少 `X-Content-Type-Options` / `X-Frame-Options`）

---

## 3. 定时任务（cron / Actions）

后端提供 Bearer Token 保护的触发接口：

- `POST /api/admin/sync`
- `POST /api/admin/health`

示例（VPS crontab）：

```bash
# 每天 03:10 同步
10 3 * * * curl -fsS -X POST "https://cms.api-navigator.com/api/admin/sync" -H "Authorization: Bearer $JOB_TOKEN" >/dev/null

# 每小时探活（分批）
0 * * * * curl -fsS -X POST "https://cms.api-navigator.com/api/admin/health" -H "Authorization: Bearer $JOB_TOKEN" >/dev/null
```

---

## 4. 前端部署（Cloudflare Workers / OpenNext）

### 4.1 资源准备

- Cloudflare R2 bucket：用于 ISR incremental cache（binding: `NEXT_INC_CACHE_R2_BUCKET`）
- Cloudflare KV namespace：用于 tag cache（binding: `NEXT_TAG_CACHE_KV`）

### 4.2 配置

- `apps/frontend/wrangler.toml`：设置
  - `NEXT_PUBLIC_CMS_URL=https://cms.api-navigator.com`
  - `NEXT_PUBLIC_SITE_URL=https://api-navigator.com`
  - R2/KV 的 bucket/namespace 信息

### 4.3 构建与发布（示例命令）

```bash
pnpm --filter @api-navigator/frontend build:worker
pnpm --filter @api-navigator/frontend deploy:worker
```

---

## 5. 上线检查清单（最小闭环）

- 后端：
  - `GET /api/health` 返回 `healthy`
  - `POST /api/admin/sync` 可跑通且无 diff 阈值误触发
  - `POST /api/admin/health` 可跑通（SSRF 拦截不导致 down 误报）
- 前端：
  - 首页/分类页/详情页可访问
  - sitemap/robots 正常
- 运维：
  - Postgres 备份策略落地（至少每日备份 + 定期恢复演练）
