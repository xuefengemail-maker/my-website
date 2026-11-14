# Proposal

## Why

StudyPal 目前只有前端 mock 数据，无法安全识别用户或持久化个性化 Profile。先建立 FastAPI + JWT 认证与用户资料基础，为后续真实学习记录、跨设备状态和个性化能力提供可信身份边界。

## What Changes

- 新增独立 FastAPI 后端应用，使用 SQLite 3 持久化数据，使用 Alembic 管理数据库迁移。
- 新增邮箱 + 密码的注册和登录能力；密码只保存安全哈希，不保存明文。
- 新增 JWT access token 与 refresh token：受保护接口校验 access token，refresh token 用于换取新的 access token。
- 新增认证用户 Profile 能力：返回头像 URL、连续学习天数、用户等级，并支持更新头像 URL。
- 新增用户、refresh token 和用户 Profile 的数据模型及初始 Alembic 迁移。
- 为认证与 Profile API 建立统一的鉴权边界、输入校验和错误响应约定。
- 本变更只交付后端 API、数据模型和迁移，不修改现有 Dashboard UI。

## Capabilities

### New Capabilities

- `auth/user-auth`: 用户注册、登录、JWT access/refresh token 生命周期，以及受保护 API 的身份校验。
- `users/user-profile`: 认证用户 Profile 的头像 URL、连续学习天数、用户等级读取与头像更新。

### Modified Capabilities

无。

## Impact

- 后端：新增 FastAPI 应用、数据库会话、配置管理和 Alembic 迁移目录。
- 数据：新增用户、refresh token、用户 Profile 相关表；SQLite 作为本地及初版部署数据库。
- API：新增认证与 Profile API 分组，具体路径和 payload 在 design.md 中定义。
- 依赖：新增 FastAPI、SQLAlchemy、Alembic、JWT 与密码哈希相关依赖；不得影响现有前端构建。
- 前端：本变更不接入 Dashboard UI，后续可单独变更实现登录页、token 存储和 API 客户端。
- Profile 字段：头像使用 URL；连续学习天数和用户等级作为持久化字段返回，自动计算规则依赖后续学习行为数据。

## Out of Scope

- 后台管理。
- 前端登录、注册界面和前端 token 存储。
- 头像文件上传和对象存储。
- 第三方 OAuth、邮箱验证、找回密码和账号注销。
- 连续学习天数与用户等级的自动计算规则。

## Rollback

认证与 Profile 后端作为独立应用和独立迁移引入，现有前端构建不依赖它。若方案验证失败，可移除后端应用目录及其依赖，或通过 Alembic downgrade 回退数据库迁移；SQLite 数据在迁移前备份，回滚时恢复备份即可。由于当前没有生产用户数据，整体回滚风险可控。
