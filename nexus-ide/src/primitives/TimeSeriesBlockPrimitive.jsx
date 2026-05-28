import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { EmptyState } from '../components/BlockStates'
import { useWorkspaceData } from '../context/useWorkspaceData'
import { getChartTheme } from '../styles/themeTokens'

const tabs = ['Trend', 'Decomposition', 'ACF/PACF', 'Forecast']
const movingAverageWindows = [3, 5, 7, 14, 30]
const seasonalPeriods = [4, 7, 12, 52]
const horizons = [5, 10, 20, 30]

function mean(values) {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0
}

function stdDev(values) {
  if (values.length < 2) return 0
  const avg = mean(values)
  return Math.sqrt(
    values.reduce((sum, value) => sum + (value - avg) ** 2, 0) /
      (values.length - 1),
  )
}

function movingAverage(values, windowSize, centered = false) {
  return values.map((_, index) => {
    const start = centered
      ? Math.max(0, index - Math.floor(windowSize / 2))
      : Math.max(0, index - windowSize + 1)
    const end = centered
      ? Math.min(values.length, index + Math.ceil(windowSize / 2))
      : index + 1
    return mean(values.slice(start, end))
  })
}

function linearTrend(values) {
  const n = values.length
  const xMean = (n - 1) / 2
  const yMean = mean(values)
  const numerator = values.reduce(
    (sum, value, index) => sum + (index - xMean) * (value - yMean),
    0,
  )
  const denominator = values.reduce(
    (sum, _, index) => sum + (index - xMean) ** 2,
    0,
  )
  const slope = denominator ? numerator / denominator : 0
  const intercept = yMean - slope * xMean
  return {
    direction: slope > 0.000001 ? '↑' : slope < -0.000001 ? '↓' : '→',
    slope,
    values: values.map((_, index) => intercept + slope * index),
  }
}

function autocorrelation(values, lag) {
  const avg = mean(values)
  const denominator = values.reduce((sum, value) => sum + (value - avg) ** 2, 0)
  if (!denominator) return 0
  let numerator = 0
  for (let index = lag; index < values.length; index += 1) {
    numerator += (values[index] - avg) * (values[index - lag] - avg)
  }
  return numerator / denominator
}

function pacf(values, lag) {
  if (lag === 1) return autocorrelation(values, 1)
  const acfs = Array.from({ length: lag + 1 }, (_, index) =>
    autocorrelation(values, index),
  )
  const matrix = Array.from({ length: lag }, (_, row) =>
    Array.from({ length: lag }, (_, column) => acfs[Math.abs(row - column)]),
  )
  const rhs = acfs.slice(1, lag + 1)
  try {
    return solveLinearSystem(matrix, rhs).at(-1) ?? 0
  } catch {
    return 0
  }
}

function solveLinearSystem(matrix, rhs) {
  const n = matrix.length
  const augmented = matrix.map((row, index) => [...row, rhs[index]])
  for (let pivot = 0; pivot < n; pivot += 1) {
    let pivotRow = pivot
    for (let row = pivot + 1; row < n; row += 1) {
      if (Math.abs(augmented[row][pivot]) > Math.abs(augmented[pivotRow][pivot])) {
        pivotRow = row
      }
    }
    if (Math.abs(augmented[pivotRow][pivot]) < 1e-10) throw new Error('singular')
    ;[augmented[pivot], augmented[pivotRow]] = [augmented[pivotRow], augmented[pivot]]
    const divisor = augmented[pivot][pivot]
    augmented[pivot] = augmented[pivot].map((value) => value / divisor)
    for (let row = 0; row < n; row += 1) {
      if (row === pivot) continue
      const factor = augmented[row][pivot]
      augmented[row] = augmented[row].map(
        (value, column) => value - factor * augmented[pivot][column],
      )
    }
  }
  return augmented.map((row) => row[n])
}

function exponentialSmoothing(values, alpha, horizon) {
  const fitted = []
  let level = values[0] ?? 0
  values.forEach((value) => {
    fitted.push(level)
    level = alpha * value + (1 - alpha) * level
  })
  const errors = values.map((value, index) => value - fitted[index])
  const rmse = Math.sqrt(mean(errors.map((error) => error ** 2)))
  const mae = mean(errors.map((error) => Math.abs(error)))
  const band = 1.96 * stdDev(errors)
  const forecast = Array.from({ length: horizon }, (_, index) => ({
    forecast: level,
    lower: level - band,
    time: values.length + index,
    upper: level + band,
  }))
  return { fitted, forecast, mae, rmse }
}

function format(value) {
  return Number.isFinite(Number(value)) ? Number(value).toFixed(3) : 'n/a'
}

function TimeSeriesBlockPrimitive({
  analysisTab,
  blockId,
  dateColumn,
  updateBlockData,
  valueColumn,
}) {
  const chartTheme = getChartTheme()
  const { activeDataset, datasets, setActiveDataset } = useWorkspaceData()
  const [datasetId, setDatasetId] = useState('')
  const selectedDataset =
    datasets.find((dataset) => dataset.id === datasetId) ?? activeDataset
  const columns = selectedDataset?.columns ?? []
  const rows = selectedDataset?.rows || []
  const numericColumns = columns.filter((column) =>
    rows.some((row) => Number.isFinite(Number(row?.[column]))),
  )
  const dateColumns = columns.filter((column) =>
    rows.some((row) => !Number.isNaN(Date.parse(row?.[column]))),
  )
  const [selectedDateColumn, setSelectedDateColumn] = useState(dateColumn ?? '')
  const [selectedValueColumn, setSelectedValueColumn] = useState(valueColumn ?? '')
  const [activeTab, setActiveTab] = useState(analysisTab ?? 'Trend')
  const [maWindow, setMaWindow] = useState(7)
  const [period, setPeriod] = useState(12)
  const [alpha, setAlpha] = useState(0.3)
  const [horizon, setHorizon] = useState(10)
  const activeValueColumn = numericColumns.includes(selectedValueColumn)
    ? selectedValueColumn
    : numericColumns[0] ?? ''
  const activeDateColumn = dateColumns.includes(selectedDateColumn)
    ? selectedDateColumn
    : ''

  const series = rows
    .map((row, index) => ({
      index,
      label: activeDateColumn ? String(row?.[activeDateColumn]) : String(index + 1),
      time: activeDateColumn
        ? new Date(row?.[activeDateColumn]).getTime()
        : index,
      value: Number(row?.[activeValueColumn]),
    }))
    .filter((point) => Number.isFinite(point.value))
    .sort((first, second) => first.time - second.time)
  const values = series.map((point) => point.value)
  const trend = linearTrend(values)
  const ma = movingAverage(values, maWindow)
  const trendRows = series.map((point, index) => ({
    ...point,
    movingAverage: ma[index],
    trend: trend.values[index],
  }))
  const stats = {
    max: Math.max(...values),
    mean: mean(values),
    min: Math.min(...values),
    stdDev: stdDev(values),
  }
  const trendComponent = movingAverage(values, period, true)
  const deviations = values.map((value, index) => value - trendComponent[index])
  const seasonalMeans = Array.from({ length: period }, (_, seasonalIndex) =>
    mean(deviations.filter((_, index) => index % period === seasonalIndex)),
  )
  const decomposition = series.map((point, index) => {
    const seasonal = seasonalMeans[index % period] ?? 0
    return {
      ...point,
      residual: point.value - trendComponent[index] - seasonal,
      seasonal,
      trend: trendComponent[index],
    }
  })
  const confidence = values.length ? 1.96 / Math.sqrt(values.length) : 0
  const correlationRows = Array.from({ length: Math.max(0, Math.min(20, values.length - 1)) }, (_, index) => {
    const lag = index + 1
    return {
      acf: autocorrelation(values, lag),
      lag,
      pacf: pacf(values, lag),
    }
  })
  const significantLags = correlationRows
    .filter((row) => Math.abs(row.acf) > confidence)
    .map((row) => row.lag)
  const forecast = exponentialSmoothing(values, alpha, horizon)
  const forecastRows = [
    ...series.map((point) => ({ ...point, historical: point.value })),
    ...forecast.forecast,
  ]

  useEffect(() => {
    if (!rows.length || !numericColumns.length || !activeValueColumn) {
      return
    }

    updateBlockData?.(blockId, {
      analysisTab: activeTab,
      correlationData: correlationRows,
      datasetName: selectedDataset?.name ?? '',
      dateColumn: activeDateColumn,
      decompositionData: decomposition,
      forecastData: forecastRows,
      stats: {
        max: stats.max,
        mean: stats.mean,
        min: stats.min,
        stdDev: stats.stdDev,
        trendDirection: trend.direction,
      },
      trendData: trendRows,
      valueColumn: activeValueColumn,
    })
  })

  if (!rows.length || !numericColumns.length) {
    return (
      <EmptyState message="Load a dataset with at least one numeric column to analyze a time series" />
    )
  }

  return (
    <div className="time-series-primitive">
      <aside className="analytics-config-panel">
        <label>
          <span>Dataset</span>
          <select
            value={selectedDataset?.id ?? ''}
            onChange={(event) => {
              setDatasetId(event.target.value)
              setActiveDataset(event.target.value)
              setSelectedDateColumn('')
              setSelectedValueColumn('')
            }}
          >
            {datasets.map((dataset) => (
              <option key={dataset.id} value={dataset.id}>
                {dataset.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Date / Time</span>
          <select
            value={activeDateColumn}
            onChange={(event) => setSelectedDateColumn(event.target.value)}
          >
            <option value="">Row index</option>
            {dateColumns.map((column) => (
              <option key={column} value={column}>{column}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Value</span>
          <select
            value={activeValueColumn}
            onChange={(event) => setSelectedValueColumn(event.target.value)}
          >
            {numericColumns.map((column) => (
              <option key={column} value={column}>{column}</option>
            ))}
          </select>
        </label>
        {!activeDateColumn && (
          <p>No date column detected — using row index as time axis</p>
        )}
        <div className="analytics-tab-list">
          {tabs.map((tab) => (
            <button
              className={activeTab === tab ? 'is-active' : undefined}
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </aside>
      <section className="analytics-results-panel">
        {activeTab === 'Trend' && (
          <>
            <div className="analytics-inline-control">
              <label>
                Moving average
                <select value={maWindow} onChange={(event) => setMaWindow(Number(event.target.value))}>
                  {movingAverageWindows.map((windowSize) => (
                    <option key={windowSize} value={windowSize}>{windowSize}</option>
                  ))}
                </select>
              </label>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={trendRows}>
                <CartesianGrid stroke="var(--color-chart-grid)" strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <Tooltip />
                <Line dataKey="value" stroke={chartTheme.blue} dot={false} />
                <Line dataKey="trend" stroke={chartTheme.orange} dot={false} />
                <Line dataKey="movingAverage" stroke={chartTheme.green} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="analytics-stat-grid">
              <span>Mean <strong>{format(stats.mean)}</strong></span>
              <span>Std Dev <strong>{format(stats.stdDev)}</strong></span>
              <span>Min <strong>{format(stats.min)}</strong></span>
              <span>Max <strong>{format(stats.max)}</strong></span>
              <span>Trend <strong>{trend.direction}</strong></span>
            </div>
          </>
        )}
        {activeTab === 'Decomposition' && (
          <>
            <div className="analytics-inline-control">
              <label>
                Period
                <select value={period} onChange={(event) => setPeriod(Number(event.target.value))}>
                  {seasonalPeriods.map((periodOption) => (
                    <option key={periodOption} value={periodOption}>{periodOption}</option>
                  ))}
                </select>
              </label>
            </div>
            {['trend', 'seasonal', 'residual'].map((key) => (
              <div className="mini-chart" key={key}>
                <strong>{key}</strong>
                <ResponsiveContainer width="100%" height={90}>
                  <LineChart data={decomposition}>
                    <XAxis dataKey="label" hide />
                    <YAxis hide />
                    <Tooltip />
                    <Line dataKey={key} stroke={chartTheme.blue} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ))}
          </>
        )}
        {activeTab === 'ACF/PACF' && (
          <>
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={correlationRows}>
                <XAxis dataKey="lag" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <YAxis domain={[-1, 1]} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <Tooltip />
                <ReferenceLine y={confidence} stroke={chartTheme.red} strokeDasharray="3 3" />
                <ReferenceLine y={-confidence} stroke={chartTheme.red} strokeDasharray="3 3" />
                <Bar dataKey="acf" fill={chartTheme.blue} />
              </BarChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={correlationRows}>
                <XAxis dataKey="lag" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <YAxis domain={[-1, 1]} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <Tooltip />
                <ReferenceLine y={confidence} stroke={chartTheme.red} strokeDasharray="3 3" />
                <ReferenceLine y={-confidence} stroke={chartTheme.red} strokeDasharray="3 3" />
                <Bar dataKey="pacf" fill={chartTheme.purple} />
              </BarChart>
            </ResponsiveContainer>
            <p>Significant autocorrelation at lags: {significantLags.join(', ') || 'none'}</p>
          </>
        )}
        {activeTab === 'Forecast' && (
          <>
            <div className="analytics-inline-control">
              <label>Alpha <input type="range" min="0.1" max="0.9" step="0.1" value={alpha} onChange={(event) => setAlpha(Number(event.target.value))} /> {alpha}</label>
              <label>Horizon <select value={horizon} onChange={(event) => setHorizon(Number(event.target.value))}>{horizons.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={forecastRows}>
                <CartesianGrid stroke="var(--color-chart-grid)" strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <Tooltip />
                <Line dataKey="historical" stroke={chartTheme.blue} dot={false} />
                <Line dataKey="forecast" stroke={chartTheme.orange} strokeDasharray="5 5" dot={false} />
                <Line dataKey="upper" stroke={chartTheme.orange} dot={false} />
                <Line dataKey="lower" stroke={chartTheme.orange} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="analytics-stat-grid">
              <span>RMSE <strong>{format(forecast.rmse)}</strong></span>
              <span>MAE <strong>{format(forecast.mae)}</strong></span>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

export default TimeSeriesBlockPrimitive
