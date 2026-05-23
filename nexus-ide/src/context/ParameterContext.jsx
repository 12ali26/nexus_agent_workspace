import { useCallback, useMemo, useState } from 'react'
import { ParameterContext } from './parameterContext'
import { sanitizeParameterName } from './parameterUtils'

export function ParameterProvider({ children }) {
  const [parameterNodes, setParameterNodes] = useState({})

  const registerParameterNode = useCallback((sourceId, nodeParameters) => {
    // AGENT: simulation agents will inject and update parameter values through
    // this same context before generating reactive render instructions.
    setParameterNodes((currentNodes) => ({
      ...currentNodes,
      [sourceId]: nodeParameters,
    }))
  }, [])

  const unregisterParameterNode = useCallback((sourceId) => {
    setParameterNodes((currentNodes) => {
      const nextNodes = { ...currentNodes }
      delete nextNodes[sourceId]
      return nextNodes
    })
  }, [])

  const parameterList = useMemo(
    () =>
      Object.entries(parameterNodes).flatMap(([sourceId, nodeParameters]) =>
        nodeParameters.map((parameter) => ({
          ...parameter,
          sourceId,
          variableName: sanitizeParameterName(parameter.label),
        })),
      ),
    [parameterNodes],
  )

  const parameters = useMemo(
    () =>
      parameterList.reduce((scope, parameter) => {
        scope[parameter.variableName] = parameter.value
        return scope
      }, {}),
    [parameterList],
  )

  const value = useMemo(
    () => ({
      parameterList,
      parameters,
      registerParameterNode,
      unregisterParameterNode,
    }),
    [parameterList, parameters, registerParameterNode, unregisterParameterNode],
  )

  return (
    <ParameterContext.Provider value={value}>
      {children}
    </ParameterContext.Provider>
  )
}
