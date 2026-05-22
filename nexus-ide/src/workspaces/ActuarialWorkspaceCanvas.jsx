import WorkspaceToolbar from './WorkspaceToolbar'

const actuarialRenderers = [
  'Table',
  'Equation',
  'Chart',
  'Assumption Flag',
  'Progress Step',
]

function ActuarialWorkspaceCanvas() {
  return (
    <div className="domain-workspace">
      <WorkspaceToolbar renderers={actuarialRenderers} />
      <div className="domain-canvas-body">
        <p>Actuarial Workspace Ready — Load data or connect an agent to begin</p>
      </div>
    </div>
  )
}

export default ActuarialWorkspaceCanvas
