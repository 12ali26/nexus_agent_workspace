import { useMemo, useRef, useState } from 'react'
import { evaluate } from 'mathjs'
import { useParameters } from '../context/useParameters'
import { sanitizeDataName } from '../context/workspaceDataUtils'
import { useWorkspaceData } from '../context/useWorkspaceData'

function formatResult(result) {
  if (typeof result === 'number') {
    return Number.isInteger(result) ? result.toString() : result.toFixed(4)
  }

  return String(result)
}

function FormulaBlockPrimitive() {
  const { parameterList, parameters } = useParameters()
  const { activeDataset, datasetAliases, datasetScope } = useWorkspaceData()
  const formulaInputRef = useRef(null)
  const [label, setLabel] = useState('Present Value')
  const [formula, setFormula] = useState(
    '1000 / (1 + discount_rate / 100) ^ 10',
  )

  const scope = useMemo(
    () => ({
      ...datasetScope,
      ...parameters,
    }),
    [datasetScope, parameters],
  )
  const evaluation = useMemo(() => {
    try {
      return {
        error: '',
        result: evaluate(formula, scope),
      }
    } catch (error) {
      return {
        error: error.message,
        result: null,
      }
    }
  }, [formula, scope])

  const datasetColumnHints = useMemo(() => {
    const activeDatasetHints = activeDataset
      ? activeDataset.columns.map((column) => ({
          label: column,
          variableName: sanitizeDataName(column),
        }))
      : []
    const scopedHints = datasetAliases.flatMap(({ dataset, variableName }) =>
      dataset.columns.map((column) => ({
        label: `${dataset.name}: ${column}`,
        variableName: `${variableName}_${sanitizeDataName(column)}`,
      })),
    )

    return [...activeDatasetHints, ...scopedHints]
  }, [activeDataset, datasetAliases])

  const insertToken = (token) => {
    const input = formulaInputRef.current
    const selectionStart = input?.selectionStart ?? formula.length
    const selectionEnd = input?.selectionEnd ?? formula.length
    const nextFormula = `${formula.slice(0, selectionStart)}${token}${formula.slice(selectionEnd)}`

    setFormula(nextFormula)

    requestAnimationFrame(() => {
      input?.focus()
      input?.setSelectionRange(
        selectionStart + token.length,
        selectionStart + token.length,
      )
    })
  }

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
          ref={formulaInputRef}
          type="text"
          value={formula}
          onChange={(event) => setFormula(event.target.value)}
        />
      </label>

      <div className="formula-hint-group">
        <span>Parameters</span>
        <div className="formula-hints" aria-label="Available parameters">
        {parameterList.length ? (
          parameterList.map((parameter) => (
            <button
              key={`${parameter.sourceId}-${parameter.id}`}
              type="button"
              onClick={() => insertToken(parameter.variableName)}
            >
              {parameter.variableName}
            </button>
          ))
        ) : (
          <p>No parameters available</p>
        )}
        </div>
      </div>

      <div className="formula-hint-group">
        <span>Dataset Columns</span>
        <div className="formula-hints" aria-label="Available dataset columns">
          {datasetColumnHints.length ? (
            datasetColumnHints.map((hint) => (
              <button
                key={`${hint.label}-${hint.variableName}`}
                type="button"
                title={hint.label}
                onClick={() => insertToken(hint.variableName)}
              >
                {hint.variableName}
              </button>
            ))
          ) : (
            <p>No dataset columns available</p>
          )}
        </div>
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
