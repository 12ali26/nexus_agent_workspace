import katex from 'katex'
import { useEffect } from 'react'
import 'katex/dist/katex.min.css'

function EquationPrimitive({ blockId, formula, resolved, resolvedValue, updateBlockData }) {
  const activeFormula = formula ?? ''
  const activeResolved = resolvedValue ?? resolved
  const renderedFormula = katex.renderToString(activeFormula, {
    displayMode: true,
    throwOnError: false,
  })

  useEffect(() => {
    updateBlockData?.(blockId, {
      formula: activeFormula,
      resolved: activeResolved,
    })
  }, [
    activeResolved,
    blockId,
    activeFormula,
    updateBlockData,
  ])

  return (
    <div className="equation-primitive">
      <div
        className="equation-render"
        dangerouslySetInnerHTML={{ __html: renderedFormula }}
      />
      <div className="equation-resolved">{activeResolved}</div>
    </div>
  )
}

export default EquationPrimitive
