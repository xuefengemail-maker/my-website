# auth/user-auth Specification

## Purpose
StudyPal 需要一套可验证的身份边界，使学习者能够安全注册、登录并维持会话，同时确保受保护的 API 只对当前认证用户开放。

## Requirements

### Requirement: 邮箱密码注册

系统 SHALL 允许用户使用未注册的邮箱和符合长度要求的密码创建账户。邮箱在去除首尾空白后按不区分大小写的方式保持唯一；注册成功响应 SHALL 返回账户 ID 与邮箱，且不得包含密码或密码哈希。

#### Scenario: 成功注册
- **GIVEN** 邮箱尚未注册
- **WHEN** 用户提交合法邮箱和 8 至 128 个字符的密码
- **THEN** 系统创建账户并返回账户 ID 与邮箱，且响应不包含密码或密码哈希

#### Scenario: 邮箱已存在
- **GIVEN** 邮箱已注册
- **WHEN** 用户使用仅大小写不同或首尾带空白的同一邮箱注册
- **THEN** 系统返回冲突错误且不创建重复账户

#### Scenario: 注册输入无效
- **GIVEN** 邮箱格式无效或密码长度不在 8 至 128 个字符之间
- **WHEN** 用户提交注册请求
- **THEN** 系统返回输入校验错误且不创建账户

### Requirement: 密码安全存储

系统 SHALL 仅以加盐的不可逆密码哈希保存密码，并 SHALL NOT 在 API 响应、日志或错误信息中暴露密码明文、密码哈希、盐值或哈希算法内部细节。

#### Scenario: 注册后保存密码
- **GIVEN** 用户完成注册
- **WHEN** 系统持久化账户数据
- **THEN** 数据库中只存在可通过原始密码验证的密码哈希，不包含密码明文

#### Scenario: 登录失败不泄露凭据信息
- **GIVEN** 密码错误或邮箱不存在
- **WHEN** 用户尝试登录
- **THEN** 响应不包含密码、哈希、盐值或可区分账户是否存在的细节

### Requirement: 登录与令牌签发

系统 SHALL 在邮箱和密码验证成功后签发 JWT access token 与 refresh token，并返回两者的令牌类型和过期时间。access token SHALL 用于访问受保护资源，refresh token SHALL 仅用于换发 access token。

#### Scenario: 成功登录
- **GIVEN** 用户已注册
- **WHEN** 用户提交正确的邮箱和密码
- **THEN** 系统返回 access token、refresh token、令牌类型及各自的过期时间

#### Scenario: 密码错误
- **GIVEN** 邮箱已注册
- **WHEN** 用户提交错误密码
- **THEN** 系统返回统一的认证失败错误且不签发任何 token

#### Scenario: 邮箱不存在
- **GIVEN** 邮箱未注册
- **WHEN** 用户提交登录请求
- **THEN** 系统返回与密码错误相同的认证失败错误，避免暴露账户是否存在

#### Scenario: 登录输入缺失
- **GIVEN** 登录请求缺少邮箱或密码
- **WHEN** 用户提交请求
- **THEN** 系统返回输入校验错误且不签发任何 token

### Requirement: Access token 鉴权

系统 SHALL 要求受保护 API 使用 Bearer 认证，并 SHALL 只接受签名有效、未过期且令牌类型为 access 的 JWT。缺少、无效、过期或类型错误的凭据 MUST 返回 401。

#### Scenario: 使用有效 access token
- **GIVEN** 用户持有未过期的 access token
- **WHEN** 用户访问受保护 API
- **THEN** 系统按该 token 对应的用户身份处理请求

#### Scenario: 缺少认证凭据
- **GIVEN** 请求未携带 Bearer token
- **WHEN** 用户访问受保护 API
- **THEN** 系统返回 401 且不执行受保护操作

#### Scenario: access token 无效或过期
- **GIVEN** 请求携带签名错误或已过期的 access token
- **WHEN** 用户访问受保护 API
- **THEN** 系统返回 401 且不执行受保护操作

#### Scenario: 拒绝错误令牌类型
- **GIVEN** 请求携带有效但类型为 refresh 的 token
- **WHEN** 用户访问受保护 API
- **THEN** 系统返回 401 且不将其视为 access token

### Requirement: Refresh token 换发

系统 SHALL 允许客户端使用系统已签发、未过期且类型为 refresh 的 JWT 换取新的 access token。无效、过期或未知的 refresh token MUST 被拒绝，且系统不得签发新的 access token。

#### Scenario: 使用有效 refresh token
- **GIVEN** 用户持有系统已签发且未过期的 refresh token
- **WHEN** 用户请求刷新会话
- **THEN** 系统返回新的 access token 及其过期时间

#### Scenario: refresh token 过期
- **GIVEN** refresh token 已超过有效期
- **WHEN** 用户请求刷新会话
- **THEN** 系统返回 401 且不签发新 access token

#### Scenario: refresh token 无效或未知
- **GIVEN** refresh token 签名无效、格式错误或不存在于系统签发记录中
- **WHEN** 用户请求刷新会话
- **THEN** 系统返回 401 且不签发新 access token

#### Scenario: 拒绝错误令牌类型
- **GIVEN** 用户将 access token 提交到刷新会话接口
- **WHEN** 用户请求刷新会话
- **THEN** 系统返回 401 且不签发新 access token
