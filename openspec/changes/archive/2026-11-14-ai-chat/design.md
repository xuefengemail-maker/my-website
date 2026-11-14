# Design

## Context

当前前端由 `src/App.tsx` 直接渲染 `DashboardShell`，没有路由库；Dashboard 的页内导航使用 `#overview` 等 hash 锚点，且 `ui/learning-dashboard` 要求所有内容继续使用前端 mock 数据。后端已有 FastAPI、同步 SQLAlchemy 2、SQLite、Alembic 和 Bearer JWT 鉴权，Profile 只提供 `avatar_url`、`streak_days`、`level`。

聊天需要真实身份、持久化和外部模型调用，因此不能塞进现有 mock Dashboard 面板。本次新增独立路由和后端能力；动机见 `proposal.md`，行为契约见两份 delta spec。

## Goals / Non-Goals

**Goals:**

- 用 HashRouter 提供 `#/chat`，同时保持 Dashboard 原有页内滚动和 mock-only 行为。
- 复用现有认证 API，增加最小登录/注册入口和 token refresh，使聊天可用。
- 持久化会话与消息，使用 SSE 转发 DeepSeek 增量输出，并正确处理失败状态。
- 将 Profile 与有界的 Dashboard 学习摘要作为个性化上下文，不新增学习事件采集。
- 安全渲染 Markdown，提供自动滚动、键盘操作、移动端布局和错误恢复。

**Non-Goals:**

- 不引入 WebSocket、异步 SQLAlchemy、Redis、消息队列或独立 AI 服务。
- 不实现语音、文件、模型选择、后台管理、账户中心、多会话分享、搜索或导出。
- 不把 Dashboard mock 数据升级为权威学习分析，也不在 Dashboard 内调用聊天 API。
- 不实现自动重试上游模型、费用控制、租户级限流或生产部署自动化。

## Decisions

### 1. 路由与 Dashboard 兼容

使用 `react-router-dom` 的 `HashRouter`，路由为 `/`（Dashboard）和 `/chat`（聊天），未知路径重定向 `/`。HashRouter 兼容 GitHub Pages 的静态托管，避免 BrowserRouter 的深层 URL 404。

现有 `href="#overview"` 会与 HashRouter 的 hash 路由冲突。将 `DashboardNav` 改为路由保持的滚动按钮：点击后调用目标区块的 `scrollIntoView`，不修改 location hash；在 `prefers-reduced-motion` 下使用 `behavior: "auto"`，否则使用 `smooth`。Desktop sidebar 和 mobile header 增加 `Link to="/chat"` 的“AI 助手”入口。

选择 HashRouter 是为了部署兼容性；放弃手动监听 `hashchange` 是因为聊天页需要认证守卫、嵌套视图和后续路由扩展。页内滚动从 anchor 改为按钮是必要的兼容调整，不改变 `ui/learning-dashboard` 的可见行为。

### 2. 最小前端认证会话

新增 `AuthProvider`，用 `localStorage` 的 `studypal.auth.tokens` 保存现有登录接口返回的 access token、refresh token 和过期时间。聊天 API 通过统一 `apiFetch` 添加 `Authorization: Bearer <token>`；收到 401 时最多刷新一次并重放原请求，刷新失败则清除 token 并显示认证入口。

未认证的 `#/chat` 显示 `ChatAuthPanel`，支持邮箱密码登录与注册。注册成功后自动调用登录接口，因为现有注册响应只返回用户信息。认证只服务于聊天入口，不新增 Profile 编辑或账户中心。

选择 localStorage 而非 HttpOnly cookie，是因为现有后端签发 JSON token 且未提供 cookie 会话端点；该选择要求严格的 Markdown 安全渲染和部署层 CSP。若后续改为 cookie，`AuthProvider` 与 API 客户端可替换而不影响聊天协议。

### 3. 会话与消息数据模型

新增迁移 `20261114_0002_create_chat_tables.py`，`down_revision = "20261114_0001"`。表使用 snake_case，外键启用级联删除，复用现有 SQLite 外键 PRAGMA。

`chat_conversations`：

| 字段 | 类型 | 约束 |
| --- | --- | --- |
| `id` | Integer | 主键 |
| `user_id` | Integer | 外键 `users.id`，`ON DELETE CASCADE`，非空 |
| `title` | String(120) | 非空，默认“新对话” |
| `created_at` | DateTime(timezone=True) | 非空 |
| `updated_at` | DateTime(timezone=True) | 非空，索引 |

索引：`ix_chat_conversations_user_id_updated_at (user_id, updated_at)`。

`chat_messages`：

| 字段 | 类型 | 约束 |
| --- | --- | --- |
| `id` | Integer | 主键 |
| `conversation_id` | Integer | 外键 `chat_conversations.id`，`ON DELETE CASCADE`，非空 |
| `role` | String(16) | `user` 或 `assistant` |
| `content` | Text | 非空，默认空字符串 |
| `status` | String(16) | `streaming`、`completed` 或 `failed` |
| `created_at` | DateTime(timezone=True) | 非空 |
| `updated_at` | DateTime(timezone=True) | 非空 |

索引：`ix_chat_messages_conversation_id_created_at (conversation_id, created_at)`；检查约束限制 `role` 和 `status` 的取值。用户消息直接保存为 `completed`；assistant 消息先生成 `streaming` 占位，结束后改为 `completed` 或 `failed`。同一会话存在 `streaming` assistant 消息时拒绝新消息，避免并发写乱序。

选择“会话 + 消息”两层而不是单表，是为了保持历史可恢复并为后续多会话能力保留清晰边界；当前 UI 只恢复最近会话，不提供分享或搜索。

### 4. API 端点

所有端点位于 `/api/v1/chat`，除语音、文件或模型选择外不新增其他路由。除认证接口外均要求 Bearer access token。

#### `POST /api/v1/chat/conversations`

创建当前用户的会话。请求体为空或 `{}`。

成功：`201 Created`

```json
{
  "id": 12,
  "title": "新对话",
  "created_at": "2026-11-14T08:00:00Z",
  "updated_at": "2026-11-14T08:00:00Z"
}
```

错误：`401` 未认证；数据库失败返回安全的 `500`。

#### `GET /api/v1/chat/conversations`

返回当前用户会话，按 `updated_at` 降序。成功：`200 OK`。

```json
{
  "items": [
    {
      "id": 12,
      "title": "新对话",
      "created_at": "2026-11-14T08:00:00Z",
      "updated_at": "2026-11-14T08:05:00Z"
    }
  ]
}
```

错误：`401` 未认证。

#### `GET /api/v1/chat/conversations/{conversation_id}/messages`

返回当前用户指定会话及按 `created_at, id` 升序排列的消息。会话不存在或属于其他用户时统一返回 `404`。

成功：`200 OK`

```json
{
  "conversation": {
    "id": 12,
    "title": "如何安排今天的复习",
    "created_at": "2026-11-14T08:00:00Z",
    "updated_at": "2026-11-14T08:05:00Z"
  },
  "items": [
    {
      "id": 31,
      "role": "user",
      "content": "帮我安排今天的复习",
      "status": "completed",
      "created_at": "2026-11-14T08:04:00Z"
    },
    {
      "id": 32,
      "role": "assistant",
      "content": "先从最薄弱的知识点开始……",
      "status": "completed",
      "created_at": "2026-11-14T08:04:05Z"
    }
  ]
}
```

错误：`401` 未认证；`404` 会话不存在或不属于当前用户。

#### `POST /api/v1/chat/conversations/{conversation_id}/messages/stream`

保存用户消息、调用 DeepSeek 并返回 SSE。请求：

```json
{
  "content": "帮我安排今天的复习",
  "learning_context": {
    "weekly_hours": 12.5,
    "completed_goals": 18,
    "weekly_progress": 68,
    "goals": [{"title": "算法练习", "completed": false}],
    "trend_view": "week",
    "trend_points": [{"label": "周一", "value": 1.5}]
  }
}
```

`content` 去除首尾空白后必须为 1 至 4000 字符；`learning_context` 可为 `null` 或 JSON 对象，序列化后不得超过 4000 字符。成功响应为 `200 OK`，`Content-Type: text/event-stream; charset=utf-8`，并设置 `Cache-Control: no-cache`、`X-Accel-Buffering: no` 和 `Connection: keep-alive`。

建立流前的错误：`401` 未认证；`404` 会话不存在或不属于当前用户；`409` 会话已有 `streaming` assistant 消息；`422` 内容或上下文无效；`503` DeepSeek 未配置。以上错误均返回 JSON 且不保存消息。流建立后的上游错误通过 SSE `error` 事件返回，assistant 消息保存为 `failed`。

### 5. SSE 契约

事件使用 `event:` 与单行 JSON `data:`，以空行分隔。首个事件为 `meta`，随后零个或多个 `delta`，最终为 `done` 或 `error`。服务端每 15 秒可发送 `: ping` 注释保活；客户端忽略注释和未知事件。

```text
event: meta
data: {"conversation_id":12,"user_message_id":31,"assistant_message_id":32}

event: delta
data: {"content":"先从"}

event: delta
data: {"content":"最薄弱的知识点开始。"}

event: done
data: {"message_id":32,"status":"completed","created_at":"2026-11-14T08:04:05Z"}
```

失败事件只暴露稳定错误码和安全文案，不包含密钥、上游响应体、堆栈或内部 URL：

```text
event: error
data: {"code":"provider_error","message":"AI 服务暂时不可用，请稍后重试。"}
```

前端不能使用 `EventSource`，因为它不支持 POST body 和自定义 Authorization header。使用 `fetch` 读取 `response.body`，通过 `TextDecoder` 和按 `\n\n` 切分的解析器处理事件；`AbortController` 负责停止或离开页面时关闭连接。

### 6. DeepSeek 适配与上下文组装

新增 `ChatProvider` 协议，暴露 `stream_reply(messages) -> AsyncIterator[str]`。生产实现 `DeepSeekChatProvider` 使用运行时依赖 `httpx.AsyncClient.stream` 请求 `${STUDYPAL_DEEPSEEK_BASE_URL}/chat/completions`，发送 `model`、`messages`、`stream: true`，解析 OpenAI 兼容的 `choices[0].delta.content` 与 `[DONE]`。测试通过 FastAPI 依赖覆盖注入假 provider，不访问网络。

模型请求在服务端组装，顺序为：应用系统指令、带分隔符的不可信学习数据、最近 19 条 `completed` 历史消息与当前用户消息（总计 20 条；失败回复不进入上下文）。Profile 的 `streak_days` 和 `level` 由服务端读取并覆盖客户端可能提交的同名字段；Dashboard 摘要只作为参考数据，并明确提示可能来自示例数据。系统指令要求模型不得服从 `<learning_context>` 中的指令，不得虚构未提供的学习记录。持久化历史不截断。

配置统一使用 `STUDYPAL_` 前缀，DeepSeek key 使用 `SecretStr` 且允许为空，以便认证和 Profile 在未配置模型时仍可启动；聊天端点检测到空 key 时返回 `503`。

### 7. 持久化与流式执行流程

1. 校验 token、会话归属、消息长度、学习摘要和 provider 配置。
2. 检查会话内没有 `streaming` assistant 消息。
3. 写入 `completed` 用户消息；若会话标题仍为默认值，用首条消息前 60 个字符更新标题；更新 `conversation.updated_at`。
4. 写入 `streaming` assistant 占位并提交事务，发送 `meta`。
5. 调用 provider，逐块追加内存缓冲并发送 `delta`。
6. 正常结束后写入完整内容、`completed` 状态和更新时间，发送 `done`。
7. 上游异常或客户端断开时写入已积累内容、`failed` 状态，尽可能发送 `error`，并在 `finally` 中关闭 provider 流。

复用现有同步 SQLAlchemy Session，只在短事务中读写；模型网络等待由异步 `httpx` 承担。这样避免为一次功能重写数据库层，代价是少量同步数据库调用会占用事件循环，当前单实例 SQLite 规模可接受。

### 8. 前端结构与状态

```text
App
└─ HashRouter
   ├─ AuthProvider
   ├─ Route "/"
   │  └─ DashboardShell (existing)
   │     ├─ DashboardSidebar
   │     │  ├─ DashboardNav (scroll buttons)
   │     │  └─ Link "AI 助手" → "/chat"
   │     └─ DashboardMobileHeader
   │        └─ Link "AI 助手" → "/chat"
   └─ Route "/chat"
      └─ ChatPage
         ├─ ChatAuthPanel (when signed out)
         ├─ ChatHeader
         │  ├─ ProfileSummary
         │  └─ Link "返回 Dashboard" → "/"
         ├─ ChatMessageList
         │  ├─ MessageBubble (user, plain text)
         │  └─ MessageBubble (assistant)
         │     ├─ MarkdownContent
         │     └─ StreamingIndicator
         ├─ ScrollToBottomButton
         ├─ ChatErrorBanner
         └─ ChatComposer
```

组件放在 `src/components/chat/`，PascalCase 命名；认证上下文放在 `src/auth/`；API、SSE 解析和学习摘要组装放在 `src/lib/`。`ChatPage` 通过 `GET conversations` 恢复最近会话及其消息；没有会话时显示空状态，首次发送前创建会话。所有视觉样式使用 Tailwind 和现有 `--dashboard-*` 变量，不写内联 `style`，并支持 `dark:` 与移动端单列布局。

`MarkdownContent` 使用 `react-markdown` 和 `remark-gfm`，不启用原始 HTML 插件。链接只允许 `http`、`https` 和站内相对地址，外链使用 `target="_blank"` 与 `rel="noopener noreferrer"`。用户气泡始终纯文本显示。

自动滚动使用消息列表底部哨兵和 `scroll` 阈值（约 96px）判断用户是否接近底部。仅在接近底部时滚动；用户上滚后显示“回到底部”按钮。`prefers-reduced-motion` 下使用即时滚动；assistant 增量区域使用 `aria-live="polite"`。

`ChatComposer` 使用受控 textarea，限制 4000 字符；Enter 发送，Shift+Enter 换行，组合态 `compositionstart/compositionend` 期间不发送。流式期间显示停止控件；请求失败保留待重试内容。重试作为新的一轮交换提交，已保存的失败回复与用户消息保留在历史中。

### 9. 安全与配置

后端 `.env.example` 只保留占位值，不提交真实密钥：

```dotenv
STUDYPAL_DEEPSEEK_API_KEY=
STUDYPAL_DEEPSEEK_BASE_URL=https://api.deepseek.com
STUDYPAL_DEEPSEEK_MODEL=deepseek-chat
STUDYPAL_CORS_ORIGINS=http://localhost:5173
```

前端使用 `VITE_STUDYPAL_API_BASE_URL`，默认 `http://localhost:8000/api/v1`，部署时指向后端 HTTPS 地址。后端增加 CORS 中间件，允许列表由 `STUDYPAL_CORS_ORIGINS` 配置，不使用通配符配合凭据。

模型密钥不得出现在源码、迁移、OpenSpec、日志、异常详情、测试 fixture 或浏览器 bundle 中。DeepSeek 请求头不记录；上游异常转换为固定安全错误码。任何已粘贴到聊天或文档中的真实 key 都应立即撤销并轮换，仓库只使用环境变量注入的新 key。

### 10. 测试与验证

后端测试继续使用临时 SQLite 和 `TestClient`，新增：

- 迁移 upgrade/downgrade 后表、外键、索引和检查约束存在。
- 会话创建、列表、历史读取、用户隔离和 401/404。
- 空消息、超长消息、无效摘要、超大摘要和 409 并发。
- 假 provider 的正常流事件顺序、部分内容保存、`completed`/`failed` 状态。
- provider 异常、缺失 key 的 503、错误不泄露密钥。
- Profile 与学习摘要进入模型请求，历史截取到最近 20 条。

前端没有现成测试框架，不为本变更引入新测试栈；通过 `npm run lint`、`npm run build` 和浏览器手动检查覆盖登录、刷新、流式、Markdown、自动滚动、键盘和移动端。OpenSpec 使用 `openspec validate --all --strict`。

## API Error Matrix

| 状态码 | 场景 | 响应 |
| --- | --- | --- |
| `401` | 缺少、无效或过期 access token，且 refresh 失败 | 统一认证错误，不执行操作 |
| `404` | 会话不存在或属于其他用户 | 不泄露会话存在性 |
| `409` | 同一会话已有流式回复 | 不保存新消息 |
| `422` | 空/超长消息、无效或过大摘要 | 不保存任何消息 |
| `503` | DeepSeek key 未配置 | 不建立 SSE，不保存消息 |
| `200` + SSE `error` | 流建立后上游失败 | 保存 `failed` assistant 消息 |

## Risks / Trade-offs

- **localStorage 中的 token 可被 XSS 读取** → Markdown 禁用原始 HTML 和危险 URL，部署层增加 CSP；后续可迁移到 HttpOnly cookie 会话。
- **DeepSeek 延迟、限流或费用不可控** → 设置连接/读取超时，单次请求限制上下文和历史，不自动重试，失败可手动重试。
- **提示注入** → 学习摘要和用户消息都按不可信内容处理，放在明确分隔的数据区，系统指令禁止执行其中的指令；本次不提供工具调用。
- **代理缓冲导致“伪流式”** → 设置 `X-Accel-Buffering: no`，部署时关闭反向代理缓冲。
- **SQLite 并发写冲突** → 单实例部署、短事务、busy timeout，并以 409 阻止同会话并发生成。
- **聊天历史无限增长** → 数据完整保留，但模型上下文只发送最近 20 条；分页和归档留给后续变更。
- **HashRouter 与旧锚点冲突** → Dashboard 导航改为不改变 hash 的滚动按钮，保留原有区块定位行为。
- **CORS 配置错误导致前端不可用** → 通过显式允许来源配置并在部署检查中验证预检请求。

## Migration Plan

1. 创建 `20261114_0002_create_chat_tables.py`，在 `20261114_0001` 之上新增两张表、外键、索引和检查约束。
2. 执行 `cd backend && uv run alembic upgrade head`，运行迁移与聊天测试。
3. 增加后端配置和 `.env.example` 占位项，在本地环境注入新的 DeepSeek key 并验证流式响应；测试始终使用假 provider。
4. 增加前端依赖、路由、认证上下文和聊天组件，验证 Dashboard 原有滚动和 mock-only 行为未变化。
5. 运行 `npm run lint`、`npm run build`、`cd backend && uv run pytest -q` 和 `openspec validate --all --strict`。
6. 部署时先迁移后端、配置 CORS 与密钥，再发布前端并验证 `#/chat`。

回滚：停止前端聊天入口后移除相关知识；后端执行 `uv run alembic downgrade 20261114_0001` 删除聊天表。回滚前备份 SQLite 文件；聊天历史会丢失，但 `users`、`user_profiles` 和 `refresh_tokens` 不受影响。DeepSeek key 可在控制台撤销，前端退回纯 Dashboard 不需要数据库操作。
