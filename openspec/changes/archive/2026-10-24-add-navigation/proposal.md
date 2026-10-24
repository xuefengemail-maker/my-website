# Proposal

## Why

站点目前只有首屏 Hero，访客无法快速跳到项目或联系方式。主题切换按钮只存在于 Hero 右上角，也没有常驻入口。需要固定导航栏建立全站导航，并让主题切换始终可见。

## What Changes

- 新增固定顶部导航栏。左侧显示名字，右侧显示首页、项目、联系我和主题切换。
- 导航链接使用原生锚点，页面启用平滑滚动。`prefers-reduced-motion` 下改为即时跳转。
- 导航栏始终使用半透明背景加 `backdrop-filter` 模糊。浏览器不支持时回退为不透明背景。
- 新增 `#projects` 和 `#contact` 最小占位 section，作为导航目标。
- 主题切换按钮从 Hero 右上角移入导航栏右侧。功能和持久化行为不变。
- 页面锚点增加滚动偏移，避免目标标题被固定导航遮挡。

## Out of Scope

- 不做搜索。
- 不做多级下拉菜单。
- 不做用户登录和注册。
- 不做移动端汉堡菜单。所有宽度使用横向导航。
- 不做当前 section 高亮。
- 不实现 Projects 和 Contact 的完整内容，只做占位。
- 不做联系表单或后端 API。
- 不使用图片 logo。左侧显示文字名字。

## Capabilities

### New Capabilities

- `site-navigation`: 固定导航栏、品牌、链接、平滑滚动、模糊背景、窄屏布局与无障碍。
- `projects-section`: `#projects` 占位区块和标题，为导航与 Hero CTA 提供目标。
- `contact-section`: `#contact` 占位区块和标题，为导航提供目标。

### Modified Capabilities

- `theme-switching`: 主题切换控件的位置从 Hero 右上角改为固定导航栏右侧。

## Impact

- 代码：`src/App.tsx` 加入导航与区块；新增 `Navbar.tsx`、`ProjectsSection.tsx`、`ContactSection.tsx`；`Hero.tsx` 移除 `ThemeToggle`；`ThemeToggle.tsx` 去掉绝对定位；`src/index.css` 增加导航颜色变量、平滑滚动和滚动偏移；`src/content/site.ts` 增加导航项和占位文案。
- 依赖：无新增运行时依赖。
- 现有功能：主题切换功能保留，位置变化。Hero 的 CTA `#projects` 首次获得真实目标。平滑滚动会同时影响 Hero CTA 的跳转方式。
- 性能：`backdrop-filter` 有 GPU 成本。需要限制模糊半径，并在不支持的浏览器使用不透明背景。
- 无障碍：导航使用 `nav` landmark。链接和主题按钮支持键盘，触控区域不小于 44x44 CSS 像素。减少动态效果时禁用平滑滚动。
- 部署：不修改 Vite 与 GitHub Pages 配置。

## Assumptions

- 左侧使用 `siteContent.name` 显示文字名字。
- 占位 section 占满一屏，包含 `h2` 标题和一句占位说明。
- 导航在所有宽度保持横向，链接和按钮紧凑排列。
- 平滑滚动是站点级行为，同时作用于导航链接和 Hero CTA。
