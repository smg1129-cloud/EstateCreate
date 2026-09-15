// Renders a DocumentModel to a Word (.docx) file the attorney can edit during
// review. Uses the `docx` library. Output is deterministic for a given model.
//
// Lists use manual prefixes rather than Word numbering definitions to keep the
// output stable and dependency-light; article/clause numbers come from the
// generators, which is where legal numbering belongs.

import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  PageBreak,
  Paragraph,
  TextRun,
  type ISectionOptions,
} from 'docx'
import type { Block, DocumentModel, Run } from '../blocks'

function textRuns(runs: Run[]): TextRun[] {
  return runs.map((r) => {
    if (typeof r === 'string') return new TextRun({ text: r })
    return new TextRun({
      text: r.text,
      bold: r.bold,
      italics: r.italic,
      underline: r.underline ? {} : undefined,
      smallCaps: r.smallCaps,
    })
  })
}

function alignFor(a?: string): (typeof AlignmentType)[keyof typeof AlignmentType] | undefined {
  switch (a) {
    case 'center':
      return AlignmentType.CENTER
    case 'right':
      return AlignmentType.RIGHT
    case 'justify':
      return AlignmentType.JUSTIFIED
    case 'left':
      return AlignmentType.LEFT
    default:
      return undefined
  }
}

function blockParagraphs(block: Block): Paragraph[] {
  switch (block.kind) {
    case 'title': {
      const out = [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [new TextRun({ text: block.text.toUpperCase(), bold: true, size: 30 })],
        }),
      ]
      if (block.subtitle) {
        out.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [new TextRun({ text: block.subtitle, italics: true })],
          })
        )
      }
      return out
    }
    case 'article':
      return [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 120 },
          children: [
            new TextRun({ text: `ARTICLE ${block.number}`, bold: true }),
            new TextRun({ text: `\n${block.title.toUpperCase()}`, bold: true, break: 1 }),
          ],
        }),
      ]
    case 'heading':
      return [
        new Paragraph({
          heading: block.level === 1 ? HeadingLevel.HEADING_2 : block.level === 2 ? HeadingLevel.HEADING_3 : HeadingLevel.HEADING_4,
          spacing: { before: 160, after: 80 },
          children: [
            ...(block.numberLabel ? [new TextRun({ text: `${block.numberLabel} `, bold: true })] : []),
            new TextRun({ text: block.text, bold: true }),
          ],
        }),
      ]
    case 'paragraph':
      return [
        new Paragraph({
          alignment: alignFor(block.align) ?? AlignmentType.JUSTIFIED,
          spacing: { after: 160 },
          indent: block.indent ? { left: block.indent * 360 } : undefined,
          children: textRuns(block.runs),
        }),
      ]
    case 'clause':
      return [
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 },
          indent: { left: (block.indent ?? 1) * 360 },
          children: [
            ...(block.number ? [new TextRun({ text: `${block.number} `, bold: true })] : []),
            ...textRuns(block.runs),
          ],
        }),
      ]
    case 'list':
      return block.items.map(
        (item, idx) =>
          new Paragraph({
            spacing: { after: 80 },
            indent: { left: 720, hanging: 360 },
            children: [new TextRun({ text: block.ordered ? `${idx + 1}. ` : '• ' }), ...textRuns(item)],
          })
      )
    case 'spacer':
      return Array.from({ length: block.lines ?? 1 }, () => new Paragraph({ children: [] }))
    case 'pageBreak':
      return [new Paragraph({ children: [new PageBreak()] })]
    case 'signatureBlock': {
      const out: Paragraph[] = []
      if (block.heading) {
        out.push(new Paragraph({ spacing: { before: 240, after: 120 }, children: [new TextRun({ text: block.heading })] }))
      }
      for (const line of block.lines) {
        out.push(new Paragraph({ spacing: { before: 320 }, children: [new TextRun({ text: '____________________________________' })] }))
        out.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({ text: line.name ? `${line.name}, ${line.role}` : line.role }),
              ...(line.withDate ? [new TextRun({ text: '          Date: ______________' })] : []),
            ],
          })
        )
        if (line.caption) {
          out.push(new Paragraph({ children: [new TextRun({ text: line.caption, italics: true, size: 18 })] }))
        }
      }
      return out
    }
    case 'notaryBlock':
      return block.text.map(
        (line) => new Paragraph({ spacing: { after: 120 }, children: textRuns(line) })
      )
    case 'fillIn':
      return [
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({ text: `${block.label}: `, bold: true }),
            new TextRun({ text: '____________________________' }),
            ...(block.note ? [new TextRun({ text: `  (${block.note})`, italics: true, size: 18 })] : []),
          ],
        }),
      ]
  }
}

export async function renderDocx(model: DocumentModel): Promise<Buffer> {
  const children = model.blocks.flatMap(blockParagraphs)
  const section: ISectionOptions = {
    properties: {
      page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
    },
    children,
  }
  const doc = new Document({
    creator: 'EstateCreate',
    title: model.title,
    styles: {
      default: {
        document: { run: { font: 'Times New Roman', size: 24 } },
      },
    },
    sections: [section],
  })
  return Packer.toBuffer(doc)
}
