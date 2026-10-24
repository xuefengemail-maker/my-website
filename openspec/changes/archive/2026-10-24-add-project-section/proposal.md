# Proposal

## Why

个人品牌站的 Projects 区域目前只有占位文案。访客看不到作品，导航“项目”和 Hero CTA 都落在空区块上，站点无法展示能力。现在需要把它改造成可浏览的项目展示区。

## What Changes

- 将现有 `#projects` 占位区块改造为项目卡片展示区，位置保持在 Hero 下方。
- 每张卡片包含：项目截图、项目名称、项目简介、GitHub 链接。
- 最少展示 4 个项目。示例项目数据集中存放在 `src/content/site.ts`。
- 卡片在鼠标悬浮时显示微特效。启用 `prefers-reduced-motion: reduce` 时，不播放位移动画。
- 确认 Hero CTA 的锚点指向项目展示区。当前 `ctaHref` 已是 `#projects`，本次纳入验收。
- 在 `public/` 增加 4 张占位截图；所有图片使用 lazy loading。

没有 **BREAKING** 变更。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `projects-section`: 用项目卡片展示需求替换占位需求，新增卡片内容、项目数量、悬浮效果和 Hero CTA 锚点要求。

## Impact

- 代码：`src/components/ProjectsSection.tsx`、`src/content/site.ts`、`src/index.css`，以及 `public/` 下新增的占位截图。
- 现有导航：“项目”链接继续指向 `#projects`；`site-navigation` 的需求不变。
- 现有锚点行为：80px 偏移、平滑滚动、深链接首次定位保持不变。
- 主题：卡片样式必须同时支持亮色和暗色。
- 无障碍：卡片链接支持键盘聚焦并显示焦点指示；悬浮效果不是唯一的信息载体。
- 性能：图片 lazy loading；首屏加载少于 2 秒的目标不变。
- 不修改 `hero-section`、`theme-switching`、`contact-section` 的需求。

## Out of Scope

- 项目详情页。
- 项目搜索功能。
- 接入真实项目数据或远程接口；本次只使用示例数据。
- 新增路由、后端服务或 SSR。
