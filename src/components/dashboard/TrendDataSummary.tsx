import type { TrendPoint, TrendView } from '../../lib/analyticsApi.ts'
import { formatHours } from './trendUtils.ts'

type TrendDataSummaryProps = {
  points: readonly TrendPoint[]
  view: TrendView
}

export function TrendDataSummary({ points, view }: TrendDataSummaryProps) {
  const viewLabel = view === 'week' ? '本周' : '本月'

  return (
    <table className="sr-only">
      <caption>{viewLabel}学习趋势数据</caption>
      <thead>
        <tr>
          <th scope="col">周期</th>
          <th scope="col">学习时长（小时）</th>
        </tr>
      </thead>
      <tbody>
        {points.map((point) => (
          <tr key={point.label}>
            <th scope="row">{point.label}</th>
            <td>{formatHours(point.value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
