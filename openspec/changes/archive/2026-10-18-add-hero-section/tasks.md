# Tasks

## 1. 主题基础设施

- [x] 1.1 在 `src/index.css` 配置 Tailwind v4 的 `@custom-variant dark`、亮/暗主题颜色变量和 `color-scheme`；验证：运行 `npm run build` 成功，DevTools 手动切换 `html.dark` 时页面颜色变化。
- [x] 1.2 在 `index.html` 的 `<head>` 添加同步主题脚本，读取 `localStorage.theme`，无效或不可用时回退到 `matchMedia`；验证：写入 `theme=dark` 后硬刷新，首帧即暗色，无亮色闪烁。
- [x] 1.3 新增 `src/theme/ThemeProvider.tsx` 与 `src/theme/useTheme.ts`，实现切换、持久化、系统偏好监听和异常保护；验证：临时按钮切换后刷新，选择保留，控制台无异常。
- [x] 1.4 汇报 Phase 1 变更，等待用户确认后进入 Phase 2。

## 2. Hero 结构与内容

- [x] 2.1 新增 `src/content/site.ts`，导出占位名字、职业、一句话介绍和 CTA 文案；验证：`npm run build` 通过，Hero 不再包含硬编码文案。
- [x] 2.2 新增 `src/components/Hero.tsx`，使用 `min-h-svh`、垂直居中布局和原生 `<a href="#projects">` CTA；验证：桌面、320px 窄屏、横屏短视口下内容可见且无横向滚动。
- [x] 2.3 新增 `src/components/ThemeToggle.tsx` 并放入 Hero 右上角，提供 `aria-label`、44x44 触控区和焦点环；验证：Tab 可聚焦，Enter/Space 可切换，320px 下不遮挡文字。
- [x] 2.4 替换 `src/App.tsx` 的模板计数器并删除 `src/App.css`；验证：`npm run build` 与 `npm run lint` 通过，页面不再出现计数器。
- [x] 2.5 汇报 Phase 2 变更，等待用户确认后进入 Phase 3。

## 3. Canvas 粒子背景

- [x] 3.1 新增 `src/components/HeroBackground.tsx`，实现 `absolute inset-0` 分层、`pointer-events-none`、`aria-hidden`、DPR 上限 2 和 `ResizeObserver`；验证：装饰层无法点击选中，缩放窗口后画布尺寸正确。
- [x] 3.2 实现静态首帧与 `requestAnimationFrame` 循环，加入粒子数量上限、`visibilitychange` 暂停和 `prefers-reduced-motion` 静止分支；验证：切到后台后循环停止，模拟减少动态效果后粒子不动。
- [x] 3.3 让粒子颜色从 CSS 变量读取，并在主题切换时重新读取；验证：切换亮/暗主题后粒子颜色变化，无需刷新页面。
- [x] 3.4 在渐变与文字之间加入主题遮罩，并校准两种主题的文字颜色；验证：用对比度工具检查正文与 CTA 均 `>= 4.5:1`。
- [x] 3.5 汇报 Phase 3 变更，等待用户确认后进入 Phase 4。

## 4. 验收与文档

- [x] 4.1 运行 `npm run build`、`npm run lint` 和 `npm run preview`；验证：全部命令成功，控制台无报错。
- [x] 4.2 按验收矩阵手动检查：320px 宽、横屏短视口、200% 缩放、键盘操作、`prefers-reduced-motion`、禁用或损坏 `localStorage`；验证：全部符合 `specs/` 中的场景。
- [x] 4.3 在 `npm run preview` 下用浏览器 DevTools 限速测试首屏；验证：名字与介绍在 2 秒内可见，粒子不阻塞文字渲染。
- [x] 4.4 更新 `README.md`，说明项目结构、主题存储键和本地开发命令；验证：按文档命令可以启动项目。
- [x] 4.5 汇总最终变更与验收结果，等待用户确认完成。
