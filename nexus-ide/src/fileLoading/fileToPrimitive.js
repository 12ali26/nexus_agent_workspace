import Papa from 'papaparse'

function createColumnsFromRows(rows) {
  const firstRow = rows[0] ?? {}

  return Object.keys(firstRow).map((key) => ({
    accessorKey: key,
    header: key,
  }))
}

function isObjectRow(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
}

function createTablePrimitive(title, rows) {
  return {
    type: 'table',
    data: {
      title,
      props: {
        columns: createColumnsFromRows(rows),
        data: rows,
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

  return createTablePrimitive(filename, rows)
}

function parseJsonToPrimitive(filename, fileText) {
  const parsedJson = JSON.parse(fileText)

  if (Array.isArray(parsedJson) && parsedJson.every(isObjectRow)) {
    if (!parsedJson.length) {
      throw new Error('Empty JSON array')
    }

    return createTablePrimitive(filename, parsedJson)
  }

  if (!isObjectRow(parsedJson)) {
    throw new Error('Unsupported JSON')
  }

  if ('formula' in parsedJson) {
    return {
      type: 'equation',
      data: {
        title: filename,
        props: {
          formula: parsedJson.formula,
          resolvedValue: parsedJson.resolvedValue ?? parsedJson.resolved ?? '',
        },
      },
    }
  }

  if (Array.isArray(parsedJson.steps)) {
    return {
      type: 'progress-step',
      data: {
        title: filename,
        props: {
          steps: parsedJson.steps,
        },
      },
    }
  }

  if (Array.isArray(parsedJson.assumptions)) {
    return {
      type: 'assumption-flag',
      data: {
        title: filename,
        props: {
          assumptions: parsedJson.assumptions,
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
        primitive: parseCsvToPrimitive(filename, fileText),
      }
    }

    if (lowerFilename.endsWith('.json')) {
      return {
        primitive: parseJsonToPrimitive(filename, fileText),
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
