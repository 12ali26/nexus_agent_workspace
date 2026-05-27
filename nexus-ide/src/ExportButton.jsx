import { exportCanvasToPDF } from './export/exportToPDF'
import { useExportSnapshots } from './export/useExportSnapshots'
import { usePackRegistry } from './registry/usePackRegistry'
import { useRenderBlocks } from './renderBlocks/useRenderBlocks'
import { useSettings } from './settings/useSettings'

function ExportButton({
  buttonClassName = 'top-bar-action',
  buttonLabel = 'Export',
  buttonRef,
}) {
  const { activeProject } = usePackRegistry()
  const { getExportBlocks } = useExportSnapshots()
  const { primitiveBlocks } = useRenderBlocks()
  const { exportSettings } = useSettings()

  return (
    <button
      ref={buttonRef}
      className={buttonClassName}
      type="button"
      onClick={() =>
        exportCanvasToPDF(
          activeProject?.projectName || 'NEXUS_Analysis',
          getExportBlocks(primitiveBlocks),
          exportSettings,
        )
      }
    >
      {buttonLabel}
    </button>
  )
}

export default ExportButton
