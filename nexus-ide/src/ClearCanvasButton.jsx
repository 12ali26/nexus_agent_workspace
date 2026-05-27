import { useRenderBlocks } from './renderBlocks/useRenderBlocks'

function ClearCanvasButton({
  buttonClassName = 'top-bar-action',
  buttonLabel = 'Clear Canvas',
  buttonRef,
  onToast,
}) {
  const { clearCanvas } = useRenderBlocks()

  const handleClearCanvas = () => {
    clearCanvas()
    onToast('Canvas cleared')
  }

  return (
    <button
      ref={buttonRef}
      className={buttonClassName}
      type="button"
      onClick={handleClearCanvas}
    >
      {buttonLabel}
    </button>
  )
}

export default ClearCanvasButton
