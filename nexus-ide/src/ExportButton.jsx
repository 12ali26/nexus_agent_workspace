import { exportCanvasToPDF } from './export/exportToPDF'
import { usePackRegistry } from './registry/usePackRegistry'
import { useSettings } from './settings/useSettings'

function ExportButton() {
  const { activeProject } = usePackRegistry()
  const { exportSettings } = useSettings()

  return (
    <button
      className="top-bar-action"
      type="button"
      onClick={() =>
        exportCanvasToPDF(
          activeProject?.projectName || 'NEXUS_Analysis',
          exportSettings,
        )
      }
    >
      Export
    </button>
  )
}

export default ExportButton
