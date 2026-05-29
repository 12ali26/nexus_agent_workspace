import { useCallback, useEffect, useMemo, useState } from 'react'
import { useActivity } from '../activity/useActivity'
import { usePackRegistry } from '../registry/usePackRegistry'
import { api } from '../utils/api'
import {
  createColumnsFromRows,
  createDatasetScope,
} from './workspaceDataUtils'
import { WorkspaceDataContext } from './workspaceDataContext'

function getProjectDatasetStorageKey(projectId) {
  return `nexus_datasets_${projectId}`
}

function normalizeRows(rows) {
  return Array.isArray(rows)
    ? rows.filter(
        (row) => row && typeof row === 'object' && !Array.isArray(row),
      )
    : []
}

function readLocalDatasets(projectId) {
  try {
    const storedValue = localStorage.getItem(getProjectDatasetStorageKey(projectId))

    if (!storedValue) {
      return []
    }

    const parsedValue = JSON.parse(storedValue)

    return Array.isArray(parsedValue) ? parsedValue : []
  } catch {
    return []
  }
}

function writeLocalDatasets(projectId, datasets) {
  try {
    localStorage.setItem(
      getProjectDatasetStorageKey(projectId),
      JSON.stringify(datasets),
    )
  } catch {
    // Local fallback persistence should never block the workspace.
  }
}

export function WorkspaceDataProvider({ children }) {
  const { activeProject } = usePackRegistry()
  const { logActivity } = useActivity()
  const projectId = activeProject?.projectId ?? 'project_default'
  const [datasets, setDatasets] = useState([])
  const [activeDatasetId, setActiveDatasetId] = useState('')

  useEffect(() => {
    let isCancelled = false

    async function restoreDatasets() {
      try {
        const restoredDatasets = await api.get(`/api/datasets/${projectId}`)

        if (!isCancelled) {
          setDatasets(restoredDatasets)
          setActiveDatasetId(restoredDatasets[0]?.id ?? '')
        }
      } catch {
        const restoredDatasets = readLocalDatasets(projectId)

        if (!isCancelled) {
          setDatasets(restoredDatasets)
          setActiveDatasetId(restoredDatasets[0]?.id ?? '')
        }
      }
    }

    restoreDatasets()

    return () => {
      isCancelled = true
    }
  }, [projectId])

  useEffect(() => {
    writeLocalDatasets(projectId, datasets)
  }, [datasets, projectId])

  const addDataset = useCallback((datasetInput) => {
    const rows = normalizeRows(datasetInput?.rows)

    if (!rows.length) {
      return null
    }

    const dataset = {
      id: datasetInput?.id || crypto.randomUUID(),
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
    api
      .post('/api/datasets', {
        columns: dataset.columns,
        id: dataset.id,
        name: dataset.name,
        projectId,
        rows: dataset.rows,
        source: dataset.source,
      })
      .catch(() => {
        // Plain Vite dev uses local fallback storage.
      })
    logActivity({
      metadata: {
        columns: dataset.columns.length,
        datasetId: dataset.id,
        rows: dataset.rows.length,
        source: dataset.source,
      },
      summary: `Added dataset ${dataset.name}`,
      type: 'dataset',
    })

    return dataset
  }, [logActivity, projectId])

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
    api.delete(`/api/datasets/${datasetId}`).catch(() => {
      // Plain Vite dev uses local fallback storage.
    })
    logActivity({
      metadata: { datasetId },
      summary: 'Removed dataset',
      type: 'dataset',
    })
  }, [logActivity])

  const clearDatasets = useCallback((options = {}) => {
    setDatasets([])
    setActiveDatasetId('')
    writeLocalDatasets(projectId, [])
    api.delete(`/api/datasets/project/${projectId}`).catch(() => {
      // Plain Vite dev uses local fallback storage.
    })
    if (options.silent) {
      return
    }

    logActivity({
      summary: 'Cleared datasets',
      type: 'dataset',
    })
  }, [logActivity, projectId])

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
      clearDatasets,
      datasetAliases: datasetScope.datasetAliases,
      datasetScope: datasetScope.scope,
      datasets,
      removeDataset,
      setActiveDataset: setActiveDatasetId,
    }),
    [
      activeDataset,
      addDataset,
      clearDatasets,
      datasetScope,
      datasets,
      removeDataset,
    ],
  )

  return (
    <WorkspaceDataContext.Provider value={value}>
      {children}
    </WorkspaceDataContext.Provider>
  )
}
