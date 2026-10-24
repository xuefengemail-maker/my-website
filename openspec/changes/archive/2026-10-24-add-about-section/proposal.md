# Proposal

## Why

站点目前从 Hero 直接进入项目展示，访客看不到个人背景和品牌信息。需要增加“关于我”区域，说明身份、经历和品牌，帮助访客建立信任。

## What Changes

- 在 Hero 与 Projects 之间新增 `id="about"` 的“关于我”区域。
- 宽屏为两栏：左侧显示肖像照片，右侧显示 3 段个人简介。
- 两栏下方显示品牌标签“赋范空间”。
- 顶部导航新增“关于我”链接。导航变为首页、关于我、项目、联系我四项，锚点为 `#hero`、`#about`、`#projects`、`#contact`。
- 调整导航在 320px 下的间距和名字字号，保证四项链接、名字和主题按钮全部可见。
- 示例简介和品牌文案集中存放在 `src/content/site.ts`；占位肖像放在 `public/about/`。
- 照片使用 lazy loading。

没有 **BREAKING** 变更。

## Capabilities

### New Capabilities

- `about-section`: 定义“关于我”区域的照片、3 段简介、品牌标签、响应式布局和无障碍要求。

### Modified Capabilities

- `site-navigation`: 导航链接从三项变为四项，新增 `#about` 锚点，并更新 320px 布局要求。

## Impact

- 代码：新增 `src/components/AboutSection.tsx`；修改 `src/App.tsx`、`src/content/site.ts`、`src/components/Navbar.tsx`、`src/index.css`；新增 `public/about/` 占位照片。
- 现有区块：Hero、Projects、Contact 的内容和顺序关系不变；About 插入 Hero 与 Projects 之间。
- 锚点行为：继续复用 80px 滚动偏移、平滑滚动和深链接首次定位；新增 `#about`。
- 导航：四项链接在 320px 下必须无横向滚动，触控区域保持 44x44 CSS 像素。
- 主题：照片边框和品牌标签必须同时支持亮色和暗色。
- 无障碍：照片有描述性 `alt`；区域使用 `h2`；导航链接可键盘聚焦。
- 性能：只增加一张 lazy loading 图片，首屏少于 2 秒的目标不变。
- 联系区：本次不修改 `contact-section`，不增加联系表单。

## Out of Scope

- 联系我的表单。
- 真实个人照片和真实简介内容；本次使用占位照片和示例文案。
- 新增路由、后端服务、SSR 或新依赖。
- 额外的入场动画或滚动特效。
