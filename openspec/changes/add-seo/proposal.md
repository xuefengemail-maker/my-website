# Proposal

## Why

站点当前是客户端渲染 SPA。`index.html` 的标题是通用的 `my-website`，没有 description、canonical、Open Graph 或 Twitter Card。搜索结果和社交分享无法正确展示站点身份。站点也没有 `robots.txt`。语义结构基本合规，但 Hero 区域缺少可访问名称。

## What Changes

- 在 `index.html` 设置页面标题、description 和 `meta robots`（`index, follow`）。
- 增加 `link rel="canonical"`，指向占位公开 URL `https://your-username.github.io/my-website/`。
- 增加 Open Graph 和 Twitter Card 元数据，使用绝对 URL 和静态标签。
- 新增 `public/og-image.png`，尺寸 1200x630，作为社交分享占位预览图。
- 新增 `public/robots.txt`，允许通用爬虫和 Googlebot 抓取。
- 执行语义化 HTML 审查，修正 Hero 区域缺少可访问名称的问题，并验证 `lang`、`nav`、`main`、标题层级、图片 alt 和装饰层隐藏。
- 在 README 写明月度信息的替换位置，包括公开 URL 和社交预览图。

没有 **BREAKING** 变更。

## Capabilities

### New Capabilities

- `seo-foundation`: 定义页面标题与描述、社交分享元数据、规范化 URL、爬虫索引和文档语义结构。

### Modified Capabilities

无。

## Impact

- 代码与资源：`index.html`、`public/robots.txt`、`public/og-image.png`、`src/components/Hero.tsx`、`README.md`。
- 现有区块：Hero 只增加可访问名称，视觉不变；Projects、Contact、About 不改。
- 现有导航：不变。当前活跃变更 `add-about-section` 也未完成，本变更不修改它的文件。
- 搜索引擎：静态 HTML 中包含 title 和 description。社交爬虫不执行 JavaScript，因此 OG/Twitter 标签必须写在静态 HTML 中。
- robots.txt 限制：GitHub Pages 项目站点的 `robots.txt` 位于 `/my-website/robots.txt`，不是主机根目录。标准爬虫只读取主机根目录的 robots.txt。页面级 `meta robots` 是项目站点下实际生效的索引控制。设计文档会记录该限制。
- 性能：OG 图片只供爬虫读取，页面不加载，不影响首屏 2 秒目标。
- 无障碍：Hero 成为有名称的 region；其余地标、标题层级和 alt 已在现有实现中满足。
- 不新增依赖、不引入 SSR、不生成 sitemap。

## Out of Scope

- `sitemap.xml`。
- JSON-LD 或其它结构化数据。
- SSR、预渲染或构建时注入动态元数据。
- 自定义域名配置或主机根目录的 robots.txt。
- Google Search Console、分析工具或提交索引。
- 联系我的表单。
- 视觉改版或新增页面区块。
