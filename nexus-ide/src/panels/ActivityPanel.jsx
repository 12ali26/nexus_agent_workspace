import { useMemo, useState } from 'react'
import { Download, GitCommitHorizontal, ShieldCheck, Trash2 } from 'lucide-react'
import { useActivity } from '../activity/useActivity'

const activityTypes = [
  'all',
  'project',
  'dataset',
  'canvas',
  'extension',
  'execution',
  'api',
  'security',
]

function formatActivityTime(createdAt) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
    }).format(new Date(createdAt))
  } catch {
    return ''
  }
}

function exportEvents(events) {
  const content = events
    .map(
      (event) =>
        `[${event.createdAt}] [${String(event.type).toUpperCase()}] ${event.actor}: ${event.summary}`,
    )
    .join('\n')
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = `nexus-activity-${Date.now()}.log`
  anchor.click()
  URL.revokeObjectURL(url)
}

function ActivityPanel() {
  const { clearActivity, events, securityStatus } = useActivity()
  const [filter, setFilter] = useState('all')
  const [searchValue, setSearchValue] = useState('')
  const normalizedSearchValue = searchValue.trim().toLowerCase()
  const filteredEvents = useMemo(
    () =>
      events.filter((event) => {
        const matchesType = filter === 'all' || event.type === filter
        const matchesSearch =
          !normalizedSearchValue ||
          event.summary.toLowerCase().includes(normalizedSearchValue) ||
          event.actor.toLowerCase().includes(normalizedSearchValue) ||
          event.type.toLowerCase().includes(normalizedSearchValue)

        return matchesType && matchesSearch
      }),
    [events, filter, normalizedSearchValue],
  )
  const authLabel = securityStatus?.configInvalid
    ? 'Auth misconfigured'
    : securityStatus?.authEnabled
      ? 'Auth enabled'
      : 'Auth disabled'

  return (
    <section className="workspace-panel activity-panel" aria-label="Activity">
      <header className="panel-header activity-panel-header">
        <span>ACTIVITY</span>
        <span className="activity-count">{events.length}</span>
      </header>

      <div className="activity-security-status">
        <ShieldCheck size={15} strokeWidth={1.8} />
        <span>{authLabel}</span>
      </div>

      <div className="panel-search activity-search">
        <input
          type="search"
          placeholder="Search activity"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
        />
      </div>

      <div className="activity-toolbar">
        <select
          className="activity-filter"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          {activityTypes.map((type) => (
            <option key={type} value={type}>
              {type === 'all' ? 'All events' : type}
            </option>
          ))}
        </select>
        <button
          type="button"
          title="Export activity"
          aria-label="Export activity"
          onClick={() => exportEvents(filteredEvents)}
        >
          <Download size={14} strokeWidth={1.9} />
        </button>
        <button
          type="button"
          title="Clear activity"
          aria-label="Clear activity"
          onClick={clearActivity}
        >
          <Trash2 size={14} strokeWidth={1.9} />
        </button>
      </div>

      <div className="activity-list">
        {!filteredEvents.length && (
          <div className="activity-empty">No activity yet</div>
        )}
        {filteredEvents.map((event) => (
          <article className="activity-entry" key={event.id}>
            <div className={`activity-entry-icon is-${event.type}`}>
              <GitCommitHorizontal size={15} strokeWidth={1.9} />
            </div>
            <div className="activity-entry-body">
              <div className="activity-entry-summary">{event.summary}</div>
              <div className="activity-entry-meta">
                <span>{formatActivityTime(event.createdAt)}</span>
                <span>{event.actor}</span>
                <span>{event.type}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default ActivityPanel
