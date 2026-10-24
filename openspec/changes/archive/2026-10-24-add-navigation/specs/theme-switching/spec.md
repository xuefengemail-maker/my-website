# Spec Delta

## MODIFIED Requirements

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
