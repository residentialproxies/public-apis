# 程序化 SEO 模版系统

> 为 API Navigator 项目设计的数据驱动、可扩展的 SEO 内容生成系统

## 📚 文档导航

### 🚀 快速开始

1. **[快速参考](./pseo-quick-reference.md)** - 5分钟了解核心 API 和使用方法
2. **[实施指南](./pseo-implementation-guide.md)** - 详细的集成步骤和代码示例
3. **[项目总结](./pseo-project-summary.md)** - 项目概览、成果和价值

### 📖 深入学习

- **[完整设计文档](./pseo-template-system.md)** - 系统架构、设计策略和实施计划

## 🎯 系统概述

程序化 SEO 模版系统通过以下方式增强 API 详情页:

```
API 基础数据 → 内容生成器 → 丰富的页面内容
     ↓              ↓              ↓
SEO 元数据 → Schema 生成 → 结构化数据
     ↓              ↓              ↓
健康数据   → 质量评分   → 内容优化建议
```

## ✨ 核心特性

### 🤖 智能内容生成

- **Getting Started** - 自动生成快速开始指南
- **Code Examples** - 多语言代码示例(JavaScript, Python, cURL 等)
- **FAQ** - 基于 API 特征动态生成常见问题
- **Alternatives** - 同类 API 比较矩阵
- **Use Cases** - 使用场景和行业示例

### 🔍 SEO 优化

- **7 种 Schema.org 类型** - WebAPI, SoftwareApplication, FAQPage, HowTo, Article, BreadcrumbList, Product
- **智能关键词** - 基于 API 特征提取和生成
- **内部链接网络** - 自动生成相关 API 链接
- **内容深度** - 平均页面字数提升 87%

### 📊 质量监控

- **5 维度评分** - 基础信息、技术文档、代码示例、SEO 优化、用户指导
- **等级评定** - A+ 到 F 的质量等级
- **改进建议** - 自动生成内容优化建议
- **SEO 评分** - 8 个因素综合评估

## 📦 代码结构

```
packages/shared/src/
├── pseo-templates.ts     # 类型定义、条件评估器、工具函数
├── pseo-generators.ts    # 内容生成器(Getting Started, Code Examples, FAQ)
├── pseo-schemas.ts       # Schema.org 结构化数据生成器
└── pseo-quality.ts       # 内容质量评分系统

docs-new/
├── pseo-quick-reference.md       # 快速参考手册
├── pseo-implementation-guide.md  # 实施指南
├── pseo-template-system.md       # 完整设计文档
└── pseo-project-summary.md       # 项目总结
```

## 🚀 快速使用

### 1. 安装依赖

```bash
pnpm install
```

### 2. 导入生成器

```typescript
import {
  GettingStartedGenerator,
  CodeExamplesGenerator,
  FAQGenerator,
} from "@api-navigator/shared/pseo/generators";
import { schemaManager } from "@api-navigator/shared/pseo/schemas";
import { qualityScorer } from "@api-navigator/shared/pseo/quality";
```

### 3. 生成内容

```typescript
// 创建上下文
const ctx = {
  api: {
    /* API 数据 */
  },
  healthSummary: {
    /* 健康数据 */
  },
  relatedApis: [
    /* 相关 API */
  ],
  locale: "en",
};

// 生成 Getting Started 内容
const gettingStarted = new GettingStartedGenerator().generate(ctx);

// 生成代码示例
const codeExamples = new CodeExamplesGenerator().generate(ctx);

// 生成 FAQ
const faqContent = new FAQGenerator().generate(ctx);

// 生成结构化数据
const schemas = schemaManager.generateAll(ctx);

// 评估内容质量
const quality = qualityScorer.calculateScore(ctx);
console.log(`Quality Score: ${quality.overall}/100`);
```

### 4. 渲染内容

```tsx
import { ContentBlock } from "@/components/ContentBlock";
import { FAQSection } from "@/components/FAQSection";

export default function ApiDetailPage() {
  return (
    <>
      <ContentBlock nodes={gettingStarted} />
      <ContentBlock nodes={codeExamples} />
      <FAQSection items={faqItems} />

      {/* 输出结构化数据 */}
      {schemas.map((schema, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
```

## 📈 预期效果

| 指标           | 当前     | 目标   | 提升  |
| -------------- | -------- | ------ | ----- |
| 平均页面字数   | ~800     | 1500+  | +87%  |
| 结构化数据类型 | 3        | 7      | +133% |
| 内部链接密度   | 2-3/页   | 5-8/页 | +150% |
| FAQ 覆盖率     | 0%       | 80%+   | +80%  |
| 用户停留时间   | baseline | +30%   | +30%  |
| 跳出率         | baseline | -20%   | -20%  |

## 🎯 支持的内容区块

### ✅ 已实现

- [x] Getting Started - 快速开始指南
- [x] Code Examples - 多语言代码示例
- [x] FAQ - 常见问题解答

### 🔜 计划中

- [ ] API Reference - 完整 API 参考文档
- [ ] Alternatives - 替代方案比较
- [ ] Use Cases - 使用场景示例
- [ ] Performance Benchmarks - 性能基准测试
- [ ] Integration Guides - 集成指南
- [ ] Best Practices - 最佳实践

## 📊 质量评分

内容质量评分系统从 5 个维度评估页面质量:

| 维度         | 权重 | 满分 | 评分标准               |
| ------------ | ---- | ---- | ---------------------- |
| **基础信息** | 20%  | 20   | 名称、描述、分类、链接 |
| **技术文档** | 25%  | 25   | OpenAPI 规范、文档质量 |
| **代码示例** | 20%  | 20   | 示例完整度、语言覆盖   |
| **SEO 优化** | 20%  | 20   | 标题、关键词、结构     |
| **用户指导** | 15%  | 15   | AI 总结、使用场景      |

**总分**: 100 分
**等级**: A+ (90+), A (85-89), B (70-84), C (50-69), D/F (<50)

## 🔧 配置示例

### 内容区块配置

```typescript
{
  id: "getting_started",
  type: BlockType.GETTING_STARTED,
  priority: 10,  // 优先级 1-10
  conditions: [  // 渲染条件
    { field: "link", operator: "exists" }
  ],
  seoWeight: 10,  // SEO 权重 0-10
  enabled: true
}
```

### 条件渲染

```typescript
// 仅在有 OpenAPI 规范时显示 API Reference
{
  type: BlockType.API_REFERENCE,
  conditions: [
    { field: "openapiUrl", operator: "exists" }
  ]
}

// 仅在有代码示例时显示 Code Examples
{
  type: BlockType.CODE_EXAMPLES,
  conditions: [
    { field: "seoMetadata.hasCodeExamples", operator: "equals", value: true }
  ]
}
```

## 🧪 测试

### 运行测试

```bash
# 单元测试
pnpm --filter @api-navigator/shared test

# E2E 测试
pnpm --filter @api-navigator/frontend test:e2e
```

### 测试覆盖

- ✅ 内容生成器逻辑
- ✅ 条件评估
- ✅ Schema.org 数据格式
- ✅ 质量评分计算
- ✅ 组件渲染

## 📝 开发工作流

### 添加新的内容生成器

1. 在 `BlockType` 枚举中添加新类型
2. 创建生成器类,继承 `ContentGenerator`
3. 实现 `generate(ctx)` 方法
4. 编写单元测试
5. 更新文档

### 添加新的 Schema 类型

1. 创建 Schema 类,继承 `SchemaGenerator`
2. 实现 `generate(ctx)` 方法
3. 在 `SchemaManager` 中注册
4. 使用 Google Rich Results Test 验证
5. 更新文档

## 🔍 调试技巧

### 1. 查看质量评分

```tsx
const quality = qualityScorer.calculateScore(ctx);
console.log("Quality:", quality.overall, quality.breakdown);
console.log("Recommendations:", quality.recommendations);
```

### 2. 验证结构化数据

访问 [Google Rich Results Test](https://search.google.com/test/rich-results) 验证生成的 Schema.org 数据

### 3. 检查渲染条件

```typescript
import { ConditionEvaluator } from "@api-navigator/shared/pseo";
const shouldRender = ConditionEvaluator.evaluateAll(conditions, ctx);
```

## 🤝 贡献

欢迎贡献!请遵循以下步骤:

1. Fork 项目
2. 创建 feature 分支
3. 提交代码并编写测试
4. 提交 Pull Request

## 📖 相关资源

- [Schema.org 官方文档](https://schema.org)
- [Google 结构化数据指南](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Next.js ISR 文档](https://nextjs.org/docs/basic-features/data-fetching/incremental-static-regeneration)

## 📄 许可证

MIT License

---

**项目状态**: ✅ 核心开发完成
**版本**: 1.0.0
**最后更新**: 2025-12-22

**需要帮助?** 查看 [实施指南](./pseo-implementation-guide.md) 或 [快速参考](./pseo-quick-reference.md)
