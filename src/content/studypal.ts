export type NavIcon = 'analytics' | 'chat' | 'goals'

export type StatIcon = 'clock' | 'check' | 'flame' | 'target'

export type IconName = NavIcon | StatIcon

export type NavItem = {
  readonly label: string
  readonly to: string
  readonly icon: NavIcon
}

export type Stat = {
  readonly id: string
  readonly label: string
  readonly value: number
  readonly unit: string
  readonly description: string
  readonly icon: StatIcon
}

export type DailyGoal = {
  readonly id: string
  readonly title: string
  readonly category: string
  readonly completed: boolean
}

export type TrendView = 'week' | 'month'

export type TrendPoint = {
  readonly label: string
  readonly value: number
}

export type TrendSeries = Readonly<Record<TrendView, readonly TrendPoint[]>>

export type StudyPalContent = {
  readonly productName: string
  readonly tagline: string
  readonly user: {
    readonly greeting: string
    readonly name: string
    readonly summary: string
  }
  readonly navItems: readonly NavItem[]
  readonly stats: readonly Stat[]
  readonly dailyGoals: readonly DailyGoal[]
  readonly trends: TrendSeries
}

export const studyPalContent = {
  productName: 'StudyPal',
  tagline: '个人学习助手',
  user: {
    greeting: '早上好',
    name: '学习者',
    summary: '今天从一个小目标开始，保持稳定的学习节奏。',
  },
  navItems: [
    { label: '学习数据', to: '/', icon: 'analytics' },
    { label: 'AI 对话建议', to: '/chat', icon: 'chat' },
    { label: '学习目标', to: '/goals', icon: 'goals' },
  ],
  stats: [
    {
      id: 'weekly-hours',
      label: '学习时长',
      value: 12.5,
      unit: '小时',
      description: '比上周多 2.5 小时',
      icon: 'clock',
    },
    {
      id: 'completed-goals',
      label: '完成任务数',
      value: 18,
      unit: '个',
      description: '本周累计完成',
      icon: 'check',
    },
    {
      id: 'learning-streak',
      label: '连续学习天数',
      value: 7,
      unit: '天',
      description: '保持当前节奏',
      icon: 'flame',
    },
    {
      id: 'weekly-progress',
      label: '本周目标进度',
      value: 68,
      unit: '%',
      description: '距离周末还有 3 天',
      icon: 'target',
    },
  ],
  dailyGoals: [
    {
      id: 'goal-typescript',
      title: '复习 TypeScript 泛型',
      category: '前端基础',
      completed: true,
    },
    {
      id: 'goal-algorithm',
      title: '完成 30 分钟算法练习',
      category: '算法',
      completed: false,
    },
    {
      id: 'goal-notes',
      title: '整理 React 性能笔记',
      category: '笔记',
      completed: false,
    },
    {
      id: 'goal-reading',
      title: '阅读 20 页技术书籍',
      category: '阅读',
      completed: false,
    },
  ],
  trends: {
    week: [
      { label: '周一', value: 1.5 },
      { label: '周二', value: 2.2 },
      { label: '周三', value: 1.8 },
      { label: '周四', value: 2.6 },
      { label: '周五', value: 1.9 },
      { label: '周六', value: 3.1 },
      { label: '周日', value: 2.4 },
    ],
    month: [
      { label: '第 1 周', value: 6.5 },
      { label: '第 2 周', value: 8.2 },
      { label: '第 3 周', value: 7.4 },
      { label: '第 4 周', value: 9.1 },
    ],
  },
} as const satisfies StudyPalContent
