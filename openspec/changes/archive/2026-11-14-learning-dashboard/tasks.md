# Tasks

## 1. Dashboard Foundation

- [x] 1.1 新增 `src/content/studypal.ts`，定义 StudyPal 导航、统计、每日目标、学习建议和周/月趋势的 mock 数据与类型；运行 `npm run build`，确认新文件通过 TypeScript 检查。
- [x] 1.2 新建 `DashboardShell`、`DashboardSidebar`、`DashboardMobileHeader` 和 `DashboardNav`，实现桌面侧栏、移动端紧凑导航及页内锚点；运行 `npm run lint`，确认组件无 lint 错误。
- [x] 1.3 修改 `src/App.tsx`，将首页组合切换为 `DashboardShell`，移除品牌站 Section 的首页引用，同时保留旧组件源码；运行 `npm run build`，确认入口可以编译。
- [x] 1.4 更新 `index.html` 的 title、description、Open Graph 和 Twitter 文案为 StudyPal 学习助手；用 `rg "StudyPal" index.html` 验证静态文案已替换。
- [x] 1.5 Phase 1 验证：运行 `npm run lint` 和 `npm run build`，并在桌面与窄屏视口检查 Dashboard 应用壳、页内导航和主题切换可用。

## 2. Statistics And Daily Goals

- [x] 2.1 新建 `StatCard` 和 `StatsGrid`，使用 mock 数据展示学习时长、完成任务、连续学习天数和本周目标进度，确保每张卡片都有名称、数值和单位；运行 `npm run lint` 验证组件。
- [x] 2.2 新建 `DailyGoalsPanel` 和 `GoalItem`，用 `useState` 从 mock 数据初始化目标，支持勾选、取消勾选、完成进度和空状态；在浏览器中验证勾选后计数变化、刷新后恢复初始状态。
- [x] 2.3 将统计卡片和每日目标接入 `DashboardMain`，补充 `#goals` 区块和响应式布局；运行 `npm run build`，确认面板组合后类型检查和构建通过。
- [x] 2.4 为进度条添加 `role="progressbar"` 和 ARIA 数值属性，并确认复选框可通过键盘操作；用键盘遍历目标清单验证焦点和状态更新。
- [x] 2.5 Phase 2 验证：运行 `npm run lint` 和 `npm run build`，检查四张统计卡片、目标勾选、进度更新、全部完成反馈和空状态。

## 3. Advice And Trend Panels

- [x] 3.1 新建 `AiAdvicePanel` 和 `AdviceCard`，展示至少两条带标题、理由和下一步的示例建议，并在面板中明确标注“示例建议”；在浏览器中确认无 AI 或后端网络请求。
- [x] 3.2 新建 `TrendChart`，使用原生 SVG 绘制折线和数据点，并提供可见周期标签和 `sr-only` 数据表；检查亮暗主题下图表的文字和线条可读。
- [x] 3.3 新建 `TrendPanel`，默认展示周数据，提供周/月切换按钮并处理空数据或数据点不足的提示；在浏览器中验证切换后数据、选中状态和图表同步更新。
- [x] 3.4 更新 `README.md`，记录 Dashboard 结构、mock 数据位置、当前单页锚点导航和 out-of-scope 范围；检查文档中的命令与项目脚本一致。
- [x] 3.5 Phase 3 验证：运行 `npm run lint` 和 `npm run build`，检查 AI 建议空状态、周/月切换、趋势空数据回退、键盘切换和 `prefers-reduced-motion` 行为。

## 4. Integration And Accessibility

- [x] 4.1 在 320px、768px 和 1280px 视口检查页面布局，确认内容单列或双列切换正常、无页面级水平滚动、触控目标不小于 44px；记录检查结果。
- [x] 4.2 检查侧栏和移动导航的锚点跳转、标题层级、可见焦点、亮暗主题和减少动态效果；确认状态信息不只依赖颜色。
- [x] 4.3 检查 Dashboard 加载和交互期间没有业务数据请求、AI 请求或认证请求；确认 `package.json` 未新增运行时依赖。
- [x] 4.4 执行最终验证：运行 `npm run lint`、`npm run build` 和 `openspec validate --all`，确认全部通过并记录结果。

## Workflow follow-up

- 完成用户 review 后，使用 OpenSpec 归档流程处理该变更。
- 归档后验证主 spec 是否正确生成 `ui/learning-dashboard`。
