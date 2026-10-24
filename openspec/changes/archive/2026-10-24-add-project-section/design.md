# Design

## Context

`ProjectsSection` 当前只有标题和占位说明。站点数据集中在 `src/content/site.ts`，主题颜色由 `src/index.css` 中的 CSS 变量和 `.dark` 覆盖控制。Tailwind CSS v4 通过 `@custom-variant dark` 支持暗色变体。锚点偏移和深链接定位已经由 `scroll-padding-top: 5rem` 与 `App.tsx` 处理。动机见 `proposal.md`。

## Goals / Non-Goals

**Goals:**

- 用响应式卡片网格替换占位内容。
- 用集中数据驱动卡片，至少 4 个示例项目。
- 亮色和暗色主题下保持可读和一致的视觉。
- 卡片悬浮有微特效，并尊重减少动态效果。
- 保留现有锚点、平滑滚动和深链接行为。

**Non-Goals:**

- 不实现详情页、搜索、路由或后端。
- 不接入真实项目数据。
- 不引入新依赖。

## Decisions

### 数据结构

在 `siteContent.projects` 中增加 `items` 数组，每个项目包含 `name`、`description`、`screenshot`、`href`。`screenshot` 保存 `public/` 下的相对路径，组件用 `import.meta.env.BASE_URL` 拼接，避免 GitHub Pages 的 `/my-website/` 前缀出错。

替代方案：把项目数据直接写在组件中。放弃原因是站点已有集中内容文件，集中存放便于以后替换真实内容。

### 卡片布局

使用 `<ul>` 语义列表，每项是 `<li>` 内的 `<article>`。网格为 `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`。卡片使用 `flex h-full flex-col`，让简介长短不一时底部链接仍对齐。

替代方案：固定 2x2 网格。放弃原因是在宽屏上浪费空间，4 列更符合项目展示。

### 截图占位

在 `public/projects/` 新增 4 张 SVG 占位截图，尺寸 1200x750。`<img>` 使用 `loading="lazy"`、`decoding="async"`、`width`、`height` 和描述性 `alt`。外层使用 `aspect-[16/10]` 固定比例，图片加载失败时布局不塌陷。

替代方案：使用纯 CSS 渐变。用户已选择仓库内占位图，后续可以直接替换文件。

### 悬浮微特效

卡片使用 `transition-[transform,box-shadow,border-color] duration-200`，悬浮时 `hover:-translate-y-1` 并加深阴影和边框。`motion-reduce:hover:translate-y-0` 关闭位移，保留阴影和边框变化。触屏设备不依赖悬浮也能看到全部内容。

替代方案：使用 JavaScript 指针事件。放弃原因是 CSS 足够，且不会增加事件处理复杂度。

### 主题变量

在 `src/index.css` 的 `:root` 和 `.dark` 中增加卡片背景、边框、阴影和链接颜色变量。组件用 Tailwind 任意值引用，例如 `bg-[var(--card-bg)]`，保持与现有 Hero、Navbar 一致的写法。不在组件中写内联样式。

### Hero CTA

`siteContent.ctaHref` 已经是 `#projects`，不需要修改 `Hero.tsx`。实现阶段只做回归验证：点击 CTA 后标题不被固定导航遮挡。

## Risks / Trade-offs

- [4 列在 1280px 附近可能压窄卡片] → 只在 `xl` 断点启用 4 列，320px、768px、1280px 逐档检查。
- [占位图被误认为真实项目截图] → 图片和 alt 明确标注“示例项目”；README 或数据文件注明后续替换。
- [悬浮效果在触屏不可见] → 卡片内容不依赖悬浮，默认状态完整显示。
- [SVG 占位图体积过小，看起来不够真实] → 仅用于布局验证，真实截图后续直接替换同名文件。
- [项目简介过长导致卡片高度差] → 使用 `h-full`、`mt-auto` 和自动换行，保持链接底部对齐。

## Migration Plan

无数据迁移。部署时随下一次构建发布。若需要回滚，恢复 `ProjectsSection.tsx`、`site.ts`、`index.css` 并删除 `public/projects/` 下的占位图。

## Open Questions

无。
