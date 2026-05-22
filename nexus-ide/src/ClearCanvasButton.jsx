import { useRenderBlocks } from './renderBlocks/useRenderBlocks'

function ClearCanvasButton({ onToast }) {
  const { clearCanvas } = useRenderBlocks()

  const handleClearCanvas = () => {
    clearCanvas()
    onToast('Canvas cleared')
  }

  return (
    <button
      className="top-bar-action"
      type="button"
      onClick={handleClearCanvas}
    >
      Clear Canvas
    </button>
  )
}

export default ClearCanvasButton
