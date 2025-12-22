# 项目计划（Plan）

状态：Draft  
更新时间：2025-12-15

## 1. 里程碑与交付物

### Milestone 0：文档与决策（当前）

- 输出：`docs/ARCHITECTURE.md`、`docs/PLAN.md`、`docs/adr/0001-initial-decisions.md`

### Milestone 1：Monorepo 初始化

- 建立目录：`apps/backend`（Payload）、`apps/frontend`（Next.js）
- 配置：根目录 `docker-compose.yml`（仅后端 + Postgres）
- 约定环境变量与本地启动方式（README）

验收：

- `docker compose up` 可启动 Payload Admin + Postgres
- 本地能访问 Admin UI，并能连上数据库

### Milestone 2：数据模型（Payload Collections）

- `categories`：name/slug/source
- `apis`：基础字段 + 探活字段 + source 元信息
- 索引/约束：为 link / name / category 设定必要索引（至少查询可用）

验收：

- Admin UI 可手动创建/编辑 `apis` 与 `categories`
- 只读访问策略明确（公开读或 API Key 模式）

### Milestone 3：导入器（Sync Job）

- 拉取上游 README（raw URL）
- 解析 Markdown（AST 优先）产出结构化条目
- Upsert：按稳定键更新/创建
- Sync 保护策略：
  - 字段冲突：同步只更新 `upstream.*`，人工修正写入 `override.*`（或 `isManualOverride`），前端读取 resolved 值（override 优先）
  - 软删除：上游移除的条目标记为 `archived/upstreamRemovedAt`，不物理删除
  - Diff 预警：变更量超过阈值（例如 20%）暂停写入并报警（防解析器失效导致全量污染）
- 运行模式：可手动触发 + 定时触发（先手动，后定时）

验收：

- 能导入全量分类与条目
- 再次运行不会重复创建（幂等）
- 同步日志包含新增/更新数量与耗时

### Milestone 4：探活器（Health Job）

- 对每条 `link` 做 HEAD/GET 探活
- 更新：status/latencyMs/lastCheckedAt/(lastStatusCode)
- 并发与超时：默认小并发，避免对上游造成压力
- 误报控制：固定 User-Agent + 宽容状态码（3xx 视为 Live；403/405 倾向 Unknown）+ “连续 N 次失败才判 Down”

验收：

- 列表中能看到 Live/Down/Unknown 的真实变化
- 探活器运行可控（不会卡死/无上限重试）

### Milestone 5：对外查询 API（服务端契约）

- 列表：分页/过滤/排序
- Facet：按 category/auth/https/cors 聚合计数（可选，但对 UX 很重要）
- 搜索：name/description 的关键字搜索（优先考虑 Postgres `pg_trgm` + trigram index 提升模糊搜索）

验收：

- 前端可以仅依赖该契约完成页面开发
- 响应时间在可接受范围内（MVP 以“可用”为主）

### Milestone 6：前端 MVP（Next.js on Cloudflare Pages）

- 列表页：搜索 + Facet + 状态灯 + 分页
- 详情页：字段展示 + 跳转主页链接
- SEO：分类页/详情页基础 meta + 详情页 JSON-LD（Schema.org）
- 缓存：ISR `revalidate`（例如 3600s）优先，降低后端压力
- 小亮点：按 Auth 类型生成并复制 fetch/Python 代码模板（Copy code）

验收：

- 能完成典型用例：按 Category 找到条目；按 Auth/HTTPS/CORS 过滤；按状态筛选“Down”

### Milestone 7：上线与运维最小闭环

- 部署：后端 Docker（自托管）+ Cloudflare Pages（前端）
- 定时任务：同步/探活的调度策略落地（容器内 cron、外部 scheduler、或 CI 定时触发任选其一）
- 基本限流与缓存：避免被滥用（Cloudflare 层 + 后端）

验收：

- 连续 7 天自动同步与探活稳定运行
- 明确的故障排查路径（日志/运行记录）

## 2. MVP 范围（避免失控）

MVP 必做：

- 结构化字段：Category/Auth/HTTPS/CORS/Link/Description
- 探活状态：Live/Down/Unknown + 最近检查时间
- 搜索 + 过滤 + 分页

MVP 暂缓：

- SDK 语言支持字段（需要人工补全或复杂爬取）
- “Run in Postman”全覆盖（仅对有 OpenAPI/官方集合的条目做）
- 质量评分/趋势分析（需要 checks 历史表与更多探测点）

## 3. 风险清单与对策

- 解析脆弱：上游 README 格式变动 → 使用 Markdown AST + 容错；解析失败要报警并保留上次成功数据
- 误报/漏报：站点屏蔽 HEAD 或反爬 → HEAD 失败降级 GET；状态置 Unknown 而非 Down；重试/退避
- SSRF 风险：探活访问外部 URL → 协议/私网/重定向/响应体限制 + DNS/连接地址校验
- 成本与性能：全量探活耗时 → 分批队列 + 并发控制 + 只对“待检查”窗口执行
