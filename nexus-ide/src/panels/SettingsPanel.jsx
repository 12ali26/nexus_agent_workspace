function SettingsPanel() {
  // Real settings state and persistence will plug in here later.
  return (
    <section className="workspace-panel" aria-label="Settings">
      <header className="panel-header">SETTINGS</header>

      <div className="settings-list">
        <div className="settings-row">
          <span>Theme</span>
          <label className="settings-toggle">
            <input type="checkbox" checked readOnly />
            <span>Dark</span>
          </label>
        </div>
        <div className="settings-row">
          <span>Agent Model</span>
          <strong>Claude Sonnet</strong>
        </div>
        <div className="settings-row">
          <span>Registry Source</span>
          <strong>Local</strong>
        </div>
      </div>
    </section>
  )
}

export default SettingsPanel
