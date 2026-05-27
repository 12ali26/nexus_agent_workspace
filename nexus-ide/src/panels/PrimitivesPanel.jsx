import { useMemo, useState } from 'react'
import { PRIMITIVE_CATEGORIES, PRIMITIVES } from '../config/primitives'
import { usePackRegistry } from '../registry/usePackRegistry'

function dispatchPrimitiveAdd(primitiveType) {
  window.dispatchEvent(
    new CustomEvent('nexus-add-primitive', {
      detail: {
        primitiveType,
        source: 'picker',
      },
    }),
  )
}

function PrimitivesPanel({ onClose }) {
  const { activePrimitives } = usePackRegistry()
  const [activeCategory, setActiveCategory] = useState('ALL')
  const [searchValue, setSearchValue] = useState('')
  const activePrimitiveSet = useMemo(
    () => new Set(activePrimitives),
    [activePrimitives],
  )
  const normalizedSearchValue = searchValue.trim().toLowerCase()
  const visiblePrimitives = PRIMITIVES.filter((primitive) => {
    const matchesInstalledPrimitive = activePrimitiveSet.has(primitive.id)
    const matchesCategory =
      activeCategory === 'ALL' || primitive.category === activeCategory
    const matchesSearch =
      !normalizedSearchValue ||
      primitive.name.toLowerCase().includes(normalizedSearchValue)

    return matchesInstalledPrimitive && matchesCategory && matchesSearch
  })

  const addPrimitive = (primitiveType) => {
    dispatchPrimitiveAdd(primitiveType)
    onClose?.()
  }

  return (
    <section className="workspace-panel primitives-panel" aria-label="Primitives">
      <header className="panel-header">PRIMITIVES</header>

      <div className="panel-search">
        <input
          type="search"
          placeholder="Search primitives"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
        />
      </div>

      <div className="category-tabs" aria-label="Primitive categories">
        {['ALL', ...PRIMITIVE_CATEGORIES].map((category) => (
          <button
            className={`category-tab${
              activeCategory === category ? ' active' : ''
            }`}
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="primitive-tile-grid">
        {visiblePrimitives.map((primitive) => {
          const Icon = primitive.icon

          return (
            <button
              className="primitive-tile"
              draggable
              key={primitive.id}
              type="button"
              onClick={() => addPrimitive(primitive.id)}
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = 'copy'
                event.dataTransfer.setData(
                  'application/x-nexus-primitive',
                  primitive.id,
                )
                event.dataTransfer.setData('text/plain', primitive.id)
              }}
            >
              <span className="primitive-tooltip">
                <strong>{primitive.name}</strong>
                <span>{primitive.category}</span>
                <span>Click to add</span>
              </span>
              <Icon
                className="tile-icon"
                size={22}
                strokeWidth={1.8}
                style={{ color: primitive.color }}
              />
              <span className="tile-name">{primitive.name}</span>
            </button>
          )
        })}
      </div>

      {!visiblePrimitives.length && (
        <p className="panel-empty">No primitives found</p>
      )}
    </section>
  )
}

export default PrimitivesPanel
