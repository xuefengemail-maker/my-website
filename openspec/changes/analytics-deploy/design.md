# Design

## Context

当前前端使用 `HashRouter` 提供 `/` 和 `/chat`，Dashboard 仍由 `src/content/studypal.ts` 的 mock 数据驱动；后端已有 FastAPI、同步 SQLAlchemy 2、SQLite、Alembic、JWT、Profile 和聊天能力，但没有学习记录、目标或成就表。现有 `ui/learning-dashboard` 明确要求纯前端 mock，本次变更会将其替换为认证后的真实数据工作区。动机见 `proposal.md`，行为契约见四份 delta specs。

约束：Tailwind CSS v4 + CSS 变量，禁止内联 style；前端部署在 GitHub Pages `/my-website/`，后端必须独立托管；复用现有组件和 `authorizedFetch`；不引入新的状态管理或图表库；实时通知和数据导出明确不做。

## Goals / Non-Goals

**Goals:**

- 用 `study_sessions`、`learning_goals`、`user_achievements` 持久化学习行为，并由 FastAPI 聚合统计、趋势、日历和成就。
- 提供认证后的共享工作区：左侧导航固定为“学习数据、AI 对话建议、学习目标”，并复用现有 Dashboard 和聊天组件。
- 让 Profile 的连续天数和等级与真实学习记录保持一致。
- 建立可重复的 GitHub Pages + 单实例容器部署、健康检查、迁移和回滚流程。

**Non-Goals:**

- 实时通知、数据导出、社交排行、后台管理和多用户时区。
- Postgres 迁移、多实例扩容、队列、缓存层和独立分析服务。
- 新增前端测试框架或图表库；沿用 lint、build 和现有后端测试栈。
- 把历史 mock 数据迁移成真实记录；上线后从空数据开始。

## Decisions

### 1. 数据模型与迁移

新增迁移 `20261114_0003_create_analytics_tables.py`，`down_revision = "20261114_0002"`。所有表使用 snake_case，外键启用 `ON DELETE CASCADE`，复用现有 SQLite 外键 PRAGMA。

`study_sessions`：

| 字段 | 类型 | 约束 |
| --- | --- | --- |
| `id` | Integer | 主键 |
| `user_id` | Integer | 外键 `users.id`，级联删除，非空 |
| `subject` | String(120) | 非空 |
| `duration_minutes` | Integer | 非空，检查 1–1440 |
| `studied_on` | Date | 非空，按配置时区的自然日 |
| `created_at` / `updated_at` | DateTime(timezone=True) | 非空 |

索引：`ix_study_sessions_user_id_studied_on (user_id, studied_on)`。

`learning_goals`：

| 字段 | 类型 | 约束 |
| --- | --- | --- |
| `id` | Integer | 主键 |
| `user_id` | Integer | 外键 `users.id`，级联删除，非空 |
| `title` | String(120) | 非空 |
| `category` | String(60) | 非空 |
| `target_date` | Date | 非空 |
| `status` | String(16) | `pending` 或 `completed` |
| `completed_at` | DateTime(timezone=True) | 可空 |
| `created_at` / `updated_at` | DateTime(timezone=True) | 非空 |

索引：`ix_learning_goals_user_id_target_date (user_id, target_date)`；检查约束限制 `status`。

`user_achievements`：

| 字段 | 类型 | 约束 |
| --- | --- | --- |
| `id` | Integer | 主键 |
| `user_id` | Integer | 外键 `users.id`，级联删除，非空 |
| `code` | String(64) | 非空 |
| `unlocked_at` | DateTime(timezone=True) | 非空 |

唯一约束：`uq_user_achievements_user_id_code (user_id, code)`；索引 `ix_user_achievements_user_id`。

选择三张表而不是把所有统计写入 JSON：统计需要按日期和用户过滤，关系表可以利用索引和 SQL 聚合；成就解锁需要幂等持久化，唯一约束比应用层去重更可靠。成就目录本身保留在代码常量中，避免为固定四种成就增加管理表。

### 2. API 端点

所有端点位于 `/api/v1`，除 `/health` 外都要求 Bearer access token。跨用户或不存在的学习记录/目标统一返回 404，避免泄露资源存在性。

| 方法与路径 | 请求 | 成功响应 | 主要错误 |
| --- | --- | --- | --- |
| `POST /api/v1/study-sessions` | `{subject, duration_minutes, studied_on}` | `201`，记录与当日聚合 | `401`、`422` |
| `GET /api/v1/study-sessions?from=YYYY-MM-DD&to=YYYY-MM-DD` | 日期范围 | `200`，`{items:[...]}` | `401`、`422` |
| `GET /api/v1/study-sessions/{session_id}` | 记录 ID | `200`，单条记录 | `401`、`404` |
| `GET /api/v1/goals?date=YYYY-MM-DD` | 日期 | `200`，`{items:[...]}` | `401`、`422` |
| `POST /api/v1/goals` | `{title, category, target_date}` | `201`，目标 | `401`、`422` |
| `GET /api/v1/goals/{goal_id}` | 目标 ID | `200`，目标 | `401`、`404` |
| `PATCH /api/v1/goals/{goal_id}` | `{status}` | `200`，更新后的目标 | `401`、`404`、`422` |
| `GET /api/v1/analytics/overview?range=week\|month` | 范围 | `200`，统计与趋势 | `401`、`422` |
| `GET /api/v1/analytics/calendar?month=YYYY-MM` | 月份 | `200`，日期聚合 | `401`、`422` |
| `GET /api/v1/analytics/achievements` | 无 | `200`，成就目录与进度 | `401` |
| `GET /health` | 无 | `200`，数据库健康 | `503` 数据库不可用 |

响应约定：

- `overview.stats` 固定为四项：`study_minutes`、`completed_goals`、`streak_days`、`weekly_progress`；每项包含 `label`、`value`、`unit`、`description`。
- `overview.trend` 包含 `view` 和 `points`；周视图 7 个每日点，月视图 4 个每周点。
- `calendar.days` 每项包含 `date`、`minutes`、`sessions`、`completed_goals`、`is_today`、`is_future`；没有记录的日期补零。
- `achievements.items` 每项包含 `code`、`title`、`description`、`target`、`progress`、`unlocked`、`unlocked_at`。
- 日期字段使用 `YYYY-MM-DD`，时间字段使用 ISO 8601 UTC；前端不得把日期字符串按 UTC 午夜二次转换。
- 所有错误使用稳定安全文案，不返回 SQL、堆栈、token 或内部路径。

### 3. 聚合与时间语义

时区配置为 `STUDYPAL_TIMEZONE`，默认 `Asia/Shanghai`，启动时用 `zoneinfo.ZoneInfo` 校验。`studied_on` 和 `target_date` 是用户时区下的自然日；`created_at`、`completed_at`、`unlocked_at` 存 UTC。

聚合规则：

- 周范围：配置时区下当前周的周一到周日。
- 月趋势：最近四个完整周（周一到周日），按周汇总分钟数。
- 本周学习分钟数：当前周 `study_sessions.duration_minutes` 之和。
- 已完成目标数：当前周 `completed_at` 落在范围内的目标数。
- 本周目标进度：当前周到期目标中已完成数 / 总数；总数为 0 时为 0。
- 连续学习天数：从最近一次学习日（今天或昨天）向前数连续有记录的自然日；中断即停止。
- 等级：`max(1, floor(累计学习分钟数 / 600) + 1)`，每累计 10 小时提升一级。
- 日历：按月份生成完整日期网格，按 `studied_on` 汇总分钟和记录数，按 `completed_at` 的本地日期汇总完成目标数。

聚合用 SQLAlchemy `select`、`func.sum`、`func.count` 和 `group_by`，不用数据库特有窗口函数。周/月边界在 Python 中按配置时区计算，再以日期范围过滤，避免 SQLite 日期函数对时区处理不一致。索引覆盖 `(user_id, studied_on)` 和 `(user_id, target_date)`，当前单用户规模足够；不做缓存或预聚合表。

成就目录固定为：

| code | 条件 | 进度 |
| --- | --- | --- |
| `first_session` | 至少 1 条学习记录 | 记录数 / 1 |
| `streak_7` | 连续学习 7 天 | 连续天数 / 7 |
| `hours_10` | 累计 600 分钟 | 累计分钟 / 600 |
| `goals_20` | 完成 20 个目标 | 完成目标数 / 20 |

每次创建学习记录、切换目标状态、读取总览或读取成就时重新计算进度；达到阈值后写入 `user_achievements`，依赖唯一约束保证重复读取不重复解锁。聚合完成后同步 `user_profiles.streak_days` 和 `level`，客户端仍不能通过 Profile 更新接口修改这两个字段。

### 4. 前端路由与组件层级

保留 `HashRouter`，新增 `/goals`，根路径改为学习数据页；未知路径继续重定向 `/`。

```text
App
└─ AuthProvider
   └─ HashRouter
      └─ StudyPalShell
         ├─ WorkspaceSidebar
         │  ├─ BrandMark
         │  ├─ WorkspaceNav        # 学习数据 / AI 对话建议 / 学习目标
         │  └─ ThemeToggle
         ├─ WorkspaceMobileHeader
         └─ Routes
            ├─ / → AnalyticsPage
            │  ├─ DashboardHeader
            │  ├─ RecordStudyForm
            │  ├─ StatsGrid
            │  ├─ LearningCalendar
            │  ├─ AchievementWall
            │  ├─ DailyGoalsPanel
            │  └─ TrendPanel
            ├─ /goals → GoalsPage
            │  ├─ GoalComposer
            │  └─ GoalList
            └─ /chat → ChatPage
               └─ existing chat components
```

复用与改造：

- `BrandMark`、`DashboardIcon`、`StatCard`、`StatsGrid`、`TrendPanel`、`TrendChart`、`DailyGoalsPanel` 和 `ChatAuthPanel` 继续复用。
- `DashboardNav` 从页内滚动按钮改为 `NavLink` 路由导航；`NavItem` 增加 `to` 字段，图标增加 `analytics`、`goals`、`chat`。
- `DashboardMain` 演进为 `AnalyticsPage`，`DashboardShell` 演进为 `StudyPalShell`；旧组件不整体重写。
- `ChatPage` 去掉重复的页面级 header，嵌入共享 shell；聊天内部布局、SSE、Markdown 和滚动逻辑不变。
- 新增 `LearningCalendar`、`AchievementWall`、`RecordStudyForm`、`GoalsPage`、`GoalComposer`、`GoalList`。
- 新组件放在现有 `src/components/dashboard/` 或 `src/components/goals/`，PascalCase；API 客户端放在 `src/lib/analyticsApi.ts` 和 `src/lib/goalsApi.ts`。

### 5. 前端数据流与状态

页面通过 `AuthProvider` 暴露的 `authorizedFetch` 调用 API；根路径、目标页和聊天页都要求认证，未认证时显示共享 `AuthPanel`，不发起业务请求。

每个数据区块独立维护 `loading`、`error`、`data` 状态，用 `AbortController` 在路由切换或组件卸载时取消请求；用递增 request id 丢弃过期响应。失败显示可重试错误，不用 mock 兜底。`RecordStudyForm` 提交成功后并行刷新总览、日历和成就；目标切换成功后刷新目标列表和总览。

导航使用 `NavLink` 的 `aria-current="page"`；当前项在桌面侧栏和移动端紧凑导航中保持一致。日历使用可访问的表格/网格语义，日期格提供完整 `aria-label`；成就是列表语义，新解锁通过 `aria-live="polite"` 公告；所有触控目标至少 44px，`prefers-reduced-motion` 下禁用平滑滚动和脉冲动画。

### 6. 部署架构

前端保持 GitHub Pages 静态托管，`vite.config.ts` 的 `base: '/my-website/'` 不变。新增 `.github/workflows/deploy-pages.yml`：在 push 到 `main` 时执行 `npm ci`、`npm run lint`、`npm run build`，使用 `VITE_STUDYPAL_API_BASE_URL` 注入生产 API 地址，然后上传并部署 `dist/`。缺少生产 API 地址时工作流在发布前失败。

后端新增 `backend/Dockerfile`，基于 Python 3.11 slim，复制 `backend/`，执行 `uv sync --frozen`，入口先运行 `alembic upgrade head`，再运行 `uvicorn app.main:app --host 0.0.0.0 --port 8000`。`GET /health` 检查数据库连接并返回 `{status, database}`；数据库不可用返回 503。SQLite 文件放在持久卷，部署为单实例；多实例和 Postgres 不在本次范围。

生产环境变量：`STUDYPAL_DATABASE_URL=sqlite:////data/studypal.db`、`STUDYPAL_JWT_SECRET`、`STUDYPAL_CORS_ORIGINS`（包含 GitHub Pages 来源）、`STUDYPAL_TIMEZONE=Asia/Shanghai`；`STUDYPAL_DEEPSEEK_API_KEY` 可空。前端只注入 `VITE_STUDYPAL_API_BASE_URL`，不注入任何后端密钥。

### 7. 迁移、备份与回滚

1. 备份当前 SQLite：`sqlite3 /data/studypal.db ".backup '/data/backups/studypal-<timestamp>.db'"`。
2. 部署新后端镜像，容器执行 `alembic upgrade head`；失败则停止发布并保留旧镜像。
3. 验证 `/health`、认证、分析、目标和聊天接口。
4. 部署前端并验证 `/my-website/#/`、`#/chat`、`#/goals` 和 CORS。
5. 回滚：恢复上一后端镜像，执行 `alembic downgrade 20261114_0002`，恢复前端上一版本；既有 `users`、`user_profiles`、`refresh_tokens` 和聊天表不受影响。

## Risks / Trade-offs

- **SQLite 并发写冲突** → WAL、`busy_timeout=5000`、短事务、单实例部署；不承诺横向扩展。
- **时区/夏令时边界错误** → 统一 `ZoneInfo` 和日期范围过滤，测试跨月、跨年、今天/昨天边界；多用户时区不做。
- **聚合查询随历史数据变慢** → 索引 + 周/月范围限制；暂不引入预聚合表，后续按数据量再优化。
- **成就重复解锁** → `(user_id, code)` 唯一约束和幂等 upsert。
- **前端无 mock 后后端故障可见** → 明确的 loading/error/retry 状态；不伪造数据。
- **GitHub Pages 与后端 CORS 配置不一致** → 部署检查预检请求和 `STUDYPAL_CORS_ORIGINS`，并用真实 Pages 来源冒烟。
- **SQLite 持久卷配置错误导致数据丢失** → 部署前备份、健康检查、单实例持久卷；回滚先恢复数据库备份。
- **隐私风险**：学习主题可能包含敏感信息 → 不记录请求体日志，不把学习主题写入错误响应。
- **范围蔓延** → 实时通知、导出、社交排行和后台管理保持 out-of-scope，不在 UI 中预留入口。

## Migration Plan

1. 新建模型和 `20261114_0003` 迁移，验证空库升级、级联删除、检查约束和降级。
2. 实现分析/目标服务、schema、路由和测试；确保旧认证、Profile、聊天测试不回归。
3. 实现共享 shell、真实数据页面、目标页和记录学习表单；保留聊天原行为。
4. 添加 Dockerfile、健康检查、GitHub Pages 工作流、环境示例和 README 部署说明。
5. 在临时数据库执行完整迁移和 API 冒烟，再按部署步骤上线。

## Open Questions

- 后端具体托管平台（Render、Fly.io、Railway 或其他 Docker 兼容平台）在部署任务中确认；本设计只要求单实例、持久卷和 `/health`，不改变 specs 或任务拆分。
