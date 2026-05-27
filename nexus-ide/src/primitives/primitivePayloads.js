import {
  sampleAnnotations,
  sampleAssumptions,
  sampleProgressSteps,
} from './sampleData'

const primitiveLabels = {
  '3d-object': '3D Object',
  annotation: 'Annotation',
  'assumption-flag': 'Assumption Flag',
  chart: 'Chart',
  'code-editor': 'Code Editor',
  equation: 'Equation',
  'formula-block': 'Formula',
  notebook: 'Notebook',
  'parameter-node': 'Parameters',
  'progress-step': 'Progress Step',
  'prose-block': 'Prose Block',
  regression: 'Regression',
  'stats-block': 'Stats',
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
        props: {},
      },
    }
  }

  if (primitiveType === 'chart') {
    return {
      type: 'chart',
      data: {
        title: 'Trend Chart',
        props: {},
      },
    }
  }

  if (primitiveType === 'equation') {
    return {
      type: 'equation',
      data: {
        title: 'Equation',
        props: {
          formula: String.raw`q_x = \frac{d_x}{l_x}`,
          resolvedValue: 'Ready for formula evaluation',
        },
      },
    }
  }

  if (primitiveType === 'parameter-node') {
    return {
      type: 'parameter-node',
      data: {
        title: 'Parameters',
        props: {},
      },
    }
  }

  if (primitiveType === 'formula-block') {
    return {
      type: 'formula-block',
      data: {
        title: 'Formula',
        props: {},
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

  if (primitiveType === 'prose-block') {
    return {
      type: 'prose-block',
      data: {
        title: 'Prose / LaTeX',
        props: {},
      },
    }
  }

  if (primitiveType === 'notebook') {
    return {
      type: 'notebook',
      data: {
        title: 'Analysis Notebook',
        props: {},
      },
      size: {
        width: 800,
        height: 600,
      },
    }
  }

  if (primitiveType === 'stats-block') {
    return {
      type: 'stats-block',
      data: {
        title: 'Descriptive Statistics',
        props: {},
      },
    }
  }

  if (primitiveType === 'regression') {
    return {
      type: 'regression',
      data: {
        title: 'Regression Analysis',
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
