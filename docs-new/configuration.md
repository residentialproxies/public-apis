# 配置说明（Configuration）

> 日期: 2025-12-15  
> 目标: 把“本地开发 / 生产部署 / 定时任务”所需配置，收敛为一份可直接照着做的清单

---

## 1. Backend（`apps/backend`）

### 1.1 必填环境变量（启动即需要）

| 变量             | 示例                                                       | 说明                                       |
| ---------------- | ---------------------------------------------------------- | ------------------------------------------ |
| `DATABASE_URI`   | `postgres://payload:payload@127.0.0.1:54322/api_navigator` | Postgres 连接串（Payload 使用）            |
| `PAYLOAD_SECRET` | `...`                                                      | Payload 加密/会话密钥（生产必须强随机）    |
| `JOB_TOKEN`      | `...`                                                      | 触发 Sync/Health Admin API 的 Bearer Token |

> 代码入口：`apps/backend/src/config/env.ts`（`getAppConfig()`）。

### 1.2 可选环境变量（有默认值）

#### 基础/运行时

| 变量                        | 默认值                  | 说明                                                        |
| --------------------------- | ----------------------- | ----------------------------------------------------------- |
| `CORS_ORIGINS`              | `http://localhost:3000` | 逗号分隔的 Origin 白名单（Payload CORS + CSRF）             |
| `PAYLOAD_PUBLIC_SERVER_URL` | -                       | 后端对外可访问的 URL（Payload `serverURL`）                 |
| `SERVER_URL`                | -                       | 同上（兼容字段）                                            |
| `POSTGRES_EXTENSIONS`       | `pg_trgm`               | 逗号分隔，Payload 启动时可 `CREATE EXTENSION IF NOT EXISTS` |
| `PAYLOAD_DB_PUSH`           | `true`（非生产）        | 是否允许 Payload 自动 push schema（生产建议关闭）           |

#### Sync Job（`runSyncJob`）

| 变量                  | 默认值                                                                       | 说明                                          |
| --------------------- | ---------------------------------------------------------------------------- | --------------------------------------------- |
| `SYNC_UPSTREAM_URL`   | `https://raw.githubusercontent.com/public-apis/public-apis/master/README.md` | 上游 README                                   |
| `SYNC_DIFF_THRESHOLD` | `0.2`                                                                        | Diff 阈值（新增/更新/移除比例过大则中止写入） |
| `SYNC_MAX_BATCH_SIZE` | `250`                                                                        | 单批 upsert 上限（保护 DB）                   |

#### Health Job（`runHealthJob`）

| 变量                             | 默认值                                                                          | 说明                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `HEALTH_CONCURRENCY`             | `10`                                                                            | 并发数                                                                            |
| `HEALTH_TIMEOUT_MS`              | `10000`                                                                         | 单次请求超时                                                                      |
| `HEALTH_MAX_REDIRECTS`           | `5`                                                                             | 最大重定向次数                                                                    |
| `HEALTH_MAX_RESPONSE_SIZE_BYTES` | `1048576`                                                                       | 最大响应体大小                                                                    |
| `HEALTH_BATCH_SIZE`              | `200`                                                                           | 每次任务处理的 API 数量上限                                                       |
| `HEALTH_INTERVAL_MS`             | `3600000`                                                                       | 正常下一次探活间隔                                                                |
| `HEALTH_RECHECK_DELAY_MS`        | `3600000`                                                                       | 失败后的复查延迟                                                                  |
| `HEALTH_CONSECUTIVE_FAILURES`    | `3`                                                                             | 连续失败次数达到阈值才标记 down                                                   |
| `HEALTH_SLOW_THRESHOLD_MS`       | `5000`                                                                          | 慢响应阈值（> 阈值 → slow）                                                       |
| `HEALTH_USER_AGENT`              | `Mozilla/5.0 (compatible; ApiNavigatorBot/1.0; +https://api-navigator.com/bot)` | 探活 UA                                                                           |
| `HEALTH_SSRF_ALLOW_CIDRS`        | -                                                                               | 逗号分隔 CIDR 白名单（仅用于特殊网络环境；默认空，仍阻止私网/回环/本地/云元数据） |

---

## 2. Frontend（`apps/frontend`）

| 变量                   | 默认值                  | 说明                                          |
| ---------------------- | ----------------------- | --------------------------------------------- |
| `NEXT_PUBLIC_CMS_URL`  | `http://localhost:3001` | 后端（CMS/Public API）基址                    |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | 站点对外 URL（用于 canonical/sitemap/robots） |

---

## 3. Cloudflare Workers（OpenNext）

生产部署时主要看两处：

- `apps/frontend/open-next.config.ts`：使用 **R2 incremental cache** + **KV tag cache**（ISR 可用）
- `apps/frontend/wrangler.toml`：配置 `vars` + R2/KV bindings

需要的 binding 名称（与 OpenNext 覆盖实现保持一致）：

- R2：`NEXT_INC_CACHE_R2_BUCKET`
- KV：`NEXT_TAG_CACHE_KV`

---

## 4. 本地开发推荐配置

1. Postgres：`docker compose up -d postgres`（本仓库默认映射到宿主机 `54322`）
2. 后端：复制并修改 `apps/backend/.env.example` → `apps/backend/.env`
3. 前端：复制并修改 `apps/frontend/.env.example` → `apps/frontend/.env.local`
