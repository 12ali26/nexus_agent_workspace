import { useEffect, useMemo, useState } from 'react'
import MDEditor from '@uiw/react-md-editor'
import katex from 'katex'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'
import 'katex/dist/katex.min.css'

const defaultContent = String.raw`## Methodology

Define the probability of death between age $x$ and $x+1$ as:

$$q_x = \frac{d_x}{l_x}$$

Where $d_x$ is the number of deaths and $l_x$ is the number alive at age $x$.

Continue writing your methodology here...`

const proseModes = ['Edit', 'Preview', 'Split']

function getWordCount(content) {
  return content
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/\$[^$]*\$/g, ' ')
    .replace(/[#*_`>[\]()~-]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

function renderMath(formula, displayMode) {
  try {
    return katex.renderToString(formula, {
      displayMode,
      output: 'html',
      throwOnError: false,
    })
  } catch {
    return formula
  }
}

function renderMarkdownWithMath(content) {
  return content
    .replace(/\$\$([\s\S]*?)\$\$/g, (_, formula) =>
      renderMath(formula.trim(), true),
    )
    .replace(/\$([^$\n]+)\$/g, (_, formula) =>
      renderMath(formula.trim(), false),
    )
}

function ProseBlockPrimitive({
  blockId,
  content: initialContent,
  headerControls,
  updateBlockData,
}) {
  const [content, setContent] = useState(initialContent || defaultContent)
  const [mode, setMode] = useState('Split')
  const wordCount = useMemo(() => getWordCount(content), [content])

  useEffect(() => {
    headerControls(
      <>
        <div className="prose-mode-control" aria-label="Prose view mode">
          {proseModes.map((proseMode) => (
            <button
              className={proseMode === mode ? 'is-active' : undefined}
              key={proseMode}
              type="button"
              onClick={() => setMode(proseMode)}
            >
              {proseMode}
            </button>
          ))}
        </div>
        <span className="prose-word-count">{wordCount} words</span>
      </>,
    )

    return () => headerControls(null)
  }, [headerControls, mode, wordCount])

  useEffect(() => {
    updateBlockData?.(blockId, {
      content,
    })
  }, [blockId, content, updateBlockData])

  return (
    <div className="prose-block-primitive" data-color-mode="dark">
      {(mode === 'Edit' || mode === 'Split') && (
        <div className="prose-editor-pane">
          <MDEditor
            value={content}
            preview="edit"
            hideToolbar
            textareaProps={{ 'aria-label': 'Write prose and LaTeX' }}
            onChange={(nextContent) => setContent(nextContent ?? '')}
          />
        </div>
      )}

      {(mode === 'Preview' || mode === 'Split') && (
        <div className="prose-preview-pane">
          <MDEditor.Markdown
            source={renderMarkdownWithMath(content)}
            style={{ background: 'transparent', color: 'inherit' }}
          />
        </div>
      )}
    </div>
  )
}

export default ProseBlockPrimitive
