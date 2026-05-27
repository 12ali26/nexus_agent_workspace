import katex from 'katex'
import { useEffect } from 'react'
import { useExportSnapshots } from '../export/useExportSnapshots'
import 'katex/dist/katex.min.css'

function EquationPrimitive({ blockId, formula, resolvedValue }) {
  const { registerExportSnapshot, unregisterExportSnapshot } = useExportSnapshots()
  const renderedFormula = katex.renderToString(formula, {
    displayMode: true,
    throwOnError: false,
  })

  useEffect(() => {
    registerExportSnapshot(blockId, {
      type: 'equation',
      data: {
        formula,
        resolved: resolvedValue,
      },
    })

    return () => unregisterExportSnapshot(blockId)
  }, [
    blockId,
    formula,
    registerExportSnapshot,
    resolvedValue,
    unregisterExportSnapshot,
  ])

  return (
    <div className="equation-primitive">
      <div
        className="equation-render"
        dangerouslySetInnerHTML={{ __html: renderedFormula }}
      />
      <div className="equation-resolved">{resolvedValue}</div>
    </div>
  )
}

export default EquationPrimitive
