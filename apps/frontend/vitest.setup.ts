/* eslint-disable @typescript-eslint/no-explicit-any */
import "@testing-library/jest-dom/vitest";
import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// 每个测试后自动清理
afterEach(() => {
  cleanup();
});

// 模拟 Next.js 环境变量
process.env.NEXT_PUBLIC_CMS_URL = "http://localhost:3001";
process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3010";

// 模拟 Next.js 导航
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: "/",
    query: {},
    asPath: "/",
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

// 模拟 Next.js Image 组件
vi.mock("next/image", () => ({
  default: (props: any) => props,
}));

// 模拟 Next.js Link 组件
vi.mock("next/link", () => ({
  default: ({ children, ...props }: any) => ({
    $$typeof: Symbol.for("react.element"),
    type: "a",
    props: { ...props, children },
    key: null,
    ref: null,
  }),
}));

// 全局配置
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// 模拟 IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  root = null;
  rootMargin = "";
  thresholds = [];
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// 扩展 expect 匹配器
expect.extend({
  toBeInTheDocument(received: any) {
    const pass = received !== null && received !== undefined;
    return {
      pass,
      message: () =>
        pass
          ? `expected element not to be in the document`
          : `expected element to be in the document`,
    };
  },
});

console.log("✓ Vitest setup completed");
