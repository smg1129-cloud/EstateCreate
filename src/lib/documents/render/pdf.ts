// Renders a DocumentModel to a print-ready PDF using pdfkit. pdfkit handles
// text flow and automatic pagination; we drive fonts, alignment, indentation,
// and spacing from the block model. Output is deterministic for a given model.

import PDFDocument from 'pdfkit'
import type { Block, DocumentModel, Run } from '../blocks'

const FONT = 'Times-Roman'
const FONT_BOLD = 'Times-Bold'
const FONT_ITALIC = 'Times-Italic'
const FONT_BOLD_ITALIC = 'Times-BoldItalic'
const BODY_SIZE = 12

function fontFor(bold?: boolean, italic?: boolean): string {
  if (bold && italic) return FONT_BOLD_ITALIC
  if (bold) return FONT_BOLD
  if (italic) return FONT_ITALIC
  return FONT
}

type Doc = InstanceType<typeof PDFDocument>

function writeRuns(doc: Doc, runs: Run[], opts: PDFKit.Mixins.TextOptions = {}): void {
  runs.forEach((run, i) => {
    const isLast = i === runs.length - 1
    if (typeof run === 'string') {
      doc.font(FONT).text(run, { ...opts, continued: !isLast })
    } else {
      doc.font(fontFor(run.bold, run.italic)).text(run.text, {
        ...opts,
        continued: !isLast,
        underline: run.underline,
      })
    }
  })
  doc.font(FONT)
}

function blockToPdf(doc: Doc, block: Block): void {
  const { left, right } = doc.page.margins
  const usableWidth = doc.page.width - left - right

  switch (block.kind) {
    case 'title':
      doc.moveDown(0.5)
      doc.font(FONT_BOLD).fontSize(16).text(block.text.toUpperCase(), { align: 'center' })
      if (block.subtitle) {
        doc.font(FONT_ITALIC).fontSize(BODY_SIZE).text(block.subtitle, { align: 'center' })
      }
      doc.font(FONT).fontSize(BODY_SIZE).moveDown(1)
      break
    case 'article':
      doc.moveDown(0.8)
      doc.font(FONT_BOLD).fontSize(BODY_SIZE).text(`ARTICLE ${block.number}`, { align: 'center' })
      doc.font(FONT_BOLD).fontSize(BODY_SIZE).text(block.title.toUpperCase(), { align: 'center' })
      doc.font(FONT).moveDown(0.5)
      break
    case 'heading':
      doc.moveDown(0.4)
      doc.font(FONT_BOLD).fontSize(BODY_SIZE).text(`${block.numberLabel ? block.numberLabel + ' ' : ''}${block.text}`)
      doc.font(FONT).moveDown(0.2)
      break
    case 'paragraph':
      doc.fontSize(BODY_SIZE)
      writeRuns(doc, block.runs, {
        align: (block.align as PDFKit.Mixins.TextOptions['align']) ?? 'justify',
        indent: block.indent ? block.indent * 18 : 0,
        width: usableWidth,
      })
      doc.moveDown(0.5)
      break
    case 'clause':
      doc.fontSize(BODY_SIZE)
      writeRuns(doc, block.number ? [{ text: block.number + ' ', bold: true }, ...block.runs] : block.runs, {
        align: 'justify',
        indent: (block.indent ?? 1) * 18,
        width: usableWidth,
      })
      doc.moveDown(0.4)
      break
    case 'list':
      doc.fontSize(BODY_SIZE)
      block.items.forEach((item, idx) => {
        writeRuns(doc, [{ text: block.ordered ? `${idx + 1}.  ` : '•  ' }, ...item], {
          indent: 18,
          width: usableWidth,
        })
        doc.moveDown(0.2)
      })
      doc.moveDown(0.3)
      break
    case 'spacer':
      doc.moveDown(block.lines ?? 1)
      break
    case 'pageBreak':
      doc.addPage()
      break
    case 'signatureBlock':
      doc.fontSize(BODY_SIZE)
      if (block.heading) {
        doc.moveDown(0.5)
        doc.text(block.heading)
      }
      for (const line of block.lines) {
        doc.moveDown(1.4)
        doc.text('____________________________________')
        doc.text(line.name ? `${line.name}, ${line.role}` : line.role, { continued: Boolean(line.withDate) })
        if (line.withDate) doc.text('          Date: ______________')
        if (line.caption) doc.font(FONT_ITALIC).fontSize(10).text(line.caption).font(FONT).fontSize(BODY_SIZE)
      }
      break
    case 'notaryBlock':
      doc.fontSize(BODY_SIZE).moveDown(0.5)
      for (const line of block.text) {
        writeRuns(doc, line, { width: usableWidth })
        doc.moveDown(0.3)
      }
      break
    case 'fillIn':
      doc.fontSize(BODY_SIZE)
      writeRuns(doc, [
        { text: `${block.label}: `, bold: true },
        '____________________________',
        ...(block.note ? [{ text: `  (${block.note})`, italic: true }] : []),
      ])
      doc.moveDown(0.3)
      break
  }
}

export function renderPdf(model: DocumentModel): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 72, bottom: 72, left: 72, right: 72 },
      info: { Title: model.title, Author: 'EstateCreate' },
    })
    const chunks: Buffer[] = []
    doc.on('data', (c: Buffer) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.font(FONT).fontSize(BODY_SIZE)
    for (const block of model.blocks) {
      blockToPdf(doc, block)
    }
    doc.end()
  })
}
