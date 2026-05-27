import { useMemo, useState } from 'react'
import katex from 'katex'
import {
  CartesianGrid,
  Cell,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { linearRegression } from 'simple-statistics'
import { useWorkspaceData } from '../context/useWorkspaceData'
import 'katex/dist/katex.min.css'

const resultTabs = ['Coefficients', 'Residual Plot', 'Fit Plot']

function getNumericColumns(data) {
  if (!Array.isArray(data) || !data.length) {
    return []
  }

  const columns = Array.from(new Set(data.flatMap((row) => Object.keys(row ?? {}))))

  return columns.filter((column) =>
    data.some((row) => Number.isFinite(Number(row?.[column]))),
  )
}

function getRegressionRows(data, yColumn, xColumns) {
  return data
    .map((row) => ({
      original: row,
      x: xColumns.map((column) => Number(row?.[column])),
      y: Number(row?.[yColumn]),
    }))
    .filter(
      (row) =>
        Number.isFinite(row.y) && row.x.every((value) => Number.isFinite(value)),
    )
}

function transpose(matrix) {
  return matrix[0].map((_, columnIndex) =>
    matrix.map((row) => row[columnIndex]),
  )
}

function multiplyMatrices(left, right) {
  return left.map((row) =>
    right[0].map((_, columnIndex) =>
      row.reduce((sum, value, index) => sum + value * right[index][columnIndex], 0),
    ),
  )
}

function invertMatrix(matrix) {
  const size = matrix.length
  const augmented = matrix.map((row, rowIndex) => [
    ...row,
    ...Array.from({ length: size }, (_, columnIndex) =>
      rowIndex === columnIndex ? 1 : 0,
    ),
  ])

  for (let pivotIndex = 0; pivotIndex < size; pivotIndex += 1) {
    let pivotRow = pivotIndex

    for (let rowIndex = pivotIndex + 1; rowIndex < size; rowIndex += 1) {
      if (
        Math.abs(augmented[rowIndex][pivotIndex]) >
        Math.abs(augmented[pivotRow][pivotIndex])
      ) {
        pivotRow = rowIndex
      }
    }

    if (Math.abs(augmented[pivotRow][pivotIndex]) < 1e-12) {
      throw new Error('Regression matrix is singular. Try removing collinear variables.')
    }

    if (pivotRow !== pivotIndex) {
      ;[augmented[pivotIndex], augmented[pivotRow]] = [
        augmented[pivotRow],
        augmented[pivotIndex],
      ]
    }

    const pivot = augmented[pivotIndex][pivotIndex]
    augmented[pivotIndex] = augmented[pivotIndex].map((value) => value / pivot)

    for (let rowIndex = 0; rowIndex < size; rowIndex += 1) {
      if (rowIndex === pivotIndex) {
        continue
      }

      const factor = augmented[rowIndex][pivotIndex]
      augmented[rowIndex] = augmented[rowIndex].map(
        (value, columnIndex) =>
          value - factor * augmented[pivotIndex][columnIndex],
      )
    }
  }

  return augmented.map((row) => row.slice(size))
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

  const adjustedValue = value - 1
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

  if (Math.abs(d) < fpMin) d = fpMin

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

    if (Math.abs(delta - 1) < epsilon) break
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

function tPValue(tStatistic, degreesOfFreedom) {
  if (!Number.isFinite(tStatistic) || degreesOfFreedom <= 0) {
    return 1
  }

  return Math.max(0, Math.min(1, 2 * (1 - studentTCdf(Math.abs(tStatistic), degreesOfFreedom))))
}

function fPValue(fStatistic, numeratorDf, denominatorDf) {
  if (!Number.isFinite(fStatistic) || fStatistic < 0 || denominatorDf <= 0) {
    return 1
  }

  const x =
    (numeratorDf * fStatistic) /
    (numeratorDf * fStatistic + denominatorDf)

  return Math.max(
    0,
    Math.min(1, 1 - regularizedBeta(x, numeratorDf / 2, denominatorDf / 2)),
  )
}

function formatNumber(value, digits = 4) {
  if (!Number.isFinite(Number(value))) {
    return 'n/a'
  }

  return Number(value).toFixed(digits)
}

function getSignificance(pValue) {
  if (pValue < 0.001) return '***'
  if (pValue < 0.01) return '**'
  if (pValue < 0.05) return '*'
  if (pValue < 0.1) return '.'
  return ''
}

function runOls(rows, yColumn, xColumns) {
  const designMatrix = rows.map((row) => [1, ...row.x])
  const yVector = rows.map((row) => [row.y])
  const xTranspose = transpose(designMatrix)
  const xtx = multiplyMatrices(xTranspose, designMatrix)
  const xtxInverse = invertMatrix(xtx)
  const xty = multiplyMatrices(xTranspose, yVector)
  const beta = multiplyMatrices(xtxInverse, xty).map(([value]) => value)
  const predicted = designMatrix.map((row) =>
    row.reduce((sum, value, index) => sum + value * beta[index], 0),
  )
  const actual = rows.map((row) => row.y)
  const residuals = actual.map((value, index) => value - predicted[index])
  const meanY = actual.reduce((sum, value) => sum + value, 0) / actual.length
  const ssRes = residuals.reduce((sum, value) => sum + value ** 2, 0)
  const ssTot = actual.reduce((sum, value) => sum + (value - meanY) ** 2, 0)
  const ssReg = Math.max(0, ssTot - ssRes)
  const n = rows.length
  const p = xColumns.length
  const residualDf = n - p - 1
  const residualVariance = ssRes / residualDf
  const covarianceMatrix = xtxInverse.map((row) =>
    row.map((value) => value * residualVariance),
  )
  const coefficients = ['Intercept', ...xColumns].map((variable, index) => {
    const coefficient = beta[index]
    const stdError = Math.sqrt(Math.max(0, covarianceMatrix[index][index]))
    const tStatistic = stdError === 0 ? 0 : coefficient / stdError
    const pValue = tPValue(tStatistic, residualDf)

    return {
      coefficient,
      pValue,
      significance: getSignificance(pValue),
      stdError,
      tStatistic,
      variable,
    }
  })
  const rSquared = ssTot === 0 ? 1 : 1 - ssRes / ssTot
  const adjustedRSquared =
    residualDf <= 0 ? rSquared : 1 - (1 - rSquared) * ((n - 1) / residualDf)
  const fStatistic =
    p === 0 || residualDf <= 0 ? 0 : (ssReg / p) / (ssRes / residualDf)
  const modelPValue = fPValue(fStatistic, p, residualDf)
  const resultRows = rows.map((row, index) => ({
    ...row.original,
    actual: actual[index],
    fitted: predicted[index],
    predicted: predicted[index],
    residual: residuals[index],
  }))

  return {
    adjustedRSquared,
    coefficients,
    equation: createEquation(yColumn, coefficients),
    fStatistic,
    fitData: actual.map((value, index) => ({
      actual: value,
      predicted: predicted[index],
    })),
    modelPValue,
    residualData: predicted.map((value, index) => ({
      fitted: value,
      magnitude: Math.abs(residuals[index]),
      residual: residuals[index],
    })),
    resultRows,
    rSquared,
  }
}

function createEquation(yColumn, coefficients) {
  const [, ...terms] = coefficients
  const intercept = coefficients[0]?.coefficient ?? 0
  const termText = terms
    .map((term, index) => {
      const coefficient = term.coefficient
      const sign = coefficient < 0 ? '-' : '+'
      return `${sign} ${Math.abs(coefficient).toFixed(3)}x_{${index + 1}}`
    })
    .join(' ')

  return `\\hat{${yColumn}} = ${intercept.toFixed(3)} ${termText}`.trim()
}

function validateConfiguration(dataset, numericColumns, yColumn, xColumns, regressionType) {
  if (!dataset) {
    return 'Load a dataset before running regression.'
  }

  if (!numericColumns.length) {
    return 'Selected dataset has no numeric columns.'
  }

  if (!yColumn) {
    return 'Select a dependent variable.'
  }

  if (!xColumns.length) {
    return 'Select at least one independent variable.'
  }

  if (regressionType === 'simple' && xColumns.length !== 1) {
    return 'Simple Linear regression requires exactly one independent variable.'
  }

  if (dataset.rows.length <= xColumns.length + 1) {
    return 'Not enough complete rows for the selected regression model.'
  }

  return ''
}

function RegressionBlockPrimitive() {
  const { activeDataset, addDataset, datasets, setActiveDataset } =
    useWorkspaceData()
  const [activeTab, setActiveTab] = useState(resultTabs[0])
  const [error, setError] = useState('')
  const [regressionType, setRegressionType] = useState('simple')
  const [selectedDatasetId, setSelectedDatasetId] = useState('')
  const [selectedXColumns, setSelectedXColumns] = useState([])
  const [selectedYColumn, setSelectedYColumn] = useState('')
  const [results, setResults] = useState(null)
  const selectedDataset =
    datasets.find((dataset) => dataset.id === selectedDatasetId) ??
    activeDataset
  const numericColumns = useMemo(
    () => getNumericColumns(selectedDataset?.rows ?? []),
    [selectedDataset],
  )
  const activeYColumn = numericColumns.includes(selectedYColumn)
    ? selectedYColumn
    : numericColumns[0] ?? ''
  const availableXColumns = numericColumns.filter(
    (column) => column !== activeYColumn,
  )
  const activeXColumns = selectedXColumns.filter((column) =>
    availableXColumns.includes(column),
  )
  const renderedEquation = results
    ? katex.renderToString(results.equation, {
        displayMode: true,
        throwOnError: false,
      })
    : ''
  const maxResidual = results
    ? Math.max(...results.residualData.map((point) => point.magnitude), 1)
    : 1
  const actualValues = results?.fitData.flatMap((point) => [
    point.actual,
    point.predicted,
  ]) ?? [0, 1]
  const fitMin = Math.min(...actualValues)
  const fitMax = Math.max(...actualValues)
  const referenceLine = [
    { actual: fitMin, reference: fitMin },
    { actual: fitMax, reference: fitMax },
  ]

  const toggleXColumn = (column) => {
    setSelectedXColumns((currentColumns) => {
      if (regressionType === 'simple') {
        return currentColumns.includes(column) ? [] : [column]
      }

      return currentColumns.includes(column)
        ? currentColumns.filter((currentColumn) => currentColumn !== column)
        : [...currentColumns, column]
    })
  }

  const runRegression = () => {
    const validationError = validateConfiguration(
      selectedDataset,
      numericColumns,
      activeYColumn,
      activeXColumns,
      regressionType,
    )

    if (validationError) {
      setError(validationError)
      setResults(null)
      return
    }

    try {
      // AGENT: can trigger regression by pushing a regression block with pre-filled configuration.
      const rows = getRegressionRows(
        selectedDataset.rows,
        activeYColumn,
        activeXColumns,
      )

      if (rows.length <= activeXColumns.length + 1) {
        throw new Error('Not enough complete rows for the selected variables.')
      }

      if (regressionType === 'simple') {
        const simpleFit = linearRegression(rows.map((row) => [row.x[0], row.y]))

        if (!Number.isFinite(simpleFit.m) || !Number.isFinite(simpleFit.b)) {
          throw new Error('Simple linear regression could not be computed.')
        }
      }

      const nextResults = runOls(rows, activeYColumn, activeXColumns)

      addDataset({
        name: 'regression_fitted_values',
        rows: nextResults.resultRows,
        source: 'code',
      })
      setResults(nextResults)
      setActiveTab(resultTabs[0])
      setError('')
    } catch (regressionError) {
      setError(regressionError.message)
      setResults(null)
    }
  }

  return (
    <div className="regression-primitive">
      <section className="regression-config">
        <label>
          <span>Dataset</span>
          <select
            value={selectedDataset?.id ?? ''}
            onChange={(event) => {
              setSelectedDatasetId(event.target.value)
              setActiveDataset(event.target.value)
              setSelectedXColumns([])
              setSelectedYColumn('')
              setResults(null)
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
          <span>Dependent Variable (Y)</span>
          <select
            value={activeYColumn}
            onChange={(event) => {
              setSelectedYColumn(event.target.value)
              setSelectedXColumns((currentColumns) =>
                currentColumns.filter((column) => column !== event.target.value),
              )
            }}
          >
            {numericColumns.map((column) => (
              <option key={column} value={column}>
                {column}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Regression Type</span>
          <select
            value={regressionType}
            onChange={(event) => {
              setRegressionType(event.target.value)
              setSelectedXColumns([])
              setResults(null)
            }}
          >
            <option value="simple">Simple Linear</option>
            <option value="multiple">Multiple Linear</option>
            <option disabled value="logistic">
              Logistic (coming soon)
            </option>
          </select>
        </label>

        <fieldset>
          <legend>Independent Variables (X)</legend>
          {availableXColumns.length ? (
            availableXColumns.map((column) => (
              <label key={column} title={column}>
                <input
                  checked={activeXColumns.includes(column)}
                  type="checkbox"
                  onChange={() => toggleXColumn(column)}
                />
                <span>{column}</span>
              </label>
            ))
          ) : (
            <p>No independent numeric columns available.</p>
          )}
        </fieldset>

        <button type="button" onClick={runRegression}>
          Run Regression
        </button>
        {error && <p className="regression-error">{error}</p>}
      </section>

      <section className="regression-results">
        {results ? (
          <>
            <div className="stats-tabs" role="tablist" aria-label="Regression views">
              {resultTabs.map((tab) => (
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

            <div className="regression-tab-panel">
              {activeTab === 'Coefficients' && (
                <>
                  <div className="regression-table-scroll">
                    <table className="regression-table">
                      <thead>
                        <tr>
                          <th>Variable</th>
                          <th>Coefficient</th>
                          <th>Std Error</th>
                          <th>t-statistic</th>
                          <th>p-value</th>
                          <th>Significance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.coefficients.map((coefficient) => (
                          <tr key={coefficient.variable}>
                            <td>{coefficient.variable}</td>
                            <td>{formatNumber(coefficient.coefficient)}</td>
                            <td>{formatNumber(coefficient.stdError)}</td>
                            <td>{formatNumber(coefficient.tStatistic)}</td>
                            <td>{formatNumber(coefficient.pValue)}</td>
                            <td>{coefficient.significance || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="regression-model-stats">
                    <span>R² {formatNumber(results.rSquared)}</span>
                    <span>Adjusted R² {formatNumber(results.adjustedRSquared)}</span>
                    <span>F {formatNumber(results.fStatistic)}</span>
                    <span>Model p {formatNumber(results.modelPValue)}</span>
                  </div>
                </>
              )}

              {activeTab === 'Residual Plot' && (
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 12, right: 12, bottom: 12, left: 0 }}>
                    <CartesianGrid stroke="var(--color-chart-grid)" strokeDasharray="3 3" />
                    <XAxis dataKey="fitted" name="Fitted" type="number" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
                    <YAxis dataKey="residual" name="Residual" type="number" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
                    <ReferenceLine y={0} stroke="var(--color-text-muted)" strokeDasharray="4 4" />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--color-panel-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 6,
                        color: 'var(--color-text)',
                      }}
                    />
                    <Scatter data={results.residualData}>
                      {results.residualData.map((point) => (
                        <Cell
                          key={`${point.fitted}-${point.residual}`}
                          fill={`color-mix(in srgb, var(--accent-blue) ${
                            Math.round(
                              (28 + (point.magnitude / maxResidual) * 72) * 100,
                            ) / 100
                          }%, transparent)`}
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              )}

              {activeTab === 'Fit Plot' && (
                <div className="regression-fit-panel">
                  <span>R² {formatNumber(results.rSquared)}</span>
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 12, right: 12, bottom: 12, left: 0 }}>
                      <CartesianGrid stroke="var(--color-chart-grid)" strokeDasharray="3 3" />
                      <XAxis dataKey="actual" name="Actual" type="number" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
                      <YAxis dataKey="predicted" name="Predicted" type="number" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--color-panel-card)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 6,
                          color: 'var(--color-text)',
                        }}
                      />
                      <Scatter data={results.fitData} fill="var(--color-accent-strong)" />
                      <Line data={referenceLine} dataKey="reference" dot={false} stroke="var(--color-text-muted)" strokeDasharray="4 4" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="regression-equation">
              <div
                dangerouslySetInnerHTML={{ __html: renderedEquation }}
              />
            </div>
          </>
        ) : (
          <p className="stats-empty-state">
            Configure variables and run regression to see results.
          </p>
        )}
      </section>
    </div>
  )
}

export default RegressionBlockPrimitive
