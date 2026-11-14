# Proposal

## Why

当前个人品牌站无法验证 StudyPal 学习助手的核心使用场景。先用前端 mock 数据搭建一个可交互的学习 Dashboard，验证信息架构、响应式布局和关键组件，为后续接入真实数据、AI 与认证能力打基础。

## What Changes

- **BREAKING** 将站点首页从个人品牌站替换为 StudyPal 学习 Dashboard；旧品牌 Sections 不再作为首页内容渲染。
- 新建 Dashboard 应用壳：桌面端左侧导航栏，移动端折叠为紧凑导航；主内容区包含欢迎区和各学习面板。
- 新增数据统计卡片，展示学习时长、完成任务数、连续学习天数和本周目标进度等 mock 指标。
- 新增每日目标清单，支持在当前页面会话内勾选目标并更新完成进度；刷新后恢复 mock 初始状态。
- 新增 AI 学习建议面板，展示 mock 建议内容；本变更不调用任何 AI 服务。
- 新增周/月趋势图，可切换查看两组 mock 数据，使用轻量 SVG 绘制，不引入图表库。
- 侧栏仅作为当前 Dashboard 的页内区块导航，不新增课程、笔记等未定义页面，也不引入多页面路由。
- 复用现有主题 Provider、主题切换和 CSS 颜色变量，并保持亮色、暗色模式可用。
- 将静态站点标题和描述更新为 StudyPal 学习助手相关文案。

## Capabilities

### New Capabilities

- `ui/learning-dashboard`: StudyPal Dashboard 的应用壳、数据统计卡片、每日目标清单、AI 建议面板、周/月趋势图，以及响应式和主题行为。

### Modified Capabilities

无。

## Impact

- React：调整 `src/App.tsx` 页面组合，新增 Dashboard、导航、统计卡片、目标清单、建议面板和趋势图组件。
- 内容与数据：在 `src/content/` 中提供统一的 StudyPal mock 数据源，移除首页对旧品牌内容的依赖。
- 样式：复用 `src/index.css` 中的亮暗主题变量；新增布局和图表样式全部使用 Tailwind CSS，不使用内联 `style`。
- SEO：同步更新 `index.html` 的标题、描述和社交分享文案。
- 依赖：预期不新增运行时依赖；趋势图使用原生 SVG。
- 兼容性：继续使用 GitHub Pages 的 `/my-website/` base path，不改变部署方式。

## Out of Scope

- 后端 API，包括 FastAPI 接口、SQLite 数据模型和真实数据请求。
- AI 功能，包括模型调用、对话、建议生成和流式响应。
- 用户认证，包括登录、注册、会话和权限控制。
- 真实数据持久化、账号同步和生产分析数据。
- 课程、笔记、复习、设置等独立页面。

## Rollback

本变更涉及首页替换，属于高风险 UI 重构。实现期间保留旧品牌 Section 组件和内容源码，不执行破坏性删除。若验收失败，恢复 `src/App.tsx` 的原页面组合，并回退 `index.html` 与内容文件即可恢复品牌站；提交后也可通过 revert 该变更对应提交完成整体回滚。
