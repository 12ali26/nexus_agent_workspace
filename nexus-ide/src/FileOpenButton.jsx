import { useRef } from 'react'
import { parseFileToPrimitive } from './fileLoading/fileToPrimitive'
import { useWorkspaceRegistry } from './registry/useWorkspaceRegistry'
import { useRenderBlocks } from './renderBlocks/useRenderBlocks'

const acceptedFileTypes = '.csv,.json,application/json,text/csv'

function FileOpenButton({ onToast }) {
  const fileInputRef = useRef(null)
  const { activeWorkspace } = useWorkspaceRegistry()
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

    if (!activeWorkspace) {
      onToast('Please activate a workspace before loading a file')
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
