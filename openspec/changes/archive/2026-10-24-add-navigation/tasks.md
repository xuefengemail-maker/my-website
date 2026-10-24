# Tasks

## 1. 导航栏与主题按钮

- [x] 1.1 在 `src/content/site.ts` 增加 `navItems`、Projects 和 Contact 的占位文案；验证：`npm run build` 通过，组件中不再硬编码导航标签。
- [x] 1.2 在 `src/index.css` 增加导航主题变量、`scroll-behavior: smooth`、减少动态效果分支和 `scroll-padding-top: 5rem`；验证：构建后 CSS 包含这些规则。
- [x] 1.3 新增 `src/components/Navbar.tsx`，实现固定定位、名字、三个链接、`nav` landmark、44px 触控区和模糊背景降级；验证：桌面与 320px 下无横向滚动，链接可聚焦。
- [x] 1.4 把 `ThemeToggle` 移入导航栏，并从 `Hero.tsx` 移除；验证：主题切换、刷新保留、键盘操作正常，按钮不遮挡链接。
- [x] 1.5 汇报 Phase 1 变更，等待用户确认后进入 Phase 2。

## 2. 占位区块与页面结构

- [x] 2.1 新增 `src/components/ProjectsSection.tsx`，包含 `id="projects"`、`h2`、占位说明和 `min-h-svh`；验证：导航“项目”和 Hero CTA 都能到达，标题不被导航遮挡。
- [x] 2.2 新增 `src/components/ContactSection.tsx`，包含 `id="contact"`、`h2`、占位说明和 `min-h-svh`；验证：导航“联系我”能到达，页面没有表单或提交控件。
- [x] 2.3 更新 `src/App.tsx` 渲染导航、Hero 和两个区块；验证：`npm run build`、`npm run lint` 通过，页面只有一个 `h1`。
- [x] 2.4 汇报 Phase 2 变更，等待用户确认后进入 Phase 3。

## 3. 验收与文档

- [x] 3.1 运行 `npm run build`、`npm run lint` 和 `npm run preview`；验证：全部成功，控制台无报错。
- [x] 3.2 浏览器验收：滚动时导航固定、三个锚点偏移正确、320px 无横向滚动、Tab 顺序正确、导航链接为原生 `a` 元素且不依赖 JS 事件处理、正常模式平滑滚动、减少动态效果时即时跳转；验证：全部符合 `specs/` 场景。
- [x] 3.3 模拟不支持 `backdrop-filter` 的环境；验证：导航栏回退为不透明背景，链接仍可读。
- [x] 3.4 在 `npm run preview` 下限速测试首屏；验证：导航栏和 Hero 文字在 2 秒内可见，模糊效果不阻塞渲染。
- [x] 3.5 更新 `README.md`，说明导航结构、锚点和平滑滚动行为；验证：按文档命令可以启动并复现。
- [x] 3.6 汇总最终变更与验收结果，等待用户确认完成。
- [x] 3.7 支持首次加载带 hash 的深链接；验证：直接打开 `#projects` 和 `#contact`，目标 section 顶部距视口 80px，标题不被导航遮挡。
