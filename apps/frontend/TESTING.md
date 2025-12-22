# Testing Guide

## 测试框架

项目使用以下测试工具：

- **Vitest**: 单元测试和集成测试
- **Playwright**: E2E 端到端测试
- **Testing Library**: React 组件测试
- **Happy DOM**: 浏览器环境模拟

## 测试结构

```
apps/frontend/
├── src/
│   └── lib/
│       └── __tests__/          # 单元测试（与源码同目录）
│           ├── format.test.ts
│           └── search-params.test.ts
│
├── tests/
│   ├── unit/                   # 单元测试
│   └── e2e/                    # E2E 测试
│       ├── homepage.e2e.ts
│       └── api-detail.e2e.ts
│
├── vitest.config.ts            # Vitest 配置
├── vitest.setup.ts             # 测试设置
└── playwright.config.ts        # Playwright 配置
```

## 运行测试

### 单元测试

```bash
# 运行所有单元测试
pnpm test

# 监视模式（开发时使用）
pnpm test:watch

# 生成覆盖率报告
pnpm test:coverage
```

### E2E 测试

```bash
# 运行 E2E 测试（需要先启动 dev 服务器）
pnpm test:e2e

# 使用 UI 模式运行
pnpm test:e2e:ui

# 只运行 chromium
pnpm test:e2e --project=chromium

# 调试模式
pnpm test:e2e --debug
```

### CI/CD 环境

```bash
# 完整测试流程
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:e2e --project=chromium
```

## 编写测试

### 单元测试示例

```typescript
// src/lib/__tests__/example.test.ts
import { describe, it, expect } from "vitest";
import { myFunction } from "../example";

describe("myFunction", () => {
  it("should return expected value", () => {
    const result = myFunction("input");
    expect(result).toBe("expected output");
  });

  it("should handle edge cases", () => {
    expect(myFunction("")).toBe("");
    expect(myFunction(null)).toBeUndefined();
  });
});
```

### React 组件测试示例

```typescript
// src/components/__tests__/Button.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../Button'

describe('Button', () => {
  it('should render with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click</Button>)

    const button = screen.getByRole('button')
    await userEvent.click(button)

    expect(handleClick).toHaveBeenCalledOnce()
  })
})
```

### E2E 测试示例

```typescript
// tests/e2e/example.e2e.ts
import { test, expect } from "@playwright/test";

test("should navigate to page", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/API Navigator/);

  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toBeVisible();
});
```

## 测试最佳实践

### 1. 测试文件命名

- 单元测试: `*.test.ts` 或 `*.spec.ts`
- E2E 测试: `*.e2e.ts`
- 放置位置: 与源码同目录的 `__tests__` 文件夹

### 2. 测试组织

```typescript
describe("FeatureName", () => {
  describe("specificFunction", () => {
    it("should handle normal case", () => {});
    it("should handle edge case", () => {});
    it("should throw error on invalid input", () => {});
  });
});
```

### 3. AAA 模式

```typescript
it("should do something", () => {
  // Arrange (准备)
  const input = "test";

  // Act (执行)
  const result = myFunction(input);

  // Assert (断言)
  expect(result).toBe("expected");
});
```

### 4. 使用 data-testid

```tsx
// 组件中添加
<div data-testid="api-card">...</div>;

// 测试中使用
const card = screen.getByTestId("api-card");
```

### 5. 避免测试实现细节

```typescript
// ❌ 不好 - 测试实现细节
expect(wrapper.find(".button-class")).toHaveLength(1);

// ✅ 好 - 测试用户可见行为
expect(screen.getByRole("button")).toBeVisible();
```

## 覆盖率目标

- **Statements**: 60%+
- **Branches**: 60%+
- **Functions**: 60%+
- **Lines**: 60%+

## Mock 策略

### Mock Next.js 模块

```typescript
// vitest.setup.ts 中已配置
vi.mock('next/navigation', () => ({ ... }))
vi.mock('next/image', () => ({ ... }))
vi.mock('next/link', () => ({ ... }))
```

### Mock API 请求

```typescript
import { vi } from "vitest";

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: "test" }),
  }),
);
```

### Mock 环境变量

```typescript
// 在测试文件中
process.env.NEXT_PUBLIC_CMS_URL = "http://test.com";
```

## 调试测试

### Vitest 调试

```bash
# 使用 --inspect-brk 调试
node --inspect-brk ./node_modules/.bin/vitest run

# 在 VS Code 中添加断点后使用调试器
```

### Playwright 调试

```bash
# UI 模式（推荐）
pnpm test:e2e:ui

# Playwright Inspector
pnpm test:e2e --debug

# 慢动作模式
pnpm test:e2e --slow-mo=1000
```

## CI 集成

### GitHub Actions 示例

```yaml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"

      - run: pnpm install
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm test:e2e --project=chromium

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: apps/frontend/test-results
```

## 故障排查

### 问题: Vitest 找不到模块

**解决**: 确保 `vitest.config.ts` 中配置了 `vite-tsconfig-paths`:

```typescript
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
});
```

### 问题: Playwright 测试超时

**解决**: 增加超时时间或检查服务器是否启动:

```typescript
test("should load", async ({ page }) => {
  await page.goto("/", { timeout: 30000 });
});
```

### 问题: 测试在 CI 通过，本地失败

**解决**: 检查环境变量、端口占用、数据库状态

## 相关资源

- [Vitest 文档](https://vitest.dev/)
- [Playwright 文档](https://playwright.dev/)
- [Testing Library 文档](https://testing-library.com/)
- [Next.js Testing 指南](https://nextjs.org/docs/testing)
