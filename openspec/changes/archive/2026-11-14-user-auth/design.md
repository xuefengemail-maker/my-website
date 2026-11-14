# Design

## Context

当前仓库是纯前端 React 19 + Vite 项目，`npm run build` 只处理 `src/` 与 `index.html`，没有任何 Python 服务、数据库或迁移目录。本次变更在仓库内新增独立的 `backend/` 应用，通过 HTTP 暴露认证和 Profile API；前端构建不得导入后端代码，也不得因后端依赖变化而失败。

认证与 Profile 的行为边界见 `proposal.md` 及两份 delta spec：`auth/user-auth` 和 `users/user-profile`。本设计只解决实现方式，不重复需求动机。

## Goals / Non-Goals

**Goals:**

- 在 `backend/` 提供可独立启动、测试和部署的 FastAPI 服务。
- 使用 SQLite 3 持久化用户、Profile 和 refresh token 记录。
- 使用 Alembic 管理可重复执行、可回滚的数据库迁移。
- 用 Argon2id 保存密码，用 HS256 JWT 区分 access/refresh token。
- 通过 Bearer access token 建立统一的当前用户边界。
- 为认证和 Profile 提供稳定的 JSON 契约、错误状态码和 OpenAPI 文档。

**Non-Goals:**

- 不实现前端登录页、token 存储、API 客户端或浏览器 CORS 配置；这些由后续前端接入变更处理。
- 不实现 refresh token rotation、登出、服务端会话撤销接口或“记住我”策略。
- 不实现后台管理、邮箱验证、第三方 OAuth、找回密码、账号注销。
- 不引入异步 SQLAlchemy、PostgreSQL、Redis 或独立鉴权服务。

## Decisions

### 1. 独立 FastAPI 后端与目录边界

后端放在 `backend/`，使用 `pyproject.toml` 和 `uv` 管理 Python 3.11+ 虚拟环境与依赖。服务从 `backend/` 目录启动，前端仍使用原有 npm 工作流。Python 代码使用 `snake_case` 模块名，API 路径使用 kebab-case 不适用，资源路径使用小写单数域名词。

```text
backend/
├── pyproject.toml
├── uv.lock
├── .env.example
├── alembic.ini
├── alembic/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│       └── <revision>_create_auth_tables.py
├── app/
│   ├── main.py
│   ├── api/
│   │   ├── deps.py
│   │   └── routes/
│   │       ├── auth.py
│   │       ├── profile.py
│   │       └── router.py
│   ├── core/
│   │   ├── config.py
│   │   └── security.py
│   ├── db/
│   │   ├── base.py
│   │   └── session.py
│   ├── models/
│   │   ├── user.py
│   │   ├── refresh_token.py
│   │   └── user_profile.py
│   ├── schemas/
│   │   ├── auth.py
│   │   └── profile.py
│   └── services/
│       ├── auth_service.py
│       └── profile_service.py
└── tests/
    ├── conftest.py
    ├── test_auth.py
    ├── test_profile.py
    └── test_migrations.py
```

**Alternatives considered:** 将 FastAPI 代码混入前端 `src/` 或让 Vite 代理直接承担运行时。未采用，因为两类构建产物、依赖和部署目标不同，混放会让前端构建和 Python 环境互相污染。

### 2. 同步 SQLAlchemy 与 SQLite 运行参数

使用 SQLAlchemy 2.0 同步 `Session`，FastAPI 的同步路由在线程池执行，避免为初版 SQLite 引入 `aiosqlite` 和异步事务复杂度。SQLite 连接设置 `check_same_thread=False`，并在每个连接建立时执行：

```sql
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA busy_timeout = 5000;
```

事务保持短小：注册时在同一事务创建 `users` 与 `user_profiles`；登录时在同一事务创建 refresh token 记录；Profile 更新只提交单表单行。生产环境不使用 `Base.metadata.create_all()`，表结构只通过 Alembic 演进。

**Alternatives considered:** 使用异步 SQLAlchemy + `aiosqlite`。未采用，因为当前是单实例 SQLite，异步不会解除写锁瓶颈，反而扩大测试与事务管理成本。

### 3. 三张表与一对一 Profile

数据模型拆为 `users`、`user_profiles` 和 `refresh_tokens`。Profile 独立成表，避免用户凭据表持续膨胀，也为后续学习统计字段扩展保留边界。

| 表 | 字段 | 约束 |
| --- | --- | --- |
| `users` | `id`, `email`, `password_hash`, `created_at`, `updated_at` | `id` 主键；`email` 唯一且非空；`password_hash` 非空 |
| `user_profiles` | `user_id`, `avatar_url`, `streak_days`, `level`, `created_at`, `updated_at` | `user_id` 主键并外键引用 `users.id`；`streak_days >= 0`；`level >= 1` |
| `refresh_tokens` | `id`, `user_id`, `jti`, `expires_at`, `created_at` | `id` 主键；`jti` 唯一；`user_id` 外键引用 `users.id` |

`users.email` 保存去除首尾空白并转为小写的规范化值，长度上限 320。`user_profiles.avatar_url` 可空，最长 2048。所有时间字段以 UTC 写入，`created_at` 和 `updated_at` 由应用层生成。外键使用 `ON DELETE CASCADE`，并由 SQLite PRAGMA 确保生效。`refresh_tokens` 为 `user_id` 和 `expires_at` 建立普通索引。

**Alternatives considered:** 将头像、连续学习天数和等级直接放进 `users`。未采用，因为认证凭据与学习资料职责不同，后续真实学习统计会持续扩展 Profile 表。

### 4. 注册、邮箱唯一性与密码哈希

注册请求使用 `EmailStr` 和密码长度 8–128 校验。入库前执行 `email.strip().lower()`；唯一约束是最终一致性边界，捕获 `IntegrityError` 后返回 409，避免并发注册产生重复账户。

密码使用 `pwdlib[argon2]` 的 Argon2id 哈希，数据库只保存 `password_hash`。登录时若邮箱不存在，仍执行一次固定 dummy hash 校验，再返回与密码错误相同的 401，降低基于响应和耗时的账户枚举。注册成功只创建账户与默认 Profile，不签发 token；客户端随后调用登录接口。

**Alternatives considered:** 使用 bcrypt/passlib。未采用，因为维护状态和 bcrypt 的 72 字节输入限制不值得引入；Argon2id 是当前密码哈希的默认选择。

### 5. JWT 契约与 refresh token 校验

JWT 使用 `PyJWT` 与 HS256。access token 有效期 30 分钟，refresh token 有效期 7 天，均可通过环境变量覆盖。token claims 固定为：

```json
{
  "sub": "42",
  "token_type": "access",
  "iat": 1763100000,
  "exp": 1763101800
}
```

refresh token 额外包含 `jti`，并在 `refresh_tokens` 表中保存 `jti`、`user_id` 和 `expires_at`。刷新时同时校验 JWT 签名、`exp`、`token_type == "refresh"`、数据库记录存在、用户匹配且记录未过期；任何一项失败均返回 401。access token 无数据库记录，仍为无状态校验。

本变更不做 refresh token rotation：刷新只返回新的 access token，原 refresh token 在有效期内继续可用。这样可以严格遵守当前 spec，并避免引入 token family、重放检测和并发刷新等额外状态。refresh token 仍以 7 天 TTL 和数据库记录限制风险，后续如需登出或轮换再单独变更。

**Alternatives considered:** RS256 + 公私钥。未采用，因为当前只有一个后端签发和验证 token，对称密钥的部署与轮换更简单。**Alternatives considered:** 纯 opaque refresh token。未采用，因为需求和 proposal 已明确使用 JWT refresh token。

### 6. Profile 身份边界与只读学习字段

Profile 路由不接收用户 ID 路径参数，当前用户只来自 `get_current_user` 解析出的 access token `sub`。读取时按该 ID 查询 `user_profiles`；注册事务保证每个用户都有 Profile，若数据完整性被破坏则返回服务端错误，不向客户端推断任意用户。

更新头像只接受 `avatar_url`，Pydantic 模型设置 `extra="forbid"`。URL 去除首尾空白后必须为 `http` 或 `https`、包含主机名且不超过 2048 字符；失败返回 422 且不提交修改。`streak_days` 和 `level` 仅用于响应，不作为更新输入；请求携带这些字段会因额外字段校验被拒绝。

**Alternatives considered:** 允许客户端通过更新接口写入等级和连续学习天数。未采用，因为这些字段应由未来学习行为决定，开放写入会破坏数据可信度。

### 7. 统一路由、依赖和错误约定

应用实例在 `app/main.py` 创建，API 统一挂在 `/api/v1`。认证路由无前置认证；Profile 路由统一依赖 `get_current_user`。缺失、无效、过期或类型错误的 token 返回 401，并设置 `WWW-Authenticate: Bearer`。登录失败统一返回 `Invalid email or password`；重复邮箱返回 409；请求体校验使用 FastAPI 默认 422 结构。响应不包裹额外 envelope，便于后续 TypeScript 客户端直接消费。

**组件层级：**

```text
FastAPI app (app.main:app)
├── /api/v1 router
│   ├── auth router
│   │   ├── POST /auth/register  -> AuthService.register
│   │   ├── POST /auth/login     -> AuthService.login
│   │   └── POST /auth/refresh   -> AuthService.refresh_access
│   └── users router
│       ├── GET /users/me/profile   -> ProfileService.get_current
│       └── PATCH /users/me/profile -> ProfileService.update_avatar
├── dependencies
│   ├── get_db()             -> SQLAlchemy Session
│   └── get_current_user()   -> decode access token -> load users row
├── core/security
│   ├── hash_password / verify_password
│   └── create_access_token / create_refresh_token / decode_token
└── persistence
    ├── SQLAlchemy models
    └── SQLite database (Alembic-managed)
```

请求链路：

```text
HTTP request
  -> FastAPI route
    -> Pydantic request/response schema
      -> service
        -> SQLAlchemy Session
          -> SQLite
```

## API Endpoints

基础路径为 `/api/v1`，请求与响应均为 `application/json`。受保护端点使用：

```http
Authorization: Bearer <access_token>
```

### POST /api/v1/auth/register

创建账户与默认 Profile，不签发 token。

```json
{
  "email": "learner@example.com",
  "password": "correct-horse-battery"
}
```

成功：`201 Created`

```json
{
  "id": 1,
  "email": "learner@example.com"
}
```

错误：邮箱已存在为 `409`；邮箱格式、密码长度或额外字段不合法为 `422`。

### POST /api/v1/auth/login

校验邮箱和密码并签发 token。`expires_in` 表示 access token 剩余秒数，`refresh_expires_in` 表示 refresh token 剩余秒数。

```json
{
  "email": "learner@example.com",
  "password": "correct-horse-battery"
}
```

成功：`200 OK`

```json
{
  "access_token": "<jwt>",
  "refresh_token": "<jwt>",
  "token_type": "bearer",
  "expires_in": 1800,
  "refresh_expires_in": 604800
}
```

错误：邮箱不存在或密码错误统一为 `401`，响应体为 `{"detail": "Invalid email or password"}`，且不签发 token；请求字段缺失或格式错误为 `422`。

### POST /api/v1/auth/refresh

使用 refresh token 换取新的 access token，不返回新的 refresh token。

```json
{
  "refresh_token": "<jwt>"
}
```

成功：`200 OK`

```json
{
  "access_token": "<jwt>",
  "token_type": "bearer",
  "expires_in": 1800
}
```

错误：refresh token 过期、签名无效、未知、类型错误或请求体不合法时返回 `401` 或 `422`，且不签发 access token。

### GET /api/v1/users/me/profile

需要 access token。返回当前 token 对应用户的 Profile。

成功：`200 OK`

```json
{
  "avatar_url": null,
  "streak_days": 0,
  "level": 1
}
```

错误：缺少或无效 access token 为 `401`。

### PATCH /api/v1/users/me/profile

需要 access token。只允许更新头像 URL；请求模型拒绝 `streak_days`、`level` 和任何未知字段。

```json
{
  "avatar_url": "https://cdn.example.com/avatars/learner.png"
}
```

成功：`200 OK`，返回更新后的完整 Profile。

```json
{
  "avatar_url": "https://cdn.example.com/avatars/learner.png",
  "streak_days": 0,
  "level": 1
}
```

错误：未认证为 `401`；URL 非 http/https、缺少主机名、超过 2048 字符、传入只读字段或额外字段为 `422`，且原 Profile 不变。

### 自动生成的文档端点

- `GET /docs`：Swagger UI。
- `GET /redoc`：ReDoc。
- `GET /openapi.json`：OpenAPI schema。

这些端点由 FastAPI 生成，不包含业务逻辑，但应通过 `HTTPBearer` 安全方案展示受保护端点。

## Configuration

配置通过 `pydantic-settings` 读取环境变量或 `backend/.env`，统一前缀为 `STUDYPAL_`：

```dotenv
STUDYPAL_DATABASE_URL=sqlite:///./studypal.db
STUDYPAL_JWT_SECRET=replace-with-at-least-32-random-characters
STUDYPAL_JWT_ALGORITHM=HS256
STUDYPAL_ACCESS_TOKEN_TTL_MINUTES=30
STUDYPAL_REFRESH_TOKEN_TTL_DAYS=7
```

`STUDYPAL_JWT_SECRET` 没有可用默认值；缺失或少于 32 字符时应用启动失败。`.env.example` 提交到仓库，`backend/.env`、`backend/.venv/` 和本地 `*.db` 文件加入 `.gitignore`。密钥轮换会使既有 token 全部失效，这是可接受的运维行为。

## Testing and Validation

后端测试使用 `pytest`、`httpx` 和 FastAPI `TestClient`，每个测试使用临时 SQLite 数据库并覆盖 `get_db` 依赖。迁移测试在空数据库执行 `alembic upgrade head`，确认三张表、约束和索引存在。

覆盖范围至少包括：

- 注册成功、大小写/空白重复邮箱、非法邮箱、密码长度、并发唯一约束。
- 密码哈希不可逆验证、登录成功、密码错误与未知邮箱返回相同 401。
- access token 正常访问，以及缺失、无效、过期、refresh 类型冒充 access 的 401。
- refresh token 正常换发，以及过期、未知、access 类型冒充 refresh 的 401。
- 新用户默认 Profile、读取隔离、头像更新、非法 URL、超长 URL、只读字段拒绝。

验证命令：

```bash
cd backend
uv sync
uv run alembic upgrade head
uv run pytest
cd ..
npm run lint
npm run build
openspec validate --all --strict
```

## Risks / Trade-offs

- **SQLite 单写者限制高并发** -> 初版限定单实例部署，启用 WAL、短事务和 busy timeout；流量增长后迁移到 PostgreSQL，API 与领域模型保持稳定。
- **HS256 密钥泄露可使攻击者伪造 token** -> 密钥仅从环境读取、强制 32 字符以上、不得提交仓库；泄露时轮换密钥使全部 token 失效。
- **refresh token 无 rotation，被窃取后可在 7 天内重放** -> 使用短 TTL、数据库 `jti` 记录和服务端删除记录作为缓解；登出与 rotation 留给后续安全变更。
- **登录和注册缺少速率限制** -> 初版依赖部署层反向代理限流；若直接暴露公网，应在网关增加 IP/账户维度限流。
- **没有邮箱验证，可能出现无效或他人邮箱** -> 当前不提供邮件基础设施；后续需要验证码或邮件验证时增加独立能力，不改变密码登录主流程。
- **外部头像 URL 可能失效或带来隐私问题** -> 只存储 URL，不抓取或代理图片；前端接入时提供占位图和加载失败回退。
- **未配置 CORS，浏览器前端暂时无法跨域调用** -> 本变更不接入前端；后续前端认证变更在明确 origins 后增加 CORS 中间件。
- **连续学习天数和等级暂不自动变化** -> 这是当前 scope 的明确边界；后续学习事件变更负责计算与更新，API 读取契约保持不变。
- **SQLite 外键默认关闭可能导致悬空 Profile** -> 在连接事件中强制 `PRAGMA foreign_keys = ON`，并通过迁移和集成测试验证级联行为。

## Migration Plan

1. 创建 `backend/` 应用、依赖清单、配置和基础目录，不修改前端入口。
2. 创建 SQLAlchemy 模型与 Alembic 初始迁移，迁移包含 `users`、`user_profiles`、`refresh_tokens`、唯一约束、检查约束和索引。
3. 实现安全工具、认证服务、Profile 服务和 `/api/v1` 路由。
4. 增加 API 与迁移测试，运行 `uv run pytest`。
5. 在干净数据库执行 `uv run alembic upgrade head`，启动 `uv run uvicorn app.main:app --reload` 做 OpenAPI 与 curl 冒烟验证。
6. 运行前端 `npm run lint`、`npm run build` 和 `openspec validate --all --strict`，确认后端未影响现有站点。

回滚时停止后端，执行 `uv run alembic downgrade base` 删除本次新增表；已有 SQLite 数据应先备份，必要时恢复迁移前文件。前端不依赖本次新增目录，删除 `backend/` 即可恢复到纯前端状态。

## Open Questions

无。生产托管平台、TLS 终止和前端接入方式属于部署或后续变更，不影响当前 API 契约和任务拆分。
