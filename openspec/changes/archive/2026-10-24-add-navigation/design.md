# Design

## Context

- `src/App.tsx` 目前只渲染 `Hero`。
- `ThemeToggle` 使用绝对定位固定在 Hero 右上角。
- `src/index.css` 已有亮/暗主题变量、`@custom-variant dark` 和 Hero 配色。
- 已归档的 `theme-switching` 主 spec 规定主题按钮位于 Hero 右上角。
- 约束：Tailwind CSS v4、无新增运行时依赖、首屏 `< 2 秒`、支持减少动态效果。
- 动机见 `proposal.md`；行为契约见 `specs/site-navigation/spec.md`、`specs/projects-section/spec.md`、`specs/contact-section/spec.md` 和 `specs/theme-switching/spec.md`。

## Goals / Non-Goals

**Goals:**

- 用固定导航栏建立首页、项目、联系我三个入口。
- 平滑滚动在正常模式下生效，在减少动态效果时退化为即时跳转。
- 导航栏模糊效果有明确的降级路径。
- 预留 Projects 和 Contact 的稳定锚点。

**Non-Goals:**

- 不实现搜索、多级菜单、登录注册。
- 不实现移动端汉堡菜单。
- 不实现当前 section 高亮。
- 不填充 Projects 和 Contact 的真实内容。

## Decisions

### 1. 使用 `fixed`，不用 `sticky`

导航栏使用 `fixed inset-x-0 top-0 z-50 h-16`。

理由：需求明确要求固定在顶部。`sticky` 会占据文档流，并改变 Hero 的 `min-h-svh` 计算。固定定位更直接。代价是必须补偿滚动偏移。

替代方案：`sticky top-0`。省去滚动偏移，但 Hero 首屏高度会受导航高度影响。

### 2. 滚动偏移放在 `html` 上

在 `src/index.css` 设置：

```css
html {
  scroll-padding-top: 5rem;
}
```

理由：导航高 `4rem`，额外留 `1rem` 间距。所有锚点自动生效，不需要每个 section 重复 `scroll-mt-*`。

替代方案：每个 section 加 `scroll-mt-20`。重复且容易漏。

### 3. 平滑滚动使用 CSS

```css
html {
  scroll-behavior: smooth;
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
}
```

理由：原生锚点即可工作，不需要 JavaScript 事件处理。站点本身是客户端渲染 SPA，禁用 JavaScript 时不渲染页面。

首次加载时，浏览器定位 hash 发生在 React 渲染 section 之前。`App` 在挂载后读取 `location.hash`，用 `document.getElementById()` 找到目标并调用 `scrollIntoView()`。`scroll-padding-top` 和减少动态效果规则继续生效。

替代方案：`scrollIntoView({ behavior: 'smooth' })`。需要额外处理减少动态效果，且 CSS 已经提供平滑滚动。

### 4. 模糊背景用 Tailwind 工具类加降级

- 默认：`bg-[var(--nav-bg-solid)]`。
- 支持 `backdrop-filter` 时：`supports-[backdrop-filter:blur(1px)]:bg-[var(--nav-bg)]` 和 `supports-[backdrop-filter:blur(1px)]:backdrop-blur-md`。
- 新增亮/暗主题变量：`--nav-bg`、`--nav-bg-solid`、`--nav-border`、`--nav-text`、`--nav-text-hover`。

理由：`supports-` variant 在 CSS 层完成检测，不需要 JS。默认不透明，保证旧浏览器可读。

替代方案：始终半透明。旧浏览器会把内容透出来，降低可读性。

### 5. 主题按钮移入导航栏

`ThemeToggle` 去掉 `absolute right-4 top-4 z-20`，改为在导航栏 flex 布局中参与排列。按钮放在三个链接之后。

理由：固定导航会覆盖 Hero 右上角。移入导航栏后，按钮始终可见，也避免 z-index 冲突。

替代方案：保留在 Hero，导航栏右侧留空。滚动后按钮消失。

### 6. 窄屏保持横向导航

所有宽度使用同一套横向布局。链接使用紧凑内边距，最小触控高度 `2.75rem`。名字在极窄屏可 `truncate`。

理由：三个链接很短，320px 下可以放下。汉堡菜单不在本次范围。

替代方案：`sm` 以下折叠为菜单按钮。需要额外状态、焦点管理和动画，超出范围。

### 7. 占位 section 占满一屏

`ProjectsSection` 和 `ContactSection` 使用 `min-h-svh`，内容为 `h2` 标题加一句占位说明，id 分别为 `projects` 和 `contact`。

理由：保证平滑滚动有足够距离，也为后续内容预留位置。

### 8. 内容集中在 `siteContent`

在 `src/content/site.ts` 增加：

- `navItems`: `首页`、`项目`、`联系我` 及对应 `href`。
- `projects`: 标题和占位说明。
- `contact`: 标题和占位说明。

理由：导航和区块文案不写死在组件中，后续替换不需要改布局。

### 9. 组件结构

```text
src/
  components/
    Navbar.tsx
    Hero.tsx              # 移除 ThemeToggle
    ThemeToggle.tsx       # 去掉绝对定位
    ProjectsSection.tsx
    ContactSection.tsx
  content/
    site.ts
```

`App.tsx` 渲染顺序：`Navbar`、`Hero`、`ProjectsSection`、`ContactSection`。

### 10. 无障碍实现

- 导航使用 `<nav aria-label="主导航">`。
- 链接使用原生 `<a>`，焦点环复用 `--hero-focus-ring`。
- 主题按钮保留 `aria-label="暗色模式"` 和 `aria-pressed`。
- 占位 section 使用 `h2`，页面保持唯一 `h1`。

## Risks / Trade-offs

- **`backdrop-filter` 占用 GPU** → 导航高度只有 `4rem`，模糊半径用 `md`（12px），并提供不透明降级。
- **固定导航遮挡锚点标题** → `scroll-padding-top: 5rem`，并在浏览器验收中检查 `#projects` 和 `#contact`。
- **320px 下导航拥挤** → 紧凑间距、名字截断、44px 触控高度，并在 320px 视口验收。
- **平滑滚动影响 Hero CTA** → 这是站点级行为，符合新需求；减少动态效果时自动关闭。
- **主题按钮移动改变已归档 spec** → 本变更包含 `theme-switching` 的 MODIFIED delta，归档时同步主 spec。
- **占位区块内容空洞** → 明确标注为占位，后续变更补充。

## Open Questions

- 真实 logo 资源和完整 Projects/Contact 文案尚未提供。本次使用文字名字和占位文案，不改变实现方案。
