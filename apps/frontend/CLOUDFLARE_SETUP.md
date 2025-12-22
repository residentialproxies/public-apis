# Cloudflare Workers 部署配置指南

## 前置准备

1. Cloudflare 账户
2. Workers 订阅（免费版即可用于开发）
3. wrangler CLI 已安装并登录

```bash
npm install -g wrangler
wrangler login
```

## 步骤 1: 创建 KV Namespace

### 生产环境

```bash
wrangler kv namespace create "NEXT_TAG_CACHE_KV"
```

输出示例：

```
Created namespace with id "abc123def456..."
```

### 预览环境

```bash
wrangler kv namespace create "NEXT_TAG_CACHE_KV" --preview
```

## 步骤 2: 创建 R2 Bucket

### 生产环境

```bash
wrangler r2 bucket create api-navigator-inc-cache
```

### 预览环境

```bash
wrangler r2 bucket create api-navigator-inc-cache-preview
```

## 步骤 3: 获取 Account ID

```bash
wrangler whoami
```

输出示例：

```
Account Name: Your Name
Account ID: 1234567890abcdef
```

## 步骤 4: 更新 wrangler.toml

将以下配置添加到 `wrangler.toml`：

```toml
# 在文件顶部添加
account_id = "YOUR_ACCOUNT_ID"  # 从步骤3获取

# 更新 KV namespace IDs
[[kv_namespaces]]
binding = "NEXT_TAG_CACHE_KV"
id = "YOUR_PRODUCTION_KV_ID"    # 从步骤1获取
preview_id = "YOUR_PREVIEW_KV_ID"  # 从步骤1获取
```

## 步骤 5: 环境变量配置

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

## 步骤 6: 部署

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
   - ✅ KV Namespace 已绑定
   - ✅ R2 Bucket 已绑定
   - ✅ 环境变量已设置
   - ✅ 自定义域名已配置（如需要）

## 故障排查

### 问题: KV/R2 绑定失败

**解决**: 确保 wrangler.toml 中的 binding 名称与 open-next.config.ts 中一致：

- `NEXT_INC_CACHE_R2_BUCKET`
- `NEXT_TAG_CACHE_KV`

### 问题: 部署后 ISR 不工作

**解决**: 检查 R2 bucket 权限，确保 Worker 有读写权限

### 问题: 环境变量未生效

**解决**: 确保使用 `NEXT_PUBLIC_` 前缀，且在构建前已设置

## 成本估算

基于免费/付费套餐：

- **KV Namespace**: 免费 100k 读/天，1k 写/天
- **R2 Bucket**: 免费 10GB 存储，1M Class A 操作/月
- **Workers**: 免费 100k 请求/天

对于中小型流量，免费套餐足够使用。

## 安全最佳实践

1. **限制 CORS**: 只允许前端域名
2. **API Key 保护**: 敏感操作使用 API Key
3. **Rate Limiting**: 启用 Cloudflare Rate Limiting
4. **日志审计**: 启用 Workers Analytics

## 相关链接

- [OpenNext Cloudflare 文档](https://opennext.js.org/cloudflare)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [KV 存储文档](https://developers.cloudflare.com/kv/)
- [R2 存储文档](https://developers.cloudflare.com/r2/)
