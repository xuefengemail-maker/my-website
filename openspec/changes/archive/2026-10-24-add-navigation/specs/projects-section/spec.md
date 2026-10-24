# Spec Delta

## Purpose

定义 Projects 占位区块，为导航和 Hero CTA 提供稳定锚点。该区块后续扩展为完整的项目展示内容。

## ADDED Requirements

### Requirement: Projects 占位区块

页面 SHALL 包含 `id="projects"` 的 section，包含二级标题和一句占位说明。区块 MUST 有足够的滚动高度，使锚点跳转可观察。

#### Scenario: 从导航到达
- **WHEN** 用户点击导航中的“项目”，或点击 Hero 的 CTA
- **THEN** 页面滚动到 `#projects`，标题完整可见，不被固定导航遮挡

#### Scenario: 占位状态
- **WHEN** 访客滚动到 Projects 区块
- **THEN** 区块显示二级标题和占位说明，不显示未完成的功能控件

#### Scenario: 窄屏长文案
- **WHEN** 视口宽度为 320px
- **THEN** 标题和占位说明自动换行，页面不出现横向滚动条

### Requirement: Projects 标题语义

Projects 区块 MUST 使用 `h2` 作为标题。页面 MUST 保持唯一的 `h1`，即 Hero 中的名字。

#### Scenario: 标题层级
- **WHEN** 浏览器解析页面标题结构
- **THEN** 页面只有一个 `h1`，Projects 标题为 `h2`
