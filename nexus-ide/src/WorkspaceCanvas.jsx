import { useWorkspaceRegistry } from './registry/useWorkspaceRegistry'
import { workspaceCanvases } from './workspaces'

function EmptyCanvasState({
  message = 'Install and activate a workspace to begin',
}) {
  return (
    <div className="canvas-empty-state">
      <div className="canvas-empty-brand">NEXUS IDE</div>
      <p>{message}</p>
    </div>
  )
}

function WorkspaceCanvas() {
  const { activeWorkspace } = useWorkspaceRegistry()

  if (!activeWorkspace) {
    return (
      <main className="workspace-canvas" aria-label="Workspace canvas">
        <EmptyCanvasState />
      </main>
    )
  }

  const ActiveWorkspaceCanvas = workspaceCanvases[activeWorkspace.id]

  if (!ActiveWorkspaceCanvas) {
    return (
      <main className="workspace-canvas" aria-label="Workspace canvas">
        <EmptyCanvasState message="This workspace does not have a registered canvas yet" />
      </main>
    )
  }

  return (
    <main className="workspace-canvas" aria-label="Workspace canvas">
      <ActiveWorkspaceCanvas workspace={activeWorkspace} />
    </main>
  )
}

export default WorkspaceCanvas
