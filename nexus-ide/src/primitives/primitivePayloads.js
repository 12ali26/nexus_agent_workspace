import {
  sampleAnnotations,
  sampleAssumptions,
  sampleChartData,
  sampleProgressSteps,
  sampleTableColumns,
  sampleTableData,
} from './sampleData'

const primitiveLabels = {
  '3d-object': '3D Object',
  annotation: 'Annotation',
  'assumption-flag': 'Assumption Flag',
  chart: 'Chart',
  'code-editor': 'Code Editor',
  equation: 'Equation',
  'progress-step': 'Progress Step',
  table: 'Table',
  'terminal-output': 'Terminal',
}

export function getPrimitiveLabel(primitiveType) {
  return primitiveLabels[primitiveType] ?? primitiveType
}

export function createPrimitivePayload(primitiveType) {
  if (primitiveType === 'table') {
    return {
      type: 'table',
      data: {
        title: 'Data Table',
        props: {
          columns: sampleTableColumns,
          data: sampleTableData,
        },
      },
    }
  }

  if (primitiveType === 'chart') {
    return {
      type: 'chart',
      data: {
        title: 'Trend Chart',
        props: {
          data: sampleChartData,
          lineKey: 'value',
          title: 'Trend Chart',
          xKey: 'step',
          yLabel: 'Value',
        },
      },
    }
  }

  if (primitiveType === 'equation') {
    return {
      type: 'equation',
      data: {
        title: 'Equation',
        props: {
          formula: String.raw`y = mx + b`,
          resolvedValue: 'Ready for formula evaluation',
        },
      },
    }
  }

  if (primitiveType === 'code-editor') {
    return {
      type: 'code-editor',
      data: {
        title: 'Code Editor',
        props: {},
      },
    }
  }

  if (primitiveType === 'terminal-output') {
    return {
      type: 'terminal-output',
      data: {
        title: 'Terminal Output',
        props: {},
      },
    }
  }

  if (primitiveType === '3d-object') {
    return {
      type: '3d-object',
      data: {
        title: '3D Object',
        props: {},
      },
    }
  }

  if (primitiveType === 'annotation') {
    return {
      type: 'annotation',
      data: {
        title: 'Annotations',
        props: {
          annotations: sampleAnnotations,
        },
      },
    }
  }

  if (primitiveType === 'assumption-flag') {
    return {
      type: 'assumption-flag',
      data: {
        title: 'Assumption Flags',
        props: {
          assumptions: sampleAssumptions,
        },
      },
    }
  }

  if (primitiveType === 'progress-step') {
    return {
      type: 'progress-step',
      data: {
        title: 'Progress Steps',
        props: {
          steps: sampleProgressSteps,
        },
      },
    }
  }

  return null
}
