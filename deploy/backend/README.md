# Backend Deploy（VPS Docker）

本目录提供最小可用的生产部署模板：

- `docker-compose.yml`：Postgres + Backend
- `.env.example`：环境变量模板

## 使用

1. 构建镜像（仓库根目录执行）：

```bash
docker build -f apps/backend/Dockerfile -t api-navigator-backend:local .
```

2. 准备环境变量（本目录执行）：

```bash
cp .env.example .env
```

3. 启动：

```bash
docker compose up -d
```

## 定时任务（Sync / Health）

`docker-compose.yml` 已包含 `scheduler` 服务（默认启用）。它会定期触发：

- `/api/admin/health`：每 `10` 分钟一次
- `/api/admin/sync`：每 `24` 小时一次（默认不在启动时执行）

可在 `.env` 中配置 `JOB_TOKEN`，以及通过环境变量覆盖调度频率（见 `apps/backend/scripts/scheduler.mjs`）。
