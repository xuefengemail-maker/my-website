# Tasks

## 1. 数据与素材

- [x] 1.1 在 `public/projects/` 新增 4 张 1200x750 的 SVG 占位截图；验证：文件存在，`npm run preview` 下 `/my-website/projects/` 路径返回 200。
- [x] 1.2 在 `src/content/site.ts` 定义 `Project` 类型并加入 4 个示例项目（名称、简介、截图路径、GitHub 链接）；验证：`npm run build` 通过，数组长度为 4。
- [x] 1.3 在 `src/index.css` 的 `:root` 和 `.dark` 增加卡片背景、边框、阴影、链接颜色变量；验证：构建后 CSS 同时包含亮色和暗色两套变量。
- [x] 1.4 更新 `README.md`，说明项目数据位置、截图替换方式和 GitHub 链接字段；验证：按文档可以找到并替换示例数据。
- [x] 1.5 汇报 Phase 1 变更，直接进入 Phase 2（用户已授权不逐 Phase 暂停）。

## 2. 卡片布局与交互

- [x] 2.1 重写 `src/components/ProjectsSection.tsx`：保留 `id="projects"` 和 `h2`，用 `<ul>` 网格渲染卡片；每张卡片包含 `loading="lazy"` 截图、`h3` 名称、简介和 GitHub 链接；验证：`npm run build`、`npm run lint` 通过。
- [x] 2.2 增加悬浮微特效：位移、阴影和边框过渡；`prefers-reduced-motion: reduce` 时关闭位移；验证：正常模式下悬浮有位移，模拟减少动态效果时卡片不位移。
- [x] 2.3 检查响应式布局：320px 单列、768px 两列、1280px 四列；验证：三档视口均无横向滚动，链接和文字完整可见。
- [x] 2.4 汇报 Phase 2 变更，直接进入 Phase 3（用户已授权不逐 Phase 暂停）。

## 3. 验收与汇总

- [x] 3.1 验证锚点：点击 Hero CTA 和导航“项目”都到达 `#projects`，section 顶部距视口 80px，标题完整可见且不被固定导航遮挡；验证：浏览器实测两种入口。
- [x] 3.2 验证深链接：直接打开 `/my-website/#projects`，渲染后定位到项目展示区；验证：刷新和首次加载各一次。
- [x] 3.3 验证无障碍：Tab 依次聚焦每张卡片的 GitHub 链接，焦点指示可见；GitHub 链接可打开仓库地址并在新标签页打开；验证：键盘走查和 DOM 检查。
- [x] 3.4 验证主题与异常：亮色/暗色下卡片文字对比度不低于 4.5:1；阻断图片请求时 `alt` 文本可见且布局不塌陷；验证：浏览器切换主题和 DevTools 阻断图片。
- [x] 3.5 验证性能：所有卡片图片带 `loading="lazy"`；`npm run preview` 下限速，首屏 2 秒内可见；验证：网络面板和构建产物。
- [x] 3.6 汇总最终变更与验收结果，并完成三维验证（完整性、正确性、一致性）。

## Workflow follow-up

- 用户确认完成后，运行 `/opsx:archive add-project-section` 并同步 `projects-section` 主 spec。
- 归档前确认 `openspec validate add-project-section --strict` 通过。
