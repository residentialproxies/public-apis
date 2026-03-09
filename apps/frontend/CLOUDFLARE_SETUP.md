# Cloudflare Workers 部署配置指南

## 前置准备

1. Cloudflare 账户
2. Workers 订阅（免费版即可用于开发）
3. wrangler CLI 已安装并登录

```bash
npm install -g wrangler
wrangler login
```

## 步骤 1: 获取 Account ID

```bash
wrangler whoami
```

输出示例：

```
Account Name: Your Name
Account ID: 1234567890abcdef
```

## 步骤 2: 更新 wrangler.toml

将以下配置添加到 `wrangler.toml`：

```toml
# 在文件顶部添加
account_id = "YOUR_ACCOUNT_ID"

# 前端 OpenNext 持久缓存已禁用
# 不需要 NEXT_INC_CACHE_R2_BUCKET / NEXT_TAG_CACHE_KV 绑定
```

## 步骤 3: 环境变量配置

### 本地开发 (.env.local)

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```env
NEXT_PUBLIC_CMS_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=http://localhost:3010
```

### 生产环境（通过 wrangler）

生产环境的环境变量已在 `wrangler.toml` 的 `[vars]` 中配置：

```toml
[vars]
NEXT_PUBLIC_CMS_URL = "https://cms.api-navigator.com"
NEXT_PUBLIC_SITE_URL = "https://api-navigator.com"
```

## 步骤 4: 部署

### 预览部署

```bash
pnpm --filter @api-navigator/frontend build:worker
wrangler deploy --dry-run
```

### 生产部署

```bash
pnpm --filter @api-navigator/frontend deploy:worker
```

## 验证部署

1. 访问 Cloudflare Dashboard
2. 进入 Workers & Pages
3. 找到 `api-navigator` worker
4. 检查：
   - ✅ Worker 与静态资源已成功部署
   - ✅ 环境变量已设置
   - ✅ 自定义域名已配置（如需要）

## 故障排查

### 问题: 仍然报 NEXT_INC_CACHE_R2_BUCKET / NEXT_TAG_CACHE_KV 缺失

**解决**: 检查 `open-next.config.ts` 是否仍为 dummy cache 配置，并删除旧的 wrangler 绑定：

- `incrementalCache: "dummy"`
- `tagCache: "dummy"`

### 问题: 部署后页面不再使用持久 ISR 缓存

**说明**: 这是预期行为。当前前端直接从运行时/源站获取数据，不再写入前端 R2/KV。

### 问题: 环境变量未生效

**解决**: 确保使用 `NEXT_PUBLIC_` 前缀，且在构建前已设置

## 成本估算

基于免费/付费套餐：

- **Workers**: 免费 100k 请求/天

当前前端成本主要来自 Workers 请求；截图存储成本仍由后端截图桶单独承担。

## 安全最佳实践

1. **限制 CORS**: 只允许前端域名
2. **API Key 保护**: 敏感操作使用 API Key
3. **Rate Limiting**: 启用 Cloudflare Rate Limiting
4. **日志审计**: 启用 Workers Analytics

## 相关链接

- [OpenNext Cloudflare 文档](https://opennext.js.org/cloudflare)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
