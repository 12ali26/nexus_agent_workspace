import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import {
  COLORS,
  estimateBlockHeight,
  renderAssumptionBlock,
  renderChartBlock,
  renderEquationBlock,
  renderMonteCarloBlock,
  renderPlaceholderBlock,
  renderProgressBlock,
  renderProseBlock,
  renderRegressionBlock,
  renderStatsBlock,
  renderTableBlock,
} from './blockRenderers'
import { getThemeToken } from '../styles/themeTokens'

const paperSizes = {
  A3: { height: 420, width: 297 },
  A4: { height: 297, width: 210 },
  Letter: { height: 279, width: 216 },
}

function dispatchExportToast(message, type = 'info') {
  window.dispatchEvent(
    new CustomEvent('nexus-toast', {
      detail: { message, type },
    }),
  )
}

function sanitizeFilename(value) {
  return String(value || 'NEXUS_Analysis')
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_')
}

function getPageSize(paperSize = 'A4') {
  return paperSizes[paperSize] ?? paperSizes.A4
}

function drawPageBackground(doc, pageWidth, pageHeight) {
  doc.setFillColor(...COLORS.bg)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')
  doc.setFillColor(...COLORS.orange)
  doc.rect(0, 0, pageWidth, 2, 'F')
}

function drawFooter(doc, projectName, pageNumber, pageWidth, pageHeight, margin) {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...COLORS.border)
  doc.text(projectName, margin, pageHeight - 8, { maxWidth: pageWidth / 2 })
  doc.text(`Page ${pageNumber}`, pageWidth - margin, pageHeight - 8, {
    align: 'right',
  })
}

function renderBlock(doc, block, x, y, width) {
  switch (block.type) {
    case 'table':
      return renderTableBlock(doc, block, x, y, width)
    case 'chart':
      return renderChartBlock(doc, block, x, y, width)
    case 'equation':
      return renderEquationBlock(doc, block, x, y, width)
    case 'stats':
    case 'stats-block':
      return renderStatsBlock(doc, block, x, y, width)
    case 'regression':
      return renderRegressionBlock(doc, block, x, y, width)
    case 'prose-block':
      return renderProseBlock(doc, block, x, y, width)
    case 'assumption-flag':
      return renderAssumptionBlock(doc, block, x, y, width)
    case 'monte-carlo':
      return renderMonteCarloBlock(doc, block, x, y, width)
    case 'progress-step':
      return renderProgressBlock(doc, block, x, y, width)
    default:
      return renderPlaceholderBlock(
        doc,
        block,
        x,
        y,
        width,
        `${block.type} visual export not yet supported`,
      )
  }
}

async function exportCanvasScreenshotFallback(projectName, options = {}) {
  const canvas = document.getElementById('nexus-canvas')

  if (!canvas) {
    throw new Error('Canvas not found')
  }

  const paperSize = options.paperSize || 'A4'
  const scale = Number(options.resolution) || 2
  const pageSize = getPageSize(paperSize)
  const pdf = new jsPDF({
    format: paperSize.toLowerCase(),
    orientation: 'landscape',
    unit: 'mm',
  })
  const pageWidth = pageSize.height
  const pageHeight = pageSize.width
  const canvasImage = await html2canvas(canvas, {
    allowTaint: true,
    backgroundColor: getThemeToken('--bg-base', '#0b0f14'),
    logging: false,
    scale,
    useCORS: true,
  })
  const imgData = canvasImage.toDataURL('image/png')
  const ratio = Math.min(pageWidth / canvasImage.width, pageHeight / canvasImage.height)
  const scaledWidth = canvasImage.width * ratio
  const scaledHeight = canvasImage.height * ratio

  pdf.setFillColor(...COLORS.bg)
  pdf.rect(0, 0, pageWidth, pageHeight, 'F')
  pdf.addImage(
    imgData,
    'PNG',
    (pageWidth - scaledWidth) / 2,
    (pageHeight - scaledHeight) / 2,
    scaledWidth,
    scaledHeight,
  )
  pdf.save(`${sanitizeFilename(projectName)}_${new Date().toISOString().split('T')[0]}.pdf`)
}

// NEXUS PDF Export - Block by Block
// Native PDF rendering - selectable text, proper tables, vector output.
// AGENT: can trigger export via nex export pdf command.
export async function exportCanvasToPDF(
  projectName = 'NEXUS Analysis',
  blocks = [],
  options = {},
) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    dispatchExportToast('No blocks to export. Add content to the canvas first.', 'warning')
    return
  }

  dispatchExportToast('Generating PDF...')

  try {
    const paperSize = options.paperSize || 'A4'
    const includeCoverPage = options.includeCoverPage !== false
    const pageSize = getPageSize(paperSize)
    const pageWidth = pageSize.width
    const pageHeight = pageSize.height
    const margin = 15
    const contentWidth = pageWidth - margin * 2
    const doc = new jsPDF({
      format: paperSize.toLowerCase(),
      orientation: 'portrait',
      unit: 'mm',
    })

    if (includeCoverPage) {
      doc.setFillColor(...COLORS.bg)
      doc.rect(0, 0, pageWidth, pageHeight, 'F')
      doc.setFillColor(...COLORS.orange)
      doc.rect(0, 0, pageWidth, 3, 'F')
      doc.roundedRect(margin, 40, 16, 16, 3, 3, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(255, 255, 255)
      doc.text('N', margin + 8, 51, { align: 'center' })
      doc.setFontSize(10)
      doc.setTextColor(...COLORS.textMuted)
      doc.text('NEXUS IDE', margin + 20, 51)
      doc.setFontSize(28)
      doc.setTextColor(...COLORS.text)
      doc.text(projectName, margin, 90, { maxWidth: contentWidth })
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(...COLORS.textMuted)
      doc.text(
        new Date().toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          weekday: 'long',
          year: 'numeric',
        }),
        margin,
        100,
      )
      doc.text(`${blocks.length} analysis block${blocks.length !== 1 ? 's' : ''}`, margin, 108)
      doc.setDrawColor(...COLORS.border)
      doc.setLineWidth(0.3)
      doc.line(margin, 115, pageWidth - margin, 115)
      doc.setFontSize(8)
      doc.text('CONTENTS', margin, 125)

      blocks.slice(0, 17).forEach((block, index) => {
        const label = block.data?.name || block.data?.title || block.title || block.type
        const y = 133 + index * 8
        doc.setFontSize(9)
        doc.setTextColor(...COLORS.text)
        doc.text(`${index + 1}.  ${label}`, margin + 4, y, {
          maxWidth: contentWidth - 36,
        })
        doc.setTextColor(...COLORS.border)
        doc.text(block.type, pageWidth - margin, y, { align: 'right' })
      })

      if (blocks.length > 17) {
        doc.setFontSize(8)
        doc.setTextColor(...COLORS.textMuted)
        doc.text(`+ ${blocks.length - 17} more blocks`, margin + 4, 133 + 17 * 8)
      }

      doc.setFontSize(7)
      doc.setTextColor(...COLORS.border)
      doc.text('Generated by NEXUS IDE - nexus-ide.app', pageWidth / 2, pageHeight - 8, {
        align: 'center',
      })
      doc.addPage()
    }

    drawPageBackground(doc, pageWidth, pageHeight)
    let currentY = margin + 5
    let pageNumber = includeCoverPage ? 2 : 1

    const addPageIfNeeded = (requiredHeight) => {
      if (currentY + requiredHeight <= pageHeight - margin) {
        return
      }

      drawFooter(doc, projectName, pageNumber, pageWidth, pageHeight, margin)
      doc.addPage()
      pageNumber += 1
      drawPageBackground(doc, pageWidth, pageHeight)
      currentY = margin + 5
    }

    blocks.forEach((block) => {
      addPageIfNeeded(estimateBlockHeight(block))

      const previousY = currentY

      try {
        currentY = renderBlock(doc, block, margin, currentY, contentWidth)
      } catch (error) {
        console.error(`Failed to render block ${block.type}:`, error)
        currentY = renderPlaceholderBlock(
          doc,
          block,
          margin,
          previousY,
          contentWidth,
          `${block.type} export failed`,
        )
      }

      currentY += 4
    })

    drawFooter(doc, projectName, pageNumber, pageWidth, pageHeight, margin)

    const filename = `${sanitizeFilename(projectName)}_${new Date()
      .toISOString()
      .split('T')[0]}.pdf`
    doc.save(filename)
    dispatchExportToast(`✓ Exported: ${filename}`, 'success')
  } catch (error) {
    console.error('Block export error:', error)
    dispatchExportToast('Native export failed. Falling back to screenshot...', 'warning')

    try {
      await exportCanvasScreenshotFallback(projectName, options)
      dispatchExportToast('Exported screenshot fallback PDF', 'success')
    } catch (fallbackError) {
      console.error('Export fallback error:', fallbackError)
      dispatchExportToast('Export failed. Try again.', 'error')
    }
  }
}

export async function exportNotebookToPDF(notebookEl, title = 'Notebook', options = {}) {
  if (!notebookEl) return

  dispatchExportToast('Exporting notebook...')

  try {
    const scale = Number(options.resolution) || 2
    const paperSize = options.paperSize || 'A4'
    const pageSize = getPageSize(paperSize)
    const canvasImage = await html2canvas(notebookEl, {
      backgroundColor: getThemeToken('--bg-float', '#1e2530'),
      logging: false,
      scale,
      useCORS: true,
    })
    const imgWidth = canvasImage.width
    const imgHeight = canvasImage.height
    const pdfHeight = pageSize.height
    const pdfWidth = pageSize.width
    const margin = 15
    const contentWidth = pdfWidth - margin * 2
    const ratio = contentWidth / imgWidth
    const scaledHeight = imgHeight * ratio
    const pdf = new jsPDF({
      format: paperSize.toLowerCase(),
      orientation: 'portrait',
      unit: 'mm',
    })

    pdf.setFillColor(21, 27, 35)
    pdf.rect(0, 0, pdfWidth, pdfHeight, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(18)
    pdf.setFont('helvetica', 'bold')
    pdf.text(title, margin, margin + 5)
    pdf.setFontSize(9)
    pdf.setTextColor(150, 150, 180)
    pdf.text(`NEXUS IDE  •  ${new Date().toLocaleDateString()}`, margin, margin + 12)

    let yPosition = margin + 20
    let remainingHeight = scaledHeight
    let sourceY = 0

    while (remainingHeight > 0) {
      const pageContentHeight = pdfHeight - yPosition - margin
      const sliceHeight = Math.min(remainingHeight, pageContentHeight)
      const sourceSliceHeight = sliceHeight / ratio
      const sliceCanvas = document.createElement('canvas')
      sliceCanvas.width = imgWidth
      sliceCanvas.height = sourceSliceHeight
      const context = sliceCanvas.getContext('2d')
      context.drawImage(canvasImage, 0, -sourceY)
      pdf.addImage(
        sliceCanvas.toDataURL('image/png'),
        'PNG',
        margin,
        yPosition,
        contentWidth,
        sliceHeight,
      )
      remainingHeight -= sliceHeight
      sourceY += sourceSliceHeight

      if (remainingHeight > 0) {
        pdf.addPage()
        pdf.setFillColor(21, 27, 35)
        pdf.rect(0, 0, pdfWidth, pdfHeight, 'F')
        yPosition = margin
      }
    }

    pdf.setFontSize(8)
    pdf.setTextColor(100, 100, 120)
    pdf.text('NEXUS IDE', pdfWidth / 2, pdfHeight - 5, { align: 'center' })

    const filename = `${sanitizeFilename(title)}_notebook_${new Date()
      .toISOString()
      .split('T')[0]}.pdf`
    pdf.save(filename)
    dispatchExportToast(`Notebook exported: ${filename}`, 'success')
  } catch (error) {
    dispatchExportToast('Notebook export failed.', 'error')
    console.error('Notebook export error:', error)
  }
}
