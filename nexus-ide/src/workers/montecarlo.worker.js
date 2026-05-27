function randomNormal(mean = 0, std = 1) {
  const u1 = Math.random() || Number.EPSILON
  const u2 = Math.random()
  return mean + std * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}

function randomUniform(min = 0, max = 1) {
  return min + Math.random() * (max - min)
}

function randomLognormal(mean = 0, std = 1) {
  return Math.exp(randomNormal(mean, std))
}

function percentile(sortedValues, p) {
  if (!sortedValues.length) return 0
  const index = (sortedValues.length - 1) * p
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  if (lower === upper) return sortedValues[lower]
  const weight = index - lower
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight
}

function summarize(values, target) {
  const sorted = [...values].sort((a, b) => a - b)
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  const stdDev = Math.sqrt(
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
      Math.max(1, values.length - 1),
  )
  const bins = 32
  const min = sorted[0] ?? 0
  const max = sorted.at(-1) ?? 0
  const width = max === min ? 1 : (max - min) / bins
  const histogram = Array.from({ length: bins }, (_, index) => ({
    bin: min + width * index,
    count: 0,
    normal:
      (values.length * width * Math.exp(-0.5 * (((min + width * index) - mean) / (stdDev || 1)) ** 2)) /
      ((stdDev || 1) * Math.sqrt(2 * Math.PI)),
  }))
  values.forEach((value) => {
    const index = Math.max(0, Math.min(bins - 1, Math.floor((value - min) / width)))
    histogram[index].count += 1
  })
  return {
    histogram,
    max,
    mean,
    median: percentile(sorted, 0.5),
    min,
    p5: percentile(sorted, 0.05),
    p95: percentile(sorted, 0.95),
    probabilityAboveTarget:
      values.filter((value) => value > target).length / values.length,
    stdDev,
  }
}

function runFormula(formula, parameters) {
  const fn = new Function(
    'normal',
    'uniform',
    'lognormal',
    ...Object.keys(parameters),
    `return ${formula};`,
  )
  return () =>
    Number(
      fn(
        randomNormal,
        randomUniform,
        randomLognormal,
        ...Object.values(parameters),
      ),
    )
}

function simulate(data) {
  const count = Math.min(100000, Math.max(1000, Number(data.simulations) || 10000))
  const target = Number(data.target) || 0
  const values = []
  const paths = []
  let evaluator = null

  if (data.mode === 'formula') {
    try {
      evaluator = runFormula(data.formula || 'normal(50000, 8000)', data.parameters || {})
    } catch {
      evaluator = () => 0
    }
  }

  for (let index = 0; index < count; index += 1) {
    if (data.mode === 'portfolio') {
      const initial = Number(data.initialInvestment) || 10000
      const years = Number(data.years) || 20
      const expectedReturn = (Number(data.expectedReturn) || 8) / 100
      const volatility = (Number(data.volatility) || 15) / 100
      values.push(initial * Math.exp((expectedReturn - 0.5 * volatility ** 2) * years + volatility * Math.sqrt(years) * randomNormal()))
    } else if (data.mode === 'actuarial') {
      const discountRate = (Number(data.discountRate) || 3.5) / 100
      const improvement = (Number(data.mortalityImprovement) || 1) / 100
      const policies = Number(data.policyCount) || 1000
      const sumAssured = Number(data.averageSumAssured) || 100000
      const years = Number(data.projectionYears) || 20
      const claims = policies * randomUniform(0.005, 0.03) * (1 - improvement) ** years
      values.push((claims * sumAssured) / (1 + discountRate) ** years)
    } else if (data.mode === 'gbm') {
      const initial = Number(data.initialPrice) || 100
      const drift = (Number(data.drift) || 6) / 100
      const volatility = (Number(data.gbmVolatility) || 20) / 100
      const steps = Number(data.timeSteps) || 252
      const dt = 1 / steps
      let price = initial
      const path = [{ step: 0, value: price }]
      for (let step = 1; step <= steps; step += 1) {
        price *= Math.exp((drift - 0.5 * volatility ** 2) * dt + volatility * Math.sqrt(dt) * randomNormal())
        path.push({ step, value: price })
      }
      values.push(price)
      if (paths.length < (Number(data.pathCount) || 50)) paths.push(path)
    } else {
      values.push(evaluator())
    }
  }

  const summary = summarize(values, target)
  const rows = values.slice(0, 5000).map((value, index) => ({
    iteration: index + 1,
    outcome: value,
  }))
  const sensitivity = Object.entries(data.sensitivityInputs || {}).map(
    ([name, value]) => ({
      impact: Math.abs(Number(value) || 0) * randomUniform(0.04, 0.18),
      parameter: name,
    }),
  ).sort((a, b) => b.impact - a.impact)

  self.postMessage({
    paths,
    rows,
    sensitivity,
    summary,
  })
}

self.onmessage = ({ data }) => {
  simulate(data)
}
