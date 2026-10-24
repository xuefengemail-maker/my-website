# my-website

个人品牌站。技术栈：React 19 + Vite + TypeScript + Tailwind CSS v4。

## 本地开发

```bash
npm install
npm run dev       # 启动开发服务器
npm run build     # 类型检查并构建到 dist/
npm run lint      # 运行 oxlint
npm run preview   # 预览构建产物
```

## 目录结构

```text
src/
  components/
    Navbar.tsx          固定顶部导航栏
    Hero.tsx            首屏布局、文案与 CTA
    HeroBackground.tsx  Canvas 粒子背景
    AboutSection.tsx    关于我区域
    ThemeToggle.tsx     亮/暗主题切换按钮
    ProjectsSection.tsx 项目占位区块
    ContactSection.tsx  联系占位区块
  content/
    site.ts             名字、导航与区块文案
  theme/
    ThemeProvider.tsx   主题状态、持久化与系统偏好监听
    useTheme.ts         主题 Context 与 useTheme hook
  App.tsx
  index.css             Tailwind 入口、主题变体与颜色变量
index.html              首屏主题启动脚本
public/
  about/                关于我占位肖像
  projects/             项目卡片占位截图
  og-image.png          社交分享预览图（1200x630）
  robots.txt            爬虫规则
openspec/               OpenSpec 变更与规范
```

## 主题

- 存储键：`localStorage.theme`
- 取值：`light` 或 `dark`
- 没有存储值时跟随系统 `prefers-color-scheme`
- `index.html` 中的同步脚本在首次绘制前设置 `.dark`，避免主题闪烁

## 导航与锚点

- 固定导航栏高度 `4rem`。左侧显示名字，右侧显示首页、项目、联系我和主题切换。
- 锚点：`#hero`、`#projects`、`#contact`。
- 平滑滚动由 `scroll-behavior: smooth` 控制。`prefers-reduced-motion: reduce` 时改为即时跳转。
- `scroll-padding-top: 5rem` 保证锚点标题不被导航栏遮挡。
- 导航栏使用半透明背景和 `backdrop-filter` 模糊。浏览器不支持时回退为不透明背景。

## 项目展示区

- 数据位置：`src/content/site.ts` 中的 `siteContent.projects.items`。
- 每个项目包含 `name`、`description`、`screenshot`、`href` 四个字段。
- 截图放在 `public/projects/`。`screenshot` 写相对路径，例如 `projects/analytics-dashboard.svg`，不要加前导 `/`；组件会拼接 `import.meta.env.BASE_URL`。
- 替换截图时，保持文件名不变，或同步修改 `screenshot` 字段。
- 把 `href` 替换为真实的 GitHub 仓库地址。当前值是示例地址。
- 至少保留 4 个项目。布局在 320px 为单列，768px 为两列，1280px 为四列。

## 关于我区域

- 数据位置：`src/content/site.ts` 中的 `siteContent.about`。
- `paragraphs` 固定包含 3 段简介。
- `brand` 是品牌标签文本，默认是“赋范空间”。
- 照片放在 `public/about/profile.svg`。替换照片时保持文件名，或同步修改 `about.photo.src`。
- 替换真实照片后，同步更新 `about.photo.alt`，保持替代文本准确。
- 区域顺序是 Hero、关于我、项目、联系我。

## SEO 与社交分享

静态 SEO 标签全部写在 `index.html`。社交爬虫不执行 JavaScript，因此不要把这些标签移到 React 组件中。

- **标题与描述**：`<title>` 和 `<meta name="description">` 使用 `src/content/site.ts` 中的名字、职业和一句话介绍。修改这些文案时，同步更新 `index.html`。
- **公开 URL**：`canonical`、`og:url`、`og:image` 和 `twitter:image` 当前使用占位地址 `https://xuefengemail-maker.github.io/my-website/`。发布前必须把 `xuefengemail-maker` 替换为真实的 GitHub 用户名。
- **社交预览图**：`public/og-image.png`，尺寸 1200x630。替换图片时保持文件名和尺寸，或同步修改 `index.html` 中的图片 URL。
- **爬虫规则**：`public/robots.txt` 允许通用爬虫和 Googlebot。页面同时包含 `<meta name="robots" content="index, follow">`。
- **GitHub Pages 限制**：项目站点的 `robots.txt` 位于 `/my-website/robots.txt`，不是主机根目录 `username.github.io/robots.txt`。标准爬虫只读取主机根目录的 robots.txt，因此页面级 `meta robots` 才是项目站点下实际生效的索引控制。迁移到自定义域名后，同一份 `robots.txt` 会在根路径生效。
- **不包含 sitemap**：当前是单页站点，未生成 `sitemap.xml`。

## 部署说明

构建产物位于 `dist/`。`vite.config.ts` 已设置 `base: '/my-website/'`，匹配 GitHub Pages 的项目路径。

- 本地开发服务器地址：`http://localhost:5173/my-website/`
- `npm run preview` 同样在 `/my-website/` 下提供构建产物。
