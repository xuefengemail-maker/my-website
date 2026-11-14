# StudyPal

StudyPal 是一个学习 Dashboard 与 AI 学习助手，前端使用 React 19 + Vite + TypeScript + Tailwind CSS v4 构建，认证、用户 Profile、学习数据、目标和聊天后端使用 FastAPI + SQLite + Alembic。Dashboard 的统计、趋势、日历、成就和目标来自后端 API；`#/chat` 页面通过后端调用 DeepSeek。

## 本地开发

```bash
npm install
npm run dev       # 启动开发服务器
npm run build     # 类型检查并构建到 dist/
npm run lint      # 运行 oxlint
npm run preview   # 预览构建产物
```

## 后端开发（FastAPI）

后端位于 `backend/`，是独立服务，不参与前端 `npm run build`。本地需要 Python 3.11+ 和 `uv`。

```bash
cd backend
uv sync
cp .env.example .env
# 编辑 .env：设置至少 32 字符的 STUDYPAL_JWT_SECRET
# 设置新的 STUDYPAL_DEEPSEEK_API_KEY；不要把真实 key 提交到仓库
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

- API 文档：`http://127.0.0.1:8000/docs`
- OpenAPI：`http://127.0.0.1:8000/openapi.json`
- 健康检查：`http://127.0.0.1:8000/health`（无需认证）
- 后端测试：`cd backend && uv run pytest`
- 回滚数据库：`cd backend && uv run alembic downgrade base`

前端通过根目录 `.env.local` 或 `.env` 配置后端地址：

```dotenv
VITE_STUDYPAL_API_BASE_URL=http://localhost:8000/api/v1
```

后端聊天配置：

```dotenv
STUDYPAL_DEEPSEEK_API_KEY=
STUDYPAL_DEEPSEEK_BASE_URL=https://api.deepseek.com
STUDYPAL_DEEPSEEK_MODEL=deepseek-chat
STUDYPAL_CORS_ORIGINS=http://localhost:5173
```

`STUDYPAL_CORS_ORIGINS` 使用逗号分隔的来源列表。生产环境应加入实际前端 HTTPS 来源，并只使用环境变量或部署平台密钥管理注入 DeepSeek key。

端到端冒烟示例：

```bash
curl -fsS -X POST http://127.0.0.1:8000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"learner@example.com","password":"correct-horse-battery"}'

TOKENS=$(curl -fsS -X POST http://127.0.0.1:8000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"learner@example.com","password":"correct-horse-battery"}')
ACCESS_TOKEN=$(printf '%s' "$TOKENS" | python3 -c 'import json,sys; print(json.load(sys.stdin)["access_token"])')
REFRESH_TOKEN=$(printf '%s' "$TOKENS" | python3 -c 'import json,sys; print(json.load(sys.stdin)["refresh_token"])')

curl -fsS http://127.0.0.1:8000/api/v1/users/me/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN"

curl -fsS -X PATCH http://127.0.0.1:8000/api/v1/users/me/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"avatar_url":"https://cdn.example.com/learners/1.png"}'

curl -fsS -X POST http://127.0.0.1:8000/api/v1/auth/refresh \
  -H 'Content-Type: application/json' \
  -d "{\"refresh_token\":\"$REFRESH_TOKEN\"}"
```

### 学习分析与目标 API

所有端点和学习数据都按当前 Bearer access token 的 `user_id` 隔离，时间按 `STUDYPAL_TIMEZONE`（默认 `Asia/Shanghai`）的本地自然日聚合：

- `POST /api/v1/study-sessions`：创建学习记录，返回记录和当日聚合。
- `GET /api/v1/study-sessions?from=YYYY-MM-DD&to=YYYY-MM-DD`：按日期范围列出当前用户记录。
- `GET /api/v1/study-sessions/{session_id}`：读取当前用户的单条学习记录。
- `GET /api/v1/goals?date=YYYY-MM-DD`：列出指定日期的学习目标。
- `POST /api/v1/goals`：创建学习目标，初始状态为 `pending`。
- `GET /api/v1/goals/{goal_id}`：读取当前用户的单个学习目标。
- `PATCH /api/v1/goals/{goal_id}`：将目标切换为 `completed` 或 `pending`。
- `GET /api/v1/analytics/overview?range=week|month`：读取统计卡片和 7 个每日点或 4 个每周点趋势。
- `GET /api/v1/analytics/calendar?month=YYYY-MM`：读取整月每日学习与目标完成聚合。
- `GET /api/v1/analytics/achievements`：读取成就目录、进度和解锁时间。

```bash
curl -fsS -X POST http://127.0.0.1:8000/api/v1/study-sessions \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"subject":"算法练习","duration_minutes":45,"studied_on":"2026-11-14"}'

curl -fsS -X POST http://127.0.0.1:8000/api/v1/goals \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"title":"复习动态规划","category":"算法","target_date":"2026-11-14"}'

curl -fsS 'http://127.0.0.1:8000/api/v1/analytics/overview?range=week' \
  -H "Authorization: Bearer $ACCESS_TOKEN"

curl -fsS 'http://127.0.0.1:8000/api/v1/analytics/calendar?month=2026-11' \
  -H "Authorization: Bearer $ACCESS_TOKEN"

curl -fsS http://127.0.0.1:8000/api/v1/analytics/achievements \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

无效日期、空标题、超长文本、不支持的 `range` 或 `YYYY-MM` 返回 `422`；跨用户或不存在的学习记录/目标统一返回 `404`。创建学习记录、切换目标状态、读取总览或成就时会同步 Profile 的 `streak_days` 与 `level`。

### 聊天 API

所有聊天端点都要求 Bearer access token：

- `POST /api/v1/chat/conversations`：创建会话。
- `GET /api/v1/chat/conversations`：列出当前用户会话。
- `GET /api/v1/chat/conversations/{conversation_id}/messages`：读取会话历史。
- `POST /api/v1/chat/conversations/{conversation_id}/messages/stream`：保存用户消息并以 SSE 返回 assistant 回复。

流式请求体：

```json
{
  "content": "帮我安排今天的复习",
  "learning_context": {
    "weekly_hours": 12.5,
    "weekly_progress": 68
  }
}
```

SSE 事件顺序为 `meta`、一个或多个 `delta`，最终为 `done` 或 `error`。上游失败时 assistant 消息以 `failed` 状态保存已收到的内容；DeepSeek 未配置时返回 `503`。测试使用依赖覆盖注入假 provider，不访问真实网络。

## 目录结构

```text
src/
  auth/
    AuthProvider.tsx            登录、token 存储与 401 refresh
    useAuth.ts                  认证 Context 与 useAuth hook
  components/
    auth/
      AuthPanel.tsx              共享登录/注册入口
    chat/
      ChatPage.tsx               #/chat 页面、历史恢复与流式状态
      ChatHeader.tsx             聊天页头部与 Profile 摘要
      ChatMessageList.tsx        消息滚动容器与自动滚动
      MessageBubble.tsx          用户/assistant 气泡
      MarkdownContent.tsx        安全 Markdown/GFM 渲染
      ChatComposer.tsx           输入、Enter 发送与停止生成
      ChatErrorBanner.tsx        可重试错误提示
    dashboard/
      AnalyticsPage.tsx          学习数据页面与并行数据刷新
      DashboardHeader.tsx        欢迎区与总览标题
      RecordStudyForm.tsx        学习记录表单与输入校验
      StatCard.tsx               单项统计卡片
      StatsGrid.tsx              四项统计网格
      DailyGoalsPanel.tsx        当天目标摘要与状态切换
      GoalItem.tsx               单个目标
      LearningCalendar.tsx       整月学习日历与月份切换
      AchievementWall.tsx        成就进度与新解锁公告
      TrendPanel.tsx             周/月趋势切换
      TrendViewToggle.tsx        周/月视图切换控件
      TrendChart.tsx             原生 SVG 趋势图
      TrendDataSummary.tsx       趋势图无障碍数据表
      trendUtils.ts              趋势数值格式化
      PanelError.tsx             共享错误提示与重试
      BrandMark.tsx              StudyPal 品牌标识
      DashboardIcon.tsx          导航与统计图标
    goals/
      GoalsPage.tsx              目标页日期筛选、加载与状态切换
      GoalComposer.tsx           目标创建表单与字段校验
      GoalList.tsx               目标列表、进度与空/错误状态
    workspace/
      StudyPalShell.tsx          共享工作区壳与认证门禁
      WorkspaceSidebar.tsx       桌面端左侧导航
      WorkspaceMobileHeader.tsx  移动端紧凑导航
      WorkspaceNav.tsx           路由导航与 aria-current
    ThemeToggle.tsx              亮/暗主题切换（复用）
    ...                          旧品牌站组件暂时保留用于回滚
  content/
    studypal.ts                  导航、文案、图标类型与聊天上下文示例数据
    site.ts                      旧品牌站内容（暂时保留）
  lib/
    analyticsApi.ts              统计、日历、成就与学习记录 API
    apiClient.ts                 API 地址、JSON 请求与错误类型
    chatApi.ts                   聊天/Profile API 与 SSE 事件映射
    date.ts                      本地日期、月份与时间格式化
    goalValidation.ts            目标标题、分类与日期校验
    goalsApi.ts                  目标列表与状态切换 API
    requestError.ts              请求错误归一化与 401 判断
    sse.ts                       SSE 分块解析器
    learningContext.ts           聊天上下文示例摘要组装
  theme/
    ThemeProvider.tsx            主题状态、持久化与系统偏好监听
    useTheme.ts                  主题 Context 与 useTheme hook
  App.tsx                        HashRouter 与共享工作区路由入口
  index.css                      Tailwind 入口、主题变量与图表颜色
index.html                       静态 SEO 标签与首屏主题启动脚本
public/                          公共资源
openspec/                        OpenSpec 变更与规范
backend/                         FastAPI + SQLite + Alembic 后端
```

## Dashboard 数据

- `/` 页面通过 `authorizedFetch` 并行读取 `/analytics/overview`、`/analytics/calendar`、`/analytics/achievements` 和当天 `/goals`，所有数据按当前用户隔离。
- 四张统计卡片展示学习时长、完成任务数、连续学习天数和本周目标进度；连续天数与等级由后端根据学习记录自动计算并同步到 Profile。
- 记录学习使用主题、分钟数和日期提交，成功后刷新总览、日历和成就；目标状态切换成功后刷新总览、日历、成就和目标摘要。
- 各区块独立处理加载、错误和空状态，失败时提供重试，不回退到 mock 数据。
- 趋势图由 overview 的周/月聚合数据驱动，使用原生 SVG 绘制，不依赖图表库。
- 聊天页仍通过 `learningContext.ts` 发送示例学习摘要；该摘要不代表已验证的学习记录，后续可改为读取真实 overview。

## 学习目标

- `/goals` 默认展示当天目标，可通过“查看日期”切换指定日期的目标列表。
- 创建表单校验标题（1–120 字符）、分类（1–60 字符）和有效日期；无效输入显示字段错误且不发起请求。
- 创建成功后新目标立即加入当前列表；切换完成状态采用乐观更新，失败时回滚并显示可重试错误。
- 目标状态持久化在后端；返回学习数据页时，今日目标摘要和统计会重新从 API 读取。

## 导航与布局

- 路由使用 HashRouter：`#/` 为学习数据，`#/chat` 为 AI 对话建议，`#/goals` 为学习目标，未知路径回到学习数据。
- 桌面端使用左侧固定导航栏；导航顺序固定为“学习数据、AI 对话建议、学习目标”，当前路由通过 `aria-current="page"` 标记。
- 窄屏使用顶部紧凑导航，内容按单列排列。
- 页面使用 CSS 平滑滚动；`prefers-reduced-motion: reduce` 时改为即时跳转。
- 聊天页恢复当前用户最近会话，支持气泡式消息、流式回复、Markdown、停止生成、错误重试和“回到底部”。
- 所有主要交互目标保持至少 44px，并提供键盘焦点样式。

## 主题

- 存储键：`localStorage.theme`。
- 取值：`light` 或 `dark`。
- 没有存储值时跟随系统 `prefers-color-scheme`。
- `index.html` 中的同步脚本在首次绘制前设置 `.dark`，避免主题闪烁。
- Dashboard 颜色、卡片、趋势图和状态色使用 `src/index.css` 中的 CSS 自定义属性。

## 当前范围

本阶段明确不包含：

- 语音输入、文件上传和模型切换。
- 后台管理、头像文件上传和对象存储。
- 第三方 OAuth、邮箱验证、找回密码和账号注销。
- 生产分析数据、多会话分享/搜索/导出和跨设备同步冲突处理。
- 课程、笔记、复习、设置等独立页面。

前端 token 保存在 `localStorage` 的 `studypal.auth.tokens` 中，因此部署层应配置 CSP，并保持 Markdown 原始 HTML 禁用。DeepSeek key 只存在于后端环境变量中，不会进入浏览器 bundle。

旧的品牌站组件和 `src/content/site.ts` 暂时保留，作为本次首页替换的回滚路径；后续可在独立清理变更中删除。

## 部署

### 前端 GitHub Pages

1. 在仓库 `Settings > Pages` 将发布来源设为 `GitHub Actions`。
2. 在 `Settings > Secrets and variables > Actions > Variables` 新建 `VITE_STUDYPAL_API_BASE_URL`，值必须是生产后端 HTTPS 地址，例如 `https://api.example.com/api/v1`。
3. 推送到 `main` 后，`.github/workflows/deploy-pages.yml` 会执行 `npm ci`、`npm run lint`、`npm run build` 并发布 `dist/`。

工作流在变量缺失或不是 `https://` 地址时会在构建前失败，不会发布错误产物。Vite `base` 固定为 `/my-website/`，Hash 路由 `#/`、`#/chat`、`#/goals` 可直接打开。

后端镜像由 `.github/workflows/backend-image.yml` 在分支推送和 PR 时构建，并在 CI 内启动容器验证 `/health`、CORS 预检和迁移失败退出行为；本机无需安装 Docker 即可完成镜像验证。

### 后端容器

后端镜像是单实例 SQLite 部署，镜像启动时先执行 `alembic upgrade head`，成功后才启动 Uvicorn；迁移失败会以非零状态退出，不会进入健康状态。

```bash
cd backend
docker build -t studypal-backend .
docker run --rm --name studypal-backend -p 8000:8000 \
  -v studypal-data:/data \
  -e STUDYPAL_DATABASE_URL=sqlite:////data/studypal.db \
  -e STUDYPAL_JWT_SECRET='replace-with-at-least-32-random-characters' \
  -e STUDYPAL_CORS_ORIGINS=https://xuefengemail-maker.github.io \
  -e STUDYPAL_TIMEZONE=Asia/Shanghai \
  studypal-backend
```

- `STUDYPAL_CORS_ORIGINS` 使用逗号分隔的完整 origin，不带路径；GitHub Pages 项目页 origin 为 `https://<owner>.github.io`。
- `STUDYPAL_DEEPSEEK_API_KEY` 可留空，认证、Profile、分析和目标接口仍可用，聊天接口返回 `503`。
- SQLite 文件必须放在持久卷（示例为 `/data`），只能运行一个后端实例；不要横向扩容。
- `GET /health` 无需认证，数据库可用时返回 `{"status":"ok","database":"ok"}`，不可用时返回 `503` 且不暴露连接信息。
- JWT secret、DeepSeek key 和数据库凭据只能通过环境变量或部署平台密钥管理注入，不得写入前端或镜像。

### 备份与回滚

升级前先备份 SQLite：

```bash
mkdir -p /data/backups
sqlite3 /data/studypal.db ".backup '/data/backups/studypal-$(date +%Y%m%d-%H%M%S).db'"
```

部署失败时保留旧镜像和备份，停止新容器并恢复旧镜像。回滚分析功能时依次执行：

```bash
docker stop studypal-backend
docker run --rm -v studypal-data:/data \
  -e STUDYPAL_DATABASE_URL=sqlite:////data/studypal.db \
  -e STUDYPAL_JWT_SECRET='replace-with-at-least-32-random-characters' \
  --entrypoint alembic studypal-backend:previous downgrade 20261114_0002
docker run --rm --name studypal-backend -p 8000:8000 \
  -v studypal-data:/data \
  -e STUDYPAL_DATABASE_URL=sqlite:////data/studypal.db \
  -e STUDYPAL_JWT_SECRET='replace-with-at-least-32-random-characters' \
  -e STUDYPAL_CORS_ORIGINS=https://xuefengemail-maker.github.io \
  -e STUDYPAL_TIMEZONE=Asia/Shanghai \
  studypal-backend:previous
```

`20261114_0002` 降级只删除学习分析表，`users`、`user_profiles`、`refresh_tokens` 和聊天表保持可读。若数据库文件损坏，先停止容器，再用备份覆盖 `/data/studypal.db` 并重启。

### SEO 与静态资源

- 静态 SEO 标签保留在 `index.html`，不要移到 React 组件中。
- 当前标题、描述、Open Graph 和 Twitter 文案已更新为 StudyPal。
- `canonical`、`og:url`、`og:image` 和 `twitter:image` 仍使用占位地址 `https://xuefengemail-maker.github.io/my-website/`，发布前需要替换真实域名或用户名。
- 构建产物位于 `dist/`；`vite.config.ts` 设置 `base: '/my-website/'`，匹配 GitHub Pages 项目路径。
- 本地开发服务器地址：`http://localhost:5173/my-website/`。
