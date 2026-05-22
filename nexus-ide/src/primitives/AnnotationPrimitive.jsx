function AnnotationPrimitive({ annotations }) {
  return (
    <div className="annotation-primitive">
      {annotations.map((annotation) => (
        <article
          className={`annotation-card annotation-${annotation.type}`}
          key={annotation.id}
        >
          <div className="annotation-label">{annotation.label}</div>
          <div className="annotation-value">{annotation.value}</div>
        </article>
      ))}
    </div>
  )
}

export default AnnotationPrimitive
