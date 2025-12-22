# ADR 0001：初始技术与范围决策

日期：2025-12-15  
状态：Accepted

## 背景

目标是把 `public-apis/public-apis` 的 README 从“扁平列表”升级为“结构化数据 + 可用性信号 + 高效检索”的导航站。

## 决策

### 1) 仓库结构：独立 Monorepo（不 fork 上游）

- 选择：建立新项目仓库（monorepo），把上游作为数据源拉取
- 原因：避免与上游维护节奏耦合；核心资产是“结构化数据与增强层”，不是 README 的镜像

### 2) 探活策略：仅主页链接（Homepage）+ HEAD/GET

- 选择：只探测条目提供的主页链接，优先 HEAD，失败降级 GET
- 原因：探测真实 API endpoint 需要鉴权与参数配置，MVP 容易误报且维护成本高

### 3) 后端：Payload CMS + Postgres（Docker）

- 选择：Payload CMS 作为结构化存储 + Admin UI，Postgres 作为主库，Docker 作为运行形态
- 原因：开发效率高；可视化纠错/补全字段；天然提供查询 API

### 4) 前端：Next.js（Cloudflare Pages）

- 选择：Next.js 负责导航站 UI 与 SEO，Cloudflare Pages 负责托管与加速
- 原因：交付快；边缘渲染/缓存能力好；适合目录站的读多写少场景

### 5) 鉴权：MVP 以“公开只读”为默认，可扩展 API Key

- 选择：collection read 默认公开；如需保护/限流，再加 API Key 与 BFF 代理
- 原因：目录站的核心是可访问性与可索引性；密钥不应下发到浏览器

### 6) 缓存策略：ISR 优先，由 Cloudflare CDN 分担读压力

- 选择：列表页/详情页以 ISR（`revalidate`，例如 3600s）为主；仅在确有必要时使用 SSR
- 原因：目录站读多写少，内容更新可接受分钟/小时级延迟；ISR 能显著降低 Payload/VPS 压力并提升全球访问速度

## 后果

- 需要实现两个定时任务：导入器与探活器（并处理解析变更与 SSRF 风险）
- 前端默认通过缓存/再验证降低后端 QPS，后端更专注数据同步、探活与查询 API
- MVP 能在不做复杂用户系统/复杂试用能力的前提下，明显优于 GitHub 列表体验
