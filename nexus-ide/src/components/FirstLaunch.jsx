import { useEffect, useState } from 'react'
import { ArrowRight, CheckCircle, ExternalLink, XCircle } from 'lucide-react'

export function FirstLaunch({ onComplete }) {
  const [checks, setChecks] = useState({ python: null, r: null })
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function checkRuntimes() {
      setChecking(true)
      try {
        await fetch('/api/health')
        const [pythonAvailable, rscriptAvailable, rAvailable] =
          await Promise.all([
            checkRuntime('python3 --version'),
            checkRuntime('Rscript --version'),
            checkRuntime('R --version'),
          ])

        if (isMounted) {
          setChecks({
            python: pythonAvailable,
            r: rscriptAvailable || rAvailable,
          })
        }
      } catch {
        if (isMounted) {
          setChecks({ python: false, r: false })
        }
      } finally {
        if (isMounted) {
          setChecking(false)
        }
      }
    }

    checkRuntimes()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="first-launch">
      <div className="first-launch-card">
        <div className="first-launch-badge">N</div>
        <h1>Welcome to NEXUS IDE</h1>
        <p>Checking your system for required runtimes...</p>

        <div className="runtime-checks">
          <RuntimeCheck
            name="Python 3"
            description="Required for data analysis and computation"
            status={checks.python}
            checking={checking}
            installUrl="https://python.org/downloads"
            installCommand="sudo apt install python3"
          />
          <RuntimeCheck
            name="R"
            description="Required for statistical computing"
            status={checks.r}
            checking={checking}
            installUrl="https://r-project.org"
            installCommand="sudo apt install r-base"
            optional
          />
        </div>

        <div className="first-launch-actions">
          <button
            className="first-launch-btn"
            type="button"
            onClick={onComplete}
            disabled={checking}
          >
            {checks.python === false ? 'Continue anyway' : 'Launch NEXUS'}
            <ArrowRight size={16} />
          </button>
        </div>

        <p className="first-launch-note">
          You can always check runtime status in Settings {'->'} Runtimes
        </p>
      </div>
    </div>
  )
}

async function checkRuntime(command) {
  try {
    const response = await fetch('/api/check-runtime', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command }),
    })
    const data = await response.json()
    return Boolean(data.available)
  } catch {
    return false
  }
}

function RuntimeCheck({
  name,
  description,
  status,
  checking,
  installUrl,
  installCommand,
  optional = false,
}) {
  return (
    <div className="runtime-check">
      <div className="runtime-check-status">
        {checking || status === null ? (
          <div className="loading-spinner" />
        ) : status ? (
          <CheckCircle size={20} color="var(--accent-green)" />
        ) : (
          <XCircle
            size={20}
            color={optional ? '#f0883e' : 'var(--accent-red)'}
          />
        )}
      </div>
      <div className="runtime-check-info">
        <div className="runtime-check-name">
          {name}
          {optional && <span className="optional-badge">Optional</span>}
        </div>
        <div className="runtime-check-desc">{description}</div>
        {status === false && (
          <div className="runtime-check-install">
            <code>{installCommand}</code>
            <a href={installUrl} target="_blank" rel="noreferrer">
              Download <ExternalLink size={10} />
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
