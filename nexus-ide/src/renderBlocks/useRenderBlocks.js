import { useContext } from 'react'
import { RenderBlocksContext } from './renderBlocksContext'

export function useRenderBlocks() {
  const context = useContext(RenderBlocksContext)

  if (!context) {
    throw new Error('useRenderBlocks must be used inside RenderBlocksProvider')
  }

  return context
}
