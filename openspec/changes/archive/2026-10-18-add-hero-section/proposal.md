# Proposal

## Why

个人品牌站目前只有 Vite 模板，没有任何品牌内容。需要一个首屏 Hero，让访客在首屏内看到“我是谁、我做什么”，并建立科技感的第一印象。

## What Changes

- 新增全屏 Hero 区块，占满首屏可视高度，内容垂直居中。
- Hero 显示名字、职业和一句话介绍。文案集中在单一内容模块，便于后续替换。
- Hero 背景为 CSS 渐变底叠加 Canvas 粒子层。粒子缓慢移动。
- 新增 CTA 按钮，锚点跳转 `#projects`。
- 新增亮/暗主题切换。默认跟随系统；用户手动选择后写入 `localStorage`。
- 替换 `src/App.tsx` 中的模板计数器，清理模板样式残留。

## Out of Scope

- 不做 UI 动画（入场、悬停、滚动动画）。只有粒子缓慢移动。
- 不做导航栏。
- 不做后端 API。
- 不做 Projects 区块。本次变更中 CTA 指向的 `#projects` 不存在。
- 不做其他页面或区块（About、Contact、Footer）。
- 不做内容管理或国际化。

## Capabilities

### New Capabilities

- `hero-section`: Hero 的首屏布局、文案展示、CTA 锚点行为、粒子背景层行为。
- `theme-switching`: 亮/暗主题的判定、切换、持久化与系统偏好跟随。

### Modified Capabilities

无。项目当前没有已建立的 spec。

## Impact

- 代码：替换 `src/App.tsx`；新增 Hero、主题切换组件与主题 hook；修改 `src/index.css`（Tailwind v4 dark variant 与粒子样式）；修改 `index.html`（首屏主题启动脚本）。
- 依赖：无新增运行时依赖。Canvas 使用浏览器原生 API。
- 现有功能：项目当前只有模板计数器，无真实功能。本变更删除该计数器；`src/App.css` 成为死代码。
- 部署：不修改 Vite 配置与 GitHub Pages 流程。纯 CSS/Canvas 方案不依赖静态资源路径。
- 性能：需要限制粒子数量、设备像素比与帧率，保证首屏加载 `< 2 秒`。
- 无障碍：主题按钮必须支持键盘操作；文字对比度 `>= 4.5:1`；`prefers-reduced-motion` 下粒子静止。

## Assumptions

- 名字、职业和一句话介绍暂无真实内容。先使用占位文案，集中放在内容模块中。
- 主题切换按钮放在 Hero 右上角，因为本次不做导航栏。
- 主题默认跟随系统；用户未手动选择时不写入 `localStorage`。
