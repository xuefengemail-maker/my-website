export type Project = {
  name: string
  description: string
  screenshot: string
  href: string
}

const projects: readonly Project[] = [
  {
    name: '数据可视化仪表盘',
    description:
      '把分散的业务指标集中到一块可读的看板，支持趋势对比、筛选和钻取。',
    screenshot: 'projects/analytics-dashboard.svg',
    href: 'https://github.com/your-username/analytics-dashboard',
  },
  {
    name: '开发者命令行工具',
    description:
      '用一条命令完成脚手架创建、依赖安装、测试和预览部署，减少重复操作。',
    screenshot: 'projects/devkit-cli.svg',
    href: 'https://github.com/your-username/devkit-cli',
  },
  {
    name: '团队任务看板',
    description:
      '按待处理、进行中和已完成组织任务，支持拖拽排序和多人协作。界面在窄屏下自动切换为单列。',
    screenshot: 'projects/team-board.svg',
    href: 'https://github.com/your-username/team-board',
  },
  {
    name: '移动端阅读应用',
    description:
      '为长文阅读设计的移动端界面，提供字号调节、夜间模式和离线缓存。',
    screenshot: 'projects/reading-app.svg',
    href: 'https://github.com/your-username/reading-app',
  },
]

export const siteContent = {
  name: '你的名字',
  role: '前端工程师',
  tagline: '用清晰的界面和可靠的代码，把想法变成产品。',
  navItems: [
    { label: '首页', href: '#hero' },
    { label: '项目', href: '#projects' },
    { label: '联系我', href: '#contact' },
  ],
  ctaLabel: '查看项目',
  ctaHref: '#projects',
  projects: {
    title: '项目',
    description: '一些近期完成的作品，覆盖数据可视化、开发者工具与移动端体验。',
    items: projects,
  },
  contact: {
    title: '联系我',
    description: '联系方式即将上线，敬请期待。',
  },
} as const
