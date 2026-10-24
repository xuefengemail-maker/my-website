# theme-switching Specification

## Purpose

定义站点亮色与暗色主题的判定、切换和持久化规则。访客可以手动覆盖系统偏好，并在下次访问时保留选择。

## Requirements

### Requirement: 默认跟随系统偏好

当用户没有保存的主题选择时，站点 SHALL 跟随操作系统的 `prefers-color-scheme` 显示亮色或暗色主题。

#### Scenario: 首次访问
- **WHEN** 用户首次访问站点，且系统偏好为暗色
- **THEN** 页面以暗色主题显示

#### Scenario: 系统偏好变化
- **WHEN** 用户未手动选择过主题，且系统主题在页面打开期间发生变化
- **THEN** 页面主题跟随变化，无需刷新

### Requirement: 手动切换并持久化

主题切换控件 SHALL 在亮色与暗色之间切换，并立即应用到整个页面。用户手动选择后，站点 MUST 把选择写入 `localStorage`，后续访问 MUST 使用该选择。

#### Scenario: 手动切换
- **WHEN** 用户点击主题切换控件
- **THEN** 页面在当前主题与另一主题之间切换，无需刷新

#### Scenario: 刷新后保留
- **WHEN** 用户手动选择暗色后刷新页面
- **THEN** 页面仍以暗色主题显示

#### Scenario: 存储不可用
- **WHEN** 浏览器禁止访问 `localStorage`，或写入抛出异常
- **THEN** 切换在当前会话内仍然生效，页面不报错，也不阻断渲染

#### Scenario: 存储值损坏
- **WHEN** `localStorage` 中的主题值不是 `light` 或 `dark`
- **THEN** 站点忽略该值，回退到系统偏好

### Requirement: 首屏无主题闪烁

站点 MUST 在首次绘制前应用已保存的主题或系统偏好。不得先显示错误主题再切换。

#### Scenario: 已保存暗色主题
- **WHEN** 用户保存了暗色主题并重新打开页面
- **THEN** 首次绘制即为暗色，不出现亮色闪烁

#### Scenario: 脚本执行失败
- **WHEN** 首屏主题初始化脚本执行失败
- **THEN** 页面仍可正常显示，并使用浏览器默认配色，不出现空白页

### Requirement: 主题切换控件可访问

主题切换控件 SHALL 位于固定导航栏右侧。控件 MUST 具有可读的无障碍名称，MUST 支持键盘操作，触控区域不小于 44x44 CSS 像素，MUST 提供可见的焦点指示。

#### Scenario: 键盘操作
- **WHEN** 用户使用 Tab 聚焦切换控件并按 Enter 或 Space
- **THEN** 主题切换，焦点指示保持可见

#### Scenario: 辅助技术
- **WHEN** 屏幕阅读器读取切换控件
- **THEN** 控件报告当前主题状态和可执行的操作

#### Scenario: 窄屏布局
- **WHEN** 视口宽度为 320px
- **THEN** 切换控件不遮挡导航链接或站点名字
