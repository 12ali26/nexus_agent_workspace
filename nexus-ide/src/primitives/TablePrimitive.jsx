import { useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { createTableColumns } from '../context/workspaceDataUtils'
import { useWorkspaceData } from '../context/useWorkspaceData'

const pageSize = 20

function TablePrimitive({ columns, data }) {
  const { activeDataset, datasets, setActiveDataset } = useWorkspaceData()
  const [selectedDatasetId, setSelectedDatasetId] = useState('')
  const [columnSizing, setColumnSizing] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize,
  })
  const [sorting, setSorting] = useState([])
  const selectedDataset =
    datasets.find((dataset) => dataset.id === selectedDatasetId) ??
    activeDataset
  const tableData = useMemo(
    () => selectedDataset?.rows ?? data ?? [],
    [data, selectedDataset],
  )
  const tableColumns = useMemo(
    () =>
      selectedDataset
        ? createTableColumns(selectedDataset.columns)
        : (columns ?? createTableColumns(Object.keys(tableData[0] ?? {}))),
    [columns, selectedDataset, tableData],
  )

  // TanStack Table intentionally returns table helpers that React Compiler flags.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    columnResizeMode: 'onChange',
    columns: tableColumns,
    data: tableData,
    enableColumnResizing: true,
    enableSortingRemoval: true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: 'includesString',
    onColumnSizingChange: setColumnSizing,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    state: {
      columnSizing,
      globalFilter,
      pagination,
      sorting,
    },
  })

  const filteredRowCount = table.getFilteredRowModel().rows.length
  const showPagination = filteredRowCount > pageSize

  if (!tableData.length || !tableColumns.length) {
    return (
      <div className="stats-empty-state">
        Load a data file first to render a table
      </div>
    )
  }

  return (
    <div className="table-primitive">
      <div className="table-primitive-toolbar">
        {datasets.length > 0 && (
          <select
            className="dataset-select"
            value={selectedDataset?.id ?? ''}
            aria-label="Table dataset"
            onChange={(event) => {
              setSelectedDatasetId(event.target.value)
              setActiveDataset(event.target.value)
              setGlobalFilter('')
              table.setPageIndex(0)
            }}
          >
            {datasets.map((dataset) => (
              <option key={dataset.id} value={dataset.id}>
                {dataset.name}
              </option>
            ))}
          </select>
        )}
        <input
          className="table-search-input"
          type="search"
          value={globalFilter ?? ''}
          placeholder="Search table..."
          aria-label="Search table"
          onChange={(event) => {
            setGlobalFilter(event.target.value)
            table.setPageIndex(0)
          }}
        />
      </div>

      <div className="table-scroll-area">
        <table style={{ width: table.getCenterTotalSize() }}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sortDirection = header.column.getIsSorted()

                  return (
                    <th
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className={
                        header.column.getCanSort() ? 'is-sortable' : undefined
                      }
                    >
                      <button
                        className="table-header-button"
                        type="button"
                        disabled={!header.column.getCanSort()}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <span>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </span>
                        {sortDirection && (
                          <span className="sort-indicator">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                      <button
                        className={`column-resizer${
                          header.column.getIsResizing() ? ' is-resizing' : ''
                        }`}
                        type="button"
                        aria-label={`Resize ${header.column.id} column`}
                        onDoubleClick={() => header.column.resetSize()}
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                      />
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} style={{ width: cell.column.getSize() }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPagination && (
        <div className="table-pagination">
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </button>
          <span>
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </span>
          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default TablePrimitive
