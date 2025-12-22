# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

API Navigator - 将 `public-apis/public-apis` 从扁平列表升级为结构化 API 导航站，具有可用性信号和高效检索能力。

## Monorepo Structure

pnpm workspace + Turbo monorepo:

- `apps/backend` - Payload CMS (Next.js 15.5.9) + PostgreSQL 16，端口 3001
- `apps/frontend` - Next.js 16.0.10 前端应用，端口 3010，支持 Cloudflare Workers 部署
- `packages/shared` - 共享类型定义（AuthType, HealthStatus, CorsStatus, SyncStatus 等）

## Essential Commands

### Initial Setup

```bash
# Install dependencies
pnpm install

# Start PostgreSQL database (port 54322)
docker compose up -d postgres

# Setup environment variables
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env.local
# Edit .env files - minimally set PAYLOAD_SECRET and JOB_TOKEN
```

### Development

```bash
# Start all services in parallel
pnpm dev

# Start backend only (Payload Admin)
pnpm --filter @api-navigator/backend dev

# Start frontend only
pnpm --filter @api-navigator/frontend dev

# Clean restart backend (removes .next cache)
pnpm --filter @api-navigator/backend devsafe
```

### Build & Test

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @api-navigator/backend build
pnpm --filter @api-navigator/frontend build

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Backend tests (integration + e2e)
pnpm --filter @api-navigator/backend test

# Backend integration tests only
pnpm --filter @api-navigator/backend test:int

# Backend e2e tests only
pnpm --filter @api-navigator/backend test:e2e

# Frontend tests
pnpm --filter @api-navigator/frontend test
```

### Background Jobs

Backend provides several cron-style jobs:

```bash
# Sync upstream public-apis README
pnpm --filter @api-navigator/backend job:sync

# Health check APIs (ping endpoints, record latency)
pnpm --filter @api-navigator/backend job:health

# Take screenshots of API landing pages
pnpm --filter @api-navigator/backend job:screenshot

# Extract SEO metadata
pnpm --filter @api-navigator/backend job:seo-extract

# AI enrichment (enhance descriptions)
pnpm --filter @api-navigator/backend job:enrich

# Start scheduler (runs all jobs on schedule)
pnpm --filter @api-navigator/backend job:scheduler
```

Jobs can also be triggered via Admin API:
```bash
curl -X POST "http://localhost:3001/api/admin/sync" \
  -H "Authorization: Bearer $JOB_TOKEN"
```

## Architecture

### Backend (Payload CMS + Next.js App Router)

**Collections** (`apps/backend/src/collections/`):
- `Apis.ts` - 核心实体，每条记录对应一个 API
  - `sourceKey` (unique): upsert 稳定键，基于 `sha256(normalizeUrl(link))`
  - 字段分层设计：
    - `upstream.*` - 上游同步数据（Sync Job 覆盖）
    - `override.*` - 人工覆盖字段（优先级高，不会被同步覆盖）
    - `resolved.*` - 最终展示值（前端使用，由 beforeChange hook 计算）
  - 探活字段：`healthStatus`, `latencyMs`, `lastCheckedAt`, `healthNextCheckAt`
  - 同步状态：`syncStatus` (active/archived/error)
- `Categories.ts` - API 分类
- `HealthLogs.ts` - 探活历史记录
- `JobRuns.ts` - Job 执行日志与统计
- `Users.ts` - Admin 用户
- `Media.ts` - 媒体文件（screenshots 等）

**Public API Routes** (`apps/backend/src/app/api/v1/public/`):
- `GET /api/v1/public/categories` - 获取所有分类
- `GET /api/v1/public/apis` - 列表/搜索 APIs（支持过滤、分页、排序）
- `GET /api/v1/public/apis/:id` - 单个 API 详情
- `GET /api/v1/public/facets` - 获取筛选维度数据
- `GET /api/v1/public/search` - 搜索 API（使用 PostgreSQL pg_trgm fuzzy search）
- `GET /api/v1/public/proxy` - 代理请求（SSRF 防护）

**Jobs** (`apps/backend/src/jobs/`):
- `sync/` - 从 upstream README 同步 API 数据
- `health/` - 批量探活 API endpoints
- `screenshot/` - 截图 API 落地页（Cloudflare Browser Rendering）
- `seo/` - 提取 SEO 元数据
- `enrich/` - AI 增强描述

**Key Libraries** (`apps/backend/src/lib/`):
- `url.ts` - URL 规范化与验证
- `crypto.ts` - sourceKey 生成（sha256）
- `ssrf-guard.ts` - SSRF 防护（阻止内网地址访问）
- `pg-lock.ts` - PostgreSQL advisory locks（防止并发 job 冲突）
- `concurrency.ts` - 并发控制工具
- `ttl-cache.ts` - TTL 缓存实现

### Frontend (Next.js 16 App Router)

**App Structure** (`apps/frontend/src/app/[locale]/`):
- `/` - 首页
- `/apis` - API 列表页
- `/apis/[slug]` - API 详情页
- `/categories/[slug]` - 分类页
- `/compare` - API 对比页
- `/search` - 搜索结果页

**i18n Support**: 使用 `next-intl`，支持中英双语

**Components** (`apps/frontend/src/components/`):
- 组件化设计，遵循 Next.js 16 App Router 约定

### Shared Package

**类型定义** (`packages/shared/src/`):
- `types.ts` - 共享枚举（AuthType, CorsStatus, HealthStatus, SyncStatus）
- `pseo-*.ts` - 程序化 SEO 相关类型和生成器

## Database

PostgreSQL 16+ with `pg_trgm` extension:
- 支持模糊搜索（typo-tolerant search）
- Trigram 索引建在 `apis.name`, `apis.description`, `categories.name`
- 本地开发数据库通过 Docker 运行在端口 54322

**Important Indexes**:
- `sourceKey` (unique) - upsert 主键
- `healthNextCheckAt` - 探活任务调度
- `category`, `healthStatus`, `auth`, `https`, `cors`, `syncStatus` - 列表过滤

## Environment Variables

Backend requires:
- `DATABASE_URI` - PostgreSQL 连接字符串
- `PAYLOAD_SECRET` - Payload CMS 密钥（必填）
- `JOB_TOKEN` - Admin API 认证 token（必填）
- `SERVER_URL` / `PAYLOAD_PUBLIC_SERVER_URL` - 服务器 URL
- `CORS_ORIGINS` - CORS 白名单
- `SYNC_UPSTREAM_URL` - 上游数据源 URL
- Health check 相关：`HEALTH_CONCURRENCY`, `HEALTH_BATCH_SIZE`, `HEALTH_TIMEOUT_MS`

Frontend requires:
- `NEXT_PUBLIC_CMS_URL` - Backend API URL
- `NEXT_PUBLIC_SITE_URL` - 前端站点 URL

## Data Flow

1. **Sync Job** 从 `public-apis/public-apis` README 同步数据 → 写入 `upstream.*` 字段 → `beforeChange` hook 计算 `resolved.*`
2. **Health Job** 批量 ping APIs → 更新 `healthStatus`, `latencyMs`, `lastCheckedAt`
3. **Screenshot Job** 使用 Cloudflare Puppeteer 截图 → 上传至 R2 → 记录 URL
4. **Frontend** 只读取 `resolved.*` 字段和探活数据

## Key Architectural Decisions

1. **字段分层设计** - `upstream` / `override` / `resolved` 三层分离，允许人工编辑且不被同步覆盖
2. **sourceKey as stable key** - 基于 URL hash，即使上游重排也能正确 upsert
3. **pg_trgm fuzzy search** - PostgreSQL 原生模糊搜索，无需额外搜索引擎
4. **SSRF 防护** - 所有外部请求经过 `ssrf-guard.ts` 验证
5. **Optimistic concurrency** - 使用 PostgreSQL advisory locks 防止 job 冲突
6. **Soft delete** - API 从上游移除时标记 `archived`，不物理删除

## Deployment

### Frontend (Cloudflare Workers)

**本地部署**：
```bash
# 1. 创建配置文件
cd apps/frontend
cp wrangler.example.toml wrangler.toml

# 2. 设置环境变量
export CLOUDFLARE_ACCOUNT_ID=your_account_id

# 3. 构建并部署
pnpm --filter @api-navigator/frontend build:worker
pnpm --filter @api-navigator/frontend deploy:worker
```

**CI/CD 部署（GitHub Actions）**：
- 自动触发：Push 到 main/production 分支
- 手动触发：GitHub Actions 页面点击 "Run workflow"
- 需要配置 GitHub Secrets（详见 DEPLOYMENT.md）

**重要**：
- `wrangler.toml` 已在 `.gitignore` 中，不会提交到 Git
- `account_id` 通过环境变量 `CLOUDFLARE_ACCOUNT_ID` ��递
- 所有密钥通过 GitHub Secrets 管理

### Backend (Docker)

Backend 支持 Docker 部署：
```bash
# 从仓库根目录构建
docker build -f apps/backend/Dockerfile -t api-navigator-backend .

# 使用 docker-compose（生产配置）
cd deploy/backend
docker-compose up -d
```

详细部署指南：
- `DEPLOYMENT.md` - Cloudflare Workers 部署完整指南
- `docs-new/deployment-guide.md` - 整体架构部署方案

## Testing Strategy

- Backend: integration tests (vitest) + e2e tests (playwright)
- Frontend: unit tests (vitest) + e2e tests (playwright)
- 测试文件位于 `apps/*/tests/` 目录

## Documentation

详细文档位于 `docs-new/` 目录：
- `production-implementation.md` - 生产实施方案
- `data-model.md` - 数据模型详解
- `ssrf-guard.md` - SSRF 防护说明
- `deployment-guide.md` - 部署指南
- `configuration.md` - 配置说明

## Development Tips

- 使用 `pnpm dev` 并行启动所有服务
- Backend Admin: http://localhost:3001/admin
- Backend Health API: http://localhost:3001/api/health
- Frontend: http://localhost:3010
- 数据库初始化会��动创建 `pg_trgm` extension 和 trigram 索引
- Job scheduler 可在开发环境运行，但建议生产环境用 cron 触发 Admin API
- 测试前确保数据库运行���`docker compose ps`
