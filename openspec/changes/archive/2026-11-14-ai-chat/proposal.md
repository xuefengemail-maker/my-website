# Proposal

## Why

当前 Dashboard 的学习建议是静态 mock 内容，用户无法围绕自己的目标、进度和薄弱环节继续追问。新增独立的 AI 学习助手页面，可以在不破坏 Dashboard mock-only 约束的前提下，提供可持久化、流式响应且基于当前学习摘要的个性化对话。

## What Changes

- 新增 `#/chat` 页面和 Dashboard 入口，使用 HashRouter 兼容 GitHub Pages；Dashboard 原有四个页内区块保持不调用后端。
- 新增最小登录/注册入口、Bearer token 存储和 refresh 流程，仅用于让已认证用户进入聊天页面；不实现账户中心或 Profile 编辑界面。
- 新增消息气泡式 ChatUI、Markdown 渲染、流式增量展示、自动滚动、错误提示和重试。
- 新增后端会话与消息持久化：会话归属当前认证用户，用户消息在请求上游模型前保存，助手消息在流结束后按成功或失败状态保存。
- 新增 DeepSeek 流式对话接口，通过 SSE 向浏览器转发 `meta`、`delta`、`done`、`error` 事件。
- 个性化上下文由服务端读取 Profile 的连续学习天数与等级，并合并前端提交的、有长度上限的 Dashboard 学习摘要；本次不新增学习事件采集或分析计算。
- 新增数据库迁移、聊天 API、环境配置、测试和部署说明。

## Capabilities

### New Capabilities

- `ai/chat-conversation`: 认证用户的会话与消息持久化、DeepSeek 流式回复、学习上下文组装和上游失败处理。
- `ui/ai-chat`: 聊天路由、最小认证入口、气泡式对话界面、Markdown、自动滚动和移动端交互。

### Modified Capabilities

无。Dashboard 继续遵循 `ui/learning-dashboard` 的 mock-only 约束，聊天能力在独立页面提供。

## Impact

- 前端：`src/App.tsx` 增加 hash 路由；Dashboard 导航增加聊天入口并保留现有滚动行为；新增聊天页面、认证上下文、API 客户端和流式解析。
- 后端：新增聊天模型、迁移、路由、服务和 DeepSeek 流式适配器；复用现有 JWT 鉴权、SQLAlchemy 会话和 `/api/v1` 路由结构。
- 数据：新增 `chat_conversations` 和 `chat_messages` 表，外键关联 `users` 并级联删除。
- 依赖：前端新增 `react-router-dom`、`react-markdown`、`remark-gfm`；后端新增运行时 `httpx`。不引入 WebSocket、状态管理库或 Markdown 原文 HTML 渲染。
- 配置：新增 `STUDYPAL_DEEPSEEK_API_KEY`、`STUDYPAL_DEEPSEEK_BASE_URL`、`STUDYPAL_DEEPSEEK_MODEL` 和允许的前端来源配置。
- 安全：模型密钥只从环境变量读取，不写入仓库、日志、错误响应或测试；用户提交的学习摘要按不可信数据处理。

## Out of Scope

- 语音输入、文件上传和模型切换。
- 后台管理、账户中心、头像上传、登出接口、找回密码和第三方 OAuth。
- 多会话分享、搜索、导出、消息编辑/删除和跨设备同步冲突处理。
- 新增真实学习事件采集、统计计算或趋势聚合；Dashboard 数据仍是前端 mock，提交给助手的摘要不代表权威分析结果。
- 生产部署、TLS、域名、反向代理限流和费用控制面板。

## Rollback

前端可移除 `#/chat` 路由、入口和相关组件，使根路由恢复为原 Dashboard；不修改 Dashboard 数据源。后端可移除聊天路由与服务并执行 `alembic downgrade 20261114_0001` 删除两张聊天表。上线前应备份 SQLite 文件；回滚会删除聊天历史，但不会影响用户、Profile 或 refresh token。
