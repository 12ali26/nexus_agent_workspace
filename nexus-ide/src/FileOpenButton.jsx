import { useRef } from 'react'
import { parseFileToPrimitive } from './fileLoading/fileToPrimitive'
import { getPrimitiveLabel } from './primitives/primitivePayloads'
import { usePackRegistry } from './registry/usePackRegistry'
import { useRenderBlocks } from './renderBlocks/useRenderBlocks'

const acceptedFileTypes = '.csv,.json,application/json,text/csv'

function FileOpenButton({ onToast }) {
  const fileInputRef = useRef(null)
  const { activePrimitives, installedPacks } = usePackRegistry()
  const { addPrimitiveBlock } = useRenderBlocks()

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  const loadFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    if (!installedPacks.length) {
      onToast('Install a pack from the Extensions panel before loading a file')
      return
    }

    const fileText = await file.text()
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

    addPrimitiveBlock(result.primitive)
  }

  return (
    <>
      <button className="top-bar-action" type="button" onClick={openFilePicker}>
        Open File
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
