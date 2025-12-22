# 程序化 SEO 模版系统 - 实施执行计划

## 项目概述
实施程序化 SEO 模版系统,增强 API 详情页的内容丰富度和 SEO 表现。

## 任务分解

### Phase 1: 核心模块导出配置 (优先级: 高)
**负责**: code-expert agent
**预计时间**: 30 分钟
**任务**:
1. 更新 `packages/shared/package.json` 添加 pseo 模块导出
2. 更新 `packages/shared/src/index.ts` 导出新模块
3. 验证 TypeScript 类型定义正确导出

**文件清单**:
- `/Volumes/SSD/dev/project/public-apis/packages/shared/package.json`
- `/Volumes/SSD/dev/project/public-apis/packages/shared/src/index.ts`

---

### Phase 2: 前端组件开发 (优先级: 高)
**负责**: ui agent
**预计时间**: 2 小时
**任务**:
1. 创建 `ContentBlock.tsx` - 通用内容节点渲染组件
2. 创建 `FAQSection.tsx` - FAQ 区块组件
3. 创建 `CodeBlock.tsx` - 代码示例组件(如需独立)
4. 确保所有组件支持主题切换和响应式设计
5. 添加适当的 TypeScript 类型

**组件要求**:
- 使用现有的 CSS 变量系统 (`var(--text-primary)`, `var(--bg-secondary)` 等)
- 使用现有的 UI class (`ui-surface`, `ui-chip` 等)
- 支持国际化(i18n)占位
- 代码高亮使用合适的库

**文件清单**:
- `/Volumes/SSD/dev/project/public-apis/apps/frontend/src/components/ContentBlock.tsx`
- `/Volumes/SSD/dev/project/public-apis/apps/frontend/src/components/FAQSection.tsx`
- `/Volumes/SSD/dev/project/public-apis/apps/frontend/src/components/CodeBlock.tsx`

---

### Phase 3: API 详情页集成 (优先级: 高)
**负责**: ui agent (依赖 Phase 1, Phase 2)
**预计时间**: 2 小时
**任务**:
1. 修改 `apps/frontend/src/app/[locale]/api/[id]/[slug]/page.tsx`
2. 导入新的生成器和组件
3. 构建 TemplateContext
4. 生成 Getting Started 内容区块
5. 生成 Code Examples 内容区块
6. 生成 FAQ 区块
7. 输出所有结构化数据 schemas
8. 添加开发环境的质量评分显示(可选)

**集成点**:
- 在 "AI Analysis" 区块后插入 "Getting Started"
- 在 "OpenAPI" 区块后插入 "Code Examples"
- 在 "Related APIs" 区块后插入 "FAQ"
- 在页面底部输出所有 schema.org JSON-LD

**文件清单**:
- `/Volumes/SSD/dev/project/public-apis/apps/frontend/src/app/[locale]/api/[id]/[slug]/page.tsx`

---

### Phase 4: 后端 API 增强 (优先级: 中)
**负责**: code-expert agent
**预计时间**: 1.5 小时
**任务**:
1. 创建 `/api/v1/public/apis/[id]/quality` 端点
2. 实现质量评分查询逻辑
3. 创建批量质量评估任务 `apps/backend/src/jobs/quality/index.ts`
4. (可选) 添加质量评分到 API 响应的可选字段

**API 响应格式**:
```json
{
  "quality": {
    "overall": 85,
    "breakdown": {...},
    "recommendations": [...],
    "calculatedAt": "2025-12-22T..."
  },
  "completeness": {
    "availableBlocks": [...],
    "missingBlocks": [...],
    "completeness": 75
  },
  "seo": {
    "overall": 80,
    "factors": {...}
  }
}
```

**文件清单**:
- `/Volumes/SSD/dev/project/public-apis/apps/backend/src/app/api/v1/public/apis/[id]/quality/route.ts`
- `/Volumes/SSD/dev/project/public-apis/apps/backend/src/jobs/quality/index.ts`

---

### Phase 5: 测试开发 (优先级: 中)
**负责**: test-expert agent (依赖 Phase 1-4)
**预计时间**: 2 小时
**任务**:
1. 为 `pseo-generators.ts` 编写单元测试
2. 为 `pseo-schemas.ts` 编写单元测试
3. 为 `pseo-quality.ts` 编写单元测试
4. 为前端组件编写组件测试
5. 编写 E2E 测试验证完整集成

**测试框架**:
- 单元测试: Vitest
- 组件测试: React Testing Library
- E2E测试: Playwright

**测试覆盖率目标**: > 80%

**文件清单**:
- `/Volumes/SSD/dev/project/public-apis/packages/shared/src/__tests__/pseo-generators.test.ts`
- `/Volumes/SSD/dev/project/public-apis/packages/shared/src/__tests__/pseo-schemas.test.ts`
- `/Volumes/SSD/dev/project/public-apis/packages/shared/src/__tests__/pseo-quality.test.ts`
- `/Volumes/SSD/dev/project/public-apis/apps/frontend/src/components/__tests__/ContentBlock.test.tsx`
- `/Volumes/SSD/dev/project/public-apis/apps/frontend/src/components/__tests__/FAQSection.test.tsx`
- `/Volumes/SSD/dev/project/public-apis/tests/e2e/pseo-integration.spec.ts`

---

### Phase 6: 文档完善 (优先级: 低)
**负责**: docs-expert agent
**预计时间**: 1 小时
**任务**:
1. 为所有导出函数添加 JSDoc 注释
2. 更新 README 文档
3. 创建使用示例文档
4. 添加 API 文档

**文件清单**:
- `/Volumes/SSD/dev/project/public-apis/packages/shared/src/pseo-*.ts` (添加 JSDoc)
- `/Volumes/SSD/dev/project/public-apis/docs-new/pseo-api-reference.md` (新建)

---

## 执行顺序

### 阶段 1: 基础设施 (并行)
- **Task 1.1**: Phase 1 - 模块导出配置 (code-expert)
- **Task 1.2**: Phase 2 - 前端组件开发 (ui)

### 阶段 2: 核心集成 (串行,依赖阶段1)
- **Task 2.1**: Phase 3 - API 详情页集成 (ui)

### 阶段 3: 后端支持 (并行)
- **Task 3.1**: Phase 4 - 后端 API 增强 (code-expert)
- **Task 3.2**: Phase 5 - 测试开发 (test-expert)

### 阶段 4: 收尾 (可选)
- **Task 4.1**: Phase 6 - 文档完善 (docs-expert)

---

## 验收标准

### 必须完成 (MVP)
- [x] 核心模块已导出,类型定义正确
- [ ] ContentBlock 组件可正确渲染所有节点类型
- [ ] FAQSection 组件显示正常
- [ ] API 详情页成功集成 Getting Started 区块
- [ ] API 详情页成功集成 Code Examples 区块
- [ ] API 详情页成功集成 FAQ 区块
- [ ] 所有结构化数据正确输出

### 应该完成
- [ ] 后端质量评分 API 可用
- [ ] 单元测试覆盖率 > 70%
- [ ] 组件测试通过

### 可以完成
- [ ] E2E 测试通过
- [ ] 批量质量评估任务可执行
- [ ] 完整的 API 文档

---

## 风险与注意事项

### 潜在风险
1. **类型兼容性**: shared 包的类型定义可能与前端/后端不兼容
2. **性能问题**: 内容生成可能影响页面加载速度
3. **数据缺失**: 部分 API 可能缺少必要数据导致内容区块无法显示

### 缓解措施
1. 在 Phase 1 完成后立即验证类型导出
2. 使用 React.memo 和条件渲染优化性能
3. 所有内容区块都支持条件渲染,数据不足时优雅降级

---

## 下一步行动

1. **立即执行**: Phase 1 和 Phase 2 (可并行)
2. **第二优先**: Phase 3 (依赖 1, 2)
3. **后续执行**: Phase 4, 5 (可并行)
4. **可选**: Phase 6

---

## 成功指标

- **功能完整度**: 95%+ MVP 功能实现
- **测试覆盖率**: 80%+ 代码覆盖
- **性能**: 页面加载时间增加 < 200ms
- **SEO 改进**: Rich Results Test 全部通过

---

生成时间: 2025-12-22
版本: v1.0
状态: 待执行
