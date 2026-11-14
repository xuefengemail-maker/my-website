import type { CalendarDay, CalendarResponse } from '../../lib/analyticsApi.ts'
import { formatMonthLabel, shiftMonth } from '../../lib/date.ts'
import { PanelError } from './PanelError.tsx'

type LearningCalendarProps = {
  month: string
  data: CalendarResponse | null
  loading: boolean
  error: string | null
  onMonthChange: (month: string) => void
  onRetry: () => void
}

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'] as const

function buildWeeks(days: readonly CalendarDay[]): (CalendarDay | null)[][] {
  const firstDay = days[0]
  const leadingEmptyCells =
    firstDay === undefined
      ? 0
      : (new Date(`${firstDay.date}T00:00:00`).getDay() + 6) % 7
  const cells: (CalendarDay | null)[] = [
    ...Array.from({ length: leadingEmptyCells }, () => null),
    ...days,
  ]

  while (cells.length % 7 !== 0) {
    cells.push(null)
  }

  const weeks: (CalendarDay | null)[][] = []
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7))
  }
  return weeks
}

function dayAriaLabel(day: CalendarDay): string {
  if (day.is_future) {
    return `${day.date}，未来日期`
  }
  const todayLabel = day.is_today ? '，今天' : ''
  return `${day.date}${todayLabel}，学习 ${day.minutes} 分钟，${day.sessions} 条记录，完成 ${day.completed_goals} 个目标`
}

function CalendarSkeleton() {
  return (
    <div aria-busy="true" aria-label="学习日历加载中">
      <div className="mt-5 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((weekday) => (
          <span
            key={weekday}
            className="py-2 text-center text-xs font-semibold text-[var(--dashboard-muted)]"
          >
            {weekday}
          </span>
        ))}
        {Array.from({ length: 35 }, (_, index) => (
          <span
            key={index}
            className="min-h-20 animate-pulse rounded-xl bg-[var(--dashboard-surface-soft)] motion-reduce:animate-none"
          />
        ))}
      </div>
    </div>
  )
}

export function LearningCalendar({
  month,
  data,
  loading,
  error,
  onMonthChange,
  onRetry,
}: LearningCalendarProps) {
  const weeks = data === null ? [] : buildWeeks(data.days)
  const hasData = data?.days.some(
    (day) => day.minutes > 0 || day.completed_goals > 0,
  ) ?? false

  return (
    <section
      id="calendar"
      aria-labelledby="calendar-title"
      className="rounded-3xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] p-5 shadow-[var(--dashboard-shadow)] sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-accent-strong)]">
            Calendar
          </p>
          <h2 id="calendar-title" className="mt-1 text-xl font-bold tracking-tight">
            学习日历
          </h2>
          <p className="mt-1 text-sm text-[var(--dashboard-muted)]">
            {formatMonthLabel(month)}
            {data !== null ? ` · 时区 ${data.timezone}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="上一个月"
            onClick={() => onMonthChange(shiftMonth(month, -1))}
            className="inline-flex size-11 items-center justify-center rounded-xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-soft)] text-lg font-semibold text-[var(--dashboard-text)] transition-colors hover:border-[var(--dashboard-border-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hero-focus-ring)] motion-reduce:transition-none"
          >
            <span aria-hidden="true">‹</span>
          </button>
          <button
            type="button"
            aria-label="下一个月"
            onClick={() => onMonthChange(shiftMonth(month, 1))}
            className="inline-flex size-11 items-center justify-center rounded-xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-soft)] text-lg font-semibold text-[var(--dashboard-text)] transition-colors hover:border-[var(--dashboard-border-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hero-focus-ring)] motion-reduce:transition-none"
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </div>

      {loading ? <CalendarSkeleton /> : null}

      {!loading && error !== null ? (
        <div className="mt-5">
          <PanelError message={error} onRetry={onRetry} />
        </div>
      ) : null}

      {!loading && error === null && data !== null ? (
        <>
          <table className="mt-5 w-full table-fixed border-separate border-spacing-1">
            <caption className="sr-only">{formatMonthLabel(month)}学习日历</caption>
            <thead>
              <tr>
                {WEEKDAYS.map((weekday) => (
                  <th
                    key={weekday}
                    scope="col"
                    className="py-2 text-center text-xs font-semibold text-[var(--dashboard-muted)]"
                  >
                    {weekday}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((week, weekIndex) => (
                <tr key={weekIndex}>
                  {week.map((day, dayIndex) => {
                    if (day === null) {
                      return (
                        <td
                          key={`empty-${weekIndex}-${dayIndex}`}
                          className="h-20 sm:h-24"
                        />
                      )
                    }

                    return (
                      <td
                        key={day.date}
                        aria-label={dayAriaLabel(day)}
                        aria-current={day.is_today ? 'date' : undefined}
                        className="h-20 align-top sm:h-24"
                      >
                        <div
                          className={
                            day.is_today
                              ? 'flex h-full flex-col gap-1 rounded-xl border-2 border-[var(--dashboard-accent)] bg-[var(--dashboard-accent-soft)] p-2'
                              : day.is_future
                                ? 'flex h-full flex-col gap-1 rounded-xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-soft)] p-2 opacity-60'
                                : 'flex h-full flex-col gap-1 rounded-xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-soft)] p-2'
                          }
                        >
                          <span className="flex items-center justify-between gap-1 text-xs font-semibold text-[var(--dashboard-text)]">
                            {Number(day.date.slice(-2))}
                            {day.is_today ? (
                              <span className="rounded-full bg-[var(--dashboard-accent)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--dashboard-accent-contrast)]">
                                今天
                              </span>
                            ) : null}
                          </span>
                          {day.is_future ? (
                            <span className="text-[10px] text-[var(--dashboard-muted)]">—</span>
                          ) : (
                            <>
                              <span className="text-[10px] leading-tight text-[var(--dashboard-muted)]">
                                {day.minutes} 分钟
                              </span>
                              {day.sessions > 0 ? (
                                <span className="text-[10px] leading-tight text-[var(--dashboard-muted)]">
                                  {day.sessions} 条记录
                                </span>
                              ) : null}
                              {day.completed_goals > 0 ? (
                                <span className="text-[10px] font-semibold leading-tight text-[var(--dashboard-success)]">
                                  完成 {day.completed_goals}
                                </span>
                              ) : null}
                            </>
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {!hasData ? (
            <p className="mt-4 rounded-xl border border-dashed border-[var(--dashboard-border-strong)] bg-[var(--dashboard-surface-soft)] px-3 py-3 text-center text-sm text-[var(--dashboard-muted)]">
              本月暂无学习记录，记录一次学习后会显示在这里。
            </p>
          ) : null}
        </>
      ) : null}
    </section>
  )
}
