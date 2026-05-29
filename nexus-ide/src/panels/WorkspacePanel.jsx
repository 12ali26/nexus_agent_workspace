import { useEffect, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useWorkspaceData } from '../context/useWorkspaceData'
import { usePackRegistry } from '../registry/usePackRegistry'
import { api } from '../utils/api'

function formatCount(value, label) {
  return `${Number(value).toLocaleString()} ${label}${value === 1 ? '' : 's'}`
}

function WorkspacePanel() {
  const { activeProject, setActiveProject } = usePackRegistry()
  const {
    activeDatasetId,
    datasets,
    removeDataset,
    setActiveDataset,
  } = useWorkspaceData()
  const [isProjectsOpen, setIsProjectsOpen] = useState(true)
  const [projects, setProjects] = useState([])

  useEffect(() => {
    let isCancelled = false

    async function loadProjects() {
      try {
        const restoredProjects = await api.get('/api/projects')

        if (!isCancelled) {
          setProjects(Array.isArray(restoredProjects) ? restoredProjects : [])
        }
      } catch {
        if (!isCancelled) {
          setProjects([])
        }
      }
    }

    loadProjects()

    return () => {
      isCancelled = true
    }
  }, [activeProject?.projectId])

  const openProject = (project) => {
    setActiveProject({
      capabilities: activeProject?.capabilities ?? [],
      projectId: project.id,
      projectName: project.name,
      version: '1.0.0',
    })
  }

  return (
    <section className="workspace-panel" aria-label="Workspace data">
      <header className="panel-header">DATA</header>

      <div className="workspace-section">
        <button
          className="workspace-section-toggle"
          type="button"
          aria-expanded={isProjectsOpen}
          onClick={() => setIsProjectsOpen((currentValue) => !currentValue)}
        >
          <span>Projects</span>
          <span className="workspace-section-count">{projects.length}</span>
          {isProjectsOpen ? (
            <ChevronDown size={14} strokeWidth={1.9} />
          ) : (
            <ChevronRight size={14} strokeWidth={1.9} />
          )}
        </button>

        {isProjectsOpen && (
          projects.length ? (
            <div className="project-list">
              {projects.map((project) => {
                const isActive = project.id === activeProject?.projectId

                return (
                  <button
                    className={`project-list-item${isActive ? ' is-active' : ''}`}
                    key={project.id}
                    type="button"
                    onClick={() => openProject(project)}
                  >
                    <span>{project.name}</span>
                    <small>{isActive ? 'Current' : project.id}</small>
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="panel-empty compact">
              Saved projects appear here when the NEXUS server is running.
            </p>
          )
        )}
      </div>

      <div className="workspace-section-header">Datasets</div>

      {datasets.length ? (
        <div className="workspace-list dataset-list">
          {datasets.map((dataset) => {
            const isActive = dataset.id === activeDatasetId

            return (
              <article
                className={`workspace-card dataset-card${
                  isActive ? ' is-active' : ''
                }`}
                key={dataset.id}
              >
                <button
                  className="dataset-card-main"
                  type="button"
                  onClick={() => setActiveDataset(dataset.id)}
                >
                  <div className="workspace-card-copy">
                    <h2>{dataset.name}</h2>
                    <p title={dataset.columns.join(', ')}>
                      {formatCount(dataset.rows.length, 'row')} ·{' '}
                      {formatCount(dataset.columns.length, 'column')}
                    </p>
                  </div>
                  <span className="dataset-source">{dataset.source}</span>
                </button>

                <div className="dataset-column-preview">
                  {dataset.columns.slice(0, 4).map((column) => (
                    <span key={column}>{column}</span>
                  ))}
                  {dataset.columns.length > 4 && (
                    <span>+{dataset.columns.length - 4}</span>
                  )}
                </div>

                <div className="dataset-card-actions">
                  {isActive && <span className="dataset-active-badge">Active</span>}
                  <button
                    className="workspace-action dataset-remove"
                    type="button"
                    onClick={() => removeDataset(dataset.id)}
                  >
                    Remove
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <p className="panel-empty">
          No data loaded yet. Use Open File to add CSV or JSON datasets.
        </p>
      )}
    </section>
  )
}

export default WorkspacePanel
