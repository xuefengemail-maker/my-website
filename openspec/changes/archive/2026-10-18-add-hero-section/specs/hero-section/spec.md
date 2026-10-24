# Spec Delta

## Purpose

定义个人品牌站首屏 Hero 的布局、身份信息展示、CTA 锚点与装饰背景行为。访客打开页面后，无需滚动即可看到站点所有者的名字、职业和一句话介绍。

## ADDED Requirements

### Requirement: Hero 占满首屏

Hero SHALL 在页面加载后至少占满首屏可视高度，并让身份信息与 CTA 在垂直方向居中。页面 MUST 允许短视口下纵向滚动，不得裁切内容。

#### Scenario: 桌面端首屏占满
- **WHEN** 访客以任意桌面视口高度打开页面
- **THEN** Hero 的渲染高度不小于当前可视高度，身份信息与 CTA 垂直居中

#### Scenario: 移动端地址栏伸缩
- **WHEN** 访客在移动端展开或收起浏览器地址栏
- **THEN** Hero 高度稳定，不出现跳动或内容突然截断

#### Scenario: 短视口或高缩放
- **WHEN** 视口为横屏短高度，或页面缩放为 200%
- **THEN** 页面可以纵向滚动到 CTA，且 CTA 不被裁切

### Requirement: 展示身份信息

Hero SHALL 显示名字、职业和一句话介绍。名字 MUST 使用页面上唯一的 `h1`。文案 MUST 可通过单一内容配置替换，不写死在布局代码中。

#### Scenario: 正常加载
- **WHEN** 访客打开首页
- **THEN** 首屏显示名字、职业和一句话介绍，名字为页面唯一的一级标题

#### Scenario: 窄屏长文案
- **WHEN** 视口宽度为 320px，且名字或介绍较长
- **THEN** 文本自动换行，页面不出现横向滚动条

### Requirement: CTA 锚点跳转

Hero SHALL 提供一个 CTA 链接，目标为 `#projects`。链接 MUST 是原生 `<a>` 元素，在 JavaScript 不可用时仍可点击。链接 MUST 支持键盘聚焦，触控区域不小于 44x44 CSS 像素。

#### Scenario: 目标区块存在
- **WHEN** 访客点击 CTA，且页面存在 `#projects` 区块
- **THEN** 页面滚动到该区块，区块标题不被固定元素遮挡

#### Scenario: 目标区块不存在
- **WHEN** 访客点击 CTA，且页面没有 `#projects` 区块（本次变更的预期状态）
- **THEN** 页面不报错，URL 可以带上 `#projects`，Hero 内容保持可用

#### Scenario: 键盘操作
- **WHEN** 访客使用 Tab 键把焦点移到 CTA，再按 Enter
- **THEN** CTA 显示可见的焦点指示，并触发与鼠标点击相同的跳转

### Requirement: 装饰背景层

Hero SHALL 使用 CSS 渐变作为底色，并叠加 Canvas 粒子层。粒子 MAY 缓慢移动；除粒子外，Hero MUST NOT 出现其他动画。所有装饰层 MUST 设置 `pointer-events: none`，且 MUST 对辅助技术隐藏。

#### Scenario: 亮色与暗色主题
- **WHEN** 主题为亮色或暗色
- **THEN** 渐变底色与粒子颜色随主题切换，正文对比度不低于 4.5:1

#### Scenario: 减少动态效果
- **WHEN** 系统启用 `prefers-reduced-motion: reduce`
- **THEN** 粒子停止移动，页面保持静止

#### Scenario: 页面不可见
- **WHEN** 浏览器标签页切换到后台
- **THEN** 粒子动画停止或暂停，不持续占用 CPU

#### Scenario: 窄屏小视口
- **WHEN** 视口宽度小于 640px
- **THEN** 粒子数量降低，背景仍保持可见，不遮挡文字

### Requirement: 首屏性能预算

Hero 的文字内容 MUST 在首屏加载 2 秒内可见。Canvas 初始化 MUST NOT 阻塞文字首次渲染。粒子数量与设备像素比 MUST 设置上限，避免低端设备掉帧。

#### Scenario: 常规加载
- **WHEN** 访客在常规宽带网络下首次打开首页
- **THEN** 名字与介绍在 2 秒内完成渲染

#### Scenario: Canvas 不可用
- **WHEN** 浏览器不支持 Canvas 或 Canvas 初始化失败
- **THEN** 文字与 CTA 正常显示，CSS 渐变底色仍然可见，页面不报错

#### Scenario: 低端移动设备
- **WHEN** 页面在低端移动设备上打开
- **THEN** 粒子数量按视口和设备像素比降低，文字渲染不被阻塞
