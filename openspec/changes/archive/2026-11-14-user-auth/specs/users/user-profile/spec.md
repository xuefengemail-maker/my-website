# Spec Delta

## Purpose

StudyPal 用户 Profile 为已认证学习者提供头像、连续学习天数和用户等级的稳定读取边界，并允许用户维护自己的头像 URL。

## ADDED Requirements

### Requirement: 读取当前用户 Profile

系统 SHALL 允许已认证用户读取自己的 Profile，返回头像 URL、连续学习天数和用户等级。新账户 SHALL 初始化为空头像、连续学习 0 天和等级 1；连续学习天数不得为负，用户等级不得低于 1，响应 MUST 只包含当前 access token 对应用户的数据。

#### Scenario: 读取已有 Profile
- **GIVEN** 用户已认证且拥有 Profile
- **WHEN** 用户请求自己的 Profile
- **THEN** 系统返回该用户的头像 URL、连续学习天数和用户等级

#### Scenario: 新用户使用默认 Profile
- **GIVEN** 用户刚刚完成注册
- **WHEN** 用户首次请求自己的 Profile
- **THEN** 系统返回空头像、连续学习 0 天和等级 1

#### Scenario: 只返回当前用户数据
- **GIVEN** 用户 A 和用户 B 都已注册并拥有不同 Profile
- **WHEN** 用户 A 使用自己的 access token 请求 Profile
- **THEN** 系统只返回用户 A 的 Profile，不接受客户端指定其他用户身份

#### Scenario: 未认证访问
- **GIVEN** 请求未携带有效 access token
- **WHEN** 用户请求 Profile
- **THEN** 系统返回 401 且不返回任何用户资料

### Requirement: 更新头像 URL

系统 SHALL 允许已认证用户更新自己的头像 URL。头像 URL MUST 为 http 或 https 地址且长度不超过 2048 个字符；成功响应 SHALL 返回更新后的 Profile，校验失败 MUST NOT 修改现有头像。

#### Scenario: 成功更新头像
- **GIVEN** 用户已认证且请求使用合法的 http 或 https 头像 URL
- **WHEN** 用户提交头像更新
- **THEN** 系统保存新的头像 URL 并返回更新后的 Profile

#### Scenario: 头像 URL 格式无效
- **GIVEN** 用户提交非 http 或 https 的地址或格式错误的 URL
- **WHEN** 用户提交头像更新
- **THEN** 系统返回输入校验错误且保留原头像 URL

#### Scenario: 头像 URL 过长
- **GIVEN** 用户提交超过 2048 个字符的头像 URL
- **WHEN** 用户提交头像更新
- **THEN** 系统返回输入校验错误且保留原头像 URL

#### Scenario: 未认证更新
- **GIVEN** 请求未携带有效 access token
- **WHEN** 用户提交头像更新
- **THEN** 系统返回 401 且不修改任何 Profile

### Requirement: 学习字段只读

系统 SHALL 将连续学习天数和用户等级作为只读字段。更新 Profile 时系统 MUST NOT 接受客户端对这两个字段的修改；包含这些字段的请求 MUST 被拒绝且现有 Profile 保持不变。

#### Scenario: 拒绝修改连续学习天数
- **GIVEN** 用户尝试通过 Profile 更新请求设置连续学习天数
- **WHEN** 用户提交请求
- **THEN** 系统返回输入校验错误且连续学习天数保持不变

#### Scenario: 拒绝修改用户等级
- **GIVEN** 用户尝试通过 Profile 更新请求设置用户等级
- **WHEN** 用户提交请求
- **THEN** 系统返回输入校验错误且用户等级保持不变

#### Scenario: 仅更新头像时保留学习字段
- **GIVEN** 用户拥有已有的连续学习天数和用户等级
- **WHEN** 用户只更新头像 URL
- **THEN** 系统保留原连续学习天数和用户等级，仅修改头像 URL
