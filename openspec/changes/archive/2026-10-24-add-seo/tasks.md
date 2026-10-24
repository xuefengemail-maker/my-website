# Tasks

## 1. 静态元数据

- [x] 1.1 在 `index.html` 增加 title、description、`meta robots`、canonical、Open Graph 和 Twitter Card 标签，公开 URL 使用 `https://your-username.github.io/my-website/`；验证：每个关键标签只出现一次，构建通过。
- [x] 1.2 生成 `public/og-image.png`，尺寸 1200x630，包含品牌渐变和文字；验证：`file` 显示 PNG，`sips` 显示 1200x630。
- [x] 1.3 更新 `README.md`，说明公开 URL 替换、元数据同步、预览图替换和 robots.txt 子路径限制；验证：按文档能找到每个替换点。
- [x] 1.4 汇报 Phase 1 变更，直接进入 Phase 2（用户已授权自动执行）。

## 2. 爬虫与语义

- [x] 2.1 新增 `public/robots.txt`，允许通用爬虫和 Googlebot；验证：preview 下 `/my-website/robots.txt` 返回 200，内容包含 `Allow: /`，无 `Disallow: /`。
- [x] 2.2 修正 Hero 语义：给 `h1` 增加 `id="hero-title"`，给 section 增加 `aria-labelledby="hero-title"`；验证：`npm run build`、`npm run lint` 通过，DOM 中 Hero region 有名称。
- [x] 2.3 审查语义化 HTML：检查 `lang`、`nav`、`main`、唯一 `h1`、区块 `h2`、卡片 `h3`、图片 alt、装饰层 `aria-hidden`；验证：输出审查结果，并修正发现的具体问题。
- [x] 2.4 汇报 Phase 2 变更，直接进入 Phase 3（用户已授权自动执行）。

## 3. 验收与汇总

- [x] 3.1 验证静态元数据：禁用 JavaScript 或直接 `curl` 原始 HTML，title、description、canonical、OG 和 Twitter 标签均存在；canonical 与 `og:url` 完全相同。
- [x] 3.2 验证爬虫配置：`robots.txt` 返回 200 和文本类型；页面包含 `index, follow`；验收报告记录项目子路径下 robots.txt 不生效的限制。
- [x] 3.3 验证社交预览图：`/my-website/og-image.png` 返回 200 和图片类型；尺寸为 1200x630；`og:image` 使用绝对 URL。
- [x] 3.4 验证语义结构：页面 1 个 `nav`、1 个 `main`、1 个 `h1`；每个 section 有可访问名称；内容图片有 alt；Canvas 为 `aria-hidden="true"`。
- [x] 3.5 验证占位 URL：确认 `your-username` 仍存在时 README 有醒目替换提示；验收报告列出发布前必须替换的项。
- [x] 3.6 验证 out-of-scope：不存在 `sitemap.xml`、JSON-LD、SSR、联系表单或新依赖；验证：文件搜索和 `package.json` 检查。
- [x] 3.7 汇总最终变更与验收结果，完成三维验证（完整性、正确性、一致性），等待用户确认完成。

## Workflow follow-up

- 用户确认完成后，运行 `/opsx:archive add-seo` 并同步 `seo-foundation` 主 spec。
- 归档前确认 `openspec validate add-seo --strict` 通过。
