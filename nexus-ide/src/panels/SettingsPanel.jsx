import { useSettings } from '../settings/useSettings'

const agentModels = ['Claude Sonnet', 'Claude Opus', 'Claude Haiku']

function SettingsPanel() {
  const {
    agentModel,
    exportSettings,
    registrySource,
    setAgentModel,
    setExportSettings,
    setRegistrySource,
    setTheme,
    theme,
  } = useSettings()

  return (
    <section className="workspace-panel" aria-label="Settings">
      <header className="panel-header">SETTINGS</header>

      <div className="settings-list">
        <div className="settings-row">
          <span>Theme</span>
          <label className="settings-toggle">
            <input
              type="checkbox"
              checked={theme === 'dark'}
              onChange={(event) =>
                setTheme(event.target.checked ? 'dark' : 'light')
              }
            />
            <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
          </label>
        </div>
        <div className="settings-row">
          <label htmlFor="agent-model">Agent Model</label>
          <select
            id="agent-model"
            className="settings-select"
            value={agentModel}
            onChange={(event) => setAgentModel(event.target.value)}
          >
            {agentModels.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>
        <div className="settings-row">
          <span>Registry Source</span>
          <div className="registry-source-control">
            <label>
              <input
                type="radio"
                name="registry-source"
                value="Local"
                checked={registrySource === 'Local'}
                onChange={(event) => setRegistrySource(event.target.value)}
              />
              <span>Local</span>
            </label>
            <label className="is-disabled">
              <input
                type="radio"
                name="registry-source"
                value="Remote"
                disabled
              />
              <span>Remote</span>
              <em>Coming Soon</em>
            </label>
          </div>
        </div>
        <div className="settings-section-label">Export</div>
        <div className="settings-row">
          <label htmlFor="export-paper-size">Paper Size</label>
          <select
            id="export-paper-size"
            className="settings-select"
            value={exportSettings.paperSize}
            onChange={(event) =>
              setExportSettings({ paperSize: event.target.value })
            }
          >
            {['A4', 'A3', 'Letter'].map((paperSize) => (
              <option key={paperSize} value={paperSize}>
                {paperSize}
              </option>
            ))}
          </select>
        </div>
        <div className="settings-row">
          <span>Orientation</span>
          <span>Canvas: Landscape · Notebook: Portrait</span>
        </div>
        <div className="settings-row">
          <span>Cover Page</span>
          <label className="settings-toggle">
            <input
              type="checkbox"
              checked={exportSettings.includeCoverPage}
              onChange={(event) =>
                setExportSettings({ includeCoverPage: event.target.checked })
              }
            />
            <span>{exportSettings.includeCoverPage ? 'On' : 'Off'}</span>
          </label>
        </div>
        <div className="settings-row">
          <label htmlFor="export-resolution">Resolution</label>
          <select
            id="export-resolution"
            className="settings-select"
            value={exportSettings.resolution}
            onChange={(event) =>
              setExportSettings({ resolution: Number(event.target.value) })
            }
          >
            <option value={1}>Standard (1x)</option>
            <option value={2}>High (2x)</option>
            <option value={3}>Ultra (3x)</option>
          </select>
        </div>
      </div>
    </section>
  )
}

export default SettingsPanel
