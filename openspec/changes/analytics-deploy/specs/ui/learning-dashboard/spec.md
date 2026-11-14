# Spec Delta

## MODIFIED Requirements

### Requirement: StudyPal Dashboard 应用壳

系统 SHALL 在站点根路径提供需要认证的 StudyPal 学习数据工作区，包含欢迎区、共享主导航、真实统计、学习日历、成就墙、今日目标和趋势图。左侧导航顺序 MUST 固定为“学习数据、AI 对话建议、学习目标”，并分别指向 `/`、`/chat`、`/goals`。未认证访问 MUST 显示登录/注册入口，不得渲染业务数据。

#### Scenario: 打开首页
- **GIVEN** 用户持有有效 token
- **WHEN** 用户访问站点根路径
- **THEN** 系统展示学习数据工作区、共享导航和真实学习统计

#### Scenario: 使用页内导航
- **GIVEN** 用户已认证并进入工作区
- **WHEN** 用户选择左侧导航中的学习数据、AI 对话建议或学习目标
- **THEN** 系统进入对应路由并更新当前导航项

#### Scenario: 导航顺序固定
- **GIVEN** 用户已认证并进入工作区
- **WHEN** 系统渲染左侧导航
- **THEN** 导航项依次为“学习数据”“AI 对话建议”“学习目标”

#### Scenario: 打开 AI 对话建议
- **GIVEN** 用户位于学习数据页
- **WHEN** 用户选择“AI 对话建议”
- **THEN** 系统进入 `/chat` 并将该导航项标记为当前页

#### Scenario: 打开学习目标
- **GIVEN** 用户位于学习数据页
- **WHEN** 用户选择“学习目标”
- **THEN** 系统进入 `/goals` 并将该导航项标记为当前页

### Requirement: 响应式布局

系统 SHALL 在宽屏设备上显示左侧导航栏，在窄屏设备上显示紧凑导航；学习数据、日历、成就和目标面板 MUST 在窄屏下按单列排列，且页面不得产生水平溢出。导航和操作控件 MUST 支持键盘聚焦与触控操作。

#### Scenario: 宽屏布局
- **GIVEN** 视口宽度足以容纳侧栏和主内容
- **WHEN** 用户打开工作区
- **THEN** 系统显示左侧导航栏和右侧主内容区

#### Scenario: 窄屏布局
- **GIVEN** 视口较窄
- **WHEN** 用户打开学习数据或目标页面
- **THEN** 系统使用紧凑导航，面板按单列排列且页面不发生水平溢出

#### Scenario: 键盘导航
- **GIVEN** 用户使用键盘浏览工作区
- **WHEN** 用户聚焦导航或操作控件
- **THEN** 焦点清晰可见且可通过键盘激活对应路由或操作

### Requirement: 数据统计卡片

系统 SHALL 展示四张学习统计卡片，数据来自 `GET /api/v1/analytics/overview`：本周学习分钟数、已完成目标数、连续学习天数和本周目标进度。每张卡片 MUST 包含名称、数值、单位和说明；加载时 MUST 显示骨架，失败时 MUST 显示可重试错误，不得回退到 mock。

#### Scenario: 展示默认统计
- **GIVEN** 分析接口返回有效统计
- **WHEN** 用户进入学习数据页
- **THEN** 系统展示四张包含真实数值和单位的统计卡片

#### Scenario: 零值统计
- **GIVEN** 用户没有学习记录或已完成目标
- **WHEN** 分析接口返回零值
- **THEN** 系统显示明确的零值及其单位，不显示空白卡片

#### Scenario: 统计加载中
- **GIVEN** 分析请求尚未完成
- **WHEN** 用户进入学习数据页
- **THEN** 系统显示加载骨架且不渲染 mock 数值

#### Scenario: 统计加载失败
- **GIVEN** 分析接口暂时不可用
- **WHEN** 用户进入学习数据页
- **THEN** 系统显示可重试错误且不显示 mock 数据

#### Scenario: 统计请求未认证
- **GIVEN** access token 与 refresh token 均无效
- **WHEN** 系统请求学习统计
- **THEN** 系统清除本地会话并显示认证入口

### Requirement: 每日目标清单

系统 SHALL 在 Dashboard 展示当天学习目标摘要，数据来自 `GET /api/v1/goals?date=YYYY-MM-DD`，并允许切换完成状态。完成状态 MUST 通过 API 持久化，刷新后 MUST 保留；目标为空时 MUST 显示空状态和创建入口；切换失败 MUST 恢复原状态并显示错误。

#### Scenario: 切换目标状态
- **GIVEN** 用户拥有待完成目标
- **WHEN** 用户勾选或取消勾选目标
- **THEN** 系统调用目标 API 并更新目标状态与完成计数

#### Scenario: 全部目标完成
- **GIVEN** 用户完成当天最后一个目标
- **WHEN** 系统更新目标状态
- **THEN** 系统显示全部完成反馈且进度等于目标总数

#### Scenario: 刷新页面
- **GIVEN** 用户已经切换过目标状态
- **WHEN** 用户刷新学习数据页
- **THEN** 系统从 API 恢复持久化后的目标状态

#### Scenario: 目标清单为空
- **GIVEN** 用户当天没有学习目标
- **WHEN** 用户进入学习数据页
- **THEN** 系统显示空状态和前往学习目标页的入口

#### Scenario: 目标切换失败
- **GIVEN** 目标 API 返回非认证错误
- **WHEN** 用户切换目标状态
- **THEN** 系统恢复原状态并显示可重试错误

### Requirement: 周/月学习趋势图

系统 SHALL 展示来自 `GET /api/v1/analytics/overview?range=week|month` 的学习趋势图，并允许周/月切换。周视图 MUST 展示当前周每日分钟数，月视图 MUST 展示最近四周每周分钟数；数据为空或不足两个点时 MUST 显示不可用提示并保留切换；加载失败 MUST 显示重试。

#### Scenario: 默认展示周趋势
- **GIVEN** 分析接口返回当前周数据
- **WHEN** 用户进入学习数据页
- **THEN** 趋势图默认展示 7 个每日数据点并标明周视图

#### Scenario: 切换到月趋势
- **GIVEN** 分析接口返回最近四周数据
- **WHEN** 用户选择月视图
- **THEN** 趋势图更新为 4 个每周数据点且选中状态同步

#### Scenario: 趋势数据缺失
- **GIVEN** 当前视图没有有效趋势点
- **WHEN** 用户查看趋势图
- **THEN** 系统显示趋势暂不可用提示并保留周/月切换

#### Scenario: 趋势加载失败
- **GIVEN** 趋势接口返回错误
- **WHEN** 用户查看趋势图
- **THEN** 系统显示可重试错误且不显示 mock 趋势

#### Scenario: 趋势请求未认证
- **GIVEN** access token 与 refresh token 均无效
- **WHEN** 系统请求趋势数据
- **THEN** 系统清除本地会话并显示认证入口

## REMOVED Requirements

### Requirement: 学习建议面板

**Reason**: 静态 mock 学习建议由独立的“AI 对话建议”页面取代，避免与真实聊天和个性化上下文产生两套建议来源。

**Migration**: 用户通过共享左侧导航进入 `/chat`；现有聊天页面继续提供个性化、可持久化的 AI 建议。

### Requirement: 纯前端 Mock 数据

**Reason**: 学习统计、目标、日历和成就改为由认证 API 读取数据库聚合结果；保留 mock fallback 会掩盖后端故障并产生错误数据。

**Migration**: 使用 `GET /api/v1/analytics/overview`、`GET /api/v1/analytics/calendar`、`GET /api/v1/goals` 和成就接口；加载失败时显示错误与重试，不回退到 mock。

## ADDED Requirements

### Requirement: 学习日历

系统 SHALL 在学习数据页展示来自 `GET /api/v1/analytics/calendar?month=YYYY-MM` 的月历，按配置时区标记每天学习分钟数、记录数和完成目标数。用户 MUST 能切换上/下月；当天 MUST 高亮；未来日期 MUST 不显示完成状态；无数据时 MUST 显示零值网格；加载失败 MUST 显示重试。

#### Scenario: 渲染当月日历
- **GIVEN** 用户当月存在学习聚合数据
- **WHEN** 用户进入学习数据页
- **THEN** 系统按 7 列日历展示每天的学习分钟数和完成目标数

#### Scenario: 切换月份
- **GIVEN** 用户正在查看某月日历
- **WHEN** 用户选择上个月或下个月
- **THEN** 系统请求对应月份并更新月份标签和日期网格

#### Scenario: 当天与未来日期
- **GIVEN** 日历包含当天和未来日期
- **WHEN** 系统渲染日期格
- **THEN** 当天高亮，未来日期保持中性且不显示已完成状态

#### Scenario: 空月份
- **GIVEN** 用户所选月份没有学习记录或完成目标
- **WHEN** 系统渲染日历
- **THEN** 系统显示完整零值日期网格和空状态说明

#### Scenario: 日历加载失败
- **GIVEN** 日历接口返回错误
- **WHEN** 系统请求月份数据
- **THEN** 系统显示可重试错误且不伪造日期数据

### Requirement: 成就墙

系统 SHALL 在成就墙展示 `GET /api/v1/analytics/achievements` 返回的成就目录，区分已解锁和未解锁，并显示进度、解锁时间或剩余条件。成就墙 MUST 使用可访问的列表或卡片语义；加载失败 MUST 显示重试；无成就数据 MUST 显示空状态。

#### Scenario: 展示已解锁与未解锁成就
- **GIVEN** 成就接口返回混合状态
- **WHEN** 用户查看成就墙
- **THEN** 系统分别标记已解锁和未解锁成就

#### Scenario: 展示未解锁进度
- **GIVEN** 某项成就尚未达到阈值
- **WHEN** 系统渲染该成就
- **THEN** 系统显示当前进度和剩余条件

#### Scenario: 新成就公告
- **GIVEN** 用户的新学习记录触发成就解锁
- **WHEN** 系统刷新成就数据
- **THEN** 系统通过 `aria-live` 公告新解锁成就且不重复公告

#### Scenario: 成就为空
- **GIVEN** 成就接口返回空目录
- **WHEN** 用户查看成就墙
- **THEN** 系统显示成就暂不可用的空状态

#### Scenario: 成就加载失败
- **GIVEN** 成就接口返回错误
- **WHEN** 用户查看成就墙
- **THEN** 系统显示可重试错误且不显示 mock 成就

### Requirement: 学习目标页面

系统 SHALL 在 `/goals` 提供学习目标页面，展示指定日期的目标并允许创建、完成或恢复目标。创建 MUST 校验标题、分类和日期；成功后 MUST 刷新列表；无效输入 MUST 显示字段错误且不提交；空列表 MUST 显示创建引导；API 失败 MUST 显示重试且不回退到 mock。

#### Scenario: 打开学习目标页
- **GIVEN** 用户持有有效 token
- **WHEN** 用户进入 `/goals`
- **THEN** 系统展示当天目标列表和创建入口

#### Scenario: 创建目标
- **GIVEN** 用户填写有效标题、分类和日期
- **WHEN** 用户提交创建
- **THEN** 系统保存目标并将新目标加入列表

#### Scenario: 切换目标状态
- **GIVEN** 目标列表中已有待完成目标
- **WHEN** 用户勾选该目标
- **THEN** 系统持久化完成状态并更新进度

#### Scenario: 无效目标输入
- **GIVEN** 用户提交空标题、过长分类或无效日期
- **WHEN** 用户尝试创建目标
- **THEN** 系统显示字段错误且不发起创建请求

#### Scenario: 目标接口失败
- **GIVEN** 目标接口暂时不可用
- **WHEN** 用户加载或修改目标
- **THEN** 系统显示可重试错误并保留当前可读列表

### Requirement: 认证与数据加载状态

系统 SHALL 在未认证访问学习数据或目标页面时显示登录/注册入口，且不得发起业务数据请求。access token 过期时 MUST 最多刷新一次；刷新失败 MUST 清除本地会话并返回认证入口。数据请求进行中 MUST 显示加载状态，失败 MUST 显示可重试错误。

#### Scenario: 未认证访问学习数据
- **GIVEN** 用户没有有效 token
- **WHEN** 用户访问学习数据页
- **THEN** 系统显示认证入口且不请求分析接口

#### Scenario: Access token 过期
- **GIVEN** 用户持有有效 refresh token，access token 已过期
- **WHEN** 分析接口返回 401
- **THEN** 系统刷新 access token 并重试原请求一次

#### Scenario: Refresh 失败
- **GIVEN** refresh token 无效或已过期
- **WHEN** 系统尝试刷新会话
- **THEN** 系统清除 token、停止请求并显示认证入口

#### Scenario: 数据加载中
- **GIVEN** 学习数据请求尚未完成
- **WHEN** 用户进入页面
- **THEN** 系统显示加载状态并设置 `aria-busy`

#### Scenario: 数据请求失败
- **GIVEN** 学习数据接口返回非认证错误
- **WHEN** 用户进入页面
- **THEN** 系统显示可重试错误且不显示 mock 数据
