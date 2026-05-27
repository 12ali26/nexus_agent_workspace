import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useWorkspaceData } from '../context/useWorkspaceData'
import { useExportSnapshots } from '../export/useExportSnapshots'

const tabs = ['Descriptive', 'Distribution', 'Hypothesis Test', 'Correlation']

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
  if (!Number.isFinite(Number(value))) {
    return 'n/a'
  }

  const numberValue = Number(value)
  return Number.isInteger(numberValue) ? numberValue.toString() : numberValue.toFixed(3)
}

function formatShapeStat(value) {
  return Number.isFinite(Number(value)) ? Number(value).toFixed(4) : '0.0000'
}

function getMean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function getPopulationStandardDeviation(values, mean = getMean(values)) {
  if (!values.length) {
    return 0
  }

  return Math.sqrt(
    values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) /
      values.length,
  )
}

function getSampleStandardDeviation(values, mean = getMean(values)) {
  if (values.length < 2) {
    return 0
  }

  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    (values.length - 1)

  return Math.sqrt(variance)
}

function getStats(values) {
  const sortedValues = [...values].sort((first, second) => first - second)
  const count = values.length
  const mean = getMean(values)
  const standardDeviation = getSampleStandardDeviation(values, mean)

  return [
    { icon: 'n', name: 'Count', value: count },
    { icon: 'avg', name: 'Mean', value: mean },
    { icon: 'med', name: 'Median', value: getPercentile(sortedValues, 0.5) },
    { icon: 'sd', name: 'Std Dev', value: standardDeviation },
    { icon: 'min', name: 'Min', value: sortedValues[0] },
    { icon: 'max', name: 'Max', value: sortedValues[sortedValues.length - 1] },
    { icon: 'Q1', name: '25th Percentile', value: getPercentile(sortedValues, 0.25) },
    { icon: 'Q3', name: '75th Percentile', value: getPercentile(sortedValues, 0.75) },
  ]
}

function logGamma(value) {
  const coefficients = [
    676.5203681218851,
    -1259.1392167224028,
    771.3234287776531,
    -176.6150291621406,
    12.507343278686905,
    -0.13857109526572012,
    9.984369578019572e-6,
    1.5056327351493116e-7,
  ]

  if (value < 0.5) {
    return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * value)) - logGamma(1 - value)
  }

  let adjustedValue = value - 1
  let accumulator = 0.9999999999998099

  coefficients.forEach((coefficient, index) => {
    accumulator += coefficient / (adjustedValue + index + 1)
  })

  const t = adjustedValue + coefficients.length - 0.5
  return (
    0.5 * Math.log(2 * Math.PI) +
    (adjustedValue + 0.5) * Math.log(t) -
    t +
    Math.log(accumulator)
  )
}

function betaContinuedFraction(a, b, x) {
  const maxIterations = 100
  const epsilon = 1e-10
  const fpMin = 1e-30
  let c = 1
  let d = 1 - ((a + b) * x) / (a + 1)

  if (Math.abs(d) < fpMin) {
    d = fpMin
  }

  d = 1 / d
  let h = d

  for (let m = 1; m <= maxIterations; m += 1) {
    const m2 = 2 * m
    let numerator = (m * (b - m) * x) / ((a + m2 - 1) * (a + m2))
    d = 1 + numerator * d
    c = 1 + numerator / c

    if (Math.abs(d) < fpMin) d = fpMin
    if (Math.abs(c) < fpMin) c = fpMin

    d = 1 / d
    h *= d * c
    numerator = (-(a + m) * (a + b + m) * x) / ((a + m2) * (a + m2 + 1))
    d = 1 + numerator * d
    c = 1 + numerator / c

    if (Math.abs(d) < fpMin) d = fpMin
    if (Math.abs(c) < fpMin) c = fpMin

    d = 1 / d
    const delta = d * c
    h *= delta

    if (Math.abs(delta - 1) < epsilon) {
      break
    }
  }

  return h
}

function regularizedBeta(x, a, b) {
  if (x <= 0) return 0
  if (x >= 1) return 1

  const betaTerm = Math.exp(
    logGamma(a + b) -
      logGamma(a) -
      logGamma(b) +
      a * Math.log(x) +
      b * Math.log(1 - x),
  )

  if (x < (a + 1) / (a + b + 2)) {
    return (betaTerm * betaContinuedFraction(a, b, x)) / a
  }

  return 1 - (betaTerm * betaContinuedFraction(b, a, 1 - x)) / b
}

function studentTCdf(tStatistic, degreesOfFreedom) {
  const x = degreesOfFreedom / (degreesOfFreedom + tStatistic ** 2)
  const betaValue = regularizedBeta(x, degreesOfFreedom / 2, 0.5)

  return tStatistic >= 0 ? 1 - betaValue / 2 : betaValue / 2
}

function getTTest(values, hypothesizedMean, alpha) {
  if (values.length < 2) {
    return null
  }

  const mean = getMean(values)
  const standardDeviation = getSampleStandardDeviation(values, mean)

  if (standardDeviation === 0) {
    return null
  }

  const tStatistic =
    (mean - hypothesizedMean) / (standardDeviation / Math.sqrt(values.length))
  const degreesOfFreedom = values.length - 1
  const pValue = 2 * (1 - studentTCdf(Math.abs(tStatistic), degreesOfFreedom))

  return {
    conclusion:
      pValue < alpha
        ? 'Reject H0: sample mean differs from the hypothesized mean.'
        : 'Fail to reject H0: difference is not statistically significant.',
    degreesOfFreedom,
    pValue,
    tStatistic,
  }
}

function getHistogram(values) {
  if (!values.length) {
    return []
  }

  const mean = getMean(values)
  const standardDeviation = getSampleStandardDeviation(values, mean)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const binCount = Math.max(4, Math.ceil(Math.sqrt(values.length)))
  const width = max === min ? 1 : (max - min) / binCount
  const bins = Array.from({ length: binCount }, (_, index) => {
    const start = min + index * width
    const end = index === binCount - 1 ? max : start + width
    return {
      count: 0,
      label: `${formatStat(start)}-${formatStat(end)}`,
      midpoint: start + width / 2,
      normal: 0,
    }
  })

  values.forEach((value) => {
    const index = Math.min(binCount - 1, Math.floor((value - min) / width))
    bins[index].count += 1
  })

  if (standardDeviation > 0) {
    bins.forEach((bin) => {
      const density =
        (1 / (standardDeviation * Math.sqrt(2 * Math.PI))) *
        Math.exp(-0.5 * ((bin.midpoint - mean) / standardDeviation) ** 2)
      bin.normal = density * values.length * width
    })
  }

  return bins
}

function getShapeStats(values) {
  if (values.length < 2) {
    return {
      kurtosis: 0,
      kurtosisInterpretation: 'Mesokurtic (normal-like)',
      skewness: 0,
      skewnessInterpretation: 'Approximately symmetric',
    }
  }

  const mean = getMean(values)
  const standardDeviation = getPopulationStandardDeviation(values, mean)

  if (standardDeviation === 0) {
    return {
      kurtosis: 0,
      kurtosisInterpretation: 'Mesokurtic (normal-like)',
      skewness: 0,
      skewnessInterpretation: 'Approximately symmetric',
    }
  }

  const skewness =
    values.reduce(
      (sum, value) => sum + Math.pow((value - mean) / standardDeviation, 3),
      0,
    ) / values.length
  const kurtosis =
    values.reduce(
      (sum, value) => sum + Math.pow((value - mean) / standardDeviation, 4),
      0,
    ) /
      values.length -
    3

  return {
    kurtosis,
    kurtosisInterpretation:
      kurtosis > 1
        ? 'Leptokurtic (heavy tails)'
        : kurtosis < -1
          ? 'Platykurtic (light tails)'
          : 'Mesokurtic (normal-like)',
    skewness,
    skewnessInterpretation:
      skewness > 0.5
        ? 'Right skewed'
        : skewness < -0.5
          ? 'Left skewed'
          : 'Approximately symmetric',
  }
}

function getPearson(valuesA, valuesB) {
  const pairedValues = valuesA
    .map((value, index) => [value, valuesB[index]])
    .filter(([first, second]) => Number.isFinite(first) && Number.isFinite(second))

  if (pairedValues.length < 2) {
    return 0
  }

  const firstValues = pairedValues.map(([value]) => value)
  const secondValues = pairedValues.map(([, value]) => value)
  const meanA = getMean(firstValues)
  const meanB = getMean(secondValues)
  const numerator = pairedValues.reduce(
    (sum, [first, second]) => sum + (first - meanA) * (second - meanB),
    0,
  )
  const denominatorA = Math.sqrt(
    firstValues.reduce((sum, value) => sum + (value - meanA) ** 2, 0),
  )
  const denominatorB = Math.sqrt(
    secondValues.reduce((sum, value) => sum + (value - meanB) ** 2, 0),
  )

  if (!denominatorA || !denominatorB) {
    return 0
  }

  return numerator / (denominatorA * denominatorB)
}

function getHeatColor(value) {
  const intensity = Math.min(1, Math.abs(value))
  const opacity = Math.round((16 + intensity * 72) * 100) / 100

  if (value < 0) {
    return `color-mix(in srgb, var(--accent-red) ${opacity}%, transparent)`
  }

  return `color-mix(in srgb, var(--accent-blue) ${opacity}%, transparent)`
}

function StatsBlockPrimitive({ blockId, data = [] }) {
  const { activeDataset, datasets, setActiveDataset } = useWorkspaceData()
  const { registerExportSnapshot, unregisterExportSnapshot } = useExportSnapshots()
  const [selectedDatasetId, setSelectedDatasetId] = useState('')
  const [selectedColumn, setSelectedColumn] = useState('')
  const [activeTab, setActiveTab] = useState(tabs[0])
  const [hypothesizedMean, setHypothesizedMean] = useState(0)
  const [alpha, setAlpha] = useState(0.05)
  const selectedDataset =
    datasets.find((dataset) => dataset.id === selectedDatasetId) ??
    activeDataset
  const statsData = selectedDataset?.rows ?? data
  const numericColumns = useMemo(() => getNumericColumns(statsData), [statsData])
  const activeColumn = numericColumns.includes(selectedColumn)
    ? selectedColumn
    : numericColumns[0] || ''
  const values = useMemo(
    () => getNumericValues(statsData, activeColumn),
    [activeColumn, statsData],
  )
  const stats = useMemo(() => (values.length ? getStats(values) : []), [values])
  const sparklineData = values.map((value, index) => ({ index, value }))
  const histogramData = useMemo(() => getHistogram(values), [values])
  const shapeStats = useMemo(() => getShapeStats(values), [values])
  const tTest = useMemo(
    () => getTTest(values, Number(hypothesizedMean), Number(alpha)),
    [alpha, hypothesizedMean, values],
  )

  useEffect(() => {
    registerExportSnapshot(blockId, {
      type: 'stats-block',
      data: {
        column: activeColumn,
        datasetName: selectedDataset?.name ?? '',
        stats,
      },
    })

    return () => unregisterExportSnapshot(blockId)
  }, [
    activeColumn,
    blockId,
    registerExportSnapshot,
    selectedDataset?.name,
    stats,
    unregisterExportSnapshot,
  ])

  if (!Array.isArray(statsData) || !statsData.length) {
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
      <div className="stats-controls">
        {datasets.length > 0 && (
          <label className="stats-column-control">
            <span>Dataset</span>
            <select
              value={selectedDataset?.id ?? ''}
              onChange={(event) => {
                setSelectedDatasetId(event.target.value)
                setActiveDataset(event.target.value)
                setSelectedColumn('')
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
      </div>

      <div className="stats-tabs" role="tablist" aria-label="Statistics views">
        {tabs.map((tab) => (
          <button
            className={activeTab === tab ? 'is-active' : ''}
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="stats-tab-panel">
        {activeTab === 'Descriptive' && (
          <>
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
          </>
        )}

        {activeTab === 'Distribution' && (
          <>
            <div className="stats-card-grid compact">
              <article className="stats-card">
                <span aria-hidden="true">sk</span>
                <div>
                  <strong>{formatShapeStat(shapeStats.skewness)}</strong>
                  <p>Skewness</p>
                  <p>{shapeStats.skewnessInterpretation}</p>
                </div>
              </article>
              <article className="stats-card">
                <span aria-hidden="true">ku</span>
                <div>
                  <strong>{formatShapeStat(shapeStats.kurtosis)}</strong>
                  <p>Kurtosis</p>
                  <p>{shapeStats.kurtosisInterpretation}</p>
                </div>
              </article>
            </div>
            <div className="stats-chart-panel">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={histogramData} margin={{ top: 8, right: 10, bottom: 8, left: 4 }}>
                  <CartesianGrid stroke="var(--color-chart-grid)" strokeDasharray="3 3" />
                  <XAxis dataKey="label" hide />
                  <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--color-panel-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 6,
                      color: 'var(--color-text)',
                    }}
                  />
                  <Bar dataKey="count" fill="var(--color-accent)" />
                  <Line type="monotone" dataKey="normal" stroke="var(--color-accent-strong)" dot={false} strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {activeTab === 'Hypothesis Test' && (
          <div className="hypothesis-panel">
            <label className="stats-column-control">
              <span>Hypothesized Mean</span>
              <input
                type="number"
                value={hypothesizedMean}
                onChange={(event) => setHypothesizedMean(event.target.value)}
              />
            </label>
            <label className="stats-column-control">
              <span>Significance</span>
              <input
                max="1"
                min="0.001"
                step="0.001"
                type="number"
                value={alpha}
                onChange={(event) => setAlpha(event.target.value)}
              />
            </label>

            {tTest ? (
              <div className="stats-card-grid">
                <article className="stats-card">
                  <span aria-hidden="true">t</span>
                  <div>
                    <strong>{formatStat(tTest.tStatistic)}</strong>
                    <p>t-statistic</p>
                  </div>
                </article>
                <article className="stats-card">
                  <span aria-hidden="true">p</span>
                  <div>
                    <strong>{formatStat(tTest.pValue)}</strong>
                    <p>p-value</p>
                  </div>
                </article>
                <article className="stats-card wide">
                  <span aria-hidden="true">H0</span>
                  <div>
                    <strong>{tTest.conclusion}</strong>
                    <p>df = {tTest.degreesOfFreedom}</p>
                  </div>
                </article>
              </div>
            ) : (
              <p className="stats-note">At least two varying values are required.</p>
            )}
          </div>
        )}

        {activeTab === 'Correlation' && (
          <div className="correlation-grid">
            <div className="correlation-cell corner" />
            {numericColumns.map((column) => (
              <div className="correlation-header" key={`head-${column}`}>
                {column}
              </div>
            ))}
            {numericColumns.map((rowColumn) => (
              <div className="correlation-row" key={`row-${rowColumn}`}>
                <div className="correlation-header">{rowColumn}</div>
                {numericColumns.map((column) => {
                  const correlation = getPearson(
                    getNumericValues(statsData, rowColumn),
                    getNumericValues(statsData, column),
                  )

                  return (
                    <div
                      className="correlation-cell"
                      key={`${rowColumn}-${column}`}
                      style={{ background: getHeatColor(correlation) }}
                      title={`${rowColumn} / ${column}: ${formatStat(correlation)}`}
                    >
                      {formatStat(correlation)}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default StatsBlockPrimitive
