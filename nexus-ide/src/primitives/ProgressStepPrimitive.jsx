import { useEffect } from 'react'

function ProgressStepPrimitive({ blockId, steps, updateBlockData }) {
  const safeSteps = Array.isArray(steps) ? steps : []

  useEffect(() => {
    const exportSteps = Array.isArray(steps) ? steps : []

    updateBlockData?.(blockId, {
      steps: exportSteps,
    })
  }, [blockId, steps, updateBlockData])

  return (
    <div className="progress-step-primitive">
      {safeSteps.map((step) => (
        <article
          className={`progress-step status-${step.status.toLowerCase()}`}
          key={step.id}
        >
          <div className="progress-step-marker">
            {step.status === 'Complete' ? '✓' : step.id}
          </div>
          <div className="progress-step-copy">
            <div className="progress-step-heading">
              <h3>{step.title}</h3>
              <span>{step.status}</span>
            </div>
            <p>{step.description}</p>
          </div>
        </article>
      ))}
    </div>
  )
}

export default ProgressStepPrimitive
