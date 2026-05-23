import { useEffect, useState } from 'react'
import { useParameters } from '../context/useParameters'

const defaultParameters = [
  {
    id: 'p1',
    label: 'Discount Rate',
    type: 'slider',
    value: 3.5,
    min: 0,
    max: 15,
    step: 0.1,
    unit: '%',
  },
  {
    id: 'p2',
    label: 'Sample Size',
    type: 'slider',
    value: 1000,
    min: 100,
    max: 10000,
    step: 100,
    unit: '',
  },
  {
    id: 'p3',
    label: 'Confidence Level',
    type: 'dropdown',
    value: '95%',
    options: ['90%', '95%', '99%'],
  },
]

const emptyDraft = {
  label: '',
  type: 'slider',
  value: '',
  min: '0',
  max: '100',
  step: '1',
  unit: '',
  options: '',
}

function parseNumericValue(value, fallback = 0) {
  const parsedValue = Number(value)
  return Number.isFinite(parsedValue) ? parsedValue : fallback
}

function ParameterNodePrimitive({ blockId }) {
  const { registerParameterNode, unregisterParameterNode } = useParameters()
  const [parameters, setParameters] = useState(defaultParameters)
  const [isAddingParameter, setIsAddingParameter] = useState(false)
  const [draft, setDraft] = useState(emptyDraft)

  useEffect(() => {
    registerParameterNode(blockId, parameters)

    return () => unregisterParameterNode(blockId)
  }, [blockId, parameters, registerParameterNode, unregisterParameterNode])

  const updateParameterValue = (parameterId, value) => {
    setParameters((currentParameters) =>
      currentParameters.map((parameter) =>
        parameter.id === parameterId
          ? {
              ...parameter,
              value,
            }
          : parameter,
      ),
    )
  }

  const deleteParameter = (parameterId) => {
    setParameters((currentParameters) =>
      currentParameters.filter((parameter) => parameter.id !== parameterId),
    )
  }

  const addParameter = (event) => {
    event.preventDefault()

    if (!draft.label.trim()) {
      return
    }

    const nextParameter = {
      id: crypto.randomUUID(),
      label: draft.label.trim(),
      type: draft.type,
      value:
        draft.type === 'dropdown'
          ? draft.value || draft.options.split(',')[0]?.trim() || ''
          : parseNumericValue(draft.value),
      unit: draft.unit,
    }

    if (draft.type === 'slider') {
      nextParameter.min = parseNumericValue(draft.min)
      nextParameter.max = parseNumericValue(draft.max, 100)
      nextParameter.step = parseNumericValue(draft.step, 1)
    }

    if (draft.type === 'dropdown') {
      nextParameter.options = draft.options
        .split(',')
        .map((option) => option.trim())
        .filter(Boolean)
    }

    setParameters((currentParameters) => [...currentParameters, nextParameter])
    setDraft(emptyDraft)
    setIsAddingParameter(false)
  }

  return (
    <div className="parameter-node-primitive">
      <div className="parameter-node-list">
        {parameters.map((parameter) => (
          <div className="parameter-row" key={parameter.id}>
            <label>
              <span>{parameter.label}</span>
              {parameter.type === 'dropdown' ? (
                <select
                  value={parameter.value}
                  onChange={(event) =>
                    updateParameterValue(parameter.id, event.target.value)
                  }
                >
                  {parameter.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : parameter.type === 'number' ? (
                <input
                  type="number"
                  value={parameter.value}
                  step={parameter.step ?? 1}
                  onChange={(event) =>
                    updateParameterValue(
                      parameter.id,
                      parseNumericValue(event.target.value),
                    )
                  }
                />
              ) : (
                <div className="parameter-slider-control">
                  <input
                    type="range"
                    min={parameter.min}
                    max={parameter.max}
                    step={parameter.step}
                    value={parameter.value}
                    onChange={(event) =>
                      updateParameterValue(
                        parameter.id,
                        parseNumericValue(event.target.value),
                      )
                    }
                  />
                  <strong>
                    {parameter.value}
                    {parameter.unit}
                  </strong>
                </div>
              )}
            </label>
            <button
              className="parameter-delete"
              type="button"
              aria-label={`Delete ${parameter.label}`}
              onClick={() => deleteParameter(parameter.id)}
            >
              x
            </button>
          </div>
        ))}
      </div>

      {isAddingParameter ? (
        <form className="parameter-add-form" onSubmit={addParameter}>
          <input
            type="text"
            value={draft.label}
            placeholder="Label"
            onChange={(event) =>
              setDraft((currentDraft) => ({
                ...currentDraft,
                label: event.target.value,
              }))
            }
          />
          <select
            value={draft.type}
            onChange={(event) =>
              setDraft((currentDraft) => ({
                ...currentDraft,
                type: event.target.value,
              }))
            }
          >
            <option value="slider">Slider</option>
            <option value="number">Number Input</option>
            <option value="dropdown">Dropdown</option>
          </select>
          <input
            type="text"
            value={draft.value}
            placeholder="Value"
            onChange={(event) =>
              setDraft((currentDraft) => ({
                ...currentDraft,
                value: event.target.value,
              }))
            }
          />
          {draft.type === 'dropdown' ? (
            <input
              type="text"
              value={draft.options}
              placeholder="Options, comma-separated"
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  options: event.target.value,
                }))
              }
            />
          ) : (
            <>
              <input
                type="number"
                value={draft.min}
                placeholder="Min"
                onChange={(event) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    min: event.target.value,
                  }))
                }
              />
              <input
                type="number"
                value={draft.max}
                placeholder="Max"
                onChange={(event) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    max: event.target.value,
                  }))
                }
              />
              <input
                type="number"
                value={draft.step}
                placeholder="Step"
                onChange={(event) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    step: event.target.value,
                  }))
                }
              />
            </>
          )}
          <input
            type="text"
            value={draft.unit}
            placeholder="Unit"
            onChange={(event) =>
              setDraft((currentDraft) => ({
                ...currentDraft,
                unit: event.target.value,
              }))
            }
          />
          <div className="parameter-add-actions">
            <button type="submit">Add</button>
            <button type="button" onClick={() => setIsAddingParameter(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          className="parameter-add-button"
          type="button"
          onClick={() => setIsAddingParameter(true)}
        >
          Add Parameter
        </button>
      )}
    </div>
  )
}

export default ParameterNodePrimitive
