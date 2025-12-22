# 架构说明（Architecture）

状态：Draft  
更新时间：2025-12-15

## 1. 目标与边界

### 1.1 目标（MVP 优先）

- 把上游 `public-apis/public-apis` 的 README（扁平文本）转成可查询的结构化数据（Category/Auth/HTTPS/CORS/Link/Description）。
- 提供“可用性信号”：对每个条目的主页链接做定时探活（HEAD/GET），在列表中显示 Live/Down/Unknown 等状态、最近检查时间与延迟。
- 提供比 GitHub 更高效的“找 API”体验：全文搜索 + Facet 过滤（至少 Auth/HTTPS/CORS/Category）。

### 1.2 非目标（MVP 不做）

- 不探测真实 API endpoint（鉴权/参数/速率限制复杂，容易误报）。
- 不承诺“Run in Postman”对所有条目可用；仅对有 OpenAPI/Swagger 或官方 Postman Collection 的条目做一键导入（后续增强）。
- 不做复杂用户系统（登录、权限、多租户）作为 MVP 前置条件。

## 2. 技术栈与部署形态

### 2.1 后端（Backend）

- 运行形态：Docker 容器
- 应用：Payload CMS（v3 作为目标版本）
- 数据库：Postgres
- 职责：结构化存储、后台管理（纠错/补全字段）、对外只读查询 API、执行/触发导入与探活任务

### 2.2 前端（Frontend）

- 框架：Next.js（App Router）
- 托管：Cloudflare Pages
- 职责：导航站 UI、SEO 页面、搜索/过滤交互、状态灯展示

## 3. 核心组件与数据流

### 3.1 数据流概览

1. Sync Job（导入器）拉取上游 README → 解析 → Upsert 到 Postgres（通过 Payload Local API）
2. Health Job（探活器）按批读取 API 条目链接 → HEAD/GET 探测 → 写回状态字段
3. Frontend 通过 Payload 提供的只读 API 读取列表与详情（可加缓存/分页/排序）

### 3.2 组件划分

**A. 导入器（Sync Job）**

- 输入：上游 README.md（建议用 raw GitHub URL）
- 输出：`categories`、`apis` 两类结构化数据
- 关键点：
  - 解析策略：基于 Markdown AST（remark/markdown-it）解析标题层级与表格行，避免纯正则脆弱性
  - Upsert 键：建议以 `source.slug + source.link`（或 link 归一化后的 hash）作为稳定唯一键
  - 变更追踪：记录 `source.commitSha`/`source.fetchedAt`，便于审计与回滚
  - 字段冲突：区分“上游字段（upstream）”与“展示字段（override/display）”，同步只更新 upstream，手工修正写入 override，前端读取“resolved 值”（override 优先）
  - 软删除：上游移除的条目不物理删除，标记为 `archived`/`upstreamRemovedAt`，保留历史探活数据与 SEO 入口
  - Diff 预警：同步前计算变更量（新增/更新/移除占比），超过阈值（例如 20%）则暂停写入并报警，避免解析器失效导致全量污染

**B. 探活器（Health Job）**

- 输入：`apis.link`（主页链接）
- 输出：`apis.status`、`apis.lastCheckedAt`、`apis.latencyMs`、`apis.lastStatusCode`（可选）
- 策略：
  - 优先 HEAD，失败或不支持再降级 GET（限制响应体大小/超时）
  - 拟人化请求：固定且礼貌的 User-Agent（例如 `Mozilla/5.0 ... (compatible; ApiNavigatorBot/1.0; +https://<site>/bot)`），减少 WAF/反爬误判
  - 宽容判定：2xx/3xx（含 301/302/307/308）视为 `live`；对 401/403/405 更倾向判为 `unknown`（站点存活但拒绝访问），避免把“活着但拦截爬虫”标成 `down`
  - 智能重试：首次疑似 `down` 进入复查队列（例如 1 小时后复查），连续 N 次失败（例如 3 次）才展示为红色 `down`
  - 并发控制 + 退避重试（避免触发对方站点风控）
  - 结果分级：`live` / `down` / `unknown`（以及可选 `slow`）

**C. 查询 API（Payload）**

- 目标能力：
  - 过滤：category/auth/https/cors/status
  - 排序：`lastCheckedAt`、`name`
  - 分页：游标或 offset（MVP 先 offset）
  - 搜索：`name + description` 的全文检索（MVP 可先用 Payload 的 where/contains；中期优先用 Postgres `pg_trgm` + trigram index 提升模糊搜索体验；再考虑 FTS/外部检索）

**D. 前端（Next.js on Cloudflare Pages）**

- 页面：
  - 列表页：搜索框 + Facet 过滤 + 状态灯 + 分页
  - 详情页：字段展示（link、auth、https、cors、最后检查结果）、复制 curl 模板（仅对“主页链接”不可自动生成真实请求）
  - 分类页：按 Category 聚合
- 运行方式：
  - ISR 优先：列表/详情页使用 `revalidate`（例如 3600s）降低后端压力，由 Cloudflare CDN 承担读流量
  - pSEO 扩展位：基于结构化字段生成聚合页（例如 “支持 CORS 的 Weather APIs”）与详情页 JSON-LD（Schema.org）

## 4. 数据模型（Payload Collections）

### 4.1 categories

- `name`（唯一/索引）
- `slug`（可选，SEO 友好）
- `source`（可选：上游路径/元信息）

### 4.2 apis（核心资产）

最小字段集（对应上游表格）：

- `name`（索引）
- `description`
- `link`（索引，建议做唯一语义键）
- `category`（relationship → categories）
- `auth`（枚举：No / apiKey / OAuth / ...）
- `https`（boolean）
- `cors`（枚举：Yes / No / Unknown / ...）

增强字段（本项目差异化）：

- `status`（live/down/unknown/slow）
- `latencyMs`
- `lastCheckedAt`
- `lastStatusCode`（可选）
- `source`（object：`repo`, `path`, `commitSha`, `lineRef` 等，便于追溯）

（可选）历史表：

- `checks`：记录每次探活结果（用于趋势、稳定性评分）。MVP 可先不做，只存聚合字段。

## 5. 安全与可靠性

### 5.1 SSRF 与探活安全

探活器会访问“外部不受控 URL”，必须做最低限度的安全控制：

- 只允许 `http/https` 协议
- 禁止访问内网/私网地址（DNS 解析与最终连接地址都要校验，防止 DNS Rebinding）
- 限制重定向次数；限制响应体大小与总耗时
- 统一 User-Agent；并发上限；失败重试带退避

### 5.2 对外访问与鉴权

两种可选模型（建议从简单开始）：

1. **公开只读**：Payload collection `read` 公开，配合 Cloudflare 缓存与限流（最省事，适合 MVP）。
2. **只读 API Key**：前端通过“服务端层”携带 key 调用后端，避免在浏览器暴露密钥；并为 key 配置限权与速率限制。

### 5.3 CORS / CSRF（跨域）

- Cloudflare Pages → Payload（VPS）是典型跨域场景：需要在 Payload 配置允许的 `cors` origins，并根据实际请求方式调整 `csrf` 策略（避免把只读请求误伤）
- 如果前端走 ISR/SSR 服务器侧请求，可通过后端到后端访问减少浏览器跨域复杂度

## 6. 运维与可观测性（MVP 级别）

- Job 日志：同步/探活每次运行输出统计（新增/更新/失败数、耗时）
- Job 健康：记录 `lastRunAt`、`lastRunStatus`、`lastError`（可存到一张 `job_runs` 表或 Payload globals）
- 基本告警：连续失败阈值（后续可接 Sentry/邮件/Slack）

## 7. 未来增强（非 MVP）

- “质量评分”：结合连续成功率、延迟分位数、证书/HTTPS、重定向链等
- “可用性分区”：按地区（US/EU/CN）探测可用性（需要分布式探测点）
- 结构化接口定义：为条目补全 OpenAPI/Swagger/SDKs 字段，支持“Run in Postman”
- 更强搜索：Postgres FTS / Meilisearch / Typesense（按成本与复杂度选择）
- pSEO：聚合页（filters → landing pages）、对比页、站内推荐与相关条目
- “Aha” 功能：按 Auth 类型生成可复制的 fetch / Python requests 代码模板（Copy code）
