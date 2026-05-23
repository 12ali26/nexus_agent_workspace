import { useMemo, useState } from 'react'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from 'recharts'

function getNumericColumns(data) {
  if (!Array.isArray(data) || !data.length) {
    return []
  }

  const columnKeys = Array.from(
    new Set(data.flatMap((row) => Object.keys(row ?? {}))),
  )

  return columnKeys.filter((columnKey) =>
    data.some((row) => Number.isFinite(Number(row?.[columnKey]))),
  )
}

function getNumericValues(data, columnKey) {
  return data
    .map((row) => Number(row?.[columnKey]))
    .filter((value) => Number.isFinite(value))
}

function getPercentile(sortedValues, percentile) {
  if (!sortedValues.length) {
    return 0
  }

  const index = (sortedValues.length - 1) * percentile
  const lowerIndex = Math.floor(index)
  const upperIndex = Math.ceil(index)

  if (lowerIndex === upperIndex) {
    return sortedValues[lowerIndex]
  }

  const weight = index - lowerIndex

  return (
    sortedValues[lowerIndex] * (1 - weight) + sortedValues[upperIndex] * weight
  )
}

function formatStat(value) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(2)
}

function getStats(values) {
  const sortedValues = [...values].sort((first, second) => first - second)
  const count = values.length
  const mean = values.reduce((sum, value) => sum + value, 0) / count
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / count

  return [
    { icon: 'n', name: 'Count', value: count },
    { icon: 'avg', name: 'Mean', value: mean },
    { icon: 'med', name: 'Median', value: getPercentile(sortedValues, 0.5) },
    { icon: 'sd', name: 'Std Dev', value: Math.sqrt(variance) },
    { icon: 'min', name: 'Min', value: sortedValues[0] },
    { icon: 'max', name: 'Max', value: sortedValues[sortedValues.length - 1] },
    { icon: 'Q1', name: '25th Percentile', value: getPercentile(sortedValues, 0.25) },
    { icon: 'Q3', name: '75th Percentile', value: getPercentile(sortedValues, 0.75) },
  ]
}

function StatsBlockPrimitive({ data = [] }) {
  const numericColumns = useMemo(() => getNumericColumns(data), [data])
  const [selectedColumn, setSelectedColumn] = useState('')
  const activeColumn = numericColumns.includes(selectedColumn)
    ? selectedColumn
    : numericColumns[0] || ''
  const values = useMemo(
    () => getNumericValues(data, activeColumn),
    [activeColumn, data],
  )
  const stats = useMemo(() => (values.length ? getStats(values) : []), [values])
  const sparklineData = values.map((value, index) => ({
    index,
    value,
  }))

  if (!Array.isArray(data) || !data.length) {
    return (
      <div className="stats-empty-state">
        Load a data file first to run statistics
      </div>
    )
  }

  if (!numericColumns.length) {
    return (
      <div className="stats-empty-state">
        No numeric columns available for statistics
      </div>
    )
  }

  return (
    <div className="stats-primitive">
      <label className="stats-column-control">
        <span>Column</span>
        <select
          value={activeColumn}
          onChange={(event) => setSelectedColumn(event.target.value)}
        >
          {numericColumns.map((column) => (
            <option key={column} value={column}>
              {column}
            </option>
          ))}
        </select>
      </label>

      <div className="stats-card-grid">
        {stats.map((stat) => (
          <article className="stats-card" key={stat.name}>
            <span aria-hidden="true">{stat.icon}</span>
            <div>
              <strong>{formatStat(stat.value)}</strong>
              <p>{stat.name}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="stats-sparkline">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparklineData} margin={{ top: 6, right: 8, bottom: 6, left: 8 }}>
            <YAxis hide domain={['dataMin', 'dataMax']} />
            <Tooltip
              contentStyle={{
                background: 'var(--color-panel-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 6,
                color: 'var(--color-text)',
              }}
              formatter={(value) => [formatStat(value), activeColumn]}
              labelFormatter={(label) => `Point ${Number(label) + 1}`}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--color-accent-strong)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default StatsBlockPrimitive
