# API Navigator 全面优化方案

> 版本: 1.0
> 日期: 2025-12-15
> 状态: Approved

---

## 一、项目概述

### 1.1 项目目标

将 [public-apis/public-apis](https://github.com/public-apis/public-apis) 的 README（扁平文本）转换为结构化导航站，提供：

1. **结构化数据**: 分类、认证方式、HTTPS、CORS 等字段
2. **可用性信号**: 通过定时探活显示 API 状态（Live/Down/Unknown）
3. **高效查找**: 全文搜索 + Facet 过滤

### 1.2 当前状态

```
Milestone 0: 文档与决策 ✓
├── docs/ARCHITECTURE.md (已完成)
├── docs/PLAN.md (已完成)
└── docs/adr/0001-initial-decisions.md (已完成)

Milestone 1-6: 核心实现 ✓
├── Monorepo + Turbo + workspace（已完成）
├── 数据模型（Categories / APIs / JobRuns）（已完成）
├── Sync Job（README 解析 + 幂等 Upsert + Diff 阈值 + 互斥锁）（已完成）
├── Health Job（SSRF Guard + 到期批处理 + 连续失败判定）（已完成）
├── Public API（搜索/过滤/分页/Facet）（已完成）
└── Frontend（列表/详情/SEO：sitemap/robots/JSON-LD）（已完成）

Milestone 7: 部署与运维落地（持续完善）
```

---

## 二、技术选型

### 2.1 版本矩阵

| 组件                                      | 原规划 | 推荐版本                              | 原因                                                                                            |
| ----------------------------------------- | ------ | ------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Next.js（Frontend）**                   | 未指定 | **16.0.10**                           | 面向用户的主站；OpenNext 对 Next patch 有 peer 约束，建议跟随同主版本最新 patch（安全补丁优先） |
| **Next.js（Backend / @payloadcms/next）** | 未指定 | **15.4.10**                           | Payload 3.68.x 的 Next 集成对 Next 版本有 peer 约束，后端按 Payload 模板锁定                    |
| **React**                                 | 未指定 | **19.2.1**                            | 用户要求                                                                                        |
| **Payload CMS**                           | v3     | **v3.68+（建议锁定到 3.68.x patch）** | 与后端 Next 版本匹配；升级跟随 patch                                                            |
| **Node.js**                               | 未指定 | **20.9.0+**                           | Next.js 16 最低要求                                                                             |
| **TypeScript**                            | 未指定 | **5.1.0+**                            | Next.js 16 最低要求                                                                             |
| **PostgreSQL**                            | 未指定 | **15+**                               | Payload CMS 推荐                                                                                |
| **pnpm**                                  | 未指定 | **9.0+**                              | Monorepo 管理                                                                                   |

> 注：版本号以“实施当日的稳定版兼容矩阵”为准；最终以锁定的 `package.json`/lockfile 为准，并把升级纳入常规运维（安全补丁优先）。

### 2.2 部署架构调整（关键变更）

#### 原方案问题

Cloudflare Pages 的 `@cloudflare/next-on-pages` 存在 ISR 限制：

- ISR 仅提供静态回退，无后台再生成
- Edge Runtime 限制 Node.js API
- 不支持完整的 `revalidate` 逻辑

#### 推荐方案

**OpenNext + Cloudflare Workers**

```
优势:
├── Node.js runtime（非 Edge 限制）
├── 完整 ISR/SSR/PPR 支持
├── 最高 50 并发 ISR 再验证
└── Durable Objects 管理队列
```

#### 部署架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                     API Navigator 部署架构                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Cloudflare Workers (OpenNext)                               │   │
│  │ domain: api-navigator.com                                   │   │
│  │ ├── Next.js 16.0.10 (App Router)                            │   │
│  │ ├── 完整 ISR 支持 (revalidate: 3600)                        │   │
│  │ └── Durable Objects (ISR Queue)                             │   │
│  └──────────────────────────┬──────────────────────────────────┘   │
│                             │ server-side fetch                     │
│                             ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ VPS Docker (CMS)                                            │   │
│  │ domain: cms.api-navigator.com                               │   │
│  │ ├── Payload CMS v3.68+ (Admin + API)                        │   │
│  │ ├── PostgreSQL 15+                                          │   │
│  │ ├── Redis (可选，队列/缓存)                                  │   │
│  │ ├── /api/public/* (只读，可缓存)                            │   │
│  │ ├── /api/admin/* (JOB_TOKEN 保护)                           │   │
│  │ └── Sync Job + Health Job (定时任务)                        │   │
│  └──────────────────────────┬──────────────────────────────────┘   │
│                             │                                       │
│                             ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 上游数据源                                                   │   │
│  │ raw.githubusercontent.com/public-apis/public-apis/master/   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 三、核心功能设计

### 3.1 导入器（Sync Job）

**职责**: 拉取上游 README → 解析 → 结构化存储

```
输入: https://raw.githubusercontent.com/public-apis/public-apis/master/README.md
输出: categories + apis collections

关键逻辑:
├── Markdown AST 解析（remark + remark-gfm）
├── 表格行解析 → ParsedAPI 对象
├── Diff 计算（新增/更新/删除）
├── 变更阈值检查（> 20% 则报警暂停）
├── 幂等 Upsert（基于 link 唯一键）
└── 软删除（标记 upstreamRemovedAt）

补充（生产必做）:
├── 字段分离：同步只写 upstream.*；人工修正写 override.*；resolved 值按 override 优先
├── 稳定主键：建议引入 sourceKey（基于 normalizeUrl(upstream.link) 的 hash），避免“人工改 link”导致 upsert 重复
└── 互斥锁：用 Postgres advisory lock（或 Redis lock）防止 sync 并发执行
```

### 3.2 探活器（Health Job）

**职责**: 检测 API 首页可用性

```
输入: apis.link
输出: healthStatus + latencyMs + lastCheckedAt

策略:
├── 优先 HEAD，超时/失败降级 GET
├── User-Agent: Mozilla/5.0 (compatible; ApiNavigatorBot/1.0; +https://api-navigator.com/bot)
├── 状态判定:
│   ├── 2xx/3xx → live
│   ├── 401/403/405 → unknown (站点活着但拦截)
│   └── 无响应/超时 → down (需连续 3 次确认)
├── 并发控制 (p-limit, concurrency=10)
└── 指数退避重试

补充（生产必做）:
├── 429 → unknown（限流不等于站点宕机）
├── 只检查“到期”记录（按 lastCheckedAt 分批），避免小时级全量扫
└── 互斥锁：防止 health 并发执行导致连续失败计数抖动
```

### 3.3 查询 API

**能力**:

| 功能  | MVP 实现                        | 中期增强          |
| ----- | ------------------------------- | ----------------- |
| 过滤  | category/auth/https/cors/status | -                 |
| 排序  | lastCheckedAt/name              | 多字段排序        |
| 分页  | offset 模式                     | cursor 模式       |
| 搜索  | where/contains                  | pg_trgm + trigram |
| Facet | 分组计数                        | 动态 facet        |

### 3.4 前端

**页面结构**:

```
app/
├── (main)/
│   ├── page.tsx              # 首页（搜索 + 过滤 + 列表）
│   ├── api/[id]/page.tsx     # 详情页
│   └── category/[slug]/page.tsx  # 分类页
├── sitemap.ts                # 动态 sitemap
└── robots.ts                 # robots.txt
```

**SEO 策略**:

- JSON-LD Schema (SoftwareApplication / WebAPI)
- meta description 动态生成
- ISR 缓存 (revalidate: 3600)

**CORS 简化建议**:

- 前端优先通过 Worker/SSR 侧请求 CMS（浏览器不直连 CMS），减少 CORS/CSRF 复杂度与暴露面

---

## 四、数据模型

详见: [data-model.md](./data-model.md)

**概要**:

```
categories:
├── name (唯一)
├── slug (SEO)
├── apiCount (统计)
└── lastSyncedAt

apis:
├── 基础字段: name, description, link, category, auth, https, cors
├── 同步状态: status (active/archived/error)
├── 探活字段: healthStatus, latencyMs, lastCheckedAt, consecutiveFailures
├── 上游字段: upstream.{...}
├── 覆盖字段: override.{...}
├── 来源元信息: source.{repo, path, commitSha, lineRef}
└── 软删除: upstreamRemovedAt
```

---

## 五、安全设计

详见: [ssrf-guard.md](./ssrf-guard.md)

**SSRF 防护要点**:

1. **协议白名单**: 仅 http/https
2. **IP 黑名单**: 私网地址全覆盖
3. **DNS Rebinding 防护**: 缓存 + 连接时验证
4. **重定向限制**: 最多 5 次
5. **响应限制**: 最大 1MB

**其他安全措施**:

- Admin API: JOB_TOKEN 或 Bearer Token 认证
- CORS: 配置允许的 origins
- 限流: 基于 IP / API Key

---

## 六、配置管理

详见: [configuration.md](./configuration.md)

**阈值外部化**:

```typescript
// 所有魔法数字配置化
sync.diffThreshold = 0.2; // 20% 变更阈值
health.concurrency = 10; // 并发数
health.consecutiveFailures = 3; // 标记 down 的失败次数
health.timeoutMs = 10000; // 超时时间
cache.listTtlSeconds = 3600; // 列表缓存
```

---

## 七、代码结构

```
api-navigator/
├── apps/
│   ├── backend/                 # Payload CMS
│   │   ├── src/
│   │   │   ├── collections/     # APIs.ts, Categories.ts
│   │   │   ├── jobs/
│   │   │   │   ├── sync/        # parser.ts, diff.ts, index.ts
│   │   │   │   └── health/      # checker.ts, index.ts
│   │   │   ├── lib/
│   │   │   │   ├── security/    # ssrf-guard.ts
│   │   │   │   └── markdown/    # parser.ts
│   │   │   ├── endpoints/       # 自定义 API
│   │   │   ├── types/           # enums.ts
│   │   │   └── config/          # app.config.ts
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── frontend/                # Next.js 16
│       ├── src/
│       │   ├── app/
│       │   ├── components/
│       │   └── lib/
│       ├── open-next.config.ts
│       └── package.json
│
├── packages/
│   ├── shared/                  # 共享类型
│   └── config/                  # ESLint/TS 配置
│
├── docker-compose.yml
├── pnpm-workspace.yaml
└── turbo.json
```

---

## 八、测试策略

**金字塔**:

```
        E2E (5%)       - Playwright
    Integration (20%)  - Supertest + TestContainers
      Unit (75%)       - Vitest (覆盖率 > 80%)
```

**关键测试用例**:

| 模块            | 测试场景                           |
| --------------- | ---------------------------------- |
| SSRF Guard      | localhost/私网 IP/协议/重定向 拦截 |
| Markdown Parser | 正常格式/异常格式/空表格/特殊字符  |
| Sync Diff       | 新增/更新/删除/阈值超限/幂等性     |
| Health Checker  | 2xx/3xx/401/403/超时/重定向/并发   |
| APIs Collection | CRUD/过滤/排序/分页/搜索           |

---

## 九、实施阶段

```
Phase 0: 基础设施准备
├── Monorepo 初始化 (pnpm + turbo)
├── Docker 环境 (postgres + redis)
└── 域名/Cloudflare 配置

Phase 1: 后端核心
├── Payload CMS 配置
├── Collections (Categories + APIs)
├── 枚举与类型定义
└── SSRF 防护实现

Phase 2: 同步任务
├── Markdown AST 解析器
├── Diff 计算与幂等 Upsert
└── 变更阈值保护

Phase 3: 探活任务
├── Health Checker
├── 并发控制与重试
└── 状态更新逻辑

Phase 4: Public/Admin API
├── 列表/详情/分类接口
├── 搜索/过滤/Facet
└── 认证与限流

Phase 5: 前端实现
├── Next.js 16 + React 19
├── 首页/详情/分类页
└── SEO + ISR

Phase 6: 部署与文档
├── OpenNext + Cloudflare Workers
├── CI/CD 流水线
└── 文档完善
```

---

## 十、风险与缓解

| 风险         | 影响     | 缓解措施                           |
| ------------ | -------- | ---------------------------------- |
| 上游格式变更 | 同步失败 | Markdown AST + 20% 阈值保护 + 报警 |
| 探活触发反爬 | IP 被封  | 并发控制 + 礼貌 UA + 退避重试      |
| SSRF 攻击    | 安全漏洞 | DNS Rebinding 防护 + IP 黑名单     |
| ISR 缓存失效 | 性能下降 | OpenNext + Workers 完整支持        |
| 数据库性能   | 查询慢   | pg_trgm 索引 + 适当缓存            |

---

## 十一、相关文档

- [data-model.md](./data-model.md) - 数据模型详细设计
- [ssrf-guard.md](./ssrf-guard.md) - SSRF 防护实现
- [deployment-guide.md](./deployment-guide.md) - 部署指南
- [configuration.md](./configuration.md) - 配置说明
- [production-implementation.md](./production-implementation.md) - 生产实施方案（上线流程与验收）

---

## 十二、参考资料

- [Payload CMS PostgreSQL](https://payloadcms.com/docs/database/postgres)
- [Next.js 16 Release](https://nextjs.org/blog/next-16)
- [OpenNext Cloudflare](https://opennext.js.org/cloudflare)
- [Payload CMS & Next.js 16 Compatibility](https://www.buildwithmatija.com/blog/payload-cms-nextjs-16-compatibility-breakthrough)
