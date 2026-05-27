import { useEffect, useMemo, useState } from 'react'
import { useExportSnapshots } from '../export/useExportSnapshots'

function AssumptionFlagPrimitive({ assumptions, blockId, headerControls }) {
  const { registerExportSnapshot, unregisterExportSnapshot } = useExportSnapshots()
  const [localAssumptions, setLocalAssumptions] = useState(assumptions)
  const summary = useMemo(
    () =>
      localAssumptions.reduce(
        (counts, assumption) => {
          const statusKey = assumption.status.toLowerCase()

          if (statusKey in counts) {
            counts[statusKey] += 1
          }

          return counts
        },
        {
          approved: 0,
          challenged: 0,
          pending: 0,
        },
      ),
    [localAssumptions],
  )

  useEffect(() => {
    headerControls?.(
      <div className="primitive-header-controls">
        <button
          className="primitive-header-action assumption-info"
          type="button"
          title="Flag and review assumptions made in your analysis. Approve to accept, Challenge to question."
          onMouseDown={(event) => event.stopPropagation()}
        >
          i
        </button>
      </div>,
    )

    return () => headerControls?.(null)
  }, [headerControls])

  useEffect(() => {
    registerExportSnapshot(blockId, {
      type: 'assumption-flag',
      data: {
        assumptions: localAssumptions,
      },
    })

    return () => unregisterExportSnapshot(blockId)
  }, [
    blockId,
    localAssumptions,
    registerExportSnapshot,
    unregisterExportSnapshot,
  ])

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
              ✓ Approve
            </button>
            <button
              className="assumption-action"
              type="button"
              onClick={() => updateStatus(assumption.id, 'Challenged')}
            >
              ⚠ Challenge
            </button>
          </div>
        </article>
      ))}

      <div className="assumption-summary">
        {summary.approved} approved · {summary.challenged} challenged ·{' '}
        {summary.pending} pending
      </div>
    </div>
  )
}

export default AssumptionFlagPrimitive
