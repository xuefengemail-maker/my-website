# ui/ai-chat Specification

## Purpose
为已认证学习者提供独立于 mock Dashboard 的聊天页面，以气泡对话、流式反馈和 Markdown 呈现个性化学习建议。

## Requirements

### Requirement: 聊天路由与认证入口

系统 SHALL 在 `#/chat` 提供聊天页面，并从 Dashboard 提供可发现的入口。未认证用户 MUST 看到邮箱密码登录与注册表单；认证成功后系统 SHALL 保存 token 并进入聊天，refresh 失败时 MUST 清除本地会话并返回认证入口。

#### Scenario: 已认证用户进入聊天
- **GIVEN** 用户持有有效 token
- **WHEN** 用户从 Dashboard 打开 AI 助手
- **THEN** 系统显示聊天页面并加载当前用户的会话内容

#### Scenario: 未认证用户进入聊天
- **GIVEN** 用户没有有效 token
- **WHEN** 用户访问 `#/chat`
- **THEN** 系统显示登录与注册表单，且不发起聊天消息请求

#### Scenario: 登录或注册成功
- **GIVEN** 用户提交合法的邮箱和密码
- **WHEN** 登录或注册成功
- **THEN** 系统保存 access 与 refresh token 并显示聊天页面

#### Scenario: Access token 过期
- **GIVEN** 用户持有有效 refresh token，access token 已过期
- **WHEN** 聊天 API 返回 401
- **THEN** 系统使用 refresh token 换发 access token 并重试原请求一次

#### Scenario: Refresh 失败
- **GIVEN** refresh token 无效或已过期
- **WHEN** 系统尝试刷新会话
- **THEN** 系统清除 token、停止聊天请求并显示认证入口

### Requirement: 历史恢复

系统 SHALL 在进入聊天页时恢复当前用户最近的会话及消息，并在没有历史时显示空状态。加载失败 MUST 显示可重试提示，且不得将失败状态伪装为空对话。

#### Scenario: 恢复最近会话
- **GIVEN** 用户已有会话和消息
- **WHEN** 用户进入聊天页
- **THEN** 系统按历史顺序显示最近会话中的用户与 assistant 消息

#### Scenario: 没有历史消息
- **GIVEN** 用户尚无任何会话或消息
- **WHEN** 用户进入聊天页
- **THEN** 系统显示引导性空状态，并保留消息输入框

#### Scenario: 历史加载失败
- **GIVEN** 聊天历史接口暂时不可用
- **WHEN** 用户进入聊天页
- **THEN** 系统显示加载失败和重试控件，不显示“暂无消息”

#### Scenario: 历史请求未认证
- **GIVEN** access token 与 refresh token 均无效
- **WHEN** 系统请求聊天历史
- **THEN** 系统清除本地会话并显示认证入口

### Requirement: 气泡对话与消息输入

系统 SHALL 以用户消息靠右、assistant 消息靠左的气泡展示对话，并提供明确的发送者标签。输入框 MUST 支持 Enter 发送、Shift+Enter 换行和中文输入法组合态；空白消息不得发送，消息长度上限为 4000 字符。

#### Scenario: 展示双方气泡
- **GIVEN** 会话中同时存在用户与 assistant 消息
- **WHEN** 系统渲染消息列表
- **THEN** 用户消息靠右、assistant 消息靠左，并各自显示可读的发送者标签

#### Scenario: 键盘发送与换行
- **GIVEN** 输入框已获得焦点且包含有效文本
- **WHEN** 用户按 Enter 或 Shift+Enter
- **THEN** Enter 发送消息，Shift+Enter 插入换行

#### Scenario: 中文输入法组合态
- **GIVEN** 用户正在使用输入法组合中文
- **WHEN** 用户按 Enter 确认候选词
- **THEN** 系统不发送消息，直到组合态结束后的再次发送操作

#### Scenario: 拒绝空白或超长消息
- **GIVEN** 输入内容为空、仅含空白或超过 4000 字符
- **WHEN** 用户尝试发送
- **THEN** 系统禁用发送或显示长度错误，且不发起网络请求

#### Scenario: 发送请求失败
- **GIVEN** 聊天接口不可用或返回非认证错误
- **WHEN** 用户发送有效消息
- **THEN** 系统保留输入或待重试内容并显示可重试错误，不清空已有历史

### Requirement: 流式展示与自动滚动

系统 SHALL 在 assistant 气泡中增量展示 SSE `delta` 内容，并通过 `aria-live="polite"` 公告状态变化。消息更新时系统 SHALL 在用户接近底部时自动滚动；用户主动上滚后 MUST NOT 强制拉回，并提供“回到底部”控件。

#### Scenario: 增量显示回复
- **GIVEN** 用户已发送消息且 SSE 连接已建立
- **WHEN** 系统收到多个 `delta` 事件
- **THEN** assistant 气泡持续追加内容，并在 `done` 后移除流式指示

#### Scenario: 接近底部时自动滚动
- **GIVEN** 用户位于消息列表底部附近
- **WHEN** 新的 assistant 内容到达
- **THEN** 消息列表自动滚动到最新内容

#### Scenario: 用户主动上滚
- **GIVEN** 用户已向上滚动离开底部
- **WHEN** 新的 assistant 内容到达
- **THEN** 系统保持当前阅读位置并显示回到底部控件

#### Scenario: 减少动态效果
- **GIVEN** 用户启用 `prefers-reduced-motion`
- **WHEN** 系统自动滚动或显示流式状态
- **THEN** 系统使用无平滑动画的更新方式

#### Scenario: 流式回复中断
- **GIVEN** SSE 已返回部分内容后收到 `error` 事件或连接中断
- **WHEN** 系统结束流式状态
- **THEN** 系统保留已显示内容，标记回复失败并提供重试入口

### Requirement: Markdown 安全渲染

系统 SHALL 对 assistant 消息渲染 Markdown，包括标题、列表、代码块、表格和链接；用户消息 SHALL 以纯文本显示。系统 MUST NOT 执行原始 HTML、脚本或危险 URL，外部链接 MUST 使用安全的打开方式。

#### Scenario: 渲染常见 Markdown
- **GIVEN** assistant 消息包含标题、列表、代码块和表格
- **WHEN** 系统渲染该消息
- **THEN** 内容以对应格式呈现且代码块保持可读

#### Scenario: 用户消息保持纯文本
- **GIVEN** 用户消息包含 Markdown 或 HTML 字符
- **WHEN** 系统渲染该消息
- **THEN** 字符按原样显示，不被解释为格式化内容

#### Scenario: 原始 HTML 不执行
- **GIVEN** assistant 消息包含脚本或原始 HTML
- **WHEN** 系统渲染该消息
- **THEN** 原始 HTML 不被执行，危险标签不会进入页面 DOM

#### Scenario: 危险链接
- **GIVEN** assistant 消息包含 `javascript:` 等危险 URL
- **WHEN** 系统渲染链接
- **THEN** 系统不提供可执行的危险链接

#### Scenario: Markdown 格式异常
- **GIVEN** assistant 消息包含不完整或异常的 Markdown
- **WHEN** 系统渲染该消息
- **THEN** 系统仍显示可读文本，不导致页面崩溃
