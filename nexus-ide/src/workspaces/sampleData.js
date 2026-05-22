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
