import { useEffect, useState } from 'react'
import { Download, RefreshCw, X } from 'lucide-react'

export function UpdateNotification() {
  const [updateAvailable, setUpdateAvailable] = useState(null)
  const [updateDownloaded, setUpdateDownloaded] = useState(null)

  useEffect(() => {
    if (!window.nexus?.isElectron) {
      return undefined
    }

    const removeAvailableListener = window.nexus.onUpdateAvailable?.((info) => {
      setUpdateAvailable(info)
    })
    const removeDownloadedListener = window.nexus.onUpdateDownloaded?.((info) => {
      setUpdateDownloaded(info)
    })

    return () => {
      removeAvailableListener?.()
      removeDownloadedListener?.()
    }
  }, [])

  if (!updateDownloaded && !updateAvailable) {
    return null
  }

  return (
    <div className="update-notification">
      <Download size={14} color="var(--accent-green)" />
      {updateDownloaded ? (
        <>
          <span>NEXUS {updateDownloaded.version} ready to install</span>
          <button
            className="update-btn"
            type="button"
            onClick={() => window.nexus.installUpdate()}
          >
            <RefreshCw size={12} />
            Restart & Update
          </button>
        </>
      ) : (
        <span>Update available: v{updateAvailable.version}</span>
      )}
      <button
        className="update-dismiss"
        type="button"
        aria-label="Dismiss update notification"
        onClick={() => {
          setUpdateAvailable(null)
          setUpdateDownloaded(null)
        }}
      >
        <X size={12} />
      </button>
    </div>
  )
}
