import { exportCanvasToPDF } from './export/exportToPDF'
import { usePackRegistry } from './registry/usePackRegistry'
import { useSettings } from './settings/useSettings'

function ExportButton({
  buttonClassName = 'top-bar-action',
  buttonLabel = 'Export',
  buttonRef,
}) {
  const { activeProject } = usePackRegistry()
  const { exportSettings } = useSettings()

  return (
    <button
      ref={buttonRef}
      className={buttonClassName}
      type="button"
      onClick={() =>
        exportCanvasToPDF(
          activeProject?.projectName || 'NEXUS_Analysis',
          exportSettings,
        )
      }
    >
      {buttonLabel}
    </button>
  )
}

export default ExportButton
