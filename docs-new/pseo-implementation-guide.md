# 程序化 SEO 模版系统 - 实施指南

## 快速开始

本指南将帮助你在 API Navigator 项目中实施程序化 SEO 内容模版系统。

## 一、前置准备

### 1.1 已创建的文件

```
packages/shared/src/
├── pseo-templates.ts    # 类型定义和基础类
├── pseo-generators.ts   # 内容生成器实现
├── pseo-schemas.ts      # Schema.org 结构化数据
└── pseo-quality.ts      # 内容质量评分系统
```

### 1.2 更新 package.json

在 `packages/shared/package.json` 中导出新模块:

```json
{
  "exports": {
    "./types": "./src/types.ts",
    "./pseo": "./src/pseo-templates.ts",
    "./pseo/generators": "./src/pseo-generators.ts",
    "./pseo/schemas": "./src/pseo-schemas.ts",
    "./pseo/quality": "./src/pseo-quality.ts"
  }
}
```

## 二、集成到 API 详情页

### 2.1 在前端创建内容区块组件

创建 `apps/frontend/src/components/ContentBlock.tsx`:

```tsx
import type { ContentNode } from "@api-navigator/shared/pseo";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

type ContentBlockProps = {
  nodes: ContentNode[];
};

export function ContentBlock({ nodes }: ContentBlockProps) {
  return (
    <div className="content-blocks space-y-4">
      {nodes.map((node, idx) => (
        <ContentNodeRenderer key={idx} node={node} />
      ))}
    </div>
  );
}

function ContentNodeRenderer({ node }: { node: ContentNode }) {
  switch (node.type) {
    case "heading":
      const HeadingTag = `h${node.level}` as keyof JSX.IntrinsicElements;
      return (
        <HeadingTag
          id={node.id}
          className="font-semibold text-[var(--text-primary)]"
        >
          {node.text}
        </HeadingTag>
      );

    case "paragraph":
      return (
        <p className={`text-[var(--text-secondary)] ${node.className || ""}`}>
          {node.text}
        </p>
      );

    case "code_block":
      return (
        <div className="code-block">
          {node.filename && (
            <div className="text-xs text-[var(--text-muted)]">
              {node.filename}
            </div>
          )}
          <pre className="bg-[var(--bg-secondary)] p-4 rounded-lg overflow-x-auto">
            <code className={`language-${node.language}`}>{node.code}</code>
          </pre>
        </div>
      );

    case "list":
      const ListTag = node.ordered ? "ol" : "ul";
      return (
        <ListTag className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
          {node.items.map((item, idx) => (
            <li key={idx}>
              {typeof item === "string" ? (
                <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parseInline(item)) }} />
              ) : (
                <ContentNodeRenderer node={item} />
              )}
            </li>
          ))}
        </ListTag>
      );

    case "table":
      return (
        <div className="overflow-x-auto">
          <table className={`min-w-full ${node.className || ""}`}>
            <thead>
              <tr>
                {node.headers.map((header, idx) => (
                  <th key={idx} className="px-4 py-2 text-left">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {node.rows.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx} className="px-4 py-2">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    default:
      return null;
  }
}
```

### 2.2 创建 FAQ 组件

创建 `apps/frontend/src/components/FAQSection.tsx`:

```tsx
import type { FAQItem } from "@api-navigator/shared/pseo";

type FAQSectionProps = {
  items: FAQItem[];
  title?: string;
};

export function FAQSection({ items, title = "Frequently Asked Questions" }: FAQSectionProps) {
  const grouped = groupByCategory(items);

  return (
    <section className="ui-surface mt-6 p-6">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">
        {title}
      </h2>

      {Object.entries(grouped).map(([category, faqItems]) => (
        <div key={category} className="mt-6">
          <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase">
            {getCategoryDisplayName(category)}
          </h3>
          <div className="mt-3 space-y-4">
            {faqItems.map((item, idx) => (
              <details key={idx} className="group">
                <summary className="cursor-pointer text-sm font-medium text-[var(--text-primary)] hover:text-[var(--accent-green)]">
                  {item.question}
                </summary>
                <p className="mt-2 text-sm text-[var(--text-secondary)] pl-4">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function groupByCategory(items: FAQItem[]): Record<string, FAQItem[]> {
  const grouped: Record<string, FAQItem[]> = {};
  for (const item of items) {
    if (!grouped[item.category]) {
      grouped[item.category] = [];
    }
    grouped[item.category].push(item);
  }
  return grouped;
}

function getCategoryDisplayName(category: string): string {
  const names: Record<string, string> = {
    technical: "Technical",
    security: "Security",
    support: "Support",
    pricing: "Pricing",
    general: "General",
  };
  return names[category] || category;
}
```

### 2.3 更新 API 详情页

修改 `apps/frontend/src/app/[locale]/api/[id]/[slug]/page.tsx`:

```tsx
// 在顶部添加导入
import {
  GettingStartedGenerator,
  CodeExamplesGenerator,
  FAQGenerator
} from "@api-navigator/shared/pseo/generators";
import { schemaManager } from "@api-navigator/shared/pseo/schemas";
import { qualityScorer } from "@api-navigator/shared/pseo/quality";
import { ContentBlock } from "@/components/ContentBlock";
import { FAQSection } from "@/components/FAQSection";

// 在组件中添加内容生成逻辑
export default async function ApiDetailPage(props: Props) {
  // ... 现有代码 ...

  // 构建模版上下文
  const templateContext = {
    api,
    healthSummary,
    relatedApis: related,
    locale,
  };

  // 生成动态内容
  const gettingStartedGen = new GettingStartedGenerator();
  const codeExamplesGen = new CodeExamplesGenerator();
  const faqGen = new FAQGenerator();

  const gettingStartedContent = gettingStartedGen.generate(templateContext);
  const codeExamplesContent = api.seoMetadata?.hasCodeExamples || api.seoMetadata?.languages?.length
    ? codeExamplesGen.generate(templateContext)
    : null;
  const faqContent = faqGen.generate(templateContext);

  // 生成 FAQ 项用于结构化数据
  const faqItems = extractFAQItems(faqContent);

  // 生成所有结构化数据
  const allSchemas = schemaManager.generateAll(templateContext, faqItems);

  // 计算内容质量评分(可选,用于监控)
  const qualityScore = qualityScorer.calculateScore(templateContext);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      {/* ... 现有内容 ... */}

      {/* Getting Started 区块 */}
      <section className="ui-surface mt-6 p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Getting Started
        </h2>
        <div className="mt-4">
          <ContentBlock nodes={gettingStartedContent} />
        </div>
      </section>

      {/* Code Examples 区块 */}
      {codeExamplesContent && (
        <section className="ui-surface mt-6 p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Code Examples
          </h2>
          <div className="mt-4">
            <ContentBlock nodes={codeExamplesContent} />
          </div>
        </section>
      )}

      {/* ... 现有内容 ... */}

      {/* FAQ 区块 */}
      <FAQSection items={faqItems} />

      {/* 输出所有结构化数据 */}
      {allSchemas.map((schema, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      {/* 开发环境显示质量评分(可选) */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <h3 className="font-semibold">Content Quality Score</h3>
          <p>Overall: {qualityScore.overall}/100 ({qualityScorer.getGrade(qualityScore.overall)})</p>
          <details className="mt-2">
            <summary className="cursor-pointer">Breakdown</summary>
            <pre className="text-xs mt-2">{JSON.stringify(qualityScore.breakdown, null, 2)}</pre>
          </details>
          {qualityScore.recommendations.length > 0 && (
            <div className="mt-2">
              <p className="font-semibold">Recommendations:</p>
              <ul className="list-disc list-inside text-sm">
                {qualityScore.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

// 辅助函数:从内容节点中提取 FAQ 项
function extractFAQItems(nodes: ContentNode[]): FAQItem[] {
  // 简化实现:需要根据实际生成的结构提取
  // 这里假设 FAQ 已经在生成器中创建
  // 实际使用时应该在生成器中直接返回 FAQ 项
  return [];
}
```

## 三、后端 API 增强

### 3.1 添加内容质量评分端点

创建 `apps/backend/src/app/api/v1/public/apis/[id]/quality/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload.config";
import { qualityScorer, completenessAnalyzer, seoScoreCalculator } from "@api-navigator/shared/pseo/quality";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const payload = await getPayload({ config });
  const api = await payload.findByID({ collection: "apis", id });

  if (!api) {
    return NextResponse.json({ error: "API not found" }, { status: 404 });
  }

  // 获取健康摘要(可选)
  const healthSummary = null; // TODO: 从 health logs 查询

  // 构建上下文
  const ctx = {
    api,
    healthSummary,
    locale: "en",
  };

  // 计算各项评分
  const qualityScore = qualityScorer.calculateScore(ctx);
  const completeness = completenessAnalyzer.analyzeCompleteness(ctx);
  const seoScore = seoScoreCalculator.calculateSEOScore(ctx);

  return NextResponse.json({
    quality: qualityScore,
    completeness,
    seo: seoScore,
  });
}
```

### 3.2 批量质量评估任务

创建 `apps/backend/src/jobs/quality/index.ts`:

```typescript
import { getPayload } from "payload";
import config from "@/payload.config";
import { qualityScorer } from "@api-navigator/shared/pseo/quality";

export async function runQualityAssessment() {
  const payload = await getPayload({ config });

  const apis = await payload.find({
    collection: "apis",
    limit: 1000,
    where: {
      syncStatus: { equals: "active" },
    },
  });

  const results = [];

  for (const api of apis.docs) {
    const ctx = {
      api,
      locale: "en",
    };

    const score = qualityScorer.calculateScore(ctx);

    results.push({
      id: api.id,
      name: api.name,
      overall: score.overall,
      grade: qualityScorer.getGrade(score.overall),
      status: qualityScorer.getStatus(score.overall),
      recommendations: score.recommendations,
    });
  }

  // 按评分排序
  results.sort((a, b) => a.overall - b.overall);

  // 输出需要改进的 API(评分低于 60)
  const needsImprovement = results.filter((r) => r.overall < 60);

  console.log(`Quality Assessment Summary:`);
  console.log(`Total APIs: ${results.length}`);
  console.log(`Average Score: ${(results.reduce((sum, r) => sum + r.overall, 0) / results.length).toFixed(2)}`);
  console.log(`Needs Improvement (< 60): ${needsImprovement.length}`);

  if (needsImprovement.length > 0) {
    console.log(`\nAPIs needing improvement:`);
    for (const api of needsImprovement.slice(0, 10)) {
      console.log(`- ${api.name} (${api.overall}/100 - ${api.grade})`);
      if (api.recommendations.length > 0) {
        console.log(`  Recommendations:`);
        for (const rec of api.recommendations) {
          console.log(`    • ${rec}`);
        }
      }
    }
  }

  return results;
}
```

## 四、测试与验证

### 4.1 单元测试示例

创建 `packages/shared/src/__tests__/pseo-generators.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { GettingStartedGenerator, CodeExamplesGenerator } from "../pseo-generators";

describe("GettingStartedGenerator", () => {
  it("should generate getting started content", () => {
    const generator = new GettingStartedGenerator();
    const ctx = {
      api: {
        id: 1,
        name: "Test API",
        description: "A test API",
        link: "https://api.example.com",
        auth: "apiKey",
        cors: "Yes",
        https: true,
        latencyMs: 120,
      },
      locale: "en",
    };

    const content = generator.generate(ctx);

    expect(content).toHaveLength.greaterThan(0);
    expect(content[0].type).toBe("paragraph");
  });
});

describe("CodeExamplesGenerator", () => {
  it("should generate code examples", () => {
    const generator = new CodeExamplesGenerator();
    const ctx = {
      api: {
        id: 1,
        name: "Test API",
        description: "A test API",
        link: "https://api.example.com",
        auth: "apiKey",
        seoMetadata: {
          languages: [{ language: "JavaScript" }, { language: "Python" }],
        },
      },
      locale: "en",
    };

    const content = generator.generate(ctx);

    expect(content).toHaveLength.greaterThan(0);
  });
});
```

### 4.2 E2E 测试

使用 Playwright 验证内容渲染:

```typescript
import { test, expect } from "@playwright/test";

test("API detail page shows getting started section", async ({ page }) => {
  await page.goto("/api/1/test-api");

  // 检查 Getting Started 区块存在
  await expect(page.locator("text=Getting Started")).toBeVisible();

  // 检查代码示例存在
  await expect(page.locator("pre code")).toBeVisible();

  // 检查 FAQ 区块存在
  await expect(page.locator("text=Frequently Asked Questions")).toBeVisible();

  // 检查结构化数据存在
  const schemas = await page.locator('script[type="application/ld+json"]').count();
  expect(schemas).toBeGreaterThan(3);
});
```

## 五、性能优化

### 5.1 内容缓存策略

```typescript
// apps/frontend/src/lib/content-cache.ts
import { unstable_cache } from "next/cache";

export const getCachedContent = unstable_cache(
  async (apiId: string) => {
    // 生成内容
    return generateContent(apiId);
  },
  ["api-content"],
  {
    revalidate: 3600, // 1小时
    tags: [`api-${apiId}`],
  }
);
```

### 5.2 增量静态生成(ISR)

在 `page.tsx` 中:

```typescript
export const revalidate = 3600; // 每小时重新生成
export const dynamicParams = true; // 启用 ISR
```

## 六、监控与分析

### 6.1 内容质量仪表板

创建管理后台页面显示质量评分:

```tsx
// apps/backend/src/app/(payload)/admin/quality-dashboard/page.tsx
export default async function QualityDashboard() {
  const results = await runQualityAssessment();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Content Quality Dashboard</h1>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Average Score"
          value={calculateAverage(results)}
          trend="+5%"
        />
        <MetricCard
          title="Excellent (>80)"
          value={results.filter(r => r.overall > 80).length}
        />
        <MetricCard
          title="Needs Work (<60)"
          value={results.filter(r => r.overall < 60).length}
        />
        <MetricCard
          title="Total APIs"
          value={results.length}
        />
      </div>

      <QualityTable results={results} />
    </div>
  );
}
```

## 七、最佳实践

### 7.1 内容更新频率

- **静态内容**(Getting Started, Code Examples): 随数据更新
- **动态内容**(FAQ, Related APIs): 每小时更新
- **质量评分**: 每天计算一次
- **结构化数据**: 跟随页面更新

### 7.2 A/B 测试建议

1. 测试不同的标题格式
2. 测试 FAQ 展示方式(折叠 vs 展开)
3. 测试代码示例语言优先级
4. 测试内容区块顺序

### 7.3 SEO 检查清单

- [ ] 每个页面有唯一的标题和描述
- [ ] 所有结构化数据通过 Google Rich Results Test 验证
- [ ] 内部链接密度适中(5-8个/页)
- [ ] 内容长度 > 1000 字
- [ ] 包含至少 5 个相关关键词
- [ ] 移动端友好
- [ ] 页面加载速度 < 2秒

## 八、故障排查

### 常见问题

**Q: 内容没有显示?**
A: 检查条件渲染逻辑,确保 API 数据满足显示条件。

**Q: 结构化数据验证失败?**
A: 使用 Google Rich Results Test 检查具体错误,确保所有必需字段都存在。

**Q: 页面加载慢?**
A: 启用内容缓存,使用 ISR,优化数据库查询。

**Q: 质量评分不准确?**
A: 检查评分权重配置,确保数据完整性。

## 九、下一步

1. 实现更多内容区块类型(Alternatives, Use Cases, Industry Examples)
2. 添加多语言支持
3. 实现内容个性化推荐
4. 集成 Google Analytics 跟踪内容表现
5. 开发内容自动优化系统

## 支持

如有问题,请查阅:
- 完整设计文档: `docs-new/pseo-template-system.md`
- 类型定义: `packages/shared/src/pseo-*.ts`
- 示例实现: `apps/frontend/src/app/[locale]/api/[id]/[slug]/page.tsx`
