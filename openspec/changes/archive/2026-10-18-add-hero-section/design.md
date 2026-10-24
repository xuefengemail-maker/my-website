# Design

## Context

- 当前仓库是 Vite + React 19 模板。`src/App.tsx` 只有一个计数器，`src/App.css` 未被引用。
- Tailwind CSS v4 已通过 `@tailwindcss/vite` 接入，`src/index.css` 只有 `@import "tailwindcss";`。
- 项目没有路由、没有主题系统、没有内容模块，也没有测试框架。
- 约束来自 `openspec/config.yaml`：首屏 `< 2 秒`、暗色模式、Tailwind v4。
- 动机与范围见 `proposal.md`；行为契约见 `specs/hero-section/spec.md` 与 `specs/theme-switching/spec.md`。

## Goals / Non-Goals

**Goals:**

- 用最小依赖实现首屏 Hero 和可持久化的主题切换。
- Canvas 粒子层不影响文字首屏渲染，也不影响低端设备交互。
- 主题在首次绘制前生效，避免闪烁。

**Non-Goals:**

- 不引入粒子库、主题库或状态管理库。
- 不实现路由、导航栏、Projects 区块。
- 不改造 GitHub Pages 部署流程。

## Decisions

### 1. 主题用 class 策略，不用纯媒体查询

在 `<html>` 上挂 `.dark`，并在 `src/index.css` 声明 Tailwind v4 variant：

```css
@custom-variant dark (&:where(.dark, .dark *));
```

理由：纯 `prefers-color-scheme` 无法支持手动覆盖。`data-theme` 属性也可行，但需要更多自定义 variant，class 方案改动最小。

### 2. 首屏主题由 `index.html` 内联脚本决定

在 `<head>` 中放一段同步脚本，在首次绘制前读取 `localStorage.theme`，失败时回退到 `matchMedia('(prefers-color-scheme: dark)')`，然后设置 `.dark`。

理由：React 挂载晚于首次绘制，放在组件 effect 里必然闪烁。站点是纯 SPA，没有 SSR，内联脚本是最小方案。

### 3. 主题状态用 Context，不用第三方库

新增 `src/theme/ThemeProvider.tsx` 和 `src/theme/useTheme.ts`。Provider 持有 `theme`，负责写 `localStorage` 和切换 `<html>` class；未手动选择时监听 `matchMedia` 变化。

理由：后续区块都要读取主题。Context 是 React 内置能力，体积为零。`next-themes` 面向 Next.js，不适用于本项目。

### 4. Canvas 粒子层独立为 `HeroBackground`

- 使用 `requestAnimationFrame`，只绘制小圆点。
- 粒子数按视口面积计算并设上限，例如 `min(80, floor(width * height / 18000))`。
- `devicePixelRatio` 上限设为 2。
- `visibilitychange` 隐藏时停止循环；`prefers-reduced-motion: reduce` 时不启动循环，只绘制一帧。
- 尺寸变化用 `ResizeObserver` 重建画布。
- 粒子颜色从 CSS 变量读取，主题切换时重新读取，不重建组件。

替代方案：tsParticles 等库功能多但体积大，违反 2 秒预算；纯 CSS 方案已被用户否决。

### 5. Hero 层级与对比度

- Hero 容器：`min-h-svh`、`isolate`、`overflow-hidden`、`relative`。
- 背景层：`absolute inset-0`、`pointer-events-none`、`aria-hidden="true"`。
- 内容层：`relative z-10`。
- 粒子与文字之间加一层半透明径向渐变遮罩，保证文字对比度 `>= 4.5:1`。

理由：`min-h-svh` 避免移动端地址栏伸缩导致的高度跳动；`isolate` 把 z-index 限制在 Hero 内部。

### 6. CTA 使用原生锚点

渲染 `<a href="#projects">`，不做 JavaScript 滚动。使用浏览器默认的即时跳转，不启用平滑滚动，以遵守 out-of-scope 的“不做动画效果”。未来的 `#projects` 区块负责自己的 `scroll-mt-*`。

理由：无 JS 也能工作，键盘和屏幕阅读器行为由浏览器保证。

### 7. 文案集中在内容模块

新增 `src/content/site.ts`，导出 `siteContent` 对象，包含 `name`、`role`、`tagline`、`ctaLabel`、`ctaHref`。本次使用占位文案。

理由：Hero 只负责布局，后续替换文案不需要改组件。JSON 方案缺少类型收窄，收益不明显。

### 8. 目录结构

```text
src/
  App.tsx
  components/
    Hero.tsx
    HeroBackground.tsx
    ThemeToggle.tsx
  content/
    site.ts
  theme/
    ThemeProvider.tsx
    useTheme.ts
```

文件名遵循 PascalCase（组件）与 camelCase（hook），与现有模板一致。

## Risks / Trade-offs

- **粒子层占用 CPU** → 限制数量与 DPR、页面隐藏时停止、支持减少动态效果。
- **渐变背景降低文字对比度** → 半透明遮罩加主题色 token，两种主题分别验证对比度。
- **内联脚本被 CSP 拦截** → 项目当前没有 CSP；脚本使用 `try/catch`，失败时页面仍可渲染。
- **`localStorage` 被禁用** → 所有读写使用 `try/catch`，切换在当前会话内仍生效。
- **Tailwind v4 dark variant 配置错误** → 实现后分别验证亮色、暗色、系统跟随三种状态。
- **CTA 目标暂不存在** → 本次预期行为；链接不报错，等 Projects 变更补上锚点。

## Open Questions

- 真实名字、职业、一句话介绍尚未提供，先用占位文案，不改变实现方案。
- 粒子密度、速度和颜色需要实现后按视觉效果调整，不改变组件结构。
