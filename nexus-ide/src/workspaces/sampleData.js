export const mortalityTableData = [
  { age: 30, lx: 100000, dx: 156, qx: 0.00156 },
  { age: 35, lx: 99844, dx: 211, qx: 0.00211 },
  { age: 40, lx: 99633, dx: 302, qx: 0.00303 },
  { age: 45, lx: 99331, dx: 452, qx: 0.00455 },
  { age: 50, lx: 98879, dx: 680, qx: 0.00688 },
]

export const mortalityColumns = [
  {
    accessorKey: 'age',
    header: 'Age',
  },
  {
    accessorKey: 'lx',
    header: 'lx',
  },
  {
    accessorKey: 'dx',
    header: 'dx',
  },
  {
    accessorKey: 'qx',
    header: 'qx',
  },
]

export const forceOverTimeData = [
  { time: 0, force: 0 },
  { time: 1, force: 30 },
  { time: 2, force: 60 },
  { time: 3, force: 90 },
  { time: 4, force: 120 },
]

export const physicsAnnotations = [
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

export const actuarialAssumptions = [
  {
    id: 1,
    label: 'Mortality Base Table',
    value: 'AM92 Ultimate',
    status: 'Pending',
  },
  {
    id: 2,
    label: 'Discount Rate',
    value: '3.5% per annum',
    status: 'Pending',
  },
  {
    id: 3,
    label: 'Valuation Date',
    value: '31 December 2025',
    status: 'Pending',
  },
]

export const actuarialProgressSteps = [
  {
    id: 1,
    title: 'Load Mortality Data',
    description: 'AM92 Ultimate table loaded successfully',
    status: 'Complete',
  },
  {
    id: 2,
    title: 'Apply Discount Rate',
    description: 'Applying 3.5% per annum discount rate',
    status: 'Active',
  },
  {
    id: 3,
    title: 'Calculate Reserve',
    description: 'Net premium reserve calculation pending',
    status: 'Pending',
  },
  {
    id: 4,
    title: 'Generate Report',
    description: 'Audit trail and output pending',
    status: 'Pending',
  },
]
