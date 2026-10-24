# Design

## Context

站点使用 Vite + React 客户端渲染。`index.html` 是唯一的静态 HTML 入口，社交爬虫不会执行 React。当前 `index.html` 只有通用标题和 favicon，没有 description、canonical、Open Graph 或 Twitter Card。页面结构已使用 `lang="zh-CN"`、`nav`、`main`、`h1/h2/h3`，Projects 和 Contact 使用 `aria-labelledby`，Canvas 已设置 `aria-hidden`。动机见 `proposal.md`。

## Goals / Non-Goals

**Goals:**

- 在静态 HTML 中提供 title、description、canonical、OG 和 Twitter 标签。
- 提供 1200x630 社交预览占位图。
- 提供 robots.txt 和页面级 meta robots。
- 审查并修正语义化 HTML 的真实问题。
- 记录 GitHub Pages 项目路径下 robots.txt 的限制。

**Non-Goals:**

- 不生成 sitemap.xml。
- 不添加 JSON-LD。
- 不引入 SSR、预渲染或动态元数据注入。
- 不配置自定义域名或主机根目录 robots.txt。
- 不添加页脚、跳过链接或新页面区块。

## Decisions

### 静态元数据

所有 SEO 标签直接写入 `index.html`。不使用运行时 `document.title` 或 React Helmet。原因：社交爬虫不执行 JavaScript，静态标签是唯一可靠来源。

标题：`你的名字 · 前端工程师`。
描述：`你的名字的个人网站。前端工程师，用清晰的界面和可靠的代码，把想法变成产品。`
canonical 与 `og:url`：`https://your-username.github.io/my-website/`。
`og:site_name`：`你的名字`。
`og:locale`：`zh_CN`。
`og:type`：`website`。

替代方案：用 Vite 插件从 `site.ts` 注入元数据。放弃原因是当前规模不需要额外构建逻辑；README 会提示同步内容。

### 社交预览图

新增 `public/og-image.png`，尺寸 1200x630，使用品牌渐变和文字“你的名字 · 前端工程师”“赋范空间”。使用一次性的 Python + Pillow 脚本生成，生成后把 PNG 作为静态资源提交。页面不加载该图片。

OG 标签包含绝对 URL、宽高和 alt：
`https://your-username.github.io/my-website/og-image.png`。

替代方案：使用 SVG。放弃原因是部分社交平台不接受 SVG 预览图。

### robots.txt 与 meta robots

新增 `public/robots.txt`：

```text
User-agent: *
Allow: /

User-agent: Googlebot
Allow: /
```

页面 `<head>` 增加 `<meta name="robots" content="index, follow" />`。

GitHub Pages 项目站点的 `robots.txt` 部署在 `/my-website/robots.txt`，不是 `username.github.io/robots.txt`。标准爬虫只读取主机根目录的 robots.txt。因此：

- 页面级 `meta robots` 是项目站点下实际生效的索引控制。
- `public/robots.txt` 为将来迁移到自定义域名或根站点保留。
- README 和验收报告必须说明该限制，不能声称子路径 robots.txt 已被 Google 采用。

替代方案：在用户根站点仓库放置 robots.txt。超出本仓库范围，列入 out-of-scope。

### 语义化 HTML 审查

审查清单：

- `html lang="zh-CN"`。
- 1 个 `nav` 地标，带可读名称。
- 1 个 `main` 地标。
- 页面只有 1 个 `h1`，区块使用 `h2`，项目卡片使用 `h3`。
- 每个 section 有可访问名称。
- 内容图片有描述性 `alt`。
- 装饰 Canvas 和渐变层对辅助技术隐藏。
- 页内链接使用原生 `<a>`，外部链接提示新标签页。

审查结果：现有结构已满足大部分要求。发现一个真实问题：Hero 的 `<section>` 没有可访问名称。修正方式：

- 给 Hero 的 `h1` 增加 `id="hero-title"`。
- 给 Hero 的 `<section>` 增加 `aria-labelledby="hero-title"`。

不增加页脚或跳过链接，它们不在本次范围。

### 元数据一致性

`index.html` 的 title、description、站点名和 `site.ts` 中的 `name`、`role`、`tagline` 必须保持一致。README 增加同步说明。验收时用命令比较关键文本。

### 公开 URL 占位

公开 URL 使用 `https://your-username.github.io/my-website/`。发布前必须替换为真实 GitHub 用户名。README 中标记为必须替换项。

## Risks / Trade-offs

- [占位 URL 被直接发布] → README 和验收任务明确检查 `your-username` 是否仍存在。
- [robots.txt 在项目子路径不生效] → 增加 meta robots，并在文档和验收报告中说明限制。
- [静态元数据与 `site.ts` 漂移] → README 写明同步点，验收时比较标题、描述和站点名。
- [社交平台缓存旧预览] → 替换 URL 或图片后需要重新抓取；本次不接入平台调试工具。
- [中文 OG 图片字体缺失] → 生成后人工检查 PNG；字体不可用时退回几何图形占位，不阻塞页面。
- [meta 标签重复或冲突] → 验收时检查每个关键标签只出现一次。

## Migration Plan

无数据迁移。发布时随构建产物上传 `robots.txt` 和 `og-image.png`。回滚时恢复 `index.html` 和 `Hero.tsx`，删除新增的 public 文件。

## Open Questions

无。
