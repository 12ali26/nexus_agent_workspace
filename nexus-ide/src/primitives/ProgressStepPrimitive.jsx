function ProgressStepPrimitive({ steps }) {
  return (
    <div className="progress-step-primitive">
      {steps.map((step) => (
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
