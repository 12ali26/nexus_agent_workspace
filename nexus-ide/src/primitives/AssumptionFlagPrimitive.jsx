import { useState } from 'react'

function AssumptionFlagPrimitive({ assumptions }) {
  const [localAssumptions, setLocalAssumptions] = useState(assumptions)

  const updateStatus = (assumptionId, status) => {
    setLocalAssumptions((currentAssumptions) =>
      currentAssumptions.map((assumption) =>
        assumption.id === assumptionId
          ? {
              ...assumption,
              status,
            }
          : assumption,
      ),
    )
  }

  return (
    <div className="assumption-flag-primitive">
      {localAssumptions.map((assumption) => (
        <article className="assumption-card" key={assumption.id}>
          <div className="assumption-copy">
            <div className="assumption-label">{assumption.label}</div>
            <div className="assumption-value">{assumption.value}</div>
          </div>

          <span
            className={`assumption-status status-${assumption.status.toLowerCase()}`}
          >
            {assumption.status}
          </span>

          <div className="assumption-actions">
            <button
              className="assumption-action"
              type="button"
              onClick={() => updateStatus(assumption.id, 'Approved')}
            >
              Approve
            </button>
            <button
              className="assumption-action"
              type="button"
              onClick={() => updateStatus(assumption.id, 'Challenged')}
            >
              Challenge
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}

export default AssumptionFlagPrimitive
