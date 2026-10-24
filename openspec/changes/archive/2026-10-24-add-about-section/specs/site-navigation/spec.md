# Spec Delta

## MODIFIED Requirements

### Requirement: 固定顶部导航栏

站点 SHALL 在视口顶部显示固定导航栏，页面滚动时保持可见。页面 MUST 为导航栏预留滚动偏移，锚点目标标题不得被导航栏遮挡。

#### Scenario: 滚动时保持固定
- **WHEN** 用户把页面滚动到任意位置
- **THEN** 导航栏仍位于视口顶部，不随内容滚出

#### Scenario: 锚点偏移
- **WHEN** 用户跳转到 `#about`、`#projects` 或 `#contact`
- **THEN** 目标 section 的标题完整可见，不被导航栏覆盖

#### Scenario: 直接访问带 hash 的 URL
- **WHEN** 访客首次打开带有 `#about`、`#projects` 或 `#contact` 的 URL
- **THEN** 页面渲染完成后定位到目标 section，标题完整可见，不被导航栏遮挡

#### Scenario: 窄屏短视口
- **WHEN** 视口宽 320px，且高度较短
- **THEN** 页面不出现横向滚动，内容仍可纵向滚动

### Requirement: 品牌与导航链接

导航栏左侧 SHALL 显示站点名字。右侧 SHALL 显示首页、关于我、项目、联系我四个原生 `<a>` 链接，目标分别为 `#hero`、`#about`、`#projects`、`#contact`。每个链接的触控区域 MUST 不小于 44x44 CSS 像素。

#### Scenario: 正常显示
- **WHEN** 页面加载完成
- **THEN** 导航栏左侧显示站点名字，右侧显示四个指定链接

#### Scenario: 窄屏布局
- **WHEN** 视口宽度为 320px
- **THEN** 名字、四个链接和主题按钮全部可见，互不遮挡，页面不出现横向滚动

#### Scenario: 键盘操作
- **WHEN** 用户使用 Tab 键依次聚焦导航链接
- **THEN** 每个链接显示可见的焦点指示，按 Enter 触发跳转

#### Scenario: 原生链接
- **WHEN** 检查导航链接的 DOM
- **THEN** 每个链接都是带 `href` 的原生 `<a>` 元素，不依赖 JavaScript 事件处理
