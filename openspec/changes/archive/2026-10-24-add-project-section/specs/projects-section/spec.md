# Spec Delta

## ADDED Requirements

### Requirement: 项目展示区结构

页面 SHALL 在 Hero 下方包含 `id="projects"` 的 section。该 section MUST 包含二级标题，并展示至少 4 个项目卡片。

#### Scenario: 展示项目
- **WHEN** 访客滚动到项目展示区
- **THEN** 区块显示二级标题和至少 4 张项目卡片

#### Scenario: 窄屏布局
- **WHEN** 视口宽度为 320px
- **THEN** 卡片按单列排列，页面不出现横向滚动条

### Requirement: 项目卡片内容

每张卡片 MUST 包含项目截图、项目名称、项目简介和 GitHub 链接。截图 MUST 使用 `loading="lazy"` 并提供描述性 `alt`。GitHub 链接 MUST 是带 `href` 的原生 `<a>` 元素。

#### Scenario: 卡片完整显示
- **WHEN** 访客查看任意项目卡片
- **THEN** 卡片显示截图、名称、简介和 GitHub 链接

#### Scenario: 图片加载失败
- **WHEN** 项目截图请求失败
- **THEN** 浏览器显示 `alt` 文本，卡片布局不塌陷，其他内容仍可读

#### Scenario: 长简介
- **WHEN** 项目简介超过两行
- **THEN** 文字自动换行，卡片高度对齐，页面不出现横向滚动

#### Scenario: 键盘操作
- **WHEN** 用户使用 Tab 键聚焦 GitHub 链接
- **THEN** 链接显示可见的焦点指示，按 Enter 打开仓库地址

### Requirement: 项目卡片悬浮效果

指针悬浮项目卡片时，卡片 SHALL 显示微特效。该特效 MUST NOT 是唯一的信息载体。系统启用 `prefers-reduced-motion: reduce` 时，卡片 MUST 关闭位移动画。

#### Scenario: 鼠标悬浮
- **WHEN** 用户把指针移到项目卡片上
- **THEN** 卡片显示轻微位移、阴影或边框变化

#### Scenario: 减少动态效果
- **WHEN** 系统启用 `prefers-reduced-motion: reduce`
- **THEN** 卡片不播放位移动画，内容保持完整可读

#### Scenario: 触屏设备
- **WHEN** 用户在不支持悬浮的设备上浏览
- **THEN** 卡片的截图、名称、简介和链接仍完整显示

### Requirement: Hero CTA 指向项目展示区

Hero 主 CTA 的 `href` MUST 为 `#projects`。点击后页面 MUST 滚动到项目展示区，标题不被固定导航遮挡。

#### Scenario: 点击 CTA
- **WHEN** 用户点击 Hero 的“查看项目”按钮
- **THEN** 页面滚动到 `#projects`，项目展示区标题完整可见

#### Scenario: 深链接
- **WHEN** 访客首次打开带有 `#projects` 的 URL
- **THEN** 页面渲染完成后定位到项目展示区，标题不被固定导航遮挡

## MODIFIED Requirements

### Requirement: Projects 标题语义

Projects 区块 MUST 使用 `h2` 作为标题。项目卡片名称 MUST 使用 `h3`。页面 MUST 保持唯一的 `h1`，即 Hero 中的名字。

#### Scenario: 标题层级
- **WHEN** 浏览器解析页面标题结构
- **THEN** 页面只有一个 `h1`，Projects 标题为 `h2`，每个卡片名称为 `h3`

## REMOVED Requirements

### Requirement: Projects 占位区块

**Reason**: 占位内容被项目卡片展示取代。

**Migration**: 使用新的“项目展示区结构”和“项目卡片内容”需求。`id="projects"`、导航链接和 Hero CTA 锚点保持不变。
