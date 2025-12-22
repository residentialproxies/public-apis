# 数据模型（Data Model）

> 日期: 2025-12-15  
> 目标: 明确“同步可覆盖 / 人工可编辑 / 前端可依赖”的字段边界，避免后期返工

---

## 1. 共享枚举（前后端一致）

统一放在 `packages/shared/src/types.ts`：

- `AuthType`：`No | apiKey | OAuth | X-Mashape-Key | User-Agent | Unknown`
- `CorsStatus`：`Yes | No | Unknown`
- `HealthStatus`：`pending | live | slow | unknown | down`
- `SyncStatus`：`active | archived | error`

---

## 2. Categories（`apps/backend/src/collections/Categories.ts`）

用于导航分类与 SEO 的 slug。

### 2.1 关键字段

- `name`（unique, indexed）：显示名称（例如 `Animals`）
- `slug`（unique, indexed）：URL 友好路径（例如 `animals`）
- `description`（optional）：分类描述（可用于 SEO）
- `source.anchor` / `source.lineRef`：上游 README 溯源（可选）
- `apiCount`：该分类下 API 数量（只读，sync 维护）
- `lastSyncedAt`：最后同步时间（只读，sync 维护）

### 2.2 权限与索引

- `read` 公开；`create/update/delete` 需要登录（Payload Admin）
- 索引：`name`、`slug`

---

## 3. APIs（`apps/backend/src/collections/Apis.ts`）

核心实体：每一行 README 表格对应一个 API 记录。

### 3.1 Upsert 主键（稳定性要求）

- `sourceKey`（unique, indexed）：Sync Job 的稳定 upsert key  
  生成方式：`sha256(normalizeUrl(upstream.link))`（实现见 `apps/backend/src/lib/url.ts` + `apps/backend/src/lib/crypto.ts`）

### 3.2 字段分层（最重要）

#### resolved（对外展示 / 探活使用）

这些字段是“最终值”，前端与 Health Job 使用：

- `name`, `description`, `link`, `auth`, `https`, `cors`

#### upstream（同步写入，允许覆盖）

`upstream.*` 仅用于追溯与再计算，Sync Job 会覆盖它：

- `upstream.name`, `upstream.description`, `upstream.link`, `upstream.auth`, `upstream.https`, `upstream.cors`

#### override（人工覆盖，优先级高）

用于编辑纠错且不被同步覆盖：

- `override.isManualOverride`（boolean）
- `override.name` / `override.description` / `override.link`
- `override.overrideReason`

> `beforeChange` hook 会根据 `override.isManualOverride` 决定 resolved 字段取值（详情见 `apps/backend/src/collections/Apis.ts`）。

### 3.3 同步状态

- `syncStatus`：`active | archived | error`
- `upstreamRemovedAt`：上游移除时间（软删除）

### 3.4 探活字段（Health Job 写入）

- `healthStatus`：`pending | live | slow | unknown | down`
- `latencyMs`
- `lastCheckedAt`
- `healthNextCheckAt`（用于“到期批处理”调度）
- `lastStatusCode`
- `consecutiveFailures`
- `lastError`

### 3.5 溯源信息（审计/排错）

`source.*`：

- `repo`（默认 `public-apis/public-apis`）
- `path`（默认 `README.md`）
- `commitSha`（best-effort 记录上游提交）
- `lineRef` / `fetchedAt`

### 3.6 索引（面向查询与任务调度）

主要索引用于：

- 列表过滤：`category`, `healthStatus`, `auth/https/cors`, `syncStatus`
- 探活调度：`healthNextCheckAt`, `consecutiveFailures`

---

## 4. JobRuns（`apps/backend/src/collections/JobRuns.ts`）

用于运维可观测：记录每次 Sync/Health 的开始/结束、耗时、统计与错误信息。

### 4.1 关键字段

- `jobName`: `sync | health`
- `status`: `success | failed | skipped`
- `startedAt` / `finishedAt` / `durationMs`
- `meta`：`upstreamUrl` / `commitSha` / `fetchedAt`
- `stats`：同步/探活统计（created/updated/archived/live/down/unknown/slow…）
- `diff`：diff ratio/threshold/reason（用于阈值中止的可追溯）
- `error`：失败原因（字符串）

---

## 5. 面向生产的约束建议

- Postgres 建议启用 `pg_trgm`（Payload 可通过 `POSTGRES_EXTENSIONS` 自动创建），为后续模糊搜索预留空间
- Public API 读取只依赖 resolved 字段，避免前端直接理解 upstream/override 细节
