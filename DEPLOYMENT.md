# 🚀 Cloudflare Workers 部署指南

本文档说明如何安全地将前端应用部署到 Cloudflare Workers。

## 📋 前置准备

### 1. Cloudflare 资源

需要在 Cloudflare 中创建以下资源：

```bash
# 登录 Cloudflare
wrangler login

# 创建 R2 bucket（用于 ISR 缓存）
wrangler r2 bucket create api-navigator-inc-cache
wrangler r2 bucket create api-navigator-inc-cache-preview

# 创建 KV namespace（用于 tag 缓存）
wrangler kv namespace create "NEXT_TAG_CACHE_KV"
wrangler kv namespace create "NEXT_TAG_CACHE_KV" --preview

# 记录输出的 KV namespace IDs，稍后需要配置到 GitHub Secrets
```

### 2. 获取 Cloudflare 凭证

```bash
# 查看 Account ID
wrangler whoami

# 创建 API Token (需要以下权限):
# - Account.Cloudflare Workers Scripts: Edit
# - Account.Cloudflare Workers KV Storage: Edit
# - Account.Cloudflare R2 Storage: Edit
```

或者访问：https://dash.cloudflare.com/profile/api-tokens

## 🔐 配置 GitHub Secrets

在 GitHub 仓库设置中配置以下 Secrets：

**路径**: Settings → Secrets and variables → Actions → New repository secret

| Secret Name | 说明 | 获取方式 |
|------------|------|---------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token | 从 Cloudflare Dashboard 创建 |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID | `wrangler whoami` |
| `CLOUDFLARE_KV_NAMESPACE_ID` | 生产环境 KV Namespace ID | `wrangler kv namespace create` 输出 |
| `CLOUDFLARE_KV_PREVIEW_NAMESPACE_ID` | 预览环境 KV Namespace ID | `wrangler kv namespace create --preview` 输出 |
| `NEXT_PUBLIC_CMS_URL` | Backend API URL | 例如：https://cms.api-navigator.com |
| `NEXT_PUBLIC_SITE_URL` | Frontend URL | 例如：https://api-navigator.com |

### 配置 Secrets 的命令示例

```bash
# 使用 GitHub CLI 配置（推荐）
gh secret set CLOUDFLARE_API_TOKEN
gh secret set CLOUDFLARE_ACCOUNT_ID
gh secret set CLOUDFLARE_KV_NAMESPACE_ID
gh secret set CLOUDFLARE_KV_PREVIEW_NAMESPACE_ID
gh secret set NEXT_PUBLIC_CMS_URL
gh secret set NEXT_PUBLIC_SITE_URL
```

## 🔧 本地部署

### 1. 创建本地配置文件

```bash
cd apps/frontend
cp wrangler.example.toml wrangler.toml
```

### 2. 编辑 wrangler.toml

替换以下占位符：
- `YOUR_PRODUCTION_KV_NAMESPACE_ID` → 你的生产环境 KV namespace ID
- `YOUR_PREVIEW_KV_NAMESPACE_ID` → 你的预览环境 KV namespace ID
- 更新 `NEXT_PUBLIC_CMS_URL` 和 `NEXT_PUBLIC_SITE_URL`

### 3. 设置 Account ID 环境变量

```bash
export CLOUDFLARE_ACCOUNT_ID=your_account_id
```

### 4. 构建并部署

```bash
# 构建
pnpm --filter @api-navigator/frontend build:worker

# 部署
pnpm --filter @api-navigator/frontend deploy:worker
```

## 🤖 自动部署（GitHub Actions）

### 触发条件

GitHub Actions 会在以下情况自动部署：

1. **自动触发**：Push 到 `main` 或 `production` 分支，且修改了以下文件：
   - `apps/frontend/**`
   - `packages/shared/**`
   - `.github/workflows/deploy-frontend.yml`

2. **手动触发**：在 GitHub Actions 页面点击 "Run workflow"

### 部署流程

1. Checkout 代码
2. 安装依赖
3. 构建前端（`pnpm build:worker`）
4. 从 `wrangler.example.toml` 生成临时 `wrangler.toml`
5. 使用 GitHub Secrets 替换占位符
6. 部署到 Cloudflare Workers
7. 清理临时 `wrangler.toml`

### 查看部署日志

访问：https://github.com/YOUR_USERNAME/YOUR_REPO/actions

## 🔒 安全最佳实践

### ✅ 正确做法

1. **永远不要提交敏感信息**
   - `wrangler.toml` 已加入 `.gitignore`
   - 使用 `wrangler.example.toml` 作为模板
   - 所有密钥使用环境变量或 GitHub Secrets

2. **使用最小权限原则**
   - Cloudflare API Token 只授予必要的权限
   - 定期轮换 API Token

3. **保护主分支**
   - 启用 branch protection rules
   - 要求 pull request review
   - 要求 status checks 通过

### ❌ 错误做法

1. ❌ 在代码中硬编码 API Token
2. ❌ 提交 `wrangler.toml` 到 Git
3. ❌ 在公开的 Issue/PR 中暴露密钥
4. ❌ 使用 Admin 权限的 API Token

## 🐛 故障排查

### 问题：部署失败，提示 "Authentication error"

**解决方案**：
1. 检查 `CLOUDFLARE_API_TOKEN` 是否正确配置
2. 验证 Token 权限是否足够
3. 检查 Token 是否过期

### 问题：KV namespace 找不到

**解决方案**：
1. 确认 KV namespace 已创建：`wrangler kv namespace list`
2. 检查 `CLOUDFLARE_KV_NAMESPACE_ID` 是否配置正确
3. 确认 Account ID 是否正确

### 问题：R2 bucket 找不到

**解决方案**：
```bash
# 列出所有 R2 buckets
wrangler r2 bucket list

# 如果不存在，创建它们
wrangler r2 bucket create api-navigator-inc-cache
wrangler r2 bucket create api-navigator-inc-cache-preview
```

## 📊 部署后验证

部署完成后，验证以下内容：

```bash
# 1. 检查 Worker 是否运行
curl https://api-navigator.com/

# 2. 检查健康状态
curl https://api-navigator.com/api/health

# 3. 验证 ISR 缓存（访问任意页面两次，第二次应该更快）
time curl -I https://api-navigator.com/
time curl -I https://api-navigator.com/
```

## 🔄 更新部署

### 更新环境变量

1. 在 Cloudflare Dashboard 更新 Worker 环境变量
2. 或者更新 GitHub Secrets 并重新部署

### 回滚部署

```bash
# 查看部署历史
wrangler deployments list

# 回滚到指定版本
wrangler rollback [deployment-id]
```

## 📚 相关文档

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [OpenNext Cloudflare Adapter](https://opennext.js.org/cloudflare)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
