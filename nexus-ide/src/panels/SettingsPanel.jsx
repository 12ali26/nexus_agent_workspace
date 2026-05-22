import { useSettings } from '../settings/useSettings'

const agentModels = ['Claude Sonnet', 'Claude Opus', 'Claude Haiku']

function SettingsPanel() {
  const {
    agentModel,
    registrySource,
    setAgentModel,
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
      </div>
    </section>
  )
}

export default SettingsPanel
