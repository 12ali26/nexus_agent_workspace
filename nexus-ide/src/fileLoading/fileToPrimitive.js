import Papa from 'papaparse'
import {
  createColumnsFromRows,
  createTableColumns,
} from '../context/workspaceDataUtils'

function isObjectRow(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
}

function createTablePrimitive(title, rows, datasetId = '') {
  const columns = createColumnsFromRows(rows)

  return {
    type: 'table',
    data: {
      title,
      props: {
        columns: createTableColumns(columns),
        data: rows,
        datasetId,
      },
    },
  }
}

function parseCsvToPrimitive(filename, fileText) {
  const result = Papa.parse(fileText, {
    dynamicTyping: true,
    header: true,
    skipEmptyLines: true,
  })

  if (result.errors.length) {
    throw new Error('CSV parse failed')
  }

  const rows = result.data.filter((row) =>
    Object.values(row).some((value) => value !== null && value !== ''),
  )

  if (!rows.length || !Object.keys(rows[0]).length) {
    throw new Error('Empty CSV')
  }

  return {
    dataset: {
      columns: createColumnsFromRows(rows),
      name: filename,
      rows,
      source: 'file',
    },
    primitive: createTablePrimitive(filename, rows),
  }
}

function parseJsonToPrimitive(filename, fileText) {
  const parsedJson = JSON.parse(fileText)

  if (Array.isArray(parsedJson) && parsedJson.every(isObjectRow)) {
    if (!parsedJson.length) {
      throw new Error('Empty JSON array')
    }

    return {
      dataset: {
        columns: createColumnsFromRows(parsedJson),
        name: filename,
        rows: parsedJson,
        source: 'file',
      },
      primitive: createTablePrimitive(filename, parsedJson),
    }
  }

  if (!isObjectRow(parsedJson)) {
    throw new Error('Unsupported JSON')
  }

  if ('formula' in parsedJson) {
    return {
      dataset: null,
      primitive: {
        type: 'equation',
        data: {
          title: filename,
          props: {
            formula: parsedJson.formula,
            resolvedValue:
              parsedJson.resolvedValue ?? parsedJson.resolved ?? '',
          },
        },
      },
    }
  }

  if (Array.isArray(parsedJson.steps)) {
    return {
      dataset: null,
      primitive: {
        type: 'progress-step',
        data: {
          title: filename,
          props: {
            steps: parsedJson.steps,
          },
        },
      },
    }
  }

  if (Array.isArray(parsedJson.assumptions)) {
    return {
      dataset: null,
      primitive: {
        type: 'assumption-flag',
        data: {
          title: filename,
          props: {
            assumptions: parsedJson.assumptions,
          },
        },
      },
    }
  }

  throw new Error('Unsupported JSON')
}

export function parseFileToPrimitive(file, fileText) {
  if (!fileText.trim()) {
    return {
      error: 'empty',
    }
  }

  const filename = file.name
  const lowerFilename = filename.toLowerCase()

  try {
    if (lowerFilename.endsWith('.csv')) {
      return {
        ...parseCsvToPrimitive(filename, fileText),
      }
    }

    if (lowerFilename.endsWith('.json')) {
      return {
        ...parseJsonToPrimitive(filename, fileText),
      }
    }
  } catch {
    return {
      error: 'parse',
    }
  }

  return {
    error: 'parse',
  }
}
