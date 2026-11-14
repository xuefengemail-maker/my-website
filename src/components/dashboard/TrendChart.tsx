import type { TrendPoint, TrendView } from '../../lib/analyticsApi.ts'
import { TrendDataSummary } from './TrendDataSummary.tsx'
import { formatHours } from './trendUtils.ts'

type TrendChartProps = {
  points: readonly TrendPoint[]
  view: TrendView
}

const CHART_WIDTH = 640
const CHART_HEIGHT = 260
const PADDING = {
  top: 24,
  right: 20,
  bottom: 38,
  left: 42,
}
const INNER_WIDTH = CHART_WIDTH - PADDING.left - PADDING.right
const INNER_HEIGHT = CHART_HEIGHT - PADDING.top - PADDING.bottom
const AREA_BOTTOM = PADDING.top + INNER_HEIGHT

type ChartPoint = TrendPoint & {
  x: number
  y: number
}

function buildChartPoints(points: readonly TrendPoint[]): ChartPoint[] {
  const maxValue = Math.max(
    1,
    ...points.map((point) => Math.max(0, point.value)),
  )
  const stepX = INNER_WIDTH / (points.length - 1)

  return points.map((point, index) => {
    const safeValue = Math.max(0, point.value)

    return {
      ...point,
      x: PADDING.left + index * stepX,
      y: PADDING.top + INNER_HEIGHT - (safeValue / maxValue) * INNER_HEIGHT,
    }
  })
}

export function TrendChart({ points, view }: TrendChartProps) {
  if (points.length < 2) {
    return null
  }

  const chartPoints = buildChartPoints(points)
  const maxValue = Math.max(
    1,
    ...points.map((point) => Math.max(0, point.value)),
  )
  const firstPoint = chartPoints[0]
  const lastPoint = chartPoints[chartPoints.length - 1]
  const linePath = chartPoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')
  const areaPath = `${linePath} L ${lastPoint.x} ${AREA_BOTTOM} L ${firstPoint.x} ${AREA_BOTTOM} Z`
  const viewLabel = view === 'week' ? '本周' : '本月'
  const titleId = `trend-chart-title-${view}`
  const gridLines = Array.from({ length: 4 }, (_, index) => {
    const ratio = index / 3

    return {
      y: PADDING.top + INNER_HEIGHT * ratio,
      value: maxValue * (1 - ratio),
    }
  })

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between gap-3 text-xs text-[var(--dashboard-muted)]">
        <span>学习时长趋势</span>
        <span>单位：小时</span>
      </div>
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        role="img"
        aria-labelledby={titleId}
        className="mt-2 h-auto w-full"
      >
        <title id={titleId}>{`${viewLabel}学习趋势图`}</title>
        {gridLines.map((line) => (
          <g key={line.y}>
            <line
              x1={PADDING.left}
              y1={line.y}
              x2={CHART_WIDTH - PADDING.right}
              y2={line.y}
              strokeDasharray="4 6"
              className="stroke-[var(--dashboard-chart-grid)]"
            />
            <text
              x={PADDING.left - 10}
              y={line.y + 4}
              textAnchor="end"
              className="fill-[var(--dashboard-muted)] text-[11px]"
            >
              {formatHours(line.value)}
            </text>
          </g>
        ))}

        <path d={areaPath} className="fill-[var(--dashboard-chart-fill)]" />
        <path
          d={linePath}
          fill="none"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-[var(--dashboard-chart-line)]"
        />

        {chartPoints.map((point) => (
          <g key={point.label}>
            <circle
              cx={point.x}
              cy={point.y}
              r={4}
              strokeWidth={3}
              className="fill-[var(--dashboard-chart-point)] stroke-[var(--dashboard-surface)]"
            >
              <title>{`${point.label}：${formatHours(point.value)} 小时`}</title>
            </circle>
            <text
              x={point.x}
              y={CHART_HEIGHT - 12}
              textAnchor="middle"
              className="fill-[var(--dashboard-muted)] text-[11px]"
            >
              {point.label}
            </text>
          </g>
        ))}
      </svg>

      <TrendDataSummary points={points} view={view} />
    </div>
  )
}
