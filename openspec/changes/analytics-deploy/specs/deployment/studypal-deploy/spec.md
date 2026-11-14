# deployment/studypal-deploy Specification

## Purpose

为 StudyPal 提供可重复、可验证的前端与后端部署契约，确保生产构建、健康检查、环境配置、数据库迁移和回滚可以按步骤执行。

## ADDED Requirements

### Requirement: 前端静态部署

系统 SHALL 以 `/my-website/` 为 base path 构建前端并将 `dist/` 发布到 GitHub Pages。生产构建 MUST 使用 `VITE_STUDYPAL_API_BASE_URL` 指向 HTTPS 后端；所有 hash 路由 MUST 在静态托管下可直接打开；资源路径 MUST 包含 base path。部署工作流缺少生产 API 地址时 MUST 在发布前失败。

#### Scenario: 生产构建
- **GIVEN** 部署工作流注入了有效的 `VITE_STUDYPAL_API_BASE_URL`
- **WHEN** 系统执行前端生产构建
- **THEN** 构建成功并生成可发布到 GitHub Pages 的 `dist/`

#### Scenario: 直接打开聊天路由
- **GIVEN** 前端已部署到 GitHub Pages 项目路径
- **WHEN** 用户直接访问 `#/chat`
- **THEN** 静态托管返回应用入口并渲染聊天页面

#### Scenario: 资源路径
- **GIVEN** 站点部署在 `/my-website/`
- **WHEN** 浏览器加载构建后的脚本和样式
- **THEN** 所有资源 URL 都包含 `/my-website/` 前缀且加载成功

#### Scenario: 缺少生产 API 地址
- **GIVEN** 部署工作流没有配置 `VITE_STUDYPAL_API_BASE_URL`
- **WHEN** 系统准备发布前端
- **THEN** 工作流在发布前失败并提示配置缺失

### Requirement: 后端容器与健康检查

系统 SHALL 提供容器化 FastAPI 后端，容器启动时 MUST 先执行 `alembic upgrade head` 再启动服务。`GET /health` SHALL 无需认证返回 200 和数据库状态；数据库不可用或迁移失败时 MUST 阻止容器进入健康状态。

#### Scenario: 健康检查成功
- **GIVEN** 后端容器已启动且数据库可连接
- **WHEN** 平台请求 `/health`
- **THEN** 系统返回 200 和健康的数据库状态

#### Scenario: 数据库不可用
- **GIVEN** 后端运行中但数据库连接失败
- **WHEN** 平台请求 `/health`
- **THEN** 系统返回非 200 健康状态且不暴露内部连接信息

#### Scenario: 迁移失败阻止启动
- **GIVEN** 数据库迁移脚本执行失败
- **WHEN** 容器启动
- **THEN** 服务不进入健康状态并输出不含密钥的错误摘要

#### Scenario: 健康检查无需认证
- **GIVEN** 请求没有 access token
- **WHEN** 平台请求 `/health`
- **THEN** 系统仍返回健康状态且不要求登录

### Requirement: 生产配置与来源限制

生产配置 MUST 通过环境变量提供至少 32 字符的 JWT secret、数据库 URL、允许的 CORS origins 和时区。DeepSeek key MAY 为空，但聊天端点 MUST 返回 503。CORS MUST 只允许配置的来源；密钥 MUST NOT 出现在前端 bundle、日志或健康响应中。

#### Scenario: 有效生产配置
- **GIVEN** JWT secret、数据库 URL、CORS origins 和时区均已配置
- **WHEN** 后端启动
- **THEN** 认证、Profile、分析和聊天路由可在生产环境初始化

#### Scenario: JWT secret 缺失或过短
- **GIVEN** JWT secret 缺失或少于 32 字符
- **WHEN** 后端启动
- **THEN** 系统拒绝启动并返回配置错误

#### Scenario: 未配置来源的预检
- **GIVEN** 浏览器从不在 CORS 白名单中的来源发起预检
- **WHEN** 后端处理该请求
- **THEN** 响应不包含允许该来源的 CORS 头

#### Scenario: DeepSeek 未配置
- **GIVEN** DeepSeek key 为空但其他生产配置有效
- **WHEN** 平台执行健康检查或用户访问认证与学习分析接口
- **THEN** 这些能力正常工作，聊天端点返回 503

#### Scenario: 密钥不进入前端
- **GIVEN** 前端使用生产构建产物
- **WHEN** 检查脚本、静态资源和健康响应
- **THEN** 找不到 JWT secret、DeepSeek key 或数据库凭据

### Requirement: 迁移、备份与回滚

部署流程 MUST 在数据库迁移前备份 SQLite，并在迁移失败时停止发布。回滚 MUST 支持恢复上一后端镜像并执行 `alembic downgrade 20261114_0002`；回滚不得删除 `users`、`user_profiles`、`refresh_tokens` 或已有聊天表数据。

#### Scenario: 迁移前备份
- **GIVEN** 新版本包含数据库迁移
- **WHEN** 部署流程开始升级
- **THEN** 系统先生成可恢复的 SQLite 备份

#### Scenario: 迁移失败停止发布
- **GIVEN** `alembic upgrade head` 执行失败
- **WHEN** 部署流程检测到非零退出码
- **THEN** 系统停止发布并保留旧版本和备份

#### Scenario: 回滚应用与数据库
- **GIVEN** 新版本已上线但需要回滚
- **WHEN** 运维恢复上一镜像并执行降级迁移
- **THEN** 应用和数据库回到上一版本

#### Scenario: 回滚保留既有数据
- **GIVEN** 用户、Profile、refresh token 和聊天数据已存在
- **WHEN** 系统回滚分析功能
- **THEN** 这些既有数据保持可读取且不被删除
