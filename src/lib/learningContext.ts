import { studyPalContent } from '../content/studypal.ts'
import type { TrendView } from '../content/studypal.ts'

export function buildLearningContext(view: TrendView = 'week'): Record<string, unknown> {
  return {
    stats: studyPalContent.stats.map((stat) => ({
      label: stat.label,
      value: stat.value,
      unit: stat.unit,
    })),
    daily_goals: studyPalContent.dailyGoals.map((goal) => ({
      title: goal.title,
      category: goal.category,
      completed: goal.completed,
    })),
    trend_view: view,
    trend_points: studyPalContent.trends[view].map((point) => ({
      label: point.label,
      value: point.value,
    })),
    source_note: 'Dashboard values are illustrative mock data.',
  }
}
