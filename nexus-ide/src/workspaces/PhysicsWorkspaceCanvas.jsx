import WorkspaceToolbar from './WorkspaceToolbar'

const physicsRenderers = ['3D Object', 'Equation', 'Chart', 'Annotation']

function PhysicsWorkspaceCanvas() {
  return (
    <div className="domain-workspace">
      <WorkspaceToolbar renderers={physicsRenderers} />
      <div className="domain-canvas-body">
        <p>Physics Workspace Ready — Load data or connect an agent to begin</p>
      </div>
    </div>
  )
}

export default PhysicsWorkspaceCanvas
