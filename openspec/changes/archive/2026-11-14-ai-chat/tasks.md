# Tasks

执行时按 `AGENTS.md` 在每个 Phase 结束后停止，等待 review 后再进入下一阶段。

## 1. 后端数据与配置基础

- [x] 1.1 新增 `ChatConversation`、`ChatMessage` 模型并创建 `20261114_0002_create_chat_tables.py`，验证 `uv run alembic upgrade head` 在空库成功且表、索引、外键存在。
- [x] 1.2 增加聊天配置字段 `deepseek_api_key`、`deepseek_base_url`、`deepseek_model` 和 `cors_origins`，验证未配置 key 时认证与 Profile 仍可启动且密钥不会出现在 settings repr。
- [x] 1.3 更新 `backend/tests/test_migrations.py` 覆盖升级、降级、级联删除和检查约束，验证 `uv run pytest -q backend/tests/test_migrations.py` 通过。
- [x] 1.4 更新 `backend/.env.example`、前端环境示例和 README 配置说明，验证仓库扫描不到真实 `sk-` 密钥且占位项可直接照抄。
- [x] 1.5 增加 CORS 中间件并读取 `STUDYPAL_CORS_ORIGINS`，验证允许来源预检成功、未配置来源不返回放行头。
- [x] 1.6 运行 Phase 验证：`cd backend && UV_CACHE_DIR=/private/tmp/uv-cache uv run pytest -q`、`uv run alembic upgrade head`、`uv run alembic downgrade 20261114_0001`。

## 2. 聊天服务与流式 API

- [x] 2.1 新增聊天请求/响应 schema，校验 1 至 4000 字符消息、JSON 对象摘要和 4000 字符摘要上限，验证对应 pytest 用例返回 422 且不写库。
- [x] 2.2 实现会话创建、列表和消息历史服务，所有查询强制当前 `user_id`，验证跨用户访问统一返回 404。
- [x] 2.3 增加运行时 `httpx` 依赖，定义 `ChatProvider` 协议并实现 `DeepSeekChatProvider`，验证异步流解析可用、假 provider 可替换且测试不访问网络。
- [x] 2.4 实现 `/api/v1/chat/conversations` 与消息历史路由，验证 201、分页顺序无关的升序历史、401 和 404 场景。
- [x] 2.5 实现 `POST /messages/stream` 的 SSE、用户消息先写库、assistant `streaming/completed/failed` 状态和 409 并发保护，验证事件顺序为 `meta`→`delta`→`done` 或 `error`。
- [x] 2.6 实现 Profile 与学习摘要组装、最近 19 条已完成历史加当前消息（总计 20 条）和不可信数据分隔，验证假 provider 收到的消息顺序与上下文边界。
- [x] 2.7 新增 `backend/tests/test_chat.py` 覆盖用户隔离、无效输入、缺失 key 503、上游异常、密钥不泄露和失败内容持久化，验证 `uv run pytest -q` 全部通过。
- [x] 2.8 在 OpenAPI 描述和 README 中记录聊天端点、SSE 事件和错误码，验证 `/openapi.json` 包含四个聊天端点。
- [x] 2.9 运行 Phase 验证：`cd backend && UV_CACHE_DIR=/private/tmp/uv-cache uv run pytest -q` 和 `uv run python -m compileall -q app tests`。

## 3. 前端路由与认证入口

- [x] 3.1 安装 `react-router-dom` 并验证 `npm run build` 可解析新增依赖。
- [x] 3.2 在 `src/App.tsx` 配置 `HashRouter`、`/` 与 `/chat` 路由和未知路径重定向，验证直接访问 `#/chat` 不进入 Dashboard 空白页。
- [x] 3.3 将 `DashboardNav` 的 hash 锚点改为保持路由的滚动按钮，并在 Desktop sidebar 与 mobile header 增加“AI 助手”入口，验证四个区块仍可定位且 Dashboard 不发起业务请求。
- [x] 3.4 新增 `AuthProvider`、token 存储、`apiFetch` 和 401 单次 refresh，验证登录、刷新成功、刷新失败清理会话三条路径。
- [x] 3.5 新增 `ChatAuthPanel` 登录/注册表单并在注册后自动登录，验证空输入、错误凭据和成功后进入聊天。
- [x] 3.6 运行 Phase 验证：`npm run lint`、`npm run build`，并通过 preview 静态冒烟检查 `#/`、`#/chat` 构建产物；Safari 远程自动化未启用，未执行截图级检查。

## 4. 聊天界面与流式渲染

- [x] 4.1 新增 `parseSseStream`，支持 `meta`、`delta`、`done`、`error`、注释和未知事件，验证分块边界与中断场景不丢事件。
- [x] 4.2 新增 `ChatPage` 与最近会话恢复，验证有历史、空历史、加载失败重试和 401 回到认证入口。
- [x] 4.3 新增 `ChatMessageList`、`MessageBubble` 和 `ChatComposer`，验证用户右/助手左、Enter 发送、Shift+Enter 换行和中文组合态不误发。
- [x] 4.4 新增 `MarkdownContent`，启用 GFM 表格/列表/代码块并禁用原始 HTML，验证脚本、`javascript:` 链接和异常 Markdown 安全降级。
- [x] 4.5 实现流式增量、停止控件、`aria-live`、96px 自动滚动阈值、回到底部按钮和 `prefers-reduced-motion`，验证用户上滚后不被强制拉回。
- [x] 4.6 完成移动端、暗色模式和触控目标适配，验证窄屏单列无水平溢出、键盘焦点清晰、发送/停止按钮可触达。
- [x] 4.7 补充聊天页面文案与学习摘要组装模块，验证摘要只读取 Dashboard mock 和 Profile，不新增真实学习事件请求。
- [x] 4.8 运行 Phase 验证：`npm run lint`、`npm run build`，并用假 provider HTTP 冒烟检查流式成功、上游失败测试、重试路径与 Markdown 构建；截图级手工检查因 Safari 远程自动化未启用而跳过。

## 5. 集成与质量门禁

- [x] 5.1 验证部署来源配置：预检请求只允许 `STUDYPAL_CORS_ORIGINS` 中的来源，前端开发地址可调用聊天 API，GitHub Pages 来源可按配置加入。
- [x] 5.2 使用假 provider 完成前后端联调，验证登录、恢复历史、发送消息、SSE 增量、失败状态和刷新 token 全链路。
- [x] 5.3 检查安全边界：扫描仓库无真实密钥、日志无 Authorization/DeepSeek 请求头、错误响应无上游原始信息，并记录 key 轮换说明。
- [x] 5.4 运行完整验证：`npm run lint`、`npm run build`、`cd backend && UV_CACHE_DIR=/private/tmp/uv-cache uv run pytest -q`、`openspec validate --all --strict`。
- [x] 5.5 汇总实现与 design.md 的一致性检查，确认 API 路径、表名、事件名、组件命名和 out-of-scope 边界均一致。

## Workflow follow-up

- 实现完成并通过 review 后，运行 `openspec verify` 和 `openspec archive ai-chat`。
- 归档后确认主 specs 新增 `ai/chat-conversation` 与 `ui/ai-chat`，并检查归档目录中的 proposal、design、tasks 和 delta specs。
