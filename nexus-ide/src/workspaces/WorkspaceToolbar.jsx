function WorkspaceToolbar({ onRendererClick, renderers }) {
  return (
    <div className="workspace-toolbar" aria-label="Workspace renderers">
      {renderers.map((renderer) => (
        <button
          className="renderer-button"
          key={renderer}
          type="button"
          onClick={() => onRendererClick?.(renderer)}
        >
          {renderer}
        </button>
      ))}
    </div>
  )
}

export default WorkspaceToolbar
