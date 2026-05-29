import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useActivity } from './activity/useActivity'
import { useWorkspaceData } from './context/useWorkspaceData'
import { createProjectManifest } from './project/ProjectManifest'
import { usePackRegistry } from './registry/usePackRegistry'
import { useRenderBlocks } from './renderBlocks/useRenderBlocks'
import { useToast } from './toast/useToast'

function downloadManifest(manifest) {
  const blob = new Blob([JSON.stringify(manifest, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'nexus.project.json'
  link.click()
  URL.revokeObjectURL(url)
}

function NewProjectButton({
  buttonClassName = 'top-bar-action',
  buttonLabel = 'New Project',
  buttonRef,
}) {
  const {
    allCapabilities,
    installExtensionsForCapabilities,
    setActiveProject,
  } = usePackRegistry()
  const { clearDatasets } = useWorkspaceData()
  const { clearCanvas } = useRenderBlocks()
  const { logActivity } = useActivity()
  const showToast = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [selectedCapabilities, setSelectedCapabilities] = useState([])
  const portalTarget = document.querySelector('.nexus-shell') ?? document.body

  const toggleCapability = (capability) => {
    setSelectedCapabilities((currentCapabilities) =>
      currentCapabilities.includes(capability)
        ? currentCapabilities.filter((candidate) => candidate !== capability)
        : [...currentCapabilities, capability],
    )
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setProjectName('')
    setSelectedCapabilities([])
  }

  const createProject = (event) => {
    event.preventDefault()

    const trimmedProjectName = projectName.trim() || 'Untitled Project'
    const projectId = `project_${Date.now()}`
    const manifest = createProjectManifest({
      canvasState: [],
      capabilities: selectedCapabilities,
      projectId,
      projectName: trimmedProjectName,
    })

    const activatedCount =
      installExtensionsForCapabilities(selectedCapabilities)
    setActiveProject(manifest)
    clearCanvas()
    clearDatasets()
    downloadManifest(manifest)
    logActivity({
      metadata: {
        activatedExtensions: activatedCount,
        capabilities: selectedCapabilities,
      },
      projectId,
      summary: `Created project ${trimmedProjectName}`,
      type: 'project',
    })
    showToast(`Project created — activated ${activatedCount} extensions`)
    closeModal()
  }

  return (
    <>
      <button
        ref={buttonRef}
        className={buttonClassName}
        type="button"
        onClick={() => setIsModalOpen(true)}
      >
        {buttonLabel}
      </button>

      {isModalOpen &&
        createPortal(
          <div className="project-dialog-backdrop" role="presentation">
            <form
              className="project-dialog"
              aria-label="Create new project"
              onSubmit={createProject}
            >
              <header className="project-dialog-header">
                <h2>New Project</h2>
                <button
                  className="primitive-close"
                  type="button"
                  aria-label="Close new project dialog"
                  onClick={closeModal}
                >
                  x
                </button>
              </header>

            <label className="project-field">
              <span>Project Name</span>
              <input
                type="text"
                value={projectName}
                placeholder="Untitled Project"
                onChange={(event) => setProjectName(event.target.value)}
              />
            </label>

            <fieldset className="capability-fieldset">
              <legend>Capabilities</legend>
              <div className="capability-list">
                {allCapabilities.map((capability) => (
                  <label className="capability-option" key={capability}>
                    <input
                      type="checkbox"
                      checked={selectedCapabilities.includes(capability)}
                      onChange={() => toggleCapability(capability)}
                    />
                    <span>{capability}</span>
                  </label>
                ))}
              </div>
            </fieldset>

              <footer className="project-dialog-actions">
                <button
                  className="workspace-action"
                  type="button"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button className="workspace-action" type="submit">
                  Create
                </button>
              </footer>
            </form>
          </div>,
          portalTarget,
        )}
    </>
  )
}

export default NewProjectButton
