import katex from 'katex'
import 'katex/dist/katex.min.css'

function EquationPrimitive({ formula, resolvedValue }) {
  const renderedFormula = katex.renderToString(formula, {
    displayMode: true,
    throwOnError: false,
  })

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
