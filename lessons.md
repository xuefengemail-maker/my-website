# Lessons

只追加。记录本项目踩过的坑和当时的处理方式，供后续环节参考。

**门槛：** 下次还可能再撞，写下来能少走一遍。改拼写、一次性环境抖动不要写。

**Status 只能是：** `resolved` | `open` | `superseded by YYYY-MM-DD — <title>`

条目格式：

```markdown
## YYYY-MM-DD — 短标题

**Area:** API
**Status:** resolved

**Pit:** 碰到了什么。
**Cause:** 原因（未知就写「未定位」）。
**Fix:** 当时怎么处理的。
**Takeaway:** 给后续环节的一句话。
**Refs:** 相关文件路径。
```

---

## 2026-10-18 — 客户端渲染 SPA 的首次 hash 定位

**Area:** 前端
**Status:** resolved

**Pit:** 直接打开 `/#projects` 或 `/#contact` 时，页面停在首屏，不滚动到目标 section。
**Cause:** 浏览器首次定位 hash 时，React 还没有渲染出 section；渲染完成后浏览器不会自动重试。
**Fix:** 在 `App.tsx` 挂载后读取 `location.hash`，用 `document.getElementById()` 找到目标并调用 `scrollIntoView()`。`scroll-padding-top` 继续提供 80px 偏移。
**Takeaway:** SPA 的锚点要在组件挂载后补一次定位，不能只依赖浏览器默认行为。
**Refs:** `src/App.tsx`、`src/index.css`、`openspec/changes/add-navigation/specs/site-navigation/spec.md`

## 2026-10-18 — 不要在纯 SPA 的 spec 里承诺无 JS 可用

**Area:** 规范
**Status:** resolved

**Pit:** `site-navigation` spec 写了“JavaScript 不可用时导航仍可用”，验证时整页为空。
**Cause:** Vite + React 是客户端渲染；禁用 JavaScript 后 `#root` 为空，没有导航和内容。
**Fix:** 把场景改为“导航链接是带 `href` 的原生 `<a>`，不依赖 JavaScript 事件处理”；在 design 中记录 SPA 限制。用户选择不引入 SSR。
**Takeaway:** 纯 SPA 只承诺“不依赖 JS 事件处理”，不要承诺无 JS 渲染。
**Refs:** `openspec/changes/add-navigation/specs/site-navigation/spec.md`、`openspec/changes/add-navigation/design.md`、`src/App.tsx`
