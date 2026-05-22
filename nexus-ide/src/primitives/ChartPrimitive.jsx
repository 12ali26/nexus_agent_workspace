import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function ChartPrimitive({ data, lineKey, title, xKey, yLabel }) {
  return (
    <div className="chart-primitive">
      <div className="primitive-chart-title">{title}</div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 10, right: 18, bottom: 8, left: 8 }}>
          <CartesianGrid stroke="var(--color-chart-grid)" strokeDasharray="3 3" />
          <XAxis
            dataKey={xKey}
            stroke="var(--color-text-muted)"
            tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
            tickLine={{ stroke: 'var(--color-chart-grid)' }}
          />
          <YAxis
            stroke="var(--color-text-muted)"
            tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
            tickLine={{ stroke: 'var(--color-chart-grid)' }}
            width={58}
            label={{
              value: yLabel,
              angle: -90,
              position: 'insideLeft',
              fill: 'var(--color-text-muted)',
              fontSize: 12,
            }}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--color-panel-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 6,
              color: 'var(--color-text)',
            }}
            labelStyle={{ color: 'var(--color-text-strong)' }}
          />
          <Line
            type="monotone"
            dataKey={lineKey}
            stroke="var(--color-accent-strong)"
            strokeWidth={2}
            dot={{ fill: 'var(--color-accent-strong)', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default ChartPrimitive
