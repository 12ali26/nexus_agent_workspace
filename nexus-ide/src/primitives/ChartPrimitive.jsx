import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useEffect, useMemo, useState } from 'react'
import { EmptyState } from '../components/BlockStates'
import { useWorkspaceData } from '../context/useWorkspaceData'

function ChartPrimitive({
  blockId,
  chartData: persistedChartData,
  data,
  lineKey,
  title,
  updateBlockData,
  xKey,
  yKey,
  yLabel,
}) {
  const { activeDataset, datasets, setActiveDataset } = useWorkspaceData()
  const [selectedDatasetId, setSelectedDatasetId] = useState('')
  const [selectedXKey, setSelectedXKey] = useState('')
  const [selectedYKey, setSelectedYKey] = useState('')
  const selectedDataset =
    datasets.find((dataset) => dataset.id === selectedDatasetId) ??
    activeDataset
  const fallbackColumns = useMemo(
    () => Object.keys((persistedChartData ?? data ?? [])[0] ?? {}),
    [data, persistedChartData],
  )
  const columns = selectedDataset?.columns ?? fallbackColumns
  const chartData = useMemo(
    () => selectedDataset?.rows ?? persistedChartData ?? data ?? [],
    [data, persistedChartData, selectedDataset],
  )
  const numericColumns = columns.filter((column) =>
    chartData.some((row) => Number.isFinite(Number(row?.[column]))),
  )
  const activeXKey =
    columns.includes(selectedXKey) ? selectedXKey : xKey ?? columns[0] ?? ''
  const activeYKey = numericColumns.includes(selectedYKey)
    ? selectedYKey
    : numericColumns.includes(lineKey)
      ? lineKey
      : numericColumns.includes(yKey)
        ? yKey
      : numericColumns[0] ?? ''
  const chartRows = chartData.map((row) => ({
    ...row,
    [activeYKey]: Number(row?.[activeYKey]),
  }))
  const activeTitle = title ?? `${activeYKey} by ${activeXKey}`

  useEffect(() => {
    const exportRows = chartData.map((row) => ({
      ...row,
      [activeYKey]: Number(row?.[activeYKey]),
    }))

    updateBlockData?.(blockId, {
      chartData: exportRows,
      title: activeTitle,
      xKey: activeXKey,
      yKey: activeYKey,
    })
  })

  if (!chartData.length || !columns.length) {
    return (
      <EmptyState message="Load a data file first to render a chart" />
    )
  }

  if (!activeXKey || !activeYKey) {
    return (
      <EmptyState message="Select a dataset with at least one numeric column" />
    )
  }

  return (
    <div className="chart-primitive">
      <div className="chart-controls">
        {datasets.length > 0 && (
          <label>
            <span>Dataset</span>
            <select
              value={selectedDataset?.id ?? ''}
              onChange={(event) => {
                setSelectedDatasetId(event.target.value)
                setActiveDataset(event.target.value)
                setSelectedXKey('')
                setSelectedYKey('')
              }}
            >
              {datasets.map((dataset) => (
                <option key={dataset.id} value={dataset.id}>
                  {dataset.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          <span>X Axis</span>
          <select
            value={activeXKey}
            onChange={(event) => setSelectedXKey(event.target.value)}
          >
            {columns.map((column) => (
              <option key={column} value={column}>
                {column}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Y Axis</span>
          <select
            value={activeYKey}
            onChange={(event) => setSelectedYKey(event.target.value)}
          >
            {numericColumns.map((column) => (
              <option key={column} value={column}>
                {column}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="primitive-chart-title">
        {activeTitle}
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartRows} margin={{ top: 10, right: 18, bottom: 8, left: 8 }}>
          <CartesianGrid stroke="var(--color-chart-grid)" strokeDasharray="3 3" />
          <XAxis
            dataKey={activeXKey}
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
              value: yLabel ?? activeYKey,
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
            dataKey={activeYKey}
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
