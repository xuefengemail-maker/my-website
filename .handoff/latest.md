# Session Handoff

## 当前目标

使用 Codex + OpenSpec 继续 StudyPal 个人学习助手的开发。

## 当前状态（2026-11-14）

- 当前分支：`test/new-feature`；本次准备首次提交并推送。
- 活跃 OpenSpec 变更：`openspec/changes/analytics-deploy/`，进度 37/44。
- Phase 1–6 已实现：学习记录、目标、分析、日历、成就、共享工作区、目标页、健康检查、容器入口、Pages 工作流和后端镜像 CI。
- `Backend Image` CI 已通过（run 43603145079），镜像构建、`/health`、CORS 预检和迁移失败退出均验证通过。
- 验证通过：后端 45 个 pytest、`compileall`、`npm run lint`、`npm run build`、`openspec validate --all --strict` 6/6。
- 已本地验证启动入口：迁移、`/health`、CORS 预检、迁移失败非零退出和错误摘要。

## 下一步

1. 进入 Phase 7 集成与质量门禁，完成完整验证和三维核对。
2. 完成 Phase 7 后执行 `openspec verify`，再走归档工作流。
3. `Deploy GitHub Pages` 只会在 `main` 推送或手动触发时运行；分支推送仅触发 `Backend Image`。

## 待办 / 风险

- 用户曾在对话中粘贴真实 DeepSeek key；该 key 未写入仓库，但必须立即撤销并轮换。
- GitHub Pages 工作流要求仓库变量 `VITE_STUDYPAL_API_BASE_URL` 为 HTTPS 地址，否则构建前失败。
- 后端必须单实例运行并挂载 SQLite 持久卷；生产 CORS 只加入实际 Pages origin。
- 前端 bundle 约 508 KB，Vite 有超过 500 KB 的提示，不影响构建。
- 浏览器截图级手工检查仍未执行，不要记为已通过。
- 发布前仍需替换 `index.html` 中的公开 URL 和 `src/content/site.ts` 中的示例链接。

## 勿带入新会话

- 不要重复运行 `openspec init`。
- 不要手动移动或删除 `openspec/changes/` 下的目录；归档必须走 OpenSpec 工作流。
- 不要重新讨论是否引入 SSR；用户已决定保持 SPA。
- 用户未明确要求时，不要执行额外的 `git commit`、`git push` 或创建分支。
