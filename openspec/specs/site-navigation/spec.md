# site-navigation Specification

## Purpose

定义固定顶部导航栏的品牌、链接、平滑滚动、模糊背景和窄屏行为。访客可以在页面任意位置跳到首页、项目或联系区。

## Requirements

### Requirement: 固定顶部导航栏

站点 SHALL 在视口顶部显示固定导航栏，页面滚动时保持可见。页面 MUST 为导航栏预留滚动偏移，锚点目标标题不得被导航栏遮挡。

#### Scenario: 滚动时保持固定
- **WHEN** 用户把页面滚动到任意位置
- **THEN** 导航栏仍位于视口顶部，不随内容滚出

#### Scenario: 锚点偏移
- **WHEN** 用户跳转到 `#projects` 或 `#contact`
- **THEN** 目标 section 的标题完整可见，不被导航栏覆盖

#### Scenario: 直接访问带 hash 的 URL
- **WHEN** 访客首次打开带有 `#projects` 或 `#contact` 的 URL
- **THEN** 页面渲染完成后定位到目标 section，标题完整可见，不被导航栏遮挡

#### Scenario: 窄屏短视口
- **WHEN** 视口宽 320px，且高度较短
- **THEN** 页面不出现横向滚动，内容仍可纵向滚动

### Requirement: 品牌与导航链接

导航栏左侧 SHALL 显示站点名字。右侧 SHALL 显示首页、项目、联系我三个原生 `<a>` 链接，目标分别为 `#hero`、`#projects`、`#contact`。每个链接的触控区域 MUST 不小于 44x44 CSS 像素。

#### Scenario: 正常显示
- **WHEN** 页面加载完成
- **THEN** 导航栏左侧显示站点名字，右侧显示三个指定链接

#### Scenario: 窄屏布局
- **WHEN** 视口宽度为 320px
- **THEN** 名字、三个链接和主题按钮全部可见，互不遮挡，页面不出现横向滚动

#### Scenario: 键盘操作
- **WHEN** 用户使用 Tab 键依次聚焦导航链接
- **THEN** 每个链接显示可见的焦点指示，按 Enter 触发跳转

#### Scenario: 原生链接
- **WHEN** 检查导航链接的 DOM
- **THEN** 每个链接都是带 `href` 的原生 `<a>` 元素，不依赖 JavaScript 事件处理

### Requirement: 平滑滚动

点击导航链接后，页面 SHALL 平滑滚动到目标 section。系统启用 `prefers-reduced-motion: reduce` 时，站点 MUST 改为即时跳转。

#### Scenario: 平滑滚动
- **WHEN** 用户点击导航链接，且未启用减少动态效果
- **THEN** 页面以平滑滚动动画到达目标 section

#### Scenario: 减少动态效果
- **WHEN** 系统启用 `prefers-reduced-motion: reduce`
- **THEN** 页面直接跳到目标 section，不播放滚动动画

#### Scenario: 目标缺失
- **WHEN** 用户点击导航链接，但对应 section 不存在
- **THEN** 页面不报错，URL 可以更新 hash，导航栏保持可用

### Requirement: 模糊背景

导航栏 SHALL 使用半透明背景和 `backdrop-filter` 模糊。亮色与暗色主题 MUST 使用对应的背景色。浏览器不支持 `backdrop-filter` 时，导航栏 MUST 回退为不透明背景。

#### Scenario: 内容滚动到导航栏下方
- **WHEN** 页面内容滚动经过导航栏后方
- **THEN** 内容呈模糊效果，导航链接保持可读

#### Scenario: 亮色与暗色主题
- **WHEN** 用户切换亮色或暗色主题
- **THEN** 导航栏背景、边框和文字颜色随主题变化，链接对比度不低于 4.5:1

#### Scenario: 不支持 backdrop-filter
- **WHEN** 浏览器不支持 `backdrop-filter`
- **THEN** 导航栏使用不透明背景，链接仍然可读，页面不报错

### Requirement: 导航无障碍

导航栏 MUST 使用 `nav` landmark 并提供可读名称。所有交互元素 MUST 支持键盘操作，焦点指示 MUST 可见。

#### Scenario: 屏幕阅读器
- **WHEN** 屏幕阅读器读取页面结构
- **THEN** 导航区域被识别为导航 landmark，并带有可读名称

#### Scenario: 焦点顺序
- **WHEN** 用户从页面顶部开始按 Tab
- **THEN** 焦点依次经过导航链接和主题切换按钮，焦点指示始终可见
