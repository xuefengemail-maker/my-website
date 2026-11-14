# Tasks

执行时按 `AGENTS.md` 在每个 Phase 结束后停止，等待 review 后再进入下一阶段。

## 1. 后端数据模型与配置

- [x] 1.1 检查现有 `backend/app/models`、`services`、`api/routes` 和迁移，确认没有可复用的学习记录/目标/成就实现，并记录复用边界；验证不新增重复服务或表。
- [x] 1.2 新增 `StudySession`、`LearningGoal`、`UserAchievement` 模型和 `20261114_0003_create_analytics_tables.py`，验证空库升级后表、索引、唯一约束、检查约束和级联删除存在。
- [x] 1.3 增加 `STUDYPAL_TIMEZONE` 配置和 `ZoneInfo` 校验，验证默认 `Asia/Shanghai` 可用、无效时区启动失败且错误不含密钥。
- [x] 1.4 更新 `backend/tests/test_migrations.py` 覆盖升级、降级、级联删除和约束，验证 `cd backend && UV_CACHE_DIR=/private/tmp/uv-cache uv run pytest -q backend/tests/test_migrations.py` 通过。
- [x] 1.5 运行 Phase 验证：`uv run pytest -q`、`uv run alembic upgrade head`、`uv run alembic downgrade 20261114_0002`，确认旧认证、Profile、聊天表和迁移不受影响。

## 2. 分析与目标 API

- [x] 2.1 新增学习记录、目标、统计、日历和成就请求/响应 schema，验证无效日期、空标题、超长主题、非法 range/月份返回 422 且不写库。
- [x] 2.2 实现学习记录服务与 `POST/GET /api/v1/study-sessions`、`GET /api/v1/study-sessions/{session_id}`，所有查询按当前 `user_id` 过滤；验证创建、日期范围查询、单条读取、401 和跨用户 404。
- [x] 2.3 实现目标服务与 `GET/POST/PATCH /api/v1/goals`、`GET /api/v1/goals/{goal_id}`，验证按日期列表、单条读取、创建、完成/恢复、跨用户 404 和无效输入 422。
- [x] 2.4 实现周/月统计、连续天数、等级、目标进度和日历聚合服务，验证固定时区下的周/月边界、空数据、今天/昨天连续天数和跨月日历。
- [x] 2.5 实现成就目录、进度计算和幂等解锁，验证首次学习、7 天连续、10 小时、20 个目标、重复读取不重复解锁，以及 Profile 学习字段同步。
- [x] 2.6 新增 `backend/tests/test_analytics.py`，覆盖用户隔离、聚合边界、成就幂等、Profile 同步和 401/404/422；验证 `uv run pytest -q backend/tests/test_analytics.py` 通过。
- [x] 2.7 更新 OpenAPI 描述和 README 的分析/目标端点说明，验证 `/openapi.json` 包含全部新端点且 Bearer 安全声明存在。
- [x] 2.8 运行 Phase 验证：`uv run pytest -q` 和 `uv run python -m compileall -q app tests` 全部通过。

## 3. 共享工作区壳与路由

- [x] 3.1 扩展 `src/content/studypal.ts` 的导航类型和图标，加入 `analytics`、`chat`、`goals`，验证导航数据顺序固定为“学习数据、AI 对话建议、学习目标”。
- [x] 3.2 新增 `StudyPalShell`、`WorkspaceSidebar`、`WorkspaceMobileHeader` 和 `WorkspaceNav`，复用 `BrandMark`、`DashboardIcon`、`ThemeToggle`；验证桌面侧栏、移动端紧凑导航和 `aria-current` 正确。
- [x] 3.3 更新 `src/App.tsx` 路由为 `/`、`/chat`、`/goals`，未知路径重定向 `/`；验证直接访问三个 hash 路由都能加载正确页面。
- [x] 3.4 将 `ChatPage` 嵌入共享 shell，移除重复页面级 header，保留聊天气泡、SSE、Markdown、滚动和认证逻辑；验证 `#/chat` 行为不回归。
- [x] 3.5 复用并整理认证面板为共享 `AuthPanel`，未认证访问 `/`、`/goals`、`/chat` 时显示登录/注册且不发起业务请求；验证 401 后 refresh 失败会清空会话。
- [x] 3.6 运行 Phase 验证：`npm run lint`、`npm run build`，并通过 preview 检查三个路由和移动端导航。

## 4. 学习数据页面

- [x] 4.1 新增 `src/lib/analyticsApi.ts` 和 `src/lib/goalsApi.ts`，复用 `authorizedFetch`/`ApiError`，定义 overview、calendar、achievements、goals 和 study-session 类型；验证 `npm run build` 类型检查通过。
- [x] 4.2 将 `DashboardMain` 改造为 `AnalyticsPage`，接入真实 overview，展示四张统计卡片、加载骨架、错误重试和 401 跳转；验证不再读取 mock 统计。
- [x] 4.3 新增 `RecordStudyForm`，支持主题、分钟数和日期提交，成功后刷新总览、日历和成就；验证无效输入不请求、成功后数据更新。
- [x] 4.4 新增 `LearningCalendar`，展示整月日期网格、分钟数、完成目标数、上下月切换、当天高亮和未来日期中性状态；验证空月份和接口失败。
- [x] 4.5 新增 `AchievementWall`，展示已解锁/未解锁、进度、解锁时间和 `aria-live` 新成就公告；验证重复刷新不重复公告。
- [x] 4.6 将 `TrendPanel` 接入真实周/月聚合，保留周/月切换、空数据提示和加载失败重试；验证周视图 7 点、月视图 4 点。
- [x] 4.7 将 `DailyGoalsPanel` 接入当天目标 API，切换状态持久化并处理空列表、失败回滚和全部完成反馈；验证刷新后状态保持。
- [x] 4.8 运行 Phase 验证：`npm run lint`、`npm run build`，并用假数据/假 API 检查统计、日历、成就、趋势和目标摘要。

## 5. 学习目标页面

- [x] 5.1 新增 `/goals` 页面、`GoalComposer` 和 `GoalList`，支持按日期加载、创建目标、切换完成/待完成；验证成功后列表和 Dashboard 摘要同步。
- [x] 5.2 处理标题/分类/日期校验、空列表引导、加载状态和接口失败重试；验证无效输入不发起请求且不回退到 mock。
- [x] 5.3 运行 Phase 验证：`npm run lint`、`npm run build`，并用假 API 检查创建、完成、刷新和错误路径。

## 6. 部署与健康检查

- [x] 6.1 新增 `backend/Dockerfile` 和启动入口，先执行 `alembic upgrade head` 再启动 Uvicorn；验证镜像可构建、容器可启动且失败时退出非零。
- [x] 6.2 新增无需认证的 `GET /health`，检查数据库连接并返回 `{status, database}`；验证数据库正常返回 200、数据库不可用返回 503 且不泄露连接信息。
- [x] 6.3 更新 `backend/.env.example`、根 `.env.example` 和 README，记录 `STUDYPAL_TIMEZONE`、生产数据库路径、CORS、前端 API 地址和单实例持久卷要求；验证文档命令可照抄执行且无真实密钥。
- [x] 6.4 新增 GitHub Actions Pages 工作流，执行 `npm ci`、`npm run lint`、`npm run build` 并发布 `dist/`；缺少 `VITE_STUDYPAL_API_BASE_URL` 时在发布前失败。
- [x] 6.5 配置并验证生产 CORS：只允许 `STUDYPAL_CORS_ORIGINS` 中的来源，GitHub Pages 来源可加入，未配置来源的预检不返回放行头。
- [x] 6.6 记录 SQLite 备份、迁移失败停止发布、镜像回滚和 `alembic downgrade 20261114_0002` 步骤；验证回滚后 `users`、`user_profiles`、`refresh_tokens` 和聊天数据仍可读取。
- [x] 6.7 运行 Phase 验证：`docker build`、`npm run build`、健康检查冒烟、CORS 冒烟和 OpenSpec validate。

> 验证记录：GitHub Actions `Backend Image` run 43603145079 通过，覆盖镜像构建、`/health`、CORS 预检和迁移失败退出；本地同时验证了启动入口和冻结依赖安装。

## 7. 集成与质量门禁

- [ ] 7.1 运行完整后端验证：`cd backend && UV_CACHE_DIR=/private/tmp/uv-cache uv run pytest -q` 和 `uv run python -m compileall -q app tests`。
- [ ] 7.2 运行完整前端验证：`npm run lint`、`npm run build`，确认没有内联 style、没有新增不必要依赖、暗色和窄屏无水平溢出。
- [ ] 7.3 使用假数据/临时数据库完成端到端冒烟：注册登录、记录学习、查看统计/日历/成就、创建/完成目标、刷新后数据保持，并确认聊天行为不回归。
- [ ] 7.4 检查可访问性：导航键盘操作、`aria-current`、日历日期标签、成就 `aria-live`、触控目标至少 44px、`prefers-reduced-motion` 生效。
- [ ] 7.5 验证部署链路：前端构建产物、Pages hash 路由、后端 `/health`、CORS 预检、迁移升级/降级和备份恢复。
- [ ] 7.6 运行 `openspec validate --all --strict`，确认四份 specs 无 delta 头残留、每 requirement 不超过 5 个 scenarios、单文件不超过 2000 词。
- [ ] 7.7 完成三维验证记录：完整性（所有任务和 requirements 有实现）、正确性（边界和错误场景测试）、一致性（design 的表名、API、事件、组件命名和 out-of-scope 边界逐项核对）。

## Workflow follow-up

- 实现完成并通过 review 后，运行 `openspec verify` 和 OpenSpec 归档工作流。
- 归档后确认主 specs 更新 `ui/learning-dashboard`、`ui/ai-chat`，并新增 `analytics/learning-analytics`、`deployment/studypal-deploy`。
- 更新 `.handoff/latest.md`，记录部署状态、迁移版本和回滚验证结果。
