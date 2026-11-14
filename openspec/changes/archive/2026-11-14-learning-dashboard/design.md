# Design

## Context

当前站点是 React 19 + Vite 的单页品牌站，入口在 `src/App.tsx`，主题由 `ThemeProvider` 和 `src/index.css` 的 CSS 自定义属性提供。现有 `Navbar` 是固定顶部锚点导航，`Hero` 是全屏居中营销布局，`ProjectsSection` 提供了可复用的卡片视觉模式。项目没有路由库，也没有测试框架。

本设计只覆盖 `proposal.md` 中定义的 StudyPal 前端 Dashboard，不接入后端、AI 或认证。布局方案选择新建应用壳，而不是把 Dashboard 塞进现有 Hero：品牌首页的居中、全屏和营销语义与应用工作区冲突，继续复用会持续产生布局覆盖成本。

## Goals / Non-Goals

**Goals:**

- 用单页应用壳承载 StudyPal 学习 Dashboard。
- 复用现有主题系统、主题切换和卡片视觉语言。
- 使用统一、类型化的前端 mock 数据渲染所有面板。
- 保持桌面侧栏、移动端紧凑导航、键盘访问和减少动态效果支持。
- 用原生 SVG 完成周/月趋势图，避免新增图表依赖。

**Non-Goals:**

- 不引入 HashRouter 或其他路由库；侧栏只做当前页面的区块导航。
- 不实现课程、笔记、复习、设置等独立页面。
- 不实现真实数据获取、持久化、AI 推理或用户认证。
- 不重写 `ThemeProvider`，也不替换 Tailwind CSS v4 和现有主题变量体系。

## Decisions

### 1. 新建 Dashboard 应用壳

`App` 只负责组合 `DashboardShell`，不再渲染品牌站的 `Hero`、`AboutSection`、`ProjectsSection` 和 `ContactSection`。旧组件暂时保留在仓库中作为回滚路径，不在本变更中删除。

**组件层级：**

```text
App
+-- DashboardShell
    +-- DashboardSidebar              (desktop, in-page anchor navigation)
    |   +-- BrandMark
    |   +-- DashboardNav
    |   +-- ThemeToggle               (reuse existing component)
    +-- DashboardMobileHeader         (mobile, compact navigation)
    |   +-- BrandMark
    |   +-- DashboardNav
    |   +-- ThemeToggle
    +-- DashboardMain
        +-- DashboardHeader
        +-- StatsGrid
        |   +-- StatCard x 4
        +-- DashboardContentGrid
        |   +-- DailyGoalsPanel
        |   |   +-- GoalItem x N
        |   +-- AiAdvicePanel
        |       +-- AdviceCard x N
        +-- TrendPanel
            +-- TrendViewToggle
            +-- TrendChart            (native SVG)
            +-- TrendDataSummary      (sr-only table)
```

**Alternatives considered:** 继续使用 Hero 作为 Dashboard 外壳。未采用，因为 `min-h-svh`、居中布局和装饰背景需要被大量覆盖，且会让品牌内容与产品内容继续耦合。

### 2. 单页锚点导航，不引入路由

侧栏导航项对应 `#overview`、`#goals`、`#advice`、`#trends` 四个区块，使用普通 `<a href="#...">` 和 `scroll-mt-*` 处理固定头部遮挡。当前没有多页面需求，引入路由只会增加依赖和部署分支，暂不采用。

未来增加课程、笔记等独立页面时，再按项目约定引入 HashRouter；本次不预埋空页面或不可点击的导航项。

**Alternatives considered:** 立即引入 HashRouter。未采用，因为本变更只有一个页面，路由不会带来可验证的用户价值。

### 3. 独立 StudyPal 内容模块

新增 `src/content/studypal.ts`，集中定义导航、统计、每日目标、建议和趋势 mock 数据。现有 `src/content/site.ts` 和旧品牌组件暂时保留，避免回滚时因内容结构变化导致旧页面无法编译。

建议的数据形状：

```ts
type Stat = {
  id: string
  label: string
  value: number
  unit: string
  description: string
}

type DailyGoal = {
  id: string
  title: string
  category: string
  completed: boolean
}

type Advice = {
  id: string
  title: string
  reason: string
  nextAction: string
}

type TrendPoint = {
  label: string
  value: number
}
```

趋势数据分为 `week` 和 `month` 两组；所有内容通过 `as const` 或明确类型导出，组件只消费数据，不在 JSX 内散落 mock 字符串。

**Alternatives considered:** 直接扩展 `site.ts`。未采用，因为旧品牌组件仍依赖原内容形状，替换会破坏回滚路径。

### 4. 目标清单使用组件内状态

`DailyGoalsPanel` 用 `useState` 从 mock 数据初始化目标数组，勾选只更新当前页面状态，不写 `localStorage`，也不请求后端。刷新后恢复 mock 初始状态，这是本阶段验证交互的明确边界。

完成数量由目标数组派生，不单独维护计数状态；进度条使用 `role="progressbar"`、`aria-valuemin`、`aria-valuemax` 和 `aria-valuenow`。目标为空时显示空状态文案。

**Alternatives considered:** 使用 `localStorage` 持久化目标状态。未采用，因为本变更明确不实现真实数据持久化，过早引入存储会增加后续与后端同步的迁移成本。

### 5. 趋势图使用原生 SVG

`TrendPanel` 持有 `'week' | 'month'` 视图状态，默认展示周数据。图表用固定 `viewBox` 的 SVG 绘制折线、数据点和周期标签；折线路径和点坐标由数据计算，颜色通过 Tailwind 类引用 CSS 变量，不使用内联 `style`。

为避免图表只能靠视觉理解，面板同时渲染一个 `sr-only` 数据表，包含周期和对应的学习时长。数据点不足或为空时显示“趋势暂不可用”，并保留周/月切换控件。

**Alternatives considered:** 引入 Recharts 等图表库。未采用，因为只需求一条简单趋势线，新增依赖的收益不足以抵消包体积和维护成本。

### 6. 样式和主题策略

Dashboard 使用现有 `--hero-bg-from`、`--hero-text`、`--hero-text-muted`、`--card-*`、`--nav-*` 和 `--hero-focus-ring` 等变量作为基础，并只在确有需要时在 `src/index.css` 增加图表和状态专用变量。

布局使用 Tailwind CSS：

- 宽屏：`lg:grid-cols-[16rem_minmax(0,1fr)]`，侧栏 sticky，主内容 `min-w-0`。
- 窄屏：顶部紧凑导航，内容单列排列，禁止页面级水平溢出。
- 卡片和交互目标至少 44px，焦点样式沿用现有 `focus-visible` 变量。
- 过渡使用 `motion-reduce:transition-none` 或等价方式尊重 `prefers-reduced-motion`。

### 7. 复用边界

- 直接复用：`ThemeProvider`、`useTheme`、`ThemeToggle`、现有颜色变量、卡片视觉模式。
- 有条件复用：已安装的 SVG 图标思路、`HeroBackground` 仅在需要装饰空状态时使用，不作为 Dashboard 主布局背景。
- 不复用：固定顶部 `Navbar`、全屏 `Hero`、品牌站 About/Projects/Contact 的页面结构。
- 不新增运行时依赖。

## API Endpoints

本变更不新增、修改或调用任何 API 端点。

- 后端 API：无
- AI 端点：无
- 认证端点：无
- 数据来源：`src/content/studypal.ts` 的前端 mock 数据

## Risks / Trade-offs

- **替换首页会影响现有品牌内容曝光** -> 同步更新 `index.html` 的 title、description 和社交分享文案；旧品牌组件与内容源码保留，必要时回滚或后续单独增加品牌路由。
- **移动端导航空间有限** -> 使用短标签和紧凑锚点导航，主内容单列，验证 320px 视口无页面级水平滚动。
- **SVG 图表的可访问性不足** -> 增加可见周期标签和 `sr-only` 数据表，切换控件使用原生按钮并支持键盘操作。
- **目标状态刷新后丢失** -> 这是 mock 阶段的接受行为，不引入 localStorage，避免制造“已持久化”的错觉。
- **旧组件暂时成为未引用代码** -> 本变更优先保障回滚，不在首页替换时删除旧结构；验收通过后可在独立清理变更中处理。
- **后续接入真实数据需要替换 mock** -> 统一数据形状并为每个面板建立清晰的组件边界，后续可以在内容层或数据适配层替换，而不用重写布局。

## Migration Plan

1. 增加 StudyPal mock 内容模型和 Dashboard 组件，不删除旧品牌组件。
2. 将 `App` 首页组合切换为 `DashboardShell`，复用现有 `ThemeProvider` 和 `ThemeToggle`。
3. 更新 `index.html` 的静态 SEO 文案。
4. 完成响应式、主题、键盘和空数据验证。
5. 若验收失败，恢复 `App` 的品牌站组合并回退 SEO 文案；旧组件和旧内容仍在仓库中，可快速回滚。

## Open Questions

无。当前未决事项均不会改变本设计、spec 或任务拆分。
