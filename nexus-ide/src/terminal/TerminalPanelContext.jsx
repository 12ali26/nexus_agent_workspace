import { useCallback, useMemo, useRef, useState } from 'react'
import { TerminalPanelContext } from './terminalPanelContext'

function clampPanelHeight(height) {
  return Math.min(520, Math.max(180, height))
}

export function TerminalPanelProvider({ children }) {
  const [activeTab, setActiveTab] = useState('terminal')
  const [isOpen, setIsOpen] = useState(false)
  const [outputEntries, setOutputEntries] = useState([])
  const [panelHeight, setPanelHeightState] = useState(280)
  const runCounterRef = useRef(0)

  const openTerminal = useCallback(() => {
    setIsOpen(true)
    setActiveTab('terminal')
  }, [])

  const openOutput = useCallback(() => {
    setIsOpen(true)
    setActiveTab('output')
  }, [])

  const closePanel = useCallback(() => {
    setIsOpen(false)
  }, [])

  const appendOutput = useCallback((entry) => {
    runCounterRef.current += 1

    setOutputEntries((currentEntries) => [
      ...currentEntries,
      {
        id: crypto.randomUUID(),
        lines: [],
        runNumber: runCounterRef.current,
        timestamp: new Date().toLocaleTimeString(),
        title: 'Execution Output',
        tone: 'default',
        ...entry,
      },
    ])
    setIsOpen(true)
    setActiveTab('output')
  }, [])

  const clearOutput = useCallback(() => {
    setOutputEntries([])
  }, [])

  const setPanelHeight = useCallback((height) => {
    setPanelHeightState(clampPanelHeight(height))
  }, [])

  const value = useMemo(
    () => ({
      activeTab,
      appendOutput,
      clearOutput,
      closePanel,
      isOpen,
      openOutput,
      openTerminal,
      outputEntries,
      panelHeight,
      setActiveTab,
      setPanelHeight,
    }),
    [
      activeTab,
      appendOutput,
      clearOutput,
      closePanel,
      isOpen,
      openOutput,
      openTerminal,
      outputEntries,
      panelHeight,
      setPanelHeight,
    ],
  )

  return (
    <TerminalPanelContext.Provider value={value}>
      {children}
    </TerminalPanelContext.Provider>
  )
}
