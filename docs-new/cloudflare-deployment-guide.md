# Frontend 部署指南 - Cloudflare Workers

本指南将帮助您将 API Navigator Frontend 部署到 Cloudflare Workers，域名：**public-api.org**

## 📋 前置准备

### 已完成的配置

✅ **Cloudflare KV Namespaces**：

- Production KV: `d4c0b50e105c4e83b541ec2ec52e0573`
- Preview KV: `78821ba5c1614da8984211b260b68e60`

✅ **配置文件**：

- `wrangler.toml.example` - 模板文件（已创建）
- `wrangler.toml` - 本地配置（已配置，在 .gitignore 中）
- `.github/workflows/deploy-frontend.yml` - CI/CD 工作流（已创建）

### 需要的密钥信息

从 `/Volumes/SSD/dev/project/timezone/whatismytimezone/.env.local` 获取：

- `CLOUDFLARE_API_TOKEN`: zXwKNqnaEQruZ_1qYRDFltQYiDDZipNiTaDm7ttD
- `CLOUDFLARE_ACCOUNT_ID`: 873cd683fb162639ab3732a3a995b64b
- `GITHUB_TOKEN`: YOUR_GITHUB_TOKEN

---

## 🚀 部署方式

### 方式一：GitHub Actions 自动部署（推荐）

#### 1. 创建 GitHub 仓库

由于当前仓库 `residentialproxies/public-apis` 没有写权限，需要创建新仓库：

```bash
# 运行自动化脚本
./scripts/setup-github-repo.sh
```

或手动操作：

```bash
export GITHUB_TOKEN=YOUR_GITHUB_TOKEN

# 创建新的私有仓库
gh repo create api-navigator \
  --private \
  --description "API Navigator - Public API Directory with Health Monitoring" \
  --confirm

# 添加新的 remote
git remote add deploy https://github.com/7and1/api-navigator.git

# 推送代码
git push deploy main
```

#### 2. 配置 GitHub Secrets

```bash
# 运行自动化脚本
./scripts/setup-github-secrets.sh
```

或手动配置：

```bash
export GITHUB_TOKEN=YOUR_GITHUB_TOKEN

# 设置 Cloudflare 相关 Secrets
gh secret set CLOUDFLARE_API_TOKEN \
  --body "zXwKNqnaEQruZ_1qYRDFltQYiDDZipNiTaDm7ttD" \
  --repo 7and1/api-navigator

gh secret set CLOUDFLARE_ACCOUNT_ID \
  --body "873cd683fb162639ab3732a3a995b64b" \
  --repo 7and1/api-navigator

# 设置 KV Namespace IDs
gh secret set CLOUDFLARE_KV_NAMESPACE_ID \
  --body "d4c0b50e105c4e83b541ec2ec52e0573" \
  --repo 7and1/api-navigator

gh secret set CLOUDFLARE_KV_PREVIEW_NAMESPACE_ID \
  --body "78821ba5c1614da8984211b260b68e60" \
  --repo 7and1/api-navigator

# 设置环境变量（可选）
gh secret set NEXT_PUBLIC_CMS_URL \
  --body "https://cms.api-navigator.com" \
  --repo 7and1/api-navigator

gh secret set NEXT_PUBLIC_SITE_URL \
  --body "https://public-api.org" \
  --repo 7and1/api-navigator
```

#### 3. 触发部署

推送代码到 main 分支将自动触发部署：

```bash
git push deploy main
```

或手动触发：

```bash
gh workflow run deploy-frontend.yml --repo 7and1/api-navigator
```

查看部署状态：

```bash
gh run list --workflow=deploy-frontend.yml --repo 7and1/api-navigator
```

---

### 方式二：本地直接部署

#### 1. 准备环境

```bash
cd apps/frontend

# 导出环境变量
export CLOUDFLARE_API_TOKEN=zXwKNqnaEQruZ_1qYRDFltQYiDDZipNiTaDm7ttD
export CLOUDFLARE_ACCOUNT_ID=873cd683fb162639ab3732a3a995b64b
export NEXT_PUBLIC_CMS_URL="https://cms.api-navigator.com"
export NEXT_PUBLIC_SITE_URL="https://public-api.org"
```

#### 2. 构建和部署

**注意**：构建需要访问 Google Fonts，请确保网络畅通或配置代理：

```bash
# 如果需要代理
export HTTP_PROXY=http://127.0.0.1:7890
export HTTPS_PROXY=http://127.0.0.1:7890

# 构建
pnpm build:worker

# 部署
pnpm deploy:worker
```

#### 3. 验证部署

```bash
# 查看部署状态
npx wrangler deployments list

# 测试访问
curl https://public-api.org
```

---

## 🔧 故障排查

### 构建失败：无法获取 Google Fonts

**错误信息**：

```
Failed to fetch `Geist` from Google Fonts.
```

**解决方案**：

1. **配置代理**（推荐）：

   ```bash
   export HTTP_PROXY=http://127.0.0.1:7890
   export HTTPS_PROXY=http://127.0.0.1:7890
   pnpm build:worker
   ```

2. **使用 GitHub Actions**：
   - GitHub Actions 服务器可以直接访问 Google Fonts
   - 推送代码触发自动构建和部署

3. **临时禁用字体优化**（不推荐）：
   - 修改 `src/app/[locale]/layout.tsx`
   - 使用系统字体替代 Google Fonts

### GitHub Actions 权限错误

**错误信息**：

```
HTTP 403: You must have repository read permissions
```

**解决方案**：

- 创建新的仓库或 fork 现有仓库
- 确保 GitHub Token 有 `repo` 和 `workflow` 权限

### Wrangler 认证失败

**错误信息**：

```
Authentication error
```

**解决方案**：

```bash
# 验证 token
export CLOUDFLARE_API_TOKEN=your_token
npx wrangler whoami

# 或重新登录
npx wrangler login
```

---

## 📝 配置说明

### wrangler.toml 配置

本地 `wrangler.toml` 已配置：

- **域名**：public-api.org, www.public-api.org
- **KV Namespaces**：生产和预览环境
- **R2 Buckets**：增量缓存
- **环境变量**：CMS URL, Site URL

**⚠️ 安全提示**：

- `wrangler.toml` 已在 `.gitignore` 中
- 永远不要提交包含敏感信息的配置文件
- 使用 `wrangler.toml.example` 作为模板

### 环境变量

| 变量名                  | 用途               | 示例                            |
| ----------------------- | ------------------ | ------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Wrangler 认证      | `zXwKNqna...`                   |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 账号 ID | `873cd683...`                   |
| `NEXT_PUBLIC_CMS_URL`   | Backend API 地址   | `https://cms.api-navigator.com` |
| `NEXT_PUBLIC_SITE_URL`  | 前端站点 URL       | `https://public-api.org`        |

---

## 🎯 下一步

### 1. 域名配置

在 Cloudflare Dashboard 中配置：

1. 添加 `public-api.org` 域名
2. 配置 DNS 记录指向 Workers
3. 启用 SSL/TLS（自动）

### 2. 监控和日志

```bash
# 实时日志
npx wrangler tail

# 查看部署历史
npx wrangler deployments list

# 查看 KV 数据
npx wrangler kv:key list --namespace-id=d4c0b50e105c4e83b541ec2ec52e0573
```

### 3. 回滚部署

```bash
# 列出所有版本
npx wrangler deployments list

# 回滚到指定版本
npx wrangler rollback <deployment-id>
```

---

## 📚 相关文档

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [OpenNext Cloudflare 文档](https://opennext.js.org/cloudflare)
- [项目 CLAUDE.md](./CLAUDE.md)

---

## ⚙️ 自动化脚本

已创建以下脚本简化部署流程：

- `scripts/setup-github-repo.sh` - 创建 GitHub 仓库并推送代码
- `scripts/setup-github-secrets.sh` - 配置 GitHub Secrets
- `scripts/deploy-local.sh` - 本地构建和部署

---

**生成时间**: 2025-12-23
**文档版本**: 1.0
**维护者**: Claude Code
