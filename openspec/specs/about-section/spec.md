# about-section Specification

## Purpose

定义个人品牌站的“关于我”区域。访客可以查看个人照片、三段简介和品牌标签，并在窄屏下顺畅阅读。

## Requirements

### Requirement: 关于我区域结构

页面 SHALL 在 Hero 与 Projects 之间包含 `id="about"` 的 section。该 section MUST 包含二级标题，并按左侧照片、右侧简介的两栏结构显示。品牌标签 MUST 位于两栏下方。

#### Scenario: 正常显示
- **WHEN** 访客滚动到“关于我”区域
- **THEN** 左侧显示照片，右侧显示 3 段简介，下方显示品牌标签

#### Scenario: 窄屏布局
- **WHEN** 视口宽度为 320px
- **THEN** 照片、简介和标签按单列排列，页面不出现横向滚动条

#### Scenario: 从导航到达
- **WHEN** 用户点击导航中的“关于我”
- **THEN** 页面滚动到 `#about`，标题完整可见，不被固定导航遮挡

#### Scenario: 标题层级
- **WHEN** 浏览器解析页面标题结构
- **THEN** 页面只有一个 `h1`，“关于我”标题为 `h2`

### Requirement: 个人照片

照片 MUST 使用带 `src` 和描述性 `alt` 的 `<img>` 元素。图片 MUST 使用 `loading="lazy"` 和固定宽高比。图片加载失败时，`alt` 文本 MUST 可见，布局 MUST NOT 塌陷。

#### Scenario: 照片显示
- **WHEN** 访客查看“关于我”区域
- **THEN** 左侧显示个人照片，并有可见的边框或背景承托

#### Scenario: 图片加载失败
- **WHEN** 照片请求失败
- **THEN** 浏览器显示 `alt` 文本，照片区域保持原有比例，其他内容仍可读

#### Scenario: 窄屏照片
- **WHEN** 视口宽度为 320px
- **THEN** 照片占满可用宽度，不超出容器，页面不出现横向滚动条

#### Scenario: 亮色与暗色主题
- **WHEN** 用户切换亮色或暗色主题
- **THEN** 照片边框和背景随主题变化，内容保持可读

### Requirement: 个人简介

“关于我”区域 MUST 显示 3 段个人简介。文字 MUST 自动换行，亮色和暗色主题下的正文对比度 MUST 不低于 4.5:1。

#### Scenario: 三段简介
- **WHEN** 访客查看“关于我”区域
- **THEN** 右侧显示 3 段简介，段落之间有明确间距

#### Scenario: 长段落
- **WHEN** 单段简介超过 3 行
- **THEN** 文字自动换行，页面不出现横向滚动条

#### Scenario: 暗色主题
- **WHEN** 用户切换到暗色主题
- **THEN** 简介文字与背景的对比度不低于 4.5:1

### Requirement: 品牌标签

两栏下方 MUST 显示品牌标签“赋范空间”。标签 MUST 以文本形式呈现，不得只使用图片。标签 MUST 在亮色和暗色主题下可读。

#### Scenario: 显示品牌标签
- **WHEN** 访客滚动到“关于我”区域底部
- **THEN** 页面显示“赋范空间”文本标签

#### Scenario: 窄屏标签
- **WHEN** 视口宽度为 320px
- **THEN** 标签完整显示，不换行溢出，页面不出现横向滚动条

#### Scenario: 暗色主题标签
- **WHEN** 用户切换到暗色主题
- **THEN** 标签文字与背景保持可读的对比度
