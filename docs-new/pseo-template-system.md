# 程序化 SEO 模版系统设计方案

## 目标

为 API 详情页设计一套可扩展、数据驱动的内容模版系统,实现:
- ✅ 丰富的程序化内容生成
- ✅ SEO 友好的结构化数据
- ✅ 高质量的用户体验
- ✅ 可维护的模版架构

## 架构概览

```
┌─────────────────────────────────────────────────────┐
│           API 详情页模版系统                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐│
│  │ 数据源层     │  │ 模版引擎     │  │ 渲染层       ││
│  └─────────────┘  └─────────────┘  └─────────────┘│
│       ↓                  ↓                  ↓      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐│
│  │ API 基础数据 │  │ 动态内容块   │  │ React 组件   ││
│  │ SEO 元数据   │→ │ 条件渲染     │→ │ HTML 输出    ││
│  │ 健康数据     │  │ 内容评分     │  │ Schema.org  ││
│  └─────────────┘  └─────────────┘  └─────────────┘│
└─────────────────────────────────────────────────────┘
```

## 一、内容区块模版系统

### 1.1 核心内容区块

```typescript
type ContentBlock = {
  id: string;
  type: BlockType;
  priority: number;  // 渲染优先级
  conditions: RenderCondition[];  // 显示条件
  template: BlockTemplate;
  seoWeight: number;  // SEO 权重 (0-10)
};

enum BlockType {
  // 基础信息块
  HERO = "hero",
  QUICK_STATS = "quick_stats",

  // 技术文档块
  GETTING_STARTED = "getting_started",
  CODE_EXAMPLES = "code_examples",
  API_REFERENCE = "api_reference",
  AUTHENTICATION_GUIDE = "auth_guide",

  // 比较与分析块
  ALTERNATIVES = "alternatives",
  PRICING_COMPARISON = "pricing_comparison",
  FEATURE_MATRIX = "feature_matrix",

  // 使用场景块
  USE_CASES = "use_cases",
  INDUSTRY_EXAMPLES = "industry_examples",
  SUCCESS_STORIES = "success_stories",

  // 技术规格块
  RATE_LIMITS = "rate_limits",
  DATA_FORMATS = "data_formats",
  SUPPORTED_REGIONS = "supported_regions",

  // 社区与支持块
  COMMUNITY_RESOURCES = "community",
  CHANGELOG = "changelog",
  ROADMAP = "roadmap",

  // SEO 增强块
  FAQ = "faq",
  GLOSSARY = "glossary",
  RELATED_APIS = "related_apis",
  CATEGORY_OVERVIEW = "category_overview",
}
```

### 1.2 条件渲染逻辑

```typescript
type RenderCondition = {
  field: string;
  operator: "exists" | "equals" | "gt" | "lt" | "contains";
  value?: unknown;
};

// 示例:只在有 OpenAPI 规范时显示 API Reference
{
  id: "api_reference_block",
  type: BlockType.API_REFERENCE,
  conditions: [
    { field: "openapiUrl", operator: "exists" }
  ],
  priority: 8,
  seoWeight: 9
}

// 示例:只在有代码示例时显示 Getting Started
{
  id: "getting_started_block",
  type: BlockType.GETTING_STARTED,
  conditions: [
    { field: "seoMetadata.hasCodeExamples", operator: "equals", value: true }
  ],
  priority: 9,
  seoWeight: 10
}
```

## 二、模版内容生成策略

### 2.1 数据驱动的内容模版

每个 BlockType 对应一套内容生成模版:

```typescript
type BlockTemplate = {
  title: (data: ApiData) => string;
  content: (data: ApiData) => ContentNode[];
  schema?: (data: ApiData) => Record<string, unknown>;  // Schema.org 结构化数据
};

// 示例:Getting Started 模版
const GETTING_STARTED_TEMPLATE: BlockTemplate = {
  title: (api) => `Getting Started with ${api.name} API`,

  content: (api) => [
    {
      type: "heading",
      level: 2,
      text: "Quick Start Guide"
    },
    {
      type: "paragraph",
      text: `The ${api.name} API provides ${api.description}. ${
        api.auth === "No"
          ? "No authentication required - start using it immediately!"
          : `Authentication via ${api.auth} is required.`
      }`
    },
    {
      type: "code_block",
      language: "bash",
      code: generateQuickStartCode(api)
    },
    {
      type: "list",
      items: [
        `Base URL: ${extractBaseUrl(api.link)}`,
        `Protocol: ${api.https ? "HTTPS" : "HTTP"}`,
        `CORS: ${api.cors}`,
        ...(api.seoMetadata?.languages?.map(l =>
          `SDK available for: ${l.language}`
        ) || [])
      ]
    }
  ],

  schema: (api) => ({
    "@type": "HowTo",
    "name": `How to use ${api.name} API`,
    "step": generateHowToSteps(api)
  })
};
```

### 2.2 动态代码示例生成

根据 API 特征生成多语言代码示例:

```typescript
function generateCodeExamples(api: ApiData): CodeExample[] {
  const examples: CodeExample[] = [];

  // 基于 seoMetadata.languages 生成对应语言的示例
  const languages = api.seoMetadata?.languages?.map(l => l.language) || ["curl"];

  for (const lang of languages) {
    examples.push({
      language: lang,
      code: generateCodeForLanguage(api, lang),
      description: `Example ${lang} code to call ${api.name} API`
    });
  }

  return examples;
}

function generateCodeForLanguage(api: ApiData, lang: string): string {
  const baseUrl = extractBaseUrl(api.link);

  switch (lang.toLowerCase()) {
    case "javascript":
    case "typescript":
      return `
// ${api.name} API - JavaScript Example
const response = await fetch('${baseUrl}', {
  method: 'GET',
  headers: {
    ${api.auth !== "No" ? `'Authorization': 'Bearer YOUR_API_KEY',` : ""}
    'Content-Type': 'application/json'
  }
});
const data = await response.json();
console.log(data);
      `.trim();

    case "python":
      return `
# ${api.name} API - Python Example
import requests

url = '${baseUrl}'
${api.auth !== "No" ? `headers = {'Authorization': 'Bearer YOUR_API_KEY'}` : "headers = {}"}
response = requests.get(url, headers=headers)
data = response.json()
print(data)
      `.trim();

    case "curl":
    default:
      return `curl -X GET '${baseUrl}' ${
        api.auth !== "No" ? `-H 'Authorization: Bearer YOUR_API_KEY'` : ""
      }`.trim();
  }
}
```

## 三、FAQ 生成策略

### 3.1 基于 API 特征的动态 FAQ

```typescript
type FAQItem = {
  question: string;
  answer: string;
  category: "pricing" | "technical" | "support" | "security";
};

function generateDynamicFAQ(api: ApiData): FAQItem[] {
  const faq: FAQItem[] = [];

  // 1. 认证相关 FAQ
  if (api.auth !== "No") {
    faq.push({
      question: `How do I authenticate with ${api.name} API?`,
      answer: `The ${api.name} API uses ${api.auth} authentication. ${
        getAuthGuideText(api.auth)
      }`,
      category: "technical"
    });
  } else {
    faq.push({
      question: `Does ${api.name} API require authentication?`,
      answer: `No, the ${api.name} API is publicly accessible without authentication. You can start making requests immediately.`,
      category: "technical"
    });
  }

  // 2. CORS 相关 FAQ
  if (api.cors === "Yes") {
    faq.push({
      question: `Can I use ${api.name} API from a web browser?`,
      answer: `Yes! The ${api.name} API supports CORS, allowing you to make requests directly from web browsers.`,
      category: "technical"
    });
  }

  // 3. 性能相关 FAQ
  if (api.latencyMs !== null) {
    faq.push({
      question: `What is the typical response time for ${api.name} API?`,
      answer: `Based on our monitoring, ${api.name} API typically responds in ${api.latencyMs}ms. ${
        api.latencyMs < 500 ? "This is excellent performance!" :
        api.latencyMs < 1000 ? "This is good performance for most use cases." :
        "Consider implementing caching for better user experience."
      }`,
      category: "technical"
    });
  }

  // 4. 可靠性相关 FAQ
  if (api.healthStatus === "live") {
    faq.push({
      question: `Is ${api.name} API reliable?`,
      answer: `Yes, our latest health check shows ${api.name} API is operational. ${
        api.lastCheckedAt ? `Last verified: ${formatRelativeTime(api.lastCheckedAt)}.` : ""
      }`,
      category: "support"
    });
  }

  // 5. 基于文档质量的 FAQ
  if (api.seoMetadata?.docQualityScore && api.seoMetadata.docQualityScore >= 7) {
    faq.push({
      question: `Where can I find ${api.name} API documentation?`,
      answer: `${api.name} has comprehensive documentation available at ${api.link}. ${
        api.seoMetadata.hasCodeExamples ? "It includes code examples " : ""
      }${
        api.seoMetadata.languages?.length
          ? `in ${api.seoMetadata.languages.map(l => l.language).join(", ")}.`
          : "."
      }`,
      category: "support"
    });
  }

  // 6. OpenAPI/Swagger FAQ
  if (api.openapiUrl) {
    faq.push({
      question: `Does ${api.name} API have an OpenAPI specification?`,
      answer: `Yes, you can find the OpenAPI/Swagger specification at ${api.openapiUrl}. This allows you to auto-generate client SDKs.`,
      category: "technical"
    });
  }

  // 7. 使用场景 FAQ (基于 AI 分析)
  if (api.aiAnalysis?.useCases?.length) {
    const topUseCases = api.aiAnalysis.useCases.slice(0, 3).map(u => u.tag).join(", ");
    faq.push({
      question: `What can I build with ${api.name} API?`,
      answer: `Common use cases for ${api.name} include: ${topUseCases}. ${
        api.aiAnalysis.summary || ""
      }`,
      category: "technical"
    });
  }

  return faq;
}
```

### 3.2 Schema.org FAQ 结构化数据

```typescript
function generateFAQSchema(faqItems: FAQItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };
}
```

## 四、内容比较与替代方案模版

### 4.1 同类 API 比较表

```typescript
type ComparisonMatrix = {
  title: string;
  apis: ComparisonApi[];
  features: ComparisonFeature[];
};

type ComparisonApi = {
  id: number;
  name: string;
  score: number;  // 综合评分
};

type ComparisonFeature = {
  name: string;
  description: string;
  values: Record<number, string | boolean>;  // apiId -> value
};

function generateComparisonMatrix(
  currentApi: ApiData,
  category: Category
): ComparisonMatrix {
  // 从同类别中选取 top 3-5 个 API
  const competitors = getTopApisInCategory(category.slug, 5)
    .filter(api => api.id !== currentApi.id);

  return {
    title: `${currentApi.name} vs ${competitors.map(c => c.name).join(" vs ")}`,
    apis: [currentApi, ...competitors].map(api => ({
      id: api.id,
      name: api.name,
      score: calculateApiScore(api)
    })),
    features: [
      {
        name: "Authentication",
        description: "Required auth method",
        values: Object.fromEntries(
          [currentApi, ...competitors].map(api => [api.id, api.auth])
        )
      },
      {
        name: "HTTPS Support",
        description: "Secure connection",
        values: Object.fromEntries(
          [currentApi, ...competitors].map(api => [api.id, api.https])
        )
      },
      {
        name: "CORS Enabled",
        description: "Browser support",
        values: Object.fromEntries(
          [currentApi, ...competitors].map(api => [api.id, api.cors === "Yes"])
        )
      },
      {
        name: "Documentation Quality",
        description: "Doc completeness (1-10)",
        values: Object.fromEntries(
          [currentApi, ...competitors].map(api => [
            api.id,
            api.seoMetadata?.docQualityScore || "N/A"
          ])
        )
      },
      {
        name: "Code Examples",
        description: "Available examples",
        values: Object.fromEntries(
          [currentApi, ...competitors].map(api => [
            api.id,
            api.seoMetadata?.hasCodeExamples || false
          ])
        )
      },
      {
        name: "Avg Latency",
        description: "Response time (ms)",
        values: Object.fromEntries(
          [currentApi, ...competitors].map(api => [
            api.id,
            api.latencyMs !== null ? `${api.latencyMs}ms` : "N/A"
          ])
        )
      }
    ]
  };
}
```

## 五、内容质量评分系统

### 5.1 页面内容完整度评分

```typescript
type ContentQualityScore = {
  overall: number;  // 0-100
  breakdown: {
    basicInfo: number;      // 基础信息完整度
    technicalDocs: number;  // 技术文档完整度
    codeExamples: number;   // 代码示例丰富度
    seoOptimization: number; // SEO 优化程度
    userGuidance: number;   // 用户指导质量
  };
  recommendations: string[];  // 改进建议
};

function calculateContentQuality(api: ApiData): ContentQualityScore {
  const scores = {
    basicInfo: 0,
    technicalDocs: 0,
    codeExamples: 0,
    seoOptimization: 0,
    userGuidance: 0
  };

  const recommendations: string[] = [];

  // 1. 基础信息完整度 (0-20分)
  scores.basicInfo = 10; // 名称和描述必有
  if (api.category) scores.basicInfo += 5;
  if (api.link) scores.basicInfo += 5;

  // 2. 技术文档完整度 (0-25分)
  if (api.openapiUrl) {
    scores.technicalDocs += 10;
  } else {
    recommendations.push("添加 OpenAPI 规范以提升技术文档完整度");
  }

  if (api.seoMetadata?.docQualityScore) {
    scores.technicalDocs += Math.min(15, api.seoMetadata.docQualityScore * 1.5);
  } else {
    recommendations.push("运行 SEO 提取任务获取文档质量评分");
  }

  // 3. 代码示例丰富度 (0-20分)
  if (api.seoMetadata?.hasCodeExamples) {
    scores.codeExamples += 10;
  } else {
    recommendations.push("添加代码示例以提升开发者体验");
  }

  const langCount = api.seoMetadata?.languages?.length || 0;
  scores.codeExamples += Math.min(10, langCount * 2);
  if (langCount < 3) {
    recommendations.push("增加更多编程语言的代码示例");
  }

  // 4. SEO 优化程度 (0-20分)
  if (api.generatedContent?.seoTitle) scores.seoOptimization += 5;
  if (api.generatedContent?.blogPost) scores.seoOptimization += 5;
  if (api.seoMetadata?.keywords?.length) {
    scores.seoOptimization += Math.min(5, api.seoMetadata.keywords.length / 2);
  }
  if (api.seoMetadata?.h2s?.length) {
    scores.seoOptimization += Math.min(5, api.seoMetadata.h2s.length / 3);
  }

  if (!api.generatedContent?.blogPost) {
    recommendations.push("生成 AI 深度内容以增强 SEO");
  }

  // 5. 用户指导质量 (0-15分)
  if (api.aiAnalysis?.summary) scores.userGuidance += 5;
  if (api.aiAnalysis?.useCases?.length) {
    scores.userGuidance += Math.min(10, api.aiAnalysis.useCases.length * 2);
  } else {
    recommendations.push("添加使用场景说明帮助用户理解 API 价值");
  }

  const overall = Object.values(scores).reduce((a, b) => a + b, 0);

  return {
    overall,
    breakdown: scores,
    recommendations
  };
}
```

## 六、URL 策略与内部链接

### 6.1 多层级 URL 结构

```
/api/:id/:slug                    - API 详情页
/api/:id/:slug/getting-started    - 快速开始指南
/api/:id/:slug/documentation      - 完整文档
/api/:id/:slug/examples           - 代码示例集合
/api/:id/:slug/pricing            - 定价信息
/api/:id/:slug/alternatives       - 替代方案比较
/api/:id/:slug/changelog          - 更新日志
```

### 6.2 智能内部链接策略

```typescript
type InternalLink = {
  text: string;
  url: string;
  relevance: number;  // 相关度评分
  type: "category" | "related_api" | "comparison" | "guide";
};

function generateInternalLinks(api: ApiData): InternalLink[] {
  const links: InternalLink[] = [];

  // 1. 类别页面链接
  if (api.category) {
    links.push({
      text: `Explore all ${api.category.name} APIs`,
      url: `/category/${api.category.slug}`,
      relevance: 10,
      type: "category"
    });
  }

  // 2. 相关 API 链接 (基于相同类别)
  const relatedApis = getRelatedApis(api.category?.slug, api.id, 5);
  relatedApis.forEach((relatedApi, idx) => {
    links.push({
      text: `${relatedApi.name} - ${relatedApi.description.slice(0, 50)}...`,
      url: `/api/${relatedApi.id}/${slugify(relatedApi.name)}`,
      relevance: 8 - idx,
      type: "related_api"
    });
  });

  // 3. 比较页面链接
  if (relatedApis.length > 0) {
    links.push({
      text: `Compare ${api.name} with alternatives`,
      url: `/compare?apis=${api.id},${relatedApis.slice(0, 2).map(a => a.id).join(",")}`,
      relevance: 7,
      type: "comparison"
    });
  }

  // 4. 基于使用场景的链接
  if (api.aiAnalysis?.useCases?.length) {
    api.aiAnalysis.useCases.slice(0, 3).forEach(useCase => {
      links.push({
        text: `Best APIs for ${useCase.tag}`,
        url: `/use-case/${slugify(useCase.tag)}`,
        relevance: 6,
        type: "guide"
      });
    });
  }

  return links.sort((a, b) => b.relevance - a.relevance);
}
```

## 七、实施计划

### Phase 1: 基础模版系统 (Week 1-2)
- [ ] 创建 `ContentBlock` 类型定义
- [ ] 实现条件渲染引擎
- [ ] 开发核心内容块组件:
  - Getting Started
  - Code Examples
  - FAQ
  - Alternatives Comparison

### Phase 2: 动态内容生成 (Week 3-4)
- [ ] 实现多语言代码生成器
- [ ] 开发 FAQ 自动生成逻辑
- [ ] 创建内容质量评分系统
- [ ] 实现同类 API 比较矩阵

### Phase 3: SEO 优化 (Week 5-6)
- [ ] 增强 Schema.org 结构化数据
- [ ] 实现智能内部链接生成
- [ ] 开发内容完整度监控面板
- [ ] A/B 测试框架搭建

### Phase 4: 质量监控与优化 (Week 7-8)
- [ ] 部署内容质量监控
- [ ] 收集用户行为数据
- [ ] 优化模版参数
- [ ] 生成优化报告

## 八、成功指标

### SEO 指标
- 平均页面字数: 1500+ words
- 内容唯一性: 90%+
- 结构化数据覆盖: 100%
- 内部链接密度: 5-8 links/page
- FAQ 覆盖率: 80%+ pages

### 用户体验指标
- 页面加载时间: < 2s
- 代码示例可用性: 90%+
- 用户停留时间: +30%
- 跳出率: -20%

### 技术指标
- 内容生成成功率: 95%+
- 模版渲染时间: < 100ms
- 缓存命中率: 80%+

## 九、维护与扩展

### 9.1 内容更新策略
- 每日: 健康状态、延迟数据更新
- 每周: FAQ 内容刷新、相关 API 推荐更新
- 每月: 比较矩阵数据重新计算、内容质量审计
- 按需: 新内容块模版添加、SEO 策略调整

### 9.2 质量保障
- 自动化测试覆盖所有内容块
- 人工审核新模版内容
- A/B 测试验证新策略效果
- 用户反馈收集与迭代
