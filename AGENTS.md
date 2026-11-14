# AGENTS.md — 项目 AI 协作规范

本文件是 Codex 的项目规则入口，也是本项目 AI 协作规范的唯一来源。`CLAUDE.md` 只保留兼容说明。

## 项目概览

- 个人品牌站，技术栈为 React 19 + Vite + TypeScript + Tailwind CSS v4。
- 部署目标是 GitHub Pages，构建产物在 `dist/`，站点 base path 为 `/my-website/`。
- 结构化需求、规格和变更记录由 OpenSpec 管理，目录为 `openspec/`。
- 当前 OpenSpec 根目录已初始化，Codex 技能已生成到 `.agents/skills/`。

## 开始任务前

1. 读取 `openspec/config.yaml`，确认项目约束和产物规则。
2. 读取 `openspec/specs/` 下相关域的 `spec.md`，了解当前系统行为。
3. 检查 `openspec/changes/` 下是否存在活跃变更；`archive/` 中的内容是历史记录。
4. 如果是在恢复会话或跨会话继续工作，先读取 `.handoff/latest.md`。
5. 如果 spec 没有明确定义某项行为，先询问用户，不要自行补充需求。
6. `proposal.md` 中标记为 out-of-scope 的功能是红线，严禁实现。

## OpenSpec 与 Codex

Codex 使用 `.agents/skills/` 中的 OpenSpec 技能，不识别 Claude Code 的 `/opsx:*` 斜杠命令。用户提出对应意图时，使用以下技能：

| 目标 | Codex 技能 |
| --- | --- |
| 新建变更 | `$openspec-new-change` |
| 提案与需求分析 | `$openspec-propose` |
| 继续创建产物 | `$openspec-continue-change` |
| 实施任务 | `$openspec-apply-change` |
| 更新变更 | `$openspec-update-change` |
| 校验变更 | `$openspec-verify-change` |
| 同步主 specs | `$openspec-sync-specs` |
| 归档变更 | `$openspec-archive-change` |
| 批量归档 | `$openspec-bulk-archive-change` |
| 快速推进 | `$openspec-ff-change` |
| 探索方案 | `$openspec-explore` |
| 项目入门 | `$openspec-onboard` |

常用 CLI：

```bash
openspec list --json
openspec status --change "<name>" --json
openspec instructions apply --change "<name>" --json
openspec validate --all
openspec archive <name>
```

写入 OpenSpec 产物前，先运行 `openspec list --json`，确认返回的 `root` 指向本项目。不要手动移动或删除变更目录；归档必须通过 OpenSpec 工作流完成。除非用户明确要求，不要重复运行 `openspec init`。

OpenSpec 产物使用简体中文；代码、命令、文件路径和通用技术术语保留英文。

## Apply 阶段规则

1. 严格按 `tasks.md` 执行，不擅自扩大范围。
2. 每完成一个 Phase 就停下来。
3. 总结当前阶段的代码变更：改了哪些文件、为什么这样改、如何验证。
4. 等待用户 review 并确认后，再继续下一个 Phase。
5. 严禁一次性实现所有任务。

## 代码标准

- 使用 TypeScript 和函数式 React 组件。
- 样式全部使用 Tailwind CSS，禁止内联 `style`。
- 支持暗色模式，使用 `dark:` 前缀和现有颜色变量。
- 所有图片使用 lazy loading。
- 组件文件名使用 PascalCase。
- 站点文案和结构化内容优先放在 `src/content/site.ts`。
- 面向爬虫的静态 SEO 标签保留在 `index.html`，不要移到 React 组件中。
- 保持键盘可访问性、触控目标和 `prefers-reduced-motion` 支持。
- 不引入不必要的新依赖。

## 验证命令

```bash
npm run lint
npm run build
openspec validate --all
```

代码变更至少运行 lint 和 build；OpenSpec 变更同时运行 validate。仅修改文档时，至少运行 OpenSpec validate。

## Git 与会话

- 用户未明确要求时，不要执行 `git commit`、`git push` 或创建分支。
- 会话结束或需要交接时，更新 `.handoff/latest.md`。
- 产生长期约束时记录到 `decisions.md`；总结出可复用经验时记录到 `lessons.md`。

## 当前状态与风险

- 当前没有活跃 OpenSpec 变更；主 specs 与归档变更已清空，仅保留 `openspec/config.yaml` 和目录占位文件。
- `vite.config.ts` 已配置 `base: '/my-website/'`。
- 发布前仍需替换 `index.html` 中的公开 URL，并替换 `src/content/site.ts` 中的示例项目链接和占位文案。
- 站点是客户端渲染 SPA；禁用 JavaScript 时页面为空，这是已接受的决策，不引入 SSR。

## OpenSpec 协作规则

### 分阶段交互（防止错上加错）

在执行 `/opsx:apply` 时：

1. 每完成一个 phase 停下来。
2. 总结当前阶段的变更，包括改了哪些文件、新增了什么。
3. 等待用户 review 确认后再继续下一个 phase。
4. 如果发现偏差，立即停止并说明问题。

### 复用优先

- 优先使用已有组件和服务。
- 新建文件前先搜索是否有可复用的实现。
- 不创建重复的 utility 函数。

### 命名一致性

- Change 使用 domain-based naming，例如 `user-auth`、`ai-chat`；不使用 feature-level naming，例如 `add-sidebar`、`fix-layout`。
- Spec 按业务域组织，例如 `ui/`、`auth/`、`ai/`，每个域下按 capability 命名。
- React 组件使用 PascalCase。
- API 端点使用 kebab-case。
- 数据库表使用 snake_case。
