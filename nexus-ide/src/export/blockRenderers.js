import autoTable from 'jspdf-autotable'

export const COLORS = {
  bg: [11, 15, 20],
  panel: [21, 27, 35],
  panelAlt: [17, 22, 30],
  border: [43, 52, 66],
  text: [230, 237, 243],
  textMuted: [139, 148, 158],
  orange: [255, 123, 28],
  green: [63, 185, 80],
  red: [248, 81, 73],
  blue: [78, 161, 255],
  purple: [188, 140, 255],
}

function valueOrDash(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '-'
  }

  return String(value)
}

function formatNumber(value, digits = 4) {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) {
    return valueOrDash(value)
  }

  return numericValue.toFixed(digits)
}

export function drawBlockContainer(doc, x, y, width, height, title, typeColor) {
  doc.setFillColor(...COLORS.panel)
  doc.roundedRect(x, y, width, height, 3, 3, 'F')
  doc.setDrawColor(...COLORS.border)
  doc.setLineWidth(0.3)
  doc.roundedRect(x, y, width, height, 3, 3, 'S')
  doc.setFillColor(...COLORS.bg)
  doc.rect(x, y, width, 8, 'F')
  doc.setFillColor(...typeColor)
  doc.circle(x + 4, y + 4, 1.5, 'F')
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.textMuted)
  doc.setFont('helvetica', 'normal')
  doc.text(String(title ?? 'Block'), x + 8, y + 5.5, {
    maxWidth: width - 12,
  })
  doc.setDrawColor(...COLORS.border)
  doc.line(x, y + 8, x + width, y + 8)

  return y + 10
}

function renderAutoTable(doc, x, y, width, columns, rows) {
  autoTable(doc, {
    body: rows,
    columns,
    headStyles: {
      fillColor: COLORS.bg,
      fontSize: 6,
      fontStyle: 'bold',
      textColor: COLORS.textMuted,
    },
    margin: {
      left: x + 2,
      right: doc.internal.pageSize.width - x - width + 2,
    },
    startY: y,
    styles: {
      cellPadding: 2,
      fillColor: COLORS.panel,
      font: 'courier',
      fontSize: 7,
      lineColor: COLORS.border,
      lineWidth: 0.2,
      overflow: 'linebreak',
      textColor: COLORS.text,
    },
    alternateRowStyles: {
      fillColor: COLORS.panelAlt,
    },
    tableWidth: width - 4,
    theme: 'grid',
  })

  return doc.lastAutoTable?.finalY ?? y
}

export function estimateBlockHeight(block) {
  const data = block.data ?? {}

  if (block.type === 'table' || block.type === 'chart') {
    return Math.min(
      ((data.rows ?? data.chartData ?? data.data)?.length ?? 1) * 6 + 28,
      115,
    )
  }

  if (block.type === 'regression') {
    return Math.min((data.results?.coefficients?.length ?? 1) * 7 + 42, 120)
  }

  if (block.type === 'prose-block') {
    return 90
  }

  if (block.type === 'assumption-flag' || block.type === 'progress-step') {
    return Math.min((data.assumptions?.length ?? data.steps?.length ?? 1) * 12 + 22, 110)
  }

  if (block.type === 'time-series') {
    return 110
  }

  return 70
}

export function renderTableBlock(doc, block, x, y, width) {
  const { columns = [], name, rows = [], title } = block.data ?? {}
  const normalizedColumns = columns.length
    ? columns
    : Object.keys(rows[0] ?? {})

  if (!normalizedColumns.length || !rows.length) {
    return renderPlaceholderBlock(doc, block, x, y, width, 'No table data available')
  }

  const height = Math.min(rows.length * 6 + 24, 115)
  const contentY = drawBlockContainer(
    doc,
    x,
    y,
    width,
    height,
    name || title || 'Table',
    COLORS.blue,
  )
  const tableRows = rows.slice(0, 15).map((row) => {
    const nextRow = {}
    normalizedColumns.forEach((column) => {
      nextRow[column] = valueOrDash(row?.[column])
    })
    return nextRow
  })
  const finalY = renderAutoTable(
    doc,
    x,
    contentY,
    width,
    normalizedColumns.map((column) => ({
      dataKey: column,
      header: String(column).toUpperCase(),
    })),
    tableRows,
  )

  if (rows.length > 15) {
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.textMuted)
    doc.text(`Showing 15 of ${rows.length} rows`, x + 2, finalY + 4)
    return finalY + 10
  }

  return finalY + 6
}

export function renderChartBlock(doc, block, x, y, width) {
  const { chartData, data, rows, title, xKey, yKey } = block.data ?? {}
  const exportRows = rows ?? chartData ?? data ?? []
  const columns = Object.keys(exportRows[0] ?? {})
  const height = Math.min(exportRows.length * 6 + 38, 115)
  const contentY = drawBlockContainer(
    doc,
    x,
    y,
    width,
    height,
    title || 'Chart',
    COLORS.blue,
  )

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.textMuted)
  doc.text('Chart visualization available in NEXUS IDE.', x + 4, contentY + 3)
  doc.text(`Axes: ${xKey || 'x'} by ${yKey || 'y'}`, x + 4, contentY + 8)

  if (!columns.length || !exportRows.length) {
    return y + height + 4
  }

  return (
    renderAutoTable(
      doc,
      x,
      contentY + 12,
      width,
      columns.map((column) => ({
        dataKey: column,
        header: String(column).toUpperCase(),
      })),
      exportRows.slice(0, 12).map((row) =>
        Object.fromEntries(columns.map((column) => [column, valueOrDash(row?.[column])])),
      ),
    ) + 6
  )
}

export function renderEquationBlock(doc, block, x, y, width) {
  const { formula, resolved, resolvedValue, title } = block.data ?? {}
  const height = 34
  const contentY = drawBlockContainer(
    doc,
    x,
    y,
    width,
    height,
    title || 'Equation',
    COLORS.purple,
  )
  const cleanFormula = String(formula ?? '')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/[{}]/g, '')

  doc.setFont('courier', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...COLORS.text)
  doc.text(cleanFormula || 'Equation', x + width / 2, contentY + 8, {
    align: 'center',
    maxWidth: width - 10,
  })

  if (resolved || resolvedValue) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.textMuted)
    doc.text(String(resolved ?? resolvedValue), x + width / 2, contentY + 17, {
      align: 'center',
      maxWidth: width - 10,
    })
  }

  return y + height + 4
}

export function renderStatsBlock(doc, block, x, y, width) {
  const { column, datasetName, stats = [], title } = block.data ?? {}
  const statItems = Array.isArray(stats)
    ? stats.map((stat) => ({ label: stat.name, value: stat.value }))
    : Object.entries(stats).map(([label, value]) => ({ label, value }))

  if (!statItems.length) {
    return renderPlaceholderBlock(doc, block, x, y, width, 'No statistics available')
  }

  const height = 56
  const contentY = drawBlockContainer(
    doc,
    x,
    y,
    width,
    height,
    title || `Statistics - ${column || 'unknown'} ${datasetName ? `(${datasetName})` : ''}`,
    COLORS.blue,
  )
  const colWidth = (width - 8) / 4

  statItems.slice(0, 8).forEach((item, index) => {
    const cx = x + 4 + (index % 4) * colWidth
    const cy = contentY + 2 + Math.floor(index / 4) * 18

    doc.setFillColor(...COLORS.bg)
    doc.roundedRect(cx, cy, colWidth - 2, 14, 2, 2, 'F')
    doc.setFont('courier', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.text)
    doc.text(formatNumber(item.value), cx + (colWidth - 2) / 2, cy + 7, {
      align: 'center',
      maxWidth: colWidth - 4,
    })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6)
    doc.setTextColor(...COLORS.textMuted)
    doc.text(String(item.label).toUpperCase(), cx + (colWidth - 2) / 2, cy + 12, {
      align: 'center',
      maxWidth: colWidth - 4,
    })
  })

  return y + height + 4
}

export function renderRegressionBlock(doc, block, x, y, width) {
  const { dependentVar, independentVars = [], results, title } = block.data ?? {}

  if (!results?.coefficients?.length) {
    return renderPlaceholderBlock(doc, block, x, y, width, 'No regression results available')
  }

  const height = Math.min(results.coefficients.length * 7 + 42, 120)
  const contentY = drawBlockContainer(
    doc,
    x,
    y,
    width,
    height,
    title || `Regression - ${dependentVar || 'y'} ~ ${independentVars.join(' + ')}`,
    COLORS.green,
  )
  const finalY = renderAutoTable(
    doc,
    x,
    contentY,
    width,
    [
      { header: 'VARIABLE', dataKey: 'variable' },
      { header: 'COEFFICIENT', dataKey: 'coefficient' },
      { header: 'STD ERROR', dataKey: 'stdError' },
      { header: 'T-STAT', dataKey: 'tStatistic' },
      { header: 'P-VALUE', dataKey: 'pValue' },
      { header: 'SIG', dataKey: 'significance' },
    ],
    results.coefficients.map((coefficient) => ({
      coefficient: formatNumber(coefficient.coefficient),
      pValue: formatNumber(coefficient.pValue),
      significance: coefficient.significance || '',
      stdError: formatNumber(coefficient.stdError),
      tStatistic: formatNumber(coefficient.tStatistic ?? coefficient.tStat),
      variable: coefficient.variable,
    })),
  )

  doc.setFontSize(7)
  doc.setTextColor(...COLORS.textMuted)
  doc.text(
    `R² = ${formatNumber(results.rSquared)}   Adj R² = ${formatNumber(
      results.adjustedRSquared ?? results.adjRSquared,
    )}   F = ${formatNumber(results.fStatistic ?? results.fStat)}   p = ${formatNumber(
      results.modelPValue ?? results.modelP,
    )}`,
    x + 4,
    finalY + 4,
  )

  return finalY + 10
}

export function renderProseBlock(doc, block, x, y, width) {
  const { content, title } = block.data ?? {}
  const cleanText = String(content || '')
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\$\$[^$]+\$\$/g, '[equation]')
    .replace(/\$[^$]+\$/g, '[eq]')
    .trim()

  if (!cleanText) {
    return renderPlaceholderBlock(doc, block, x, y, width, 'No prose content available')
  }

  const lines = doc.splitTextToSize(cleanText, width - 8)
  const height = Math.min(lines.length * 5 + 18, 90)
  const contentY = drawBlockContainer(
    doc,
    x,
    y,
    width,
    height,
    title || 'Prose / LaTeX',
    COLORS.textMuted,
  )

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...COLORS.text)
  doc.text(lines.slice(0, 14), x + 4, contentY + 4, {
    lineHeightFactor: 1.4,
    maxWidth: width - 8,
  })

  return y + height + 4
}

export function renderAssumptionBlock(doc, block, x, y, width) {
  const { assumptions = [], title } = block.data ?? {}

  if (!assumptions.length) {
    return renderPlaceholderBlock(doc, block, x, y, width, 'No assumptions available')
  }

  const height = Math.min(assumptions.length * 12 + 18, 110)
  const contentY = drawBlockContainer(
    doc,
    x,
    y,
    width,
    height,
    title || 'Assumption Flags',
    COLORS.orange,
  )

  assumptions.slice(0, 7).forEach((assumption, index) => {
    const ay = contentY + index * 12
    const statusColor =
      assumption.status === 'Approved'
        ? COLORS.green
        : assumption.status === 'Challenged'
          ? COLORS.orange
          : COLORS.textMuted

    doc.setFillColor(...statusColor)
    doc.circle(x + 5, ay + 4, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.text)
    doc.text(String(assumption.label ?? 'Assumption'), x + 10, ay + 5, {
      maxWidth: width - 44,
    })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.textMuted)
    doc.text(String(assumption.value ?? ''), x + 10, ay + 10, {
      maxWidth: width - 24,
    })
    doc.setFontSize(6)
    doc.setTextColor(...statusColor)
    doc.text(String(assumption.status || 'Pending').toUpperCase(), x + width - 4, ay + 5, {
      align: 'right',
    })
  })

  return y + height + 4
}

export function renderMonteCarloBlock(doc, block, x, y, width) {
  const { formula, results, simulations, title } = block.data ?? {}

  if (!results) {
    return renderPlaceholderBlock(doc, block, x, y, width, 'No simulation results available')
  }

  const height = 58
  const contentY = drawBlockContainer(
    doc,
    x,
    y,
    width,
    height,
    title || 'Monte Carlo Simulation',
    COLORS.green,
  )

  doc.setFont('courier', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...COLORS.textMuted)
  doc.text(`Formula: ${formula || 'simulation model'}`, x + 4, contentY + 4, {
    maxWidth: width - 8,
  })
  doc.text(`Simulations: ${valueOrDash(simulations)}`, x + 4, contentY + 9)

  const metrics = [
    { label: 'Mean', value: results.mean },
    { label: 'Std Dev', value: results.stdDev },
    { label: 'VaR 95', value: results.p5 ?? results.var95 },
    { label: '95th Pct', value: results.p95 },
    { label: 'Median', value: results.median },
  ]
  const cardWidth = (width - 8) / metrics.length

  metrics.forEach((metric, index) => {
    const cx = x + 4 + index * cardWidth
    const cy = contentY + 15

    doc.setFillColor(...COLORS.bg)
    doc.roundedRect(cx, cy, cardWidth - 2, 16, 2, 2, 'F')
    doc.setFont('courier', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.text)
    doc.text(formatNumber(metric.value, 2), cx + (cardWidth - 2) / 2, cy + 8, {
      align: 'center',
    })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6)
    doc.setTextColor(...COLORS.textMuted)
    doc.text(metric.label.toUpperCase(), cx + (cardWidth - 2) / 2, cy + 13, {
      align: 'center',
    })
  })

  if (results.probabilityStatement) {
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.green)
    doc.text(results.probabilityStatement, x + 4, contentY + 39)
  }

  return y + height + 4
}

export function renderTimeSeriesBlock(doc, block, x, y, width) {
  const {
    analysisTab,
    correlationData = [],
    datasetName,
    dateColumn,
    forecastData = [],
    stats,
    title,
    trendData = [],
    valueColumn,
  } = block.data ?? {}

  if (!valueColumn && !trendData.length && !forecastData.length) {
    return renderPlaceholderBlock(doc, block, x, y, width, 'No time series data available')
  }

  const height = 110
  const contentY = drawBlockContainer(
    doc,
    x,
    y,
    width,
    height,
    title || 'Time Series Analysis',
    COLORS.green,
  )

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.textMuted)
  doc.text(`Dataset: ${datasetName || 'workspace data'}`, x + 4, contentY + 3)
  doc.text(`Value: ${valueColumn || 'n/a'}   Time: ${dateColumn || 'row index'}   Tab: ${analysisTab || 'Trend'}`, x + 4, contentY + 8)

  if (stats) {
    const metrics = [
      { label: 'Mean', value: stats.mean },
      { label: 'Std Dev', value: stats.stdDev },
      { label: 'Min', value: stats.min },
      { label: 'Max', value: stats.max },
      { label: 'Trend', value: stats.trendDirection },
    ]
    const cardWidth = (width - 8) / metrics.length

    metrics.forEach((metric, index) => {
      const cx = x + 4 + index * cardWidth
      const cy = contentY + 13

      doc.setFillColor(...COLORS.bg)
      doc.roundedRect(cx, cy, cardWidth - 2, 15, 2, 2, 'F')
      doc.setFont('courier', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(...COLORS.text)
      doc.text(formatNumber(metric.value, 3), cx + (cardWidth - 2) / 2, cy + 8, {
        align: 'center',
        maxWidth: cardWidth - 4,
      })
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6)
      doc.setTextColor(...COLORS.textMuted)
      doc.text(metric.label.toUpperCase(), cx + (cardWidth - 2) / 2, cy + 13, {
        align: 'center',
        maxWidth: cardWidth - 4,
      })
    })
  }

  const rows = trendData.length ? trendData : forecastData
  const columns = ['label', 'value', 'trend', 'movingAverage', 'forecast']
    .filter((column) => rows.some((row) => row?.[column] !== undefined))

  if (rows.length && columns.length) {
    renderAutoTable(
      doc,
      x,
      contentY + 34,
      width,
      columns.map((column) => ({
        dataKey: column,
        header: String(column).toUpperCase(),
      })),
      rows.slice(0, 8).map((row) =>
        Object.fromEntries(columns.map((column) => [column, valueOrDash(row?.[column])])),
      ),
    )
  }

  if (correlationData.length) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.textMuted)
    const significant = correlationData
      .filter((row) => Math.abs(Number(row.acf)) > 0.1)
      .slice(0, 6)
      .map((row) => row.lag)
    doc.text(`ACF lags sampled: ${significant.join(', ') || 'none'}`, x + 4, y + height - 5)
  }

  return y + height + 4
}

export function renderProgressBlock(doc, block, x, y, width) {
  const { steps = [], title } = block.data ?? {}

  if (!steps.length) {
    return renderPlaceholderBlock(doc, block, x, y, width, 'No progress steps available')
  }

  const height = Math.min(steps.length * 10 + 18, 100)
  const contentY = drawBlockContainer(
    doc,
    x,
    y,
    width,
    height,
    title || 'Progress',
    COLORS.orange,
  )

  steps.slice(0, 8).forEach((step, index) => {
    const sy = contentY + index * 10
    const statusColor =
      step.status === 'Complete'
        ? COLORS.green
        : step.status === 'Active'
          ? COLORS.orange
          : COLORS.textMuted

    doc.setFillColor(...statusColor)
    doc.circle(x + 6, sy + 4, 2.5, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6)
    doc.setTextColor(255, 255, 255)
    doc.text(String(index + 1), x + 6, sy + 5.5, { align: 'center' })
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.text)
    doc.text(String(step.title ?? 'Step'), x + 12, sy + 4, {
      maxWidth: width - 16,
    })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6)
    doc.setTextColor(...COLORS.textMuted)
    doc.text(String(step.description || ''), x + 12, sy + 8, {
      maxWidth: width - 16,
    })
  })

  return y + height + 4
}

export function renderPlaceholderBlock(doc, block, x, y, width, message) {
  const height = 18
  const contentY = drawBlockContainer(
    doc,
    x,
    y,
    width,
    height,
    block.data?.title || block.type,
    COLORS.textMuted,
  )

  doc.setFontSize(8)
  doc.setTextColor(...COLORS.textMuted)
  doc.text(message || `${block.type} visual export not yet supported`, x + 4, contentY + 3)

  return y + height + 4
}
