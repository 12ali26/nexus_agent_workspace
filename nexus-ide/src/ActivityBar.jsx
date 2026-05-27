import { LayoutGrid } from 'lucide-react'

const activityItems = [
  {
    id: 'workspaces',
    label: 'Packs',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h5.1l2 2H18.5A1.5 1.5 0 0 1 20 7.5v11A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5v-13Z" />
      </svg>
    ),
  },
  {
    id: 'primitives',
    label: 'Primitives',
    icon: <LayoutGrid aria-hidden="true" size={23} strokeWidth={1.8} />,
  },
  {
    id: 'extensions',
    label: 'Extensions',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 4h3v5H6V6a2 2 0 0 1 2-2Zm5 0h3a2 2 0 0 1 2 2v3h-5V4ZM6 11h5v5H8a2 2 0 0 1-2-2v-3Zm7 0h5v3a2 2 0 0 1-2 2h-3v-5Z" />
        <path d="M9 18h6" />
      </svg>
    ),
  },
  {
    id: 'agent',
    label: 'Agent',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 5v3" />
        <path d="M8 8h8a3 3 0 0 1 3 3v4a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4v-4a3 3 0 0 1 3-3Z" />
        <path d="M9 13h.01M15 13h.01M10 16h4" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
        <path d="m19 13 .1-2 1.8-1.2-2-3.4-2.1.9a7 7 0 0 0-1.7-1L14.8 4h-5.6l-.3 2.3a7 7 0 0 0-1.7 1l-2.1-.9-2 3.4L4.9 11l.1 2-1.8 1.2 2 3.4 2.1-.9a7 7 0 0 0 1.7 1l.3 2.3h5.6l.3-2.3a7 7 0 0 0 1.7-1l2.1.9 2-3.4L19 13Z" />
      </svg>
    ),
  },
]

function ActivityBar({ activePanel, onPanelChange }) {
  return (
    <nav className="activity-rail" aria-label="Primary navigation">
      {activityItems.map((item) => {
        const isActive = activePanel === item.id

        return (
          <button
            className={`activity-button${isActive ? ' is-active' : ''}`}
            key={item.id}
            type="button"
            aria-label={item.label}
            aria-expanded={isActive}
            title={item.label}
            onClick={() => onPanelChange(isActive ? null : item.id)}
          >
            {item.icon}
          </button>
        )
      })}
    </nav>
  )
}

export default ActivityBar
