# Decisions

只追加的承诺日志：记录会约束以后行动的决定。旧条目正文不改，只允许改 **Status** 行。

**门槛：** 未来读者会问「当时答应过吗 / 还能不能做 X？」才写入。今天的一次性选择不要记。

**Status 只能是：** `proposed` | `accepted` | `superseded by YYYY-MM-DD — <title>` | `reversed`

条目格式：

```markdown
## YYYY-MM-DD — 短标题

**Status:** accepted

**Context:** 什么问题促成这个决定。

**Decision:** 具体决定了什么。

**Consequences:** 之后什么更容易、什么更难。

**References:** 相关文件或链接。
```

---

## 2026-10-18 — 站点保持客户端渲染 SPA，不引入 SSR

**Status:** accepted

**Context:** 验证发现禁用 JavaScript 时整页为空，而 `site-navigation` spec 曾要求无 JS 导航可用。用户选择修改 spec，而不是增加 SSR 或预渲染。

**Decision:** 站点继续使用 Vite + React 客户端渲染。不实现 SSR 或构建时预渲染。无 JavaScript 环境不保证显示页面内容。

**Consequences:** 构建和部署保持简单；无 JS 用户和部分爬虫看不到内容。若未来需要无 JS 支持，必须另开变更引入 SSR 或预渲染。

**References:** `openspec/changes/add-navigation/specs/site-navigation/spec.md`、`openspec/changes/add-navigation/design.md`、`src/App.tsx`

## 2026-11-08 — 后续二次开发以 Codex 为主工具

**Status:** accepted

**Context:** 项目最初使用 Claude Code + OpenSpec 建设，现需要切换到 Codex，同时保留既有 OpenSpec 规范和 Claude Code 兼容能力。

**Decision:** 后续二次开发使用 Codex 作为主要 AI 开发工具。Codex 通过 `AGENTS.md` 和 `.agents/skills/` 使用 OpenSpec 工作流；项目 AI 协作规范以 `AGENTS.md` 为唯一来源，`CLAUDE.md` 仅保留兼容入口。

**Consequences:** 后续任务应优先使用 `$openspec-*` 技能和 OpenSpec CLI；规则变更只需维护 `AGENTS.md`，避免两份规范漂移。Claude Code 仍可继续使用，但需要先读取 `AGENTS.md`。

**References:** `AGENTS.md`、`CLAUDE.md`、`.agents/skills/`、`openspec/config.yaml`
