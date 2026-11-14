# Proposal

## Why

StudyPal 目前仍以 mock 数据展示学习统计，聊天上下文也只能引用示例摘要，用户无法看到真实学习记录、学习日历和成就进度。需要把学习行为持久化到数据库，由 FastAPI 聚合真实数据，并完成前后端可回滚的部署上线。

## What Changes

- 新增学习记录、学习目标和成就解锁数据模型与迁移；统计、周/月趋势、日历、连续学习天数、等级和成就进度由后端聚合，不再依赖前端 mock。
- 新增学习分析、学习记录和学习目标 API；所有读写按当前 JWT 用户隔离。
- 将根路由改造成需要认证的“学习数据”工作区，左侧导航顺序固定为“学习数据、AI 对话建议、学习目标”。
- 新增学习日历、成就墙和学习目标页面，并提供最小“记录学习”入口，使统计拥有真实数据来源。
- 保留现有聊天气泡、SSE、Markdown 和认证行为，将聊天入口迁移到共享左侧导航的“AI 对话建议”。
- 更新统计卡片、趋势图和目标面板，改为展示后端聚合结果和加载、错误、空状态。
- 完成部署契约：GitHub Pages 前端、单实例 FastAPI + SQLite 持久卷后端、健康检查、环境变量、CORS、迁移和回滚。
- **BREAKING**：首页不再是无认证的 mock Dashboard；未认证访问显示登录/注册入口，`ui/learning-dashboard` 的“纯前端 Mock 数据”要求被移除。

## Capabilities

### New Capabilities

- `analytics/learning-analytics`: 学习记录、学习目标与成就解锁的持久化，以及统计、趋势、日历、成就和等级聚合 API。
- `deployment/studypal-deploy`: GitHub Pages 前端与单实例容器后端的部署、健康检查、环境配置、迁移和回滚契约。

### Modified Capabilities

- `ui/learning-dashboard`: 从 mock 单页 Dashboard 改为认证后的学习数据工作区，新增固定顺序左侧导航、学习日历、成就墙和学习目标页面。
- `ui/ai-chat`: 聊天页面接入共享工作区壳与左侧导航，保留现有聊天、流式、Markdown 和认证行为。

## Impact

- 前端：`src/App.tsx` 路由、共享工作区壳、Dashboard 组件、新增目标/成就/日历视图、API 客户端和部署配置。
- 后端：新增 `study_sessions`、`learning_goals`、`user_achievements` 模型、`20261114_0003` 迁移、分析/目标路由与服务、健康检查、测试。
- 数据：新表按 `users.id` 级联删除；`user_profiles.streak_days` 和 `level` 由分析服务根据真实学习记录更新，客户端仍不可直接修改。
- 配置：新增 `STUDYPAL_TIMEZONE`，继续使用 `STUDYPAL_JWT_SECRET`、`STUDYPAL_CORS_ORIGINS` 和前端 `VITE_STUDYPAL_API_BASE_URL`。
- 依赖：后端不新增分析库，使用 SQLAlchemy 聚合和标准库 `zoneinfo`；部署使用 Docker 与 GitHub Pages 工作流。

## Out of Scope

- 实时通知、浏览器推送、邮件或短信提醒。
- 数据导出（CSV、JSON、PDF）和公开分享链接。
- 多用户时区、跨设备同步冲突、第三方分析平台和社交排行。
- 后台管理、成就手动发放、目标模板市场和课程/笔记系统。
- Postgres 迁移、多实例横向扩展、高可用集群和原生移动端应用。

## Rollback

- 前端回退到上一个 GitHub Pages 构建产物；新路由和导航可随版本一起回退。
- 后端回退到上一个容器镜像，并在备份 SQLite 后执行 `alembic downgrade 20261114_0002` 删除三张新表。
- 回滚只影响学习分析数据，不删除 `users`、`user_profiles`、`refresh_tokens` 和已有聊天表。
