# Design

## Context

页面当前顺序是 Hero、Projects、Contact。`Navbar` 从 `siteContent.navItems` 渲染链接，窄屏使用 `min-w-11` 保证 44px 触控区。主题颜色由 `src/index.css` 的 CSS 变量和 `.dark` 覆盖控制。动机见 `proposal.md`。

## Goals / Non-Goals

**Goals:**

- 在 Hero 与 Projects 之间插入两栏“关于我”区域。
- 左侧占位肖像，右侧 3 段简介，下方品牌标签“赋范空间”。
- 导航增加“关于我”，并在 320px 下保持四个链接、名字和主题按钮全部可见。
- 亮色和暗色主题下保持可读。
- 复用现有锚点、平滑滚动和深链接行为。

**Non-Goals:**

- 不实现联系表单。
- 不接入真实照片和真实简介。
- 不引入新依赖、路由、后端或 SSR。
- 不增加额外动画。

## Decisions

### 数据结构

在 `siteContent` 中增加 `about` 对象：

- `title`：区域标题。
- `paragraphs`：类型为 `readonly [string, string, string]` 的三段简介。
- `brand`：品牌标签文本“赋范空间”。
- `photo`：包含 `src` 和 `alt`。

`photo.src` 保存 `public/` 下的相对路径，组件用 `import.meta.env.BASE_URL` 拼接，避免 GitHub Pages 前缀问题。

替代方案：把文案直接写在组件中。放弃原因是站点已有集中内容文件，集中存放便于替换真实内容。

### 页面顺序

`App.tsx` 渲染顺序改为 Hero、AboutSection、ProjectsSection、ContactSection。导航顺序同步为首页、关于我、项目、联系我，与页面滚动顺序一致。

### 两栏布局

`AboutSection` 使用 `grid`：

- 默认单列：照片在上，简介在下。
- `md` 及以上：`grid-cols-[minmax(0,2fr)_minmax(0,3fr)]`，左照片、右简介。
- 两栏下方单独渲染品牌标签。

照片容器使用 `aspect-[4/5]`、`rounded-2xl` 和 `object-cover`，加载失败时比例不变。简介列限制可读宽度，段落之间使用 `space-y-4`。

### 占位肖像

在 `public/about/profile.svg` 新增 800x1000 的占位肖像。SVG 内标注“示例照片”。`<img>` 使用 `loading="lazy"`、`decoding="async"`、`width="800"`、`height="1000"` 和描述性 `alt`。

替代方案：使用 CSS 渐变占位。用户已选择仓库内占位图，后续可直接替换文件。

### 品牌标签

两栏下方渲染一个非交互 `<p>`，内部用 `inline-flex` 徽标样式显示“赋范空间”。标签使用文本，不使用图片，保证屏幕阅读器可读。

### 主题变量

在 `src/index.css` 的 `:root` 和 `.dark` 增加：

- `--about-photo-bg`
- `--about-photo-border`
- `--about-badge-bg`
- `--about-badge-border`
- `--about-badge-text`

组件用 Tailwind 任意值引用，例如 `border-[var(--about-photo-border)]`。不写内联样式。

### 导航窄屏适配

新增第四个链接后，320px 可能溢出。调整 `Navbar`：

- 名字字号改为 `text-xs sm:text-sm`。
- 链接组间距改为 `gap-0 sm:gap-1`。
- 链接内边距改为 `px-1 sm:px-3`。
- 保留 `min-h-11 min-w-11`，维持 44px 触控区域。
- 容器内边距改为 `px-3 sm:px-6`。

实现后在 320px、360px、390px 检查无横向滚动，名字和四个链接都可见。

### 锚点与深链接

不修改 `App.tsx` 的 hash 定位逻辑和 `scroll-padding-top: 5rem`。`#about` 自动复用现有行为。验收时检查首次加载和刷新。

### 无障碍

- 区域使用 `aria-labelledby` 指向 `h2`。
- 照片 `alt` 描述“示例个人肖像照片”。
- 品牌标签是文本，不是图片。
- 页面唯一 `h1` 仍由 Hero 提供。

## Risks / Trade-offs

- [320px 下四项导航可能溢出] → 压缩间距、缩小名字字号，保留 44px 触控区；在多档窄屏验证。
- [占位肖像被误认为真实照片] → SVG 内标注“示例照片”，README 写明替换方式。
- [三段简介长度不一导致两栏高度不平衡] → 简介列使用可读宽度和段落间距，照片列顶部对齐。
- [暗色下照片边框和标签对比不足] → 在 `.dark` 中单独定义变量，并实测对比度。
- [品牌标签被做成图片] → 明确使用文本，避免屏幕阅读器丢失信息。

## Migration Plan

无数据迁移。部署时随下一次构建发布。回滚时恢复 `App.tsx`、`Navbar.tsx`、`site.ts`、`index.css`，删除 `AboutSection.tsx` 和 `public/about/`。

## Open Questions

无。
