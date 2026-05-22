export const sampleTableData = [
  { metric: 'Rows Loaded', value: 128, status: 'Ready' },
  { metric: 'Columns Detected', value: 6, status: 'Ready' },
  { metric: 'Missing Values', value: 3, status: 'Review' },
  { metric: 'Derived Fields', value: 2, status: 'Ready' },
]

export const sampleTableColumns = [
  {
    accessorKey: 'metric',
    header: 'Metric',
  },
  {
    accessorKey: 'value',
    header: 'Value',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
]

export const sampleChartData = [
  { step: 'Load', value: 12 },
  { step: 'Parse', value: 24 },
  { step: 'Analyze', value: 42 },
  { step: 'Render', value: 30 },
]

export const sampleAnnotations = [
  {
    id: 1,
    label: 'Applied Force',
    value: '120 N downward at midspan',
    type: 'force',
  },
  {
    id: 2,
    label: 'Support Constraint',
    value: 'Pin support at both ends',
    type: 'constraint',
  },
  {
    id: 3,
    label: 'Max Deflection',
    value: '2.4 mm at midspan',
    type: 'result',
  },
]

export const sampleAssumptions = [
  {
    id: 1,
    label: 'Input Source',
    value: 'User-provided dataset',
    status: 'Pending',
  },
  {
    id: 2,
    label: 'Calculation Basis',
    value: 'Current workspace state',
    status: 'Pending',
  },
  {
    id: 3,
    label: 'Review Date',
    value: 'Session timestamp',
    status: 'Pending',
  },
]

export const sampleProgressSteps = [
  {
    id: 1,
    title: 'Load Inputs',
    description: 'Workspace inputs loaded successfully',
    status: 'Complete',
  },
  {
    id: 2,
    title: 'Evaluate Context',
    description: 'Reviewing canvas data and installed packs',
    status: 'Active',
  },
  {
    id: 3,
    title: 'Generate Output',
    description: 'Primitive output pending',
    status: 'Pending',
  },
]
