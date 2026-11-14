# Spec Delta

## Purpose

StudyPal 学习 Dashboard 为学习者提供单页学习总览，集中展示进度统计、每日目标、学习建议和趋势数据，帮助用户快速了解当天学习状态并决定下一步行动。

## ADDED Requirements

### Requirement: StudyPal Dashboard 应用壳

系统 SHALL 在站点首页提供 StudyPal 学习 Dashboard，包含欢迎区、主导航、数据统计、每日目标、学习建议和趋势图区块。

#### Scenario: 打开首页
- **WHEN** 用户访问站点根路径
- **THEN** 系统展示 StudyPal Dashboard，并包含欢迎区及全部四个学习区块

#### Scenario: 使用页内导航
- **WHEN** 用户选择导航中的总览、每日目标、学习建议或趋势项
- **THEN** 系统将视口定位到对应区块，并将区块标题纳入可见区域

### Requirement: 响应式布局

系统 SHALL 在宽屏设备上显示左侧导航栏，在窄屏设备上显示紧凑导航；学习面板 SHALL 在窄屏下按单列排列，且页面不得产生水平溢出。

#### Scenario: 宽屏布局
- **WHEN** 视口宽度足以容纳侧栏和主内容
- **THEN** 系统显示左侧导航栏和右侧主内容区

#### Scenario: 窄屏布局
- **WHEN** 视口较窄
- **THEN** 系统使用紧凑导航，学习面板按单列排列且页面不发生水平溢出

### Requirement: 数据统计卡片

系统 SHALL 展示四张学习统计卡片，分别呈现学习时长、完成任务数、连续学习天数和本周目标进度；每张卡片 SHALL 包含指标名称、数值和必要的单位或进度说明。

#### Scenario: 展示默认统计
- **WHEN** Dashboard 首次加载
- **THEN** 系统使用 mock 数据显示四张统计卡片，且每张卡片都有可读的指标名称和数值

#### Scenario: 零值统计
- **WHEN** 某项统计的 mock 数值为零
- **THEN** 系统显示明确的零值及其单位或进度说明，不显示空白卡片

### Requirement: 每日目标清单

系统 SHALL 展示当天的学习目标，并允许用户在当前页面会话内勾选或取消勾选目标；完成数量 SHALL 同步反映在目标进度中，刷新页面后 SHALL 恢复 mock 初始状态。

#### Scenario: 切换目标状态
- **WHEN** 用户勾选一个未完成目标或取消勾选一个已完成目标
- **THEN** 目标状态、完成计数和进度文案同步更新

#### Scenario: 全部目标完成
- **WHEN** 用户完成清单中的最后一个目标
- **THEN** 系统显示全部完成的反馈，且进度与目标总数一致

#### Scenario: 刷新页面
- **WHEN** 用户刷新 Dashboard
- **THEN** 目标清单恢复为 mock 数据定义的初始完成状态

#### Scenario: 目标清单为空
- **WHEN** mock 数据中的每日目标列表为空
- **THEN** 系统显示空状态提示，不渲染空白清单或错误布局

### Requirement: 学习建议面板

系统 SHALL 展示至少两条学习建议，每条包含标题、推荐理由和可执行的下一步；面板 SHALL 明确标注内容为示例建议，且不得调用 AI 服务或后端接口。

#### Scenario: 展示默认建议
- **WHEN** Dashboard 首次加载
- **THEN** 系统展示 mock 学习建议，并标注内容为示例建议

#### Scenario: 不触发 AI 请求
- **WHEN** 用户查看或刷新学习建议面板
- **THEN** 系统不发起 AI 推理请求或后端 API 请求

### Requirement: 周/月学习趋势图

系统 SHALL 展示学习趋势图，允许用户在周视图和月视图之间切换，并提供可读的周期标签或等价数据摘要。

#### Scenario: 默认展示周趋势
- **WHEN** Dashboard 首次加载
- **THEN** 趋势图默认展示周数据，并标明当前视图为周

#### Scenario: 切换到月趋势
- **WHEN** 用户选择月视图
- **THEN** 趋势图更新为月 mock 数据，切换控件的选中状态同步更新

#### Scenario: 趋势数据缺失
- **WHEN** 当前视图的 mock 趋势数据为空或缺少有效数据点
- **THEN** 系统显示趋势暂不可用的提示，并保留周/月切换能力

### Requirement: 纯前端 Mock 数据

Dashboard SHALL 仅使用前端 mock 数据渲染；系统不得依赖后端 API、AI 服务或用户认证，也不得在加载或交互时发起业务数据请求。

#### Scenario: 无后端环境加载
- **WHEN** 用户在没有后端服务的环境中打开 Dashboard
- **THEN** 所有统计、目标、建议和趋势内容仍使用 mock 数据正常展示

#### Scenario: 页面交互不请求业务数据
- **WHEN** 用户切换趋势视图或勾选目标
- **THEN** 系统只更新前端界面状态，不发起业务数据请求
