# Tasks

## 1. 内容与素材

- [ ] 1.1 在 `public/about/` 新增 800x1000 的 SVG 占位肖像；验证：文件存在，preview 下 `/my-website/about/profile.svg` 返回 200。
- [ ] 1.2 在 `src/content/site.ts` 增加 `about` 数据和“关于我”导航项；验证：`npm run build` 通过，`paragraphs` 长度为 3，`navItems` 长度为 4。
- [ ] 1.3 在 `src/index.css` 的 `:root` 和 `.dark` 增加照片边框、背景和品牌标签变量；验证：构建后 CSS 同时包含亮色和暗色两套变量。
- [ ] 1.4 更新 `README.md`，说明简介、品牌标签和占位照片的替换方式；验证：按文档可以找到并替换数据。
- [ ] 1.5 汇报 Phase 1 变更，等待用户确认后进入 Phase 2。

## 2. 组件与导航

- [ ] 2.1 新增 `src/components/AboutSection.tsx`：`id="about"`、`h2`、两栏网格、left photo with `loading="lazy"` 和 `alt`、3 段简介、下方“赋范空间”文本标签；验证：`npm run build`、`npm run lint` 通过。
- [ ] 2.2 在 `src/App.tsx` 把 `AboutSection` 插入 Hero 与 Projects 之间；验证：构建通过，DOM 顺序为 hero、about、projects、contact。
- [ ] 2.3 调整 `src/components/Navbar.tsx` 的窄屏间距和名字字号，容纳四个链接；验证：320px、360px、390px 均无横向滚动，名字、四个链接和主题按钮可见，触控区不小于 44x44。
- [ ] 2.4 汇报 Phase 2 变更，等待用户确认后进入 Phase 3。

## 3. 验收与汇总

- [ ] 3.1 验证锚点：点击导航“关于我”到达 `#about`；直接打开 `/my-website/#about` 后首次加载和刷新均定位，标题完整可见且不被固定导航遮挡；验证：浏览器实测。
- [ ] 3.2 验证无障碍：页面只有 1 个 `h1`，“关于我”为 `h2`；照片有描述性 `alt`；品牌标签是文本；Tab 顺序为四个导航链接、主题按钮、页面内容；焦点指示可见。
- [ ] 3.3 验证主题：亮色和暗色下简介正文对比度不低于 4.5:1，照片边框和品牌标签可见；验证：浏览器切换主题并计算对比度。
- [ ] 3.4 验证照片异常：阻断 `/about/profile.svg` 请求后，`alt` 文本可见，照片区域保持 4:5 比例，页面不塌陷；验证：DevTools 阻断请求。
- [ ] 3.5 验证性能：照片带 `loading="lazy"`；preview 下限速，首屏 2 秒内可见；验证：网络面板和构建产物。
- [ ] 3.6 验证 out-of-scope：About 区域不存在表单、提交按钮、路由或搜索入口；验证：DOM 检查。
- [ ] 3.7 汇总最终变更与验收结果，完成三维验证（完整性、正确性、一致性），等待用户确认完成。

## Workflow follow-up

- 用户确认完成后，运行 `/opsx:archive add-about-section` 并同步 `about-section` 与 `site-navigation` 主 spec。
- 归档前确认 `openspec validate add-about-section --strict` 通过。
