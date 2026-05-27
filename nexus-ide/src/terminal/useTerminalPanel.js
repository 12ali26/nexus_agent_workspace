import { useContext } from 'react'
import { TerminalPanelContext } from './terminalPanelContext'

export function useTerminalPanel() {
  const context = useContext(TerminalPanelContext)

  if (!context) {
    throw new Error('useTerminalPanel must be used inside TerminalPanelProvider')
  }

  return context
}
