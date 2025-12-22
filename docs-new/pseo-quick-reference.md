# 程序化 SEO 模版系统 - 快速参考

## 📋 文件索引

| 文件 | 说明 | 用途 |
|------|------|------|
| `docs-new/pseo-template-system.md` | 完整设计文档 | 了解系统架构和设计理念 |
| `docs-new/pseo-implementation-guide.md` | 实施指南 | 详细的集成步骤和代码示例 |
| `packages/shared/src/pseo-templates.ts` | 类型定义 | TypeScript 类型和基础类 |
| `packages/shared/src/pseo-generators.ts` | 内容生成器 | 动态内容生成实现 |
| `packages/shared/src/pseo-schemas.ts` | 结构化数据 | Schema.org JSON-LD 生成 |
| `packages/shared/src/pseo-quality.ts` | 质量评分 | 内容质量评估系统 |

## 🎯 核心概念

### 1. 内容区块(Content Block)

内容区块是程序化生成的独立内容单元:

```typescript
enum BlockType {
  GETTING_STARTED = "getting_started",    // 快速开始
  CODE_EXAMPLES = "code_examples",        // 代码示例
  FAQ = "faq",                            // 常见问题
  API_REFERENCE = "api_reference",        // API 参考
  ALTERNATIVES = "alternatives",          // 替代方案
  // ... 更多类型
}
```

### 2. 条件渲染(Conditional Rendering)

根据数据可用性决定显示哪些内容:

```typescript
{
  type: BlockType.CODE_EXAMPLES,
  conditions: [
    { field: "seoMetadata.hasCodeExamples", operator: "equals", value: true }
  ],
  priority: 8,
  seoWeight: 9
}
```

### 3. 内容节点(Content Node)

内容区块由多个内容节点组成:

```typescript
type ContentNode =
  | HeadingNode      // 标题
  | ParagraphNode    // 段落
  | CodeBlockNode    // 代码块
  | ListNode         // 列表
  | TableNode        // 表格
  // ... 更多类型
```

## 🚀 快速集成

### Step 1: 导入生成器

```typescript
import {
  GettingStartedGenerator,
  CodeExamplesGenerator,
  FAQGenerator
} from "@api-navigator/shared/pseo/generators";
```

### Step 2: 创建模版上下文

```typescript
const ctx = {
  api: {
    id: api.id,
    name: api.name,
    description: api.description,
    link: api.link,
    auth: api.auth,
    // ... 其他字段
  },
  healthSummary,
  relatedApis,
  locale: "en",
};
```

### Step 3: 生成内容

```typescript
const generator = new GettingStartedGenerator();
const content = generator.generate(ctx);
```

### Step 4: 渲染内容

```tsx
<ContentBlock nodes={content} />
```

## 📊 内容质量评分

### 使用方法

```typescript
import { qualityScorer } from "@api-navigator/shared/pseo/quality";

const score = qualityScorer.calculateScore(ctx);

console.log(`Overall: ${score.overall}/100`);
console.log(`Grade: ${qualityScorer.getGrade(score.overall)}`);
console.log(`Recommendations:`, score.recommendations);
```

### 评分维度

| 维度 | 权重 | 满分 | 说明 |
|------|------|------|------|
| 基础信息 | 20% | 20分 | 名称、描述、分类 |
| 技术文档 | 25% | 25分 | OpenAPI、文档质量 |
| 代码示例 | 20% | 20分 | 示例完整度、语言覆盖 |
| SEO 优化 | 20% | 20分 | 标题、关键词、结构 |
| 用户指导 | 15% | 15分 | AI 总结、使用场景 |

## 🏗️ 结构化数据

### 生成所有结构化数据

```typescript
import { schemaManager } from "@api-navigator/shared/pseo/schemas";

const schemas = schemaManager.generateAll(ctx, faqItems);

// 输出到页面
{schemas.map((schema, idx) => (
  <script
    key={idx}
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
  />
))}
```

### 支持的 Schema 类型

- ✅ WebAPI - API 基本信息
- ✅ SoftwareApplication - 应用程序信息
- ✅ FAQPage - 常见问题
- ✅ HowTo - 使用指南
- ✅ Article - 文章内容
- ✅ BreadcrumbList - 面包屑导航
- ✅ Product - 产品信息

## 📝 常用代码片段

### 1. 生成多语言代码示例

```typescript
const codeExampleGen = new CodeExamplesGenerator();
const examples = codeExampleGen.generate(ctx);
```

### 2. 生成动态 FAQ

```typescript
const faqGen = new FAQGenerator();
const faqContent = faqGen.generate(ctx);
```

### 3. 检查内容完整性

```typescript
import { completenessAnalyzer } from "@api-navigator/shared/pseo/quality";

const analysis = completenessAnalyzer.analyzeCompleteness(ctx);

console.log(`Completeness: ${analysis.completeness}%`);
console.log(`Available blocks:`, analysis.availableBlocks);
console.log(`Missing blocks:`, analysis.missingBlocks);
```

### 4. 计算 SEO 评分

```typescript
import { seoScoreCalculator } from "@api-navigator/shared/pseo/quality";

const seoScore = seoScoreCalculator.calculateSEOScore(ctx);

console.log(`Overall SEO Score: ${seoScore.overall}/100`);
console.log(`Breakdown:`, seoScore.factors);
```

## 🎨 React 组件示例

### ContentBlock 组件

```tsx
import type { ContentNode } from "@api-navigator/shared/pseo";

export function ContentBlock({ nodes }: { nodes: ContentNode[] }) {
  return (
    <div className="space-y-4">
      {nodes.map((node, idx) => (
        <ContentNodeRenderer key={idx} node={node} />
      ))}
    </div>
  );
}
```

### FAQ 组件

```tsx
import type { FAQItem } from "@api-navigator/shared/pseo";

export function FAQSection({ items }: { items: FAQItem[] }) {
  return (
    <div className="space-y-4">
      {items.map((item, idx) => (
        <details key={idx}>
          <summary>{item.question}</summary>
          <p>{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
```

## 🔧 配置选项

### 内容区块优先级

优先级范围: 1-10,数字越大优先级越高

```typescript
{
  id: "getting_started",
  type: BlockType.GETTING_STARTED,
  priority: 10,  // 最高优先级
  conditions: [],
  seoWeight: 10,
  enabled: true
}
```

### 条件运算符

```typescript
type RenderConditionOperator =
  | "exists"    // 字段存在
  | "equals"    // 等于
  | "gt"        // 大于
  | "lt"        // 小于
  | "contains"  // 包含
  | "in";       // 在数组中
```

## 📈 性能优化

### 1. 内容缓存

```typescript
import { unstable_cache } from "next/cache";

export const getCachedContent = unstable_cache(
  async (apiId: string) => generateContent(apiId),
  ["api-content"],
  { revalidate: 3600 }
);
```

### 2. 增量静态生成

```typescript
export const revalidate = 3600; // ISR: 每小时
export const dynamicParams = true;
```

### 3. 按需生成

只在需要时生成内容,避免不必要的计算:

```typescript
const codeExamples = api.seoMetadata?.hasCodeExamples
  ? codeExampleGen.generate(ctx)
  : null;
```

## ✅ SEO 检查清单

创建每个 API 详情页时确保:

- [ ] 唯一的页面标题(50-60字符)
- [ ] 独特的元描述(150-160字符)
- [ ] 至少 5 个结构化数据类型
- [ ] 包含 FAQ 区块
- [ ] 代码示例覆盖至少 3 种语言
- [ ] 内部链接 5-8 个
- [ ] 内容长度 > 1000 字
- [ ] 移动端友好
- [ ] 加载速度 < 2秒

## 🐛 调试技巧

### 1. 开发环境显示质量评分

```tsx
{process.env.NODE_ENV === "development" && (
  <div className="p-4 bg-yellow-100">
    <h3>Content Quality: {score.overall}/100</h3>
    <pre>{JSON.stringify(score.breakdown, null, 2)}</pre>
  </div>
)}
```

### 2. 验证结构化数据

使用 Google Rich Results Test:
https://search.google.com/test/rich-results

### 3. 检查渲染条件

```typescript
import { ConditionEvaluator } from "@api-navigator/shared/pseo";

const shouldRender = ConditionEvaluator.evaluateAll(conditions, ctx);
console.log(`Should render: ${shouldRender}`);
```

## 📚 扩展阅读

- [完整设计文档](./pseo-template-system.md)
- [实施指南](./pseo-implementation-guide.md)
- [Schema.org 文档](https://schema.org)
- [Google 结构化数据指南](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)

## 💡 最佳实践

1. **内容优先**: 先确保内容质量,再优化 SEO
2. **用户体验**: 不要为了 SEO 牺牲可读性
3. **渐进增强**: 从核心内容开始,逐步添加增强功能
4. **持续监控**: 定期检查内容质量评分和 SEO 表现
5. **A/B 测试**: 测试不同的内容策略和布局

## 🆘 获取帮助

遇到问题?
1. 查看实施指南了解详细步骤
2. 检查类型定义确认数据结构
3. 查看示例代码参考实现
4. 运行质量评估诊断问题

---

**版本**: 1.0.0
**最后更新**: 2025-12-22
