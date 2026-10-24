# Spec Delta

## Purpose

定义 Contact 占位区块，为导航提供稳定锚点。该区块后续扩展为完整的联系方式或联系表单。

## ADDED Requirements

### Requirement: Contact 占位区块

页面 SHALL 包含 `id="contact"` 的 section，包含二级标题和一句占位说明。本次变更 MUST NOT 包含联系表单或提交控件。

#### Scenario: 从导航到达
- **WHEN** 用户点击导航中的“联系我”
- **THEN** 页面滚动到 `#contact`，标题完整可见，不被固定导航遮挡

#### Scenario: 占位状态
- **WHEN** 访客滚动到 Contact 区块
- **THEN** 区块显示二级标题和占位说明，不出现表单或提交按钮

#### Scenario: 窄屏长文案
- **WHEN** 视口宽度为 320px
- **THEN** 标题和占位说明自动换行，页面不出现横向滚动条

### Requirement: Contact 标题语义

Contact 区块 MUST 使用 `h2` 作为标题。页面 MUST 保持唯一的 `h1`，即 Hero 中的名字。

#### Scenario: 标题层级
- **WHEN** 浏览器解析页面标题结构
- **THEN** 页面只有一个 `h1`，Contact 标题为 `h2`
