import { isLocalDateIso } from './date.ts'

export type GoalFieldErrors = {
  title?: string
  category?: string
  targetDate?: string
}

type GoalDraft = {
  title: string
  category: string
  targetDate: string
}

export function validateGoalDraft({
  title,
  category,
  targetDate,
}: GoalDraft): GoalFieldErrors {
  const normalizedTitle = title.trim()
  const normalizedCategory = category.trim()
  const errors: GoalFieldErrors = {}

  if (normalizedTitle.length === 0) {
    errors.title = '请输入目标标题'
  } else if (normalizedTitle.length > 120) {
    errors.title = '目标标题不能超过 120 个字符'
  }

  if (normalizedCategory.length === 0) {
    errors.category = '请输入目标分类'
  } else if (normalizedCategory.length > 60) {
    errors.category = '目标分类不能超过 60 个字符'
  }

  if (!isLocalDateIso(targetDate)) {
    errors.targetDate = '请选择有效的目标日期'
  }

  return errors
}
