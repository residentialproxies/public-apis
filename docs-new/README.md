# API Navigator 优化方案文档

> 生成日期: 2025-12-15

---

## 文档索引

| 文档                                                           | 说明                                |
| -------------------------------------------------------------- | ----------------------------------- |
| [optimization-plan.md](./optimization-plan.md)                 | 完整优化方案（核心文档）            |
| [data-model.md](./data-model.md)                               | 数据模型详细设计                    |
| [ssrf-guard.md](./ssrf-guard.md)                               | SSRF 防护实现指南                   |
| [deployment-guide.md](./deployment-guide.md)                   | 部署指南                            |
| [configuration.md](./configuration.md)                         | 配置说明                            |
| [production-implementation.md](./production-implementation.md) | 生产实施方案（落地清单 + 上线流程） |

---

## 快速概览

### 项目目标

将 [public-apis/public-apis](https://github.com/public-apis/public-apis) 的 README 转换为结构化导航站。

### 技术栈

| 组件        | 版本    | 用途             |
| ----------- | ------- | ---------------- |
| Next.js     | 16.0.10 | 前端框架（主站） |
| React       | 19.2.1  | UI 库            |
| Payload CMS | v3.68+  | 后端 CMS         |
| PostgreSQL  | 15+     | 数据库           |
| OpenNext    | latest  | Cloudflare 部署  |

### 核心功能

1. **Sync Job** - 同步上游 README 数据
2. **Health Job** - 探活 API 可用性
3. **Query API** - 搜索/过滤/分页
4. **前端** - 列表/详情/SEO

### 实施阶段

```
Phase 0: 基础设施 → Phase 1: 后端核心 → Phase 2: 同步任务
        ↓                    ↓                     ↓
Phase 3: 探活任务 → Phase 4: API 层 → Phase 5: 前端
        ↓
Phase 6: 部署与文档
```

---

## 开始阅读

建议按以下顺序阅读：

1. **[optimization-plan.md](./optimization-plan.md)** - 了解整体方案
2. **[data-model.md](./data-model.md)** - 理解数据结构
3. **[configuration.md](./configuration.md)** - 配置开发环境
4. **[ssrf-guard.md](./ssrf-guard.md)** - 安全实现细节
5. **[deployment-guide.md](./deployment-guide.md)** - 生产部署

---

## 与现有文档的关系

```
/docs/                      # 原有文档（保留）
├── ARCHITECTURE.md         # 原架构设计
├── PLAN.md                 # 原项目计划
└── adr/                    # 架构决策记录

/docs-new/                  # 优化方案（本目录）
├── optimization-plan.md    # 精化后的实施方案
├── data-model.md           # 详细数据模型
├── ssrf-guard.md           # 安全实现
├── deployment-guide.md     # 部署指南
├── configuration.md        # 配置说明
└── production-implementation.md # 生产实施方案（落地清单 + 上线流程）
```

建议：实施时以 `/docs-new/` 为主要参考，`/docs/` 保留作为原始设计记录。
