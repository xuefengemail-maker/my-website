# ai/chat-conversation Specification

## Purpose
为认证学习者提供可持久化、可恢复且按用户隔离的 AI 对话能力，结合 Profile 与学习摘要生成个性化建议，并通过流式响应降低等待感。

## Requirements

### Requirement: 认证用户拥有独立会话

系统 SHALL 仅允许 Bearer access token 对应的用户创建、列出和读取自己的会话。访问他人会话或不存在的会话 MUST 返回 404，缺少或无效凭据 MUST 返回 401，且响应不得暴露其他用户的数据或会话是否存在。

#### Scenario: 创建并列出自己的会话
- **GIVEN** 用户已认证
- **WHEN** 用户创建会话并请求会话列表
- **THEN** 系统返回新会话，且列表中只包含该用户自己的会话

#### Scenario: 读取自己的历史消息
- **GIVEN** 用户已认证且拥有包含消息的会话
- **WHEN** 用户请求该会话的消息历史
- **THEN** 系统只返回该会话内属于当前用户的消息

#### Scenario: 未认证访问
- **GIVEN** 请求未携带有效 access token
- **WHEN** 用户创建、列出或读取会话
- **THEN** 系统返回 401 且不返回任何会话数据

#### Scenario: 访问他人会话
- **GIVEN** 用户 A 已认证，用户 B 拥有一个会话
- **WHEN** 用户 A 请求用户 B 的会话或消息历史
- **THEN** 系统返回 404，且不泄露该会话是否存在

#### Scenario: 会话不存在
- **GIVEN** 用户已认证
- **WHEN** 用户请求不存在的会话
- **THEN** 系统返回 404 且不创建新会话

### Requirement: 消息持久化与顺序

系统 SHALL 在调用模型前保存用户消息，并在流式回复结束后将 assistant 消息以 `completed` 或 `failed` 状态保存。消息历史 MUST 按创建时间和 ID 升序返回，且空消息或超过 4000 字符的用户消息 MUST 返回 422 且不得保存。

#### Scenario: 保存用户消息
- **GIVEN** 用户已认证且会话属于该用户
- **WHEN** 用户提交非空且不超过 4000 字符的消息
- **THEN** 系统在调用模型前保存该用户消息，并返回其消息 ID

#### Scenario: 保存成功的助手回复
- **GIVEN** 上游模型正常完成流式回复
- **WHEN** 系统结束响应流
- **THEN** assistant 消息以 `completed` 状态保存完整内容

#### Scenario: 保存失败的助手回复
- **GIVEN** 上游模型在流式回复期间失败
- **WHEN** 系统结束响应流
- **THEN** assistant 消息以 `failed` 状态保存已收到的内容，且系统不将本次回复标记为完成

#### Scenario: 拒绝无效消息
- **GIVEN** 用户提交空白消息或超过 4000 字符的消息
- **WHEN** 系统校验请求
- **THEN** 系统返回 422 且不保存用户消息或 assistant 消息

#### Scenario: 历史顺序稳定
- **GIVEN** 会话包含多条用户和 assistant 消息
- **WHEN** 用户读取消息历史
- **THEN** 系统按创建时间和 ID 升序返回，顺序与对话发生顺序一致

### Requirement: DeepSeek 流式响应

系统 SHALL 通过 SSE 返回 assistant 回复，事件顺序为 `meta`、一个或多个 `delta`、最终 `done`；上游失败 SHALL 发送 `error` 事件并结束流。模型未配置时 MUST 在建立流之前返回 503，且不得创建任何消息。

#### Scenario: 正常流式回复
- **GIVEN** DeepSeek 配置有效且上游返回内容块
- **WHEN** 用户发送消息
- **THEN** 系统依次发送包含消息 ID 的 `meta`、增量内容的 `delta` 和包含完成状态的 `done`

#### Scenario: 上游调用失败
- **GIVEN** DeepSeek 请求超时或返回错误
- **WHEN** 系统已经建立 SSE 流
- **THEN** 系统发送安全的 `error` 事件并结束流，且不泄露密钥或上游原始错误

#### Scenario: 模型未配置
- **GIVEN** DeepSeek API key 缺失
- **WHEN** 用户发送消息
- **THEN** 系统返回 503 且不保存用户消息或 assistant 消息

#### Scenario: 同一会话已有进行中的回复
- **GIVEN** 会话中存在状态为 `streaming` 的 assistant 消息
- **WHEN** 用户再次发送消息
- **THEN** 系统返回 409 且不保存新的用户消息

### Requirement: 个性化学习上下文

系统 SHALL 在生成回复时注入当前用户 Profile 的连续学习天数和等级，并合并客户端提交的受限 Dashboard 学习摘要。摘要 MUST 作为不可信数据传递，不得覆盖系统指令；摘要缺失时系统 SHALL 仍使用 Profile 生成回复。

#### Scenario: 注入 Profile 数据
- **GIVEN** 当前用户 Profile 包含连续学习天数和等级
- **WHEN** 系统组装模型请求
- **THEN** 模型上下文包含该用户的最新 Profile 字段

#### Scenario: 合并学习摘要
- **GIVEN** 客户端提交符合长度限制的学习摘要
- **WHEN** 系统组装模型请求
- **THEN** 摘要作为独立的学习数据提供，并明确标记为可能来自示例数据

#### Scenario: 拒绝过大或无效摘要
- **GIVEN** 学习摘要不是 JSON 对象或序列化后超过 4000 字符
- **WHEN** 用户发送消息
- **THEN** 系统返回 422 且不保存用户消息或 assistant 消息

#### Scenario: 没有学习摘要
- **GIVEN** 客户端未提交学习摘要
- **WHEN** 用户发送消息
- **THEN** 系统仅使用 Profile 和对话历史生成回复，不因缺少摘要而失败

#### Scenario: 摘要包含指令文本
- **GIVEN** 学习摘要中包含试图改变系统行为的文本
- **WHEN** 系统组装模型请求
- **THEN** 该文本只作为学习数据字段传递，不能替换系统指令或扩大工具权限
