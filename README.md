# API Navigator

把 `public-apis/public-apis` 的 README 从“扁平列表”升级为“结构化数据 + 可用性信号 + 高效检索”的导航站。

## 文档

- 生产实施方案：`docs-new/production-implementation.md`
- 完整优化方案：`docs-new/optimization-plan.md`
- 数据模型：`docs-new/data-model.md`
- SSRF 防护：`docs-new/ssrf-guard.md`
- 部署指南：`docs-new/deployment-guide.md`
- 配置说明：`docs-new/configuration.md`

## 架构概览（已落地）

- `apps/backend`：Payload CMS（Next.js 15.5.9）+ **PostgreSQL 16** with pg_trgm（端口 `3001`）
- `apps/frontend`：Next.js 16.0.10（OpenNext -> Cloudflare Workers）
- `packages/shared`：共享类型（AuthType / HealthStatus 等）

**数据库特性**:

- ✅ PostgreSQL 16+ with `pg_trgm` extension for fuzzy search
- ✅ Trigram indexes on APIs and Categories for typo-tolerant search
- ✅ Production-ready connection pooling

## 本地启动

### 0) 前置依赖

- Node.js 20.9+
- pnpm 9+
- Docker（用于本地 Postgres）

### 1) 启动数据库（本地端口 54322）

```bash
docker compose up -d postgres
```

**首次启动**会自动：

- 创建 `api_navigator` 数据库
- 启用 `pg_trgm` 扩展（模糊搜索）
- 创建 trigram 索引（apis.name, apis.description, categories.name）

验证数据库运行:

```bash
docker compose ps
# postgres should show "healthy"
```

### 2) 安装依赖

`pnpm install`

### 3) 配置环境变量

后端：

- `cp apps/backend/.env.example apps/backend/.env`
- 编辑 `apps/backend/.env`：至少填写 `PAYLOAD_SECRET` 与 `JOB_TOKEN`

前端：

- `cp apps/frontend/.env.example apps/frontend/.env.local`
- 如需自定义 CMS：修改 `NEXT_PUBLIC_CMS_URL`

### 4) 启动后端（Payload Admin）

`pnpm --filter @api-navigator/backend dev`

- Admin：`http://localhost:3001/admin`
- Health probe：`http://localhost:3001/api/health`

### 5) 启动前端

`pnpm --filter @api-navigator/frontend dev`

前端：`http://localhost:3010`

## 任务（Sync / Health）

两个 Job 通过 `JOB_TOKEN` 保护的 Admin API 触发（建议用于 cron / 运维）：

```bash
export JOB_TOKEN=... # 与 apps/backend/.env 中一致

curl -sS -X POST "http://localhost:3001/api/admin/sync" \
  -H "Authorization: Bearer $JOB_TOKEN" | jq

curl -sS -X POST "http://localhost:3001/api/admin/health" \
  -H "Authorization: Bearer $JOB_TOKEN" | jq
```

本地也可以直接跑内置 scheduler：

```bash
pnpm --filter @api-navigator/backend job:scheduler
```

## 公共 API（只读）

后端对外提供稳定契约（前端只依赖这些接口）：

- `GET /api/public/categories`
- `GET /api/public/apis`（搜索/过滤/分页/排序）
- `GET /api/public/apis/:id`
- `GET /api/public/facets`

## 测试与校验

```bash
# 单包
pnpm --filter @api-navigator/backend test
pnpm --filter @api-navigator/frontend build

# 全仓库
pnpm lint
pnpm typecheck
pnpm build
```
