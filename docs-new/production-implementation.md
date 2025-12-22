# 生产实施方案（Production Implementation）

> 日期：2025-12-15  
> 目标：把“结构化 + 探活 + 检索”的导航站，以可长期维护的方式上线并稳定运行

---

## 0. 最终形态（你要交付什么）

**线上组件**

- 前端：Cloudflare Workers（OpenNext）承载 Next.js（ISR 为主）
- 后端：VPS Docker（Payload + Postgres，Redis 可选）
- 定时任务：Sync Job（日更）+ Health Job（小时级/分批）

**核心能力（MVP 必须有）**

- 结构化字段：Category/Auth/HTTPS/CORS/Link/Description
- 可用性信号：healthStatus + lastCheckedAt + latencyMs +（Down 需连续失败确认）
- 查询体验：全文搜索 + Facet 过滤 + 分页 + 排序
- 可运维：可观测（日志/健康检查/任务运行记录）+ 回滚 + 备份

---

## 1. 仓库与环境（落地约定）

**Monorepo 结构（建议）**

```
api-navigator/
├── apps/
│   ├── backend/    # Payload（Docker）
│   └── frontend/   # Next.js（OpenNext -> Workers）
└── packages/
    ├── shared/     # 共享类型（AuthType 等）
```

**环境拆分（必须）**

- `staging`：验证同步、探活与 SEO 生成，不影响生产
- `production`：线上

---

## 2. 数据模型落地（防 6 个月后返工）

### 2.1 关键原则

- **稳定主键**：Upsert 不能只依赖“可被人工修正的 link/name”，要有稳定 `sourceKey`
- **字段分离**：`upstream.*` 永远可被同步覆盖；人工改动进 `override.*`；前端读取“resolved 值”（override 优先）
- **软删除**：上游移除 → `syncStatus=archived` + `upstreamRemovedAt`，不物理删除

### 2.2 推荐字段（摘要）

详见 `docs-new/data-model.md`，生产实施时建议补齐：

- `sourceKey`（唯一）：例如 `sha256(normalizeUrl(upstream.link))`
- `link`：对外展示/探活用的 resolved link（允许被 override）
- `upstream.link`：上游原值（用于追溯与再计算）

### 2.3 搜索性能（pg_trgm）

- 生产启用 `pg_trgm` 并建立 trigram 索引（name/description），支持容错搜索（wether → weather）
- Payload 默认 contains 在数据量上来后会变慢：中期把搜索走自定义 endpoint + SQL/Drizzle

---

## 3. Sync Job（同步策略：幂等、可回滚、不覆盖人工修正）

**输入**：上游 README（raw URL）  
**输出**：Categories/APIs Upsert + archived 标记

**生产必做保护**

- **字段冲突**：同步只写 `upstream.*`；若 `override.isManualOverride=true`，不要覆盖 resolved 字段
- **Diff 预警**：新增/更新/移除占比 > 阈值（默认 20%）→ **终止写入** + 记录告警（防解析器失效）
- **并发互斥**：用 Postgres advisory lock（或 Redis lock）防止重复触发导致数据抖动
- **删除策略**：上游缺失 → 标 archived，不 delete

**验收标准**

- 重跑同步不重复创建（幂等）
- 人工修正不被覆盖
- 上游误删/恢复可正确切换 archived/active

---

## 4. Health Job（探活策略：可信度优先）

**输入**：resolved `link`  
**输出**：healthStatus/latencyMs/lastCheckedAt/lastStatusCode/consecutiveFailures

**生产探活规则（默认）**

- 安全：所有请求必须走 SSRF Guard（协议白名单 + 私网阻断 + 重定向检查 + 响应大小/超时限制）
- 请求：HEAD 优先，失败降级 GET；固定礼貌 UA
- 判定：
  - 2xx/3xx（含 301/302/307/308）→ `live`
  - 401/403/405/429 → `unknown`（站点存活但拒绝/限流）
  - 超时/网络错误/5xx → 计为失败，达到阈值才 `down`
- 连续失败：首次失败不立刻红；进入复查队列（例如 1 小时后），连续 N 次才标 `down`
- 批处理：每次只检查“到期”的一批（按 `lastCheckedAt` + limit），避免每小时全量扫
- 并发：默认 10，按被封禁风险调整

**验收标准**

- 大量站点不会被误标 down（可信度）
- 探活任务可控（不会卡死/不会无限重试）

---

## 5. API 契约（前端只依赖契约开发）

**Public（只读，可缓存）**

- `GET /api/public/apis`：支持 `q`、`category`、`auth`、`https`、`cors`、`healthStatus`、`page/limit`、`sort`
- `GET /api/public/apis/:id`
- `GET /api/public/categories`
- `GET /api/public/facets`（可选，但强烈建议：前端 facet 计数需要它）

**Admin（只给定时任务/运维使用）**

- `POST /api/admin/sync`（Bearer `JOB_TOKEN`）
- `POST /api/admin/health`（Bearer `JOB_TOKEN`）
- `GET /api/health`（探针）

---

## 6. 前端上线策略（OpenNext + ISR）

**核心策略**

- 默认 ISR：列表/详情 `revalidate`（例如 3600s）
- 尽量“服务端抓取 CMS”：浏览器不直连 CMS，降低 CORS/CSRF 复杂度与暴露面
- SEO：详情页 JSON-LD + sitemap；聚合页（pSEO）先从“高价值过滤组合”做起

**SEO 防踩坑**

- 聚合页数量要可控：对低价值组合加 `noindex` 或不生成
- 统一 canonical，避免重复内容被降权

---

## 7. 部署与运维（必须有闭环）

### 7.1 CI/CD

- 后端：构建镜像 → 推 GHCR → VPS 拉取滚动更新（docker compose）
- 前端：GitHub Actions → OpenNext build → `wrangler deploy`

### 7.2 监控与告警（最小集）

- Uptime：`/api/health` + 站点首页
- Job Run：记录每次 sync/health 的开始/结束、耗时、变更量、失败原因
- 告警：Diff 阈值触发、Job 连续失败、Down 比例异常升高

### 7.3 备份

- Postgres：每日备份 + 保留策略 + **季度恢复演练**

---

## 8. 上线流程（建议）

1. `staging` 跑全量 sync + health，确认解析正确、没有大面积误报
2. `production` 先只上线“结构化 + 搜索/过滤”，探活先低频/小并发观察一周
3. 稳定后开启小时级探活、补 facet、补 pSEO 聚合页
4. 再加 “Copy code” 等增强功能
