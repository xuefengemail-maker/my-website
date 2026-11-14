# Tasks

实现边界：本变更只新增 `backend/` 后端，并更新根 `README.md` 与必要的 `.gitignore`；不修改 `src/`、`index.html` 或前端构建配置。

## 1. 后端脚手架与配置

- [x] 1.1 在完成复用检查后创建 `backend/pyproject.toml`、Python 3.11+ 版本约束和依赖组（FastAPI、Uvicorn、SQLAlchemy、Alembic、pydantic-settings、email-validator、PyJWT、pwdlib[argon2]、pytest、httpx）；验证：`cd backend && uv sync` 成功，且 `uv run python -c "import fastapi, sqlalchemy, alembic, jwt, pwdlib"` 无错误。
- [x] 1.2 创建 `app` 包骨架、`app/main.py` 和 `/api/v1` 聚合路由，使应用可启动并生成 OpenAPI；验证：`cd backend && uv run uvicorn app.main:app` 启动后，`curl -fsS http://127.0.0.1:8000/openapi.json` 返回 200。
- [x] 1.3 实现 `app/core/config.py` 的 `STUDYPAL_*` 配置、`backend/.env.example` 和根 `.gitignore` 的 `backend/.env`、`backend/.venv/`、本地数据库规则；验证：有效配置可加载，缺少或少于 32 字符的 `STUDYPAL_JWT_SECRET` 会启动失败并给出明确错误。
- [x] 1.4 在根 `README.md` 增加后端安装、环境变量、Alembic 迁移和本地启动说明；验证：按 README 中的命令可从 `backend/` 成功启动应用。
- [x] 1.5 Phase 1 验证：运行 `cd backend && uv run python -c "from app.main import app; print(app.title)"`，并启动应用确认 `/docs` 与 `/openapi.json` 可访问；记录结果后停止等待 review。

## 2. 数据模型与 Alembic 迁移

- [x] 2.1 实现 `app/db/base.py`、`app/db/session.py`、UTC 时间辅助函数和 SQLite 连接初始化，启用 `foreign_keys`、WAL 与 `busy_timeout`；验证：`tests/test_migrations.py` 中断言 `PRAGMA foreign_keys` 返回 1，且连接可正常提交和回滚。
- [x] 2.2 定义 `users`、`user_profiles`、`refresh_tokens` 的 SQLAlchemy 模型、关系、唯一约束、检查约束和外键级联；验证：`uv run python -c` 检查 `Base.metadata.tables` 包含三张表及预期约束。
- [x] 2.3 配置 `alembic.ini`、`alembic/env.py` 和初始 revision，使其创建三张表、索引、唯一约束、检查约束与 `ON DELETE CASCADE`，并启用 SQLite batch mode；验证：在临时数据库执行 `uv run alembic upgrade head` 和 `uv run alembic downgrade base` 均成功。
- [x] 2.4 添加 `tests/test_migrations.py`，验证迁移后的三张表、唯一索引、检查约束、外键级联和降级清理；验证：`cd backend && uv run pytest tests/test_migrations.py -q` 通过。
- [x] 2.5 Phase 2 验证：删除临时数据库后重复执行 upgrade/downgrade，并运行 `uv run pytest tests/test_migrations.py -q`；记录结果后停止等待 review。

## 3. 安全原语与认证服务

- [x] 3.1 在 `app/core/security.py` 实现 Argon2id 密码哈希与校验、邮箱去除首尾空白并转小写；验证：`tests/test_auth.py` 覆盖哈希不等于明文、正确密码通过、错误密码失败、大小写和空白邮箱归一化。
- [x] 3.2 实现 JWT 创建与解析，claims 包含 `sub`、`token_type`、`iat`、`exp`，refresh 额外包含 `jti`，并校验签名、过期时间和 token 类型；验证：`tests/test_auth.py` 覆盖 access/refresh 区分、过期、篡改签名、缺失 claim 和错误类型。
- [x] 3.3 实现 `AuthService.register`：规范化邮箱、在同一事务创建用户与默认 Profile、将唯一冲突映射为 409，并为未知邮箱登录准备 dummy hash 校验；验证：`tests/test_auth.py` 覆盖注册成功、大小写重复邮箱、非法输入和事务回滚。
- [x] 3.4 实现 `AuthService.login` 与 `AuthService.refresh_access`：登录签发双 token 并持久化 refresh `jti`，刷新只签发新 access token，拒绝过期、未知和类型错误的 token；验证：`tests/test_auth.py` 覆盖 token 响应字段、密码错误与未知邮箱同错误、刷新成功及四类失败。
- [x] 3.5 Phase 3 验证：运行 `cd backend && uv run pytest tests/test_auth.py -q`；记录结果后停止等待 review。

## 4. 认证 API

- [x] 4.1 定义 `app/schemas/auth.py` 的注册、登录、刷新请求模型和 token 响应模型，并在 `app/api/routes/auth.py` 注册三个路由；验证：`TestClient` 读取 `/openapi.json`，确认三个认证路径、请求字段和响应字段均存在。
- [x] 4.2 实现 `POST /api/v1/auth/register`，返回 201 或 409/422；验证：`tests/test_auth.py` 覆盖成功响应不包含密码或哈希、重复邮箱冲突、非法邮箱和非法密码长度。
- [x] 4.3 实现 `POST /api/v1/auth/login`，返回 200、401 或 422，并包含 `access_token`、`refresh_token`、`token_type`、`expires_in`、`refresh_expires_in`；验证：`tests/test_auth.py` 覆盖成功登录、密码错误、未知邮箱和缺失字段。
- [x] 4.4 实现 `POST /api/v1/auth/refresh`，返回 200、401 或 422；验证：`tests/test_auth.py` 覆盖有效刷新、过期 refresh、未知 refresh、access 冒充 refresh 和请求体校验。
- [x] 4.5 Phase 4 验证：运行 `cd backend && uv run pytest tests/test_auth.py -q`，并按 README 示例用 curl 完成注册→登录→刷新冒烟；记录结果后停止等待 review。

## 5. 当前用户依赖与 Profile API

- [x] 5.1 在 `app/api/deps.py` 实现 `get_db` 与 `get_current_user`，使用 `HTTPBearer` 校验 access token 类型和 `sub` 用户存在性，缺失、无效、过期或类型错误时返回 401 与 `WWW-Authenticate: Bearer`；验证：`tests/test_profile.py` 覆盖四类鉴权失败和有效身份。
- [x] 5.2 定义 `app/schemas/profile.py`：响应字段为 `avatar_url`、`streak_days`、`level`，PATCH 请求只允许 `avatar_url`，设置 `extra="forbid"`，并校验 http/https、主机名和 2048 字符上限；验证：`tests/test_profile.py` 覆盖合法 URL、非法 scheme、缺少 host、超长 URL 和只读字段。
- [x] 5.3 实现 `GET /api/v1/users/me/profile`，按当前 token 用户读取 Profile，新用户返回 `null`、`0`、`1`；验证：`tests/test_profile.py` 覆盖新用户默认值、已有值和用户 A 只能读取自己的 Profile。
- [x] 5.4 实现 `PATCH /api/v1/users/me/profile`，成功返回更新后的完整 Profile，失败时不修改原值；验证：`tests/test_profile.py` 覆盖更新成功、非法 URL、超长 URL、只读字段和未认证请求。
- [x] 5.5 Phase 5 验证：运行 `cd backend && uv run pytest tests/test_profile.py -q`，并检查 `/openapi.json` 中 Profile 端点及 Bearer 安全方案；记录结果后停止等待 review。

## 6. 集成验证与最终文档

- [x] 6.1 在干净临时 SQLite 上执行 `uv run alembic upgrade head`，再运行 `uv run pytest`；验证：迁移成功且全部后端测试通过。
- [x] 6.2 启动 `uv run uvicorn app.main:app --port 8000`，按 README 用 curl 完成注册、登录、刷新、读取 Profile 和更新 Profile；验证：状态码与响应字段符合 `design.md`。
- [x] 6.3 更新根 `README.md` 的当前范围和后端章节，补充启动、迁移、API 文档地址与已验证的 curl 示例；验证：文档中的命令可执行且链接与实际端口一致。
- [x] 6.4 运行 `npm run lint`、`npm run build` 和 `openspec validate --all --strict`；验证：前端 lint/build 不受影响，OpenSpec 无失败。
- [x] 6.5 Phase 6 验证：汇总 6.1–6.4 的结果和未覆盖风险，停止等待 review 与归档决定。

## Workflow follow-up

- 在实现、测试和 review 全部完成后，使用 OpenSpec 归档流程归档该变更。
- 归档后检查 `openspec/changes/archive/` 与主 specs 是否包含 `auth/user-auth` 和 `users/user-profile` 的最终内容。
