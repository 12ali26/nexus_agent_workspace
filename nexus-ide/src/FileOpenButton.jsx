import { useRef } from 'react'
import { useActivity } from './activity/useActivity'
import { useWorkspaceData } from './context/useWorkspaceData'
import { parseFileToPrimitive } from './fileLoading/fileToPrimitive'
import { parseProjectManifest } from './project/ProjectManifest'
import { getPrimitiveLabel } from './primitives/primitivePayloads'
import { usePackRegistry } from './registry/usePackRegistry'
import { useRenderBlocks } from './renderBlocks/useRenderBlocks'

const acceptedFileTypes = '.csv,.json,application/json,text/csv'

function FileOpenButton({
  buttonClassName = 'top-bar-action',
  buttonLabel = 'Open File',
  buttonRef,
  onToast,
}) {
  const fileInputRef = useRef(null)
  const {
    activePrimitives,
    installExtensionsForCapabilities,
    installedPacks,
    setActiveProject,
  } = usePackRegistry()
  const { addDataset } = useWorkspaceData()
  const { addPrimitiveBlock, replacePrimitiveBlocks } = useRenderBlocks()
  const { logActivity } = useActivity()

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  const loadFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    const fileText = await file.text()

    let manifest = null
    const isJsonFile = file.name.toLowerCase().endsWith('.json')
    const isExplicitProjectManifest = file.name === 'nexus.project.json'

    if (isJsonFile) {
      try {
        manifest = parseProjectManifest(file, fileText)
      } catch {
        if (isExplicitProjectManifest) {
          onToast('Could not parse project manifest')
          return
        }
      }
    }

    if (manifest) {
      const activatedCount = installExtensionsForCapabilities(
        manifest.capabilities,
      )
      setActiveProject(manifest)

      if (manifest.canvasState) {
        replacePrimitiveBlocks(manifest.canvasState, manifest.projectId)
      }

      logActivity({
        metadata: {
          activatedExtensions: activatedCount,
          fileName: file.name,
        },
        projectId: manifest.projectId,
        summary: `Loaded project ${manifest.projectName}`,
        type: 'project',
      })
      onToast(`Project loaded — activated ${activatedCount} extensions`)
      return
    }

    if (!installedPacks.length) {
      onToast('Install an extension from the Extensions panel before loading a file')
      return
    }

    const result = parseFileToPrimitive(file, fileText)

    if (result.error === 'empty') {
      onToast('File appears to be empty')
      return
    }

    if (result.error === 'parse') {
      onToast('Could not parse file. Expected CSV or JSON')
      return
    }

    if (!activePrimitives.includes(result.primitive.type)) {
      onToast(
        `Install a pack that supports ${getPrimitiveLabel(
          result.primitive.type,
        )} before loading this file`,
      )
      return
    }

    if (result.dataset) {
      const dataset = addDataset(result.dataset)

      addPrimitiveBlock({
        ...result.primitive,
        data: {
          ...result.primitive.data,
          props: {
            ...result.primitive.data.props,
            datasetId: dataset?.id ?? '',
          },
        },
      })
      return
    }

    addPrimitiveBlock(result.primitive)
  }

  return (
    <>
      <button
        ref={buttonRef}
        className={buttonClassName}
        type="button"
        onClick={openFilePicker}
      >
        {buttonLabel}
      </button>
      <input
        ref={fileInputRef}
        className="file-input"
        type="file"
        accept={acceptedFileTypes}
        onChange={loadFile}
      />
    </>
  )
}

export default FileOpenButton
