export function sanitizeDataName(name) {
  const sanitized = String(name ?? '')
    .replace(/\.[^.]+$/, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

  if (!sanitized) {
    return 'dataset'
  }

  return /^[0-9]/.test(sanitized) ? `_${sanitized}` : sanitized
}

export function createColumnsFromRows(rows) {
  const columnSet = new Set()

  rows.forEach((row) => {
    if (row && typeof row === 'object' && !Array.isArray(row)) {
      Object.keys(row).forEach((key) => columnSet.add(key))
    }
  })

  return Array.from(columnSet)
}

export function createTableColumns(columns) {
  return columns.map((column) => ({
    accessorKey: column,
    header: column,
  }))
}

export function getDatasetVariableName(dataset, existingNames = new Set()) {
  const baseName = sanitizeDataName(dataset?.name)
  let variableName = baseName
  let suffix = 2

  while (existingNames.has(variableName)) {
    variableName = `${baseName}_${suffix}`
    suffix += 1
  }

  existingNames.add(variableName)
  return variableName
}

export function createDatasetScope(datasets, activeDatasetId) {
  const usedDatasetNames = new Set(['datasets'])
  const scope = {}
  const datasetAliases = []
  const activeDataset =
    datasets.find((dataset) => dataset.id === activeDatasetId) ?? datasets[0]

  datasets.forEach((dataset) => {
    const datasetName = getDatasetVariableName(dataset, usedDatasetNames)
    scope[datasetName] = dataset.rows
    datasetAliases.push({
      dataset,
      variableName: datasetName,
    })

    dataset.columns.forEach((column) => {
      const columnName = sanitizeDataName(column)
      const scopedName = `${datasetName}_${columnName}`
      scope[scopedName] = dataset.rows.map((row) => row?.[column])
    })
  })

  if (activeDataset) {
    activeDataset.columns.forEach((column) => {
      const columnName = sanitizeDataName(column)

      if (!(columnName in scope)) {
        scope[columnName] = activeDataset.rows.map((row) => row?.[column])
      }
    })
  }

  return {
    datasetAliases,
    scope,
  }
}
