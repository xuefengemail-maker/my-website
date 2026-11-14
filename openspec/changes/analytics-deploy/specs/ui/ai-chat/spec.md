# Spec Delta

## MODIFIED Requirements

### Requirement: 聊天路由与认证入口

系统 SHALL 在 `#/chat` 提供聊天页面，并接入共享 StudyPal 工作区壳。左侧导航 MUST 保持“学习数据、AI 对话建议、学习目标”的顺序，并在聊天页将“AI 对话建议”标记为当前页。未认证用户 MUST 看到邮箱密码登录与注册表单；认证成功后系统 SHALL 保存 token 并进入聊天，refresh 失败时 MUST 清除本地会话并返回认证入口。

#### Scenario: 已认证用户进入聊天
- **GIVEN** 用户持有有效 token
- **WHEN** 用户在共享左侧导航选择“AI 对话建议”
- **THEN** 系统进入 `#/chat`、标记该导航项为当前页并加载当前用户的会话内容

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
