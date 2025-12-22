# SSRF 防护（SSRF Guard）

> 日期: 2025-12-15  
> 背景: Health Job 需要对外部 URL 发起请求，必须默认安全（宁可 unknown，也不能打进内网）

---

## 1. 威胁模型（要防什么）

典型 SSRF 场景包括：

- 访问私网：`http://192.168.0.1/`
- 访问本机/容器：`http://localhost:2375/`（Docker）/ `http://127.0.0.1:6379/`（Redis）
- 云元数据：`http://169.254.169.254/latest/meta-data/`
- DNS Rebinding：域名解析结果变化后命中内网
- 重定向绕过：公网 URL 302 到内网地址
- 协议滥用：`file://`、`gopher://` 等

---

## 2. 代码落地位置

- 实现：`apps/backend/src/lib/ssrf-guard.ts`
- 使用：`apps/backend/src/jobs/health/index.ts`（`SSRFGuard.safeFetch()`）

---

## 3. 默认防护策略（实现细节）

`SSRFGuard` 的默认策略（可通过构造参数覆盖部分值）：

### 3.1 URL 解析与协议白名单

- 仅允许 `http:` / `https:`
- 禁止 URL 中包含 `username:password@host`（避免凭据注入/混淆）

### 3.2 端口拦截（高风险端口）

默认阻止常见内网服务端口（例如 22/2375/3306/5432/6379/9200/11211/27017 等），防止探测内网服务面。

### 3.3 DNS 解析 + IP 范围拦截

- 域名解析使用 Node `dns.lookup`（优先 IPv4，失败再 IPv6）
- DNS 结果缓存（默认 TTL 60s），降低重试成本
- 解析到的 IP 会被校验：
  - 阻止云元数据 IP（`169.254.169.254` 等）
  - 阻止 `private/loopback/linkLocal/multicast/reserved/...` 等范围
  - 阻止一组默认 CIDR（覆盖常见私网/保留/文档网段）

> 设计取向：宁可把一些可疑目标标为 `unknown`，也不允许“有概率触达内网”。

### 3.4 重定向检查

使用 `redirect: 'manual'` 手动跟随重定向，并对每一步重定向目标重复执行 SSRF 检查；超过最大重定向次数直接失败。

### 3.5 超时与响应体保护

- 请求使用 `AbortController` 进行超时中断（默认 10s）
- 若响应包含 `content-length` 且大于上限（默认 1MB），直接拒绝并取消读取

---

## 4. Health Job 的落地约定

- SSRF 被拦截（`SSRFError`）不计为失败：记录为 `healthStatus=unknown`，并清空 `consecutiveFailures`  
  目的：避免把“我们拒绝探测”的目标误标 down。

---

## 5. 特殊网络环境（可选白名单）

有些内网 / 安全软件会把公网域名解析到“保留网段”的地址（例如 `198.18.0.0/15`）并在网络层做透明代理。  
默认策略会把这类解析结果视为 `reserved` 并阻断，从而导致大量 `unknown`。

如确有需要，可通过环境变量对 **保留网段** 做显式白名单：

- `HEALTH_SSRF_ALLOW_CIDRS=198.18.0.0/15`

注意：该白名单 **不会** 放开 `private/loopback/linkLocal/multicast` 等内网范围，也不会允许云元数据 IP。
