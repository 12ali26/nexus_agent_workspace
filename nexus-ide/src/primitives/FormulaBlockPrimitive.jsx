import { useMemo, useState } from 'react'
import { evaluate } from 'mathjs'
import { useParameters } from '../context/useParameters'

function formatResult(result) {
  if (typeof result === 'number') {
    return Number.isInteger(result) ? result.toString() : result.toFixed(4)
  }

  return String(result)
}

function FormulaBlockPrimitive() {
  const { parameterList, parameters } = useParameters()
  const [label, setLabel] = useState('Present Value')
  const [formula, setFormula] = useState(
    '1000 / (1 + discount_rate / 100) ^ 10',
  )

  const evaluation = useMemo(() => {
    try {
      return {
        error: '',
        result: evaluate(formula, parameters),
      }
    } catch (error) {
      return {
        error: error.message,
        result: null,
      }
    }
  }, [formula, parameters])

  return (
    <div className="formula-block-primitive">
      <label className="formula-field">
        <span>Label</span>
        <input
          type="text"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
        />
      </label>

      <label className="formula-field">
        <span>Formula</span>
        <input
          type="text"
          value={formula}
          onChange={(event) => setFormula(event.target.value)}
        />
      </label>

      <div className="formula-hints" aria-label="Available parameters">
        {parameterList.length ? (
          parameterList.map((parameter) => (
            <span key={`${parameter.sourceId}-${parameter.id}`}>
              {parameter.variableName}
            </span>
          ))
        ) : (
          <p>No parameters available</p>
        )}
      </div>

      <div className="formula-result-panel">
        <span>{label || 'Formula Result'}</span>
        {evaluation.error ? (
          <strong className="formula-error">{evaluation.error}</strong>
        ) : (
          <strong>{formatResult(evaluation.result)}</strong>
        )}
      </div>
    </div>
  )
}

export default FormulaBlockPrimitive
