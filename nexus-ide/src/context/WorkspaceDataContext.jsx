import { useCallback, useMemo, useState } from 'react'
import {
  createColumnsFromRows,
  createDatasetScope,
} from './workspaceDataUtils'
import { WorkspaceDataContext } from './workspaceDataContext'

function normalizeRows(rows) {
  return Array.isArray(rows)
    ? rows.filter(
        (row) => row && typeof row === 'object' && !Array.isArray(row),
      )
    : []
}

export function WorkspaceDataProvider({ children }) {
  const [datasets, setDatasets] = useState([])
  const [activeDatasetId, setActiveDatasetId] = useState('')

  const addDataset = useCallback((datasetInput) => {
    const rows = normalizeRows(datasetInput?.rows)

    if (!rows.length) {
      return null
    }

    const dataset = {
      id: crypto.randomUUID(),
      name: datasetInput?.name || 'Untitled Dataset',
      columns:
        Array.isArray(datasetInput?.columns) && datasetInput.columns.length
          ? datasetInput.columns
          : createColumnsFromRows(rows),
      rows,
      source: datasetInput?.source || 'file',
    }

    // AGENT: pushes datasets here the same way file loading does.
    setDatasets((currentDatasets) => [...currentDatasets, dataset])
    setActiveDatasetId(dataset.id)

    return dataset
  }, [])

  const removeDataset = useCallback((datasetId) => {
    setDatasets((currentDatasets) => {
      const nextDatasets = currentDatasets.filter(
        (dataset) => dataset.id !== datasetId,
      )

      setActiveDatasetId((currentActiveDatasetId) => {
        if (currentActiveDatasetId !== datasetId) {
          return currentActiveDatasetId
        }

        return nextDatasets[0]?.id ?? ''
      })

      return nextDatasets
    })
  }, [])

  const activeDataset = useMemo(
    () =>
      datasets.find((dataset) => dataset.id === activeDatasetId) ??
      datasets[0] ??
      null,
    [activeDatasetId, datasets],
  )

  const datasetScope = useMemo(
    () => createDatasetScope(datasets, activeDataset?.id),
    [activeDataset?.id, datasets],
  )

  const value = useMemo(
    () => ({
      activeDataset,
      activeDatasetId: activeDataset?.id ?? '',
      addDataset,
      datasetAliases: datasetScope.datasetAliases,
      datasetScope: datasetScope.scope,
      datasets,
      removeDataset,
      setActiveDataset: setActiveDatasetId,
    }),
    [activeDataset, addDataset, datasetScope, datasets, removeDataset],
  )

  return (
    <WorkspaceDataContext.Provider value={value}>
      {children}
    </WorkspaceDataContext.Provider>
  )
}
