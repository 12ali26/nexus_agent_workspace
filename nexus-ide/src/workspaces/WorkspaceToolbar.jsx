function WorkspaceToolbar({ renderers }) {
  return (
    <div className="workspace-toolbar" aria-label="Workspace renderers">
      {renderers.map((renderer) => (
        <button className="renderer-button" key={renderer} type="button">
          {renderer}
        </button>
      ))}
    </div>
  )
}

export default WorkspaceToolbar
