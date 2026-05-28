import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { EmptyState } from '../components/BlockStates'
import { useParameters } from '../context/useParameters'
import { useWorkspaceData } from '../context/useWorkspaceData'
import { getChartTheme } from '../styles/themeTokens'

const modes = [
  { id: 'formula', label: 'Custom Formula' },
  { id: 'portfolio', label: 'Portfolio Returns' },
  { id: 'actuarial', label: 'Actuarial Reserve' },
  { id: 'gbm', label: 'Geometric Brownian Motion' },
]
const tabs = ['Results', 'Paths', 'Sensitivity']

function format(value) {
  return Number.isFinite(Number(value)) ? Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 }) : 'n/a'
}

function MonteCarloBlockPrimitive({
  blockId,
  formula: initialFormula,
  initialMode,
  return: expectedReturnProp,
  type,
  updateBlockData,
  vol,
  years,
}) {
  const chartTheme = getChartTheme()
  const { parameters } = useParameters()
  const { addDataset } = useWorkspaceData()
  const [mode, setMode] = useState(initialMode ?? type ?? 'formula')
  const [activeTab, setActiveTab] = useState('Results')
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState(null)
  const [formula, setFormula] = useState(
    initialFormula || 'normal(50000, 8000) * (1 + uniform(0.02, 0.08))',
  )
  const [simulations, setSimulations] = useState(10000)
  const [target, setTarget] = useState(50000)
  const [expectedReturn, setExpectedReturn] = useState(Number(expectedReturnProp) || 8)
  const [volatility, setVolatility] = useState(Number(vol) || 15)
  const [timeHorizon, setTimeHorizon] = useState(Number(years) || 20)
  const [initialInvestment, setInitialInvestment] = useState(10000)
  const [discountRate, setDiscountRate] = useState(3.5)
  const [mortalityImprovement, setMortalityImprovement] = useState(1)
  const [policyCount, setPolicyCount] = useState(1000)
  const [averageSumAssured, setAverageSumAssured] = useState(100000)
  const [projectionYears, setProjectionYears] = useState(20)
  const [initialPrice, setInitialPrice] = useState(100)
  const [drift, setDrift] = useState(6)
  const [gbmVolatility, setGbmVolatility] = useState(20)
  const [timeSteps, setTimeSteps] = useState(252)
  const [pathCount, setPathCount] = useState(50)
  const workerRef = useRef(null)

  const workerPayload = useMemo(
    () => ({
      averageSumAssured,
      discountRate,
      drift,
      expectedReturn,
      formula,
      gbmVolatility,
      initialInvestment,
      initialPrice,
      mode,
      mortalityImprovement,
      parameters,
      pathCount,
      policyCount,
      projectionYears,
      sensitivityInputs: {
        discountRate,
        drift,
        expectedReturn,
        gbmVolatility,
        mortalityImprovement,
        volatility,
      },
      simulations,
      target,
      timeSteps,
      years: timeHorizon,
      volatility,
    }),
    [
      averageSumAssured,
      discountRate,
      drift,
      expectedReturn,
      formula,
      gbmVolatility,
      initialInvestment,
      initialPrice,
      mode,
      mortalityImprovement,
      parameters,
      pathCount,
      policyCount,
      projectionYears,
      simulations,
      target,
      timeHorizon,
      timeSteps,
      volatility,
    ],
  )

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/montecarlo.worker.js', import.meta.url),
      { type: 'module' },
    )
    workerRef.current.onmessage = ({ data }) => {
      setResult(data)
      setIsRunning(false)
      if (data.rows?.length) {
        addDataset({
          name: 'montecarlo_results',
          rows: data.rows,
          source: 'code',
        })
      }
    }
    return () => workerRef.current?.terminate()
  }, [addDataset])

  useEffect(() => {
    // AGENT: can configure and run simulations by setting parameters and calling run.
    const timeout = setTimeout(() => {
      setIsRunning(true)
      workerRef.current?.postMessage(workerPayload)
    }, 300)
    return () => clearTimeout(timeout)
  }, [workerPayload])

  const summary = result?.summary

  useEffect(() => {
    updateBlockData?.(blockId, {
      formula,
      results: summary
        ? {
            mean: summary.mean,
            median: summary.median,
            p95: summary.p95,
            probabilityStatement: `P(outcome > ${format(target)}) = ${format(
              summary.probabilityAboveTarget * 100,
            )}%`,
            stdDev: summary.stdDev,
            var95: summary.p5,
          }
        : null,
      simulations,
    })
  }, [
    blockId,
    formula,
    simulations,
    summary,
    target,
    updateBlockData,
  ])
  const pathRows = useMemo(() => {
    if (!result?.paths?.length) return []
    const maxLength = Math.max(...result.paths.map((path) => path.length))
    return Array.from({ length: maxLength }, (_, step) => {
      const row = { step }
      result.paths.forEach((path, index) => {
        row[`path_${index}`] = path[step]?.value
      })
      row.mean = result.paths.reduce((sum, path) => sum + (path[step]?.value ?? 0), 0) / result.paths.length
      return row
    })
  }, [result])

  return (
    <div className="monte-carlo-primitive">
      <aside className="analytics-config-panel">
        <label>
          <span>Simulation Type</span>
          <select value={mode} onChange={(event) => setMode(event.target.value)}>
            {modes.map((modeOption) => (
              <option key={modeOption.id} value={modeOption.id}>{modeOption.label}</option>
            ))}
          </select>
        </label>
        {mode === 'formula' && (
          <label>
            <span>Formula</span>
            <textarea value={formula} onChange={(event) => setFormula(event.target.value)} />
          </label>
        )}
        {mode === 'portfolio' && (
          <>
            <Slider label="Expected Return" value={expectedReturn} setValue={setExpectedReturn} min={-10} max={30} suffix="%" />
            <Slider label="Volatility" value={volatility} setValue={setVolatility} min={0} max={50} suffix="%" />
            <Slider label="Time Horizon" value={timeHorizon} setValue={setTimeHorizon} min={1} max={30} suffix=" yrs" />
            <NumberInput label="Initial Investment" value={initialInvestment} setValue={setInitialInvestment} />
          </>
        )}
        {mode === 'actuarial' && (
          <>
            <Slider label="Discount Rate" value={discountRate} setValue={setDiscountRate} min={0} max={15} step={0.1} suffix="%" />
            <Slider label="Mortality Improvement" value={mortalityImprovement} setValue={setMortalityImprovement} min={0} max={5} step={0.1} suffix="%" />
            <NumberInput label="Policy Count" value={policyCount} setValue={setPolicyCount} />
            <NumberInput label="Average Sum Assured" value={averageSumAssured} setValue={setAverageSumAssured} />
            <Slider label="Projection Years" value={projectionYears} setValue={setProjectionYears} min={1} max={50} />
          </>
        )}
        {mode === 'gbm' && (
          <>
            <NumberInput label="Initial Price" value={initialPrice} setValue={setInitialPrice} />
            <Slider label="Drift μ" value={drift} setValue={setDrift} min={-20} max={20} suffix="%" />
            <Slider label="Volatility σ" value={gbmVolatility} setValue={setGbmVolatility} min={0} max={100} suffix="%" />
            <label><span>Time Steps</span><select value={timeSteps} onChange={(event) => setTimeSteps(Number(event.target.value))}><option value={52}>52</option><option value={252}>252</option><option value={365}>365</option></select></label>
            <Slider label="Paths" value={pathCount} setValue={setPathCount} min={10} max={100} step={10} />
          </>
        )}
        <Slider label="Simulations" value={simulations} setValue={setSimulations} min={1000} max={100000} step={1000} />
        <NumberInput label="Target" value={target} setValue={setTarget} />
        {isRunning && <p>Simulating...</p>}
      </aside>
      <section className="analytics-results-panel">
        <div className="analytics-tab-list horizontal">
          {tabs.map((tab) => (
            <button className={activeTab === tab ? 'is-active' : undefined} key={tab} type="button" onClick={() => setActiveTab(tab)}>
              {tab}
            </button>
          ))}
        </div>
        {activeTab === 'Results' && summary && (
          <>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={summary.histogram}>
                <CartesianGrid stroke="var(--color-chart-grid)" strokeDasharray="3 3" />
                <XAxis dataKey="bin" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <Tooltip />
                <Bar dataKey="count" fill={chartTheme.blue} />
                <Line dataKey="normal" stroke={chartTheme.orange} dot={false} />
              </BarChart>
            </ResponsiveContainer>
            <div className="analytics-stat-grid">
              <span>Mean <strong>{format(summary.mean)}</strong></span>
              <span>Std Dev <strong>{format(summary.stdDev)}</strong></span>
              <span>VaR 95 <strong>{format(summary.p5)}</strong></span>
              <span>95th <strong>{format(summary.p95)}</strong></span>
              <span>Median <strong>{format(summary.median)}</strong></span>
            </div>
            <p>P(outcome &gt; {format(target)}) = {format(summary.probabilityAboveTarget * 100)}%</p>
            <p>95% of outcomes fall between {format(summary.p5)} and {format(summary.p95)}</p>
          </>
        )}
        {activeTab === 'Paths' && (
          mode === 'gbm' && pathRows.length ? (
            <ResponsiveContainer width="100%" height={330}>
              <LineChart data={pathRows}>
                <CartesianGrid stroke="var(--color-chart-grid)" strokeDasharray="3 3" />
                <XAxis dataKey="step" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <Tooltip />
                {result.paths.map((_, index) => (
                  <Line key={index} dataKey={`path_${index}`} stroke={chartTheme.blueDim} dot={false} strokeWidth={1} />
                ))}
                <Line dataKey="mean" stroke={chartTheme.textPrimary} dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyState message="Paths are available for GBM simulations" />
        )}
        {activeTab === 'Sensitivity' && (
          <ResponsiveContainer width="100%" height={330}>
            <BarChart data={result?.sensitivity ?? []} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
              <YAxis type="category" dataKey="parameter" width={120} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
              <Tooltip />
              <Bar dataKey="impact" fill={chartTheme.orange} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>
    </div>
  )
}

function Slider({ label, max, min, setValue, step = 1, suffix = '', value }) {
  return (
    <label>
      <span>{label}: {value}{suffix}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => setValue(Number(event.target.value))} />
    </label>
  )
}

function NumberInput({ label, setValue, value }) {
  return (
    <label>
      <span>{label}</span>
      <input type="number" value={value} onChange={(event) => setValue(Number(event.target.value))} />
    </label>
  )
}

export default MonteCarloBlockPrimitive
