# Frontend（API Navigator）

Next.js 16（App Router）前端站点：列表/筛选/详情页 + SEO（sitemap/robots/JSON-LD）。

## 本地开发

### 1) 配置环境变量

```bash
cp .env.example .env.local
```

默认后端地址：

- `NEXT_PUBLIC_CMS_URL=http://localhost:3001`

### 2) 启动

```bash
pnpm dev
```

访问：`http://localhost:3000`

## 生产部署（Cloudflare Workers / OpenNext）

项目已提供：

- `open-next.config.ts`：R2 incremental cache + KV tag cache
- `wrangler.toml`：bindings 示例（需要替换 KV namespace id）

参考：仓库根目录 `docs-new/deployment-guide.md`。
