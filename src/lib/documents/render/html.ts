// Renders a DocumentModel to HTML for on-screen preview in the portal and the
// attorney review screen. Clause-level `ref`s become anchor ids so review
// comments can point at a specific clause. Attorney-only flags are NOT rendered
// here (they are shown separately in the review UI) — this is the client-facing
// view of the document text.

import type { Block, DocumentModel, Run } from '../blocks'

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function runHtml(run: Run): string {
  if (typeof run === 'string') return esc(run)
  let html = esc(run.text)
  if (run.bold) html = `<strong>${html}</strong>`
  if (run.italic) html = `<em>${html}</em>`
  if (run.underline) html = `<u>${html}</u>`
  if (run.smallCaps) html = `<span class="sc">${html}</span>`
  return html
}

function runsHtml(runs: Run[]): string {
  return runs.map(runHtml).join('')
}

function anchor(ref?: string): string {
  return ref ? ` id="c-${esc(ref)}"` : ''
}

function blockHtml(block: Block): string {
  switch (block.kind) {
    case 'title':
      return `<h1 class="doc-title"${anchor(block.ref)}>${esc(block.text)}</h1>${
        block.subtitle ? `<p class="doc-subtitle">${esc(block.subtitle)}</p>` : ''
      }`
    case 'article':
      return `<h2 class="doc-article"${anchor(block.ref)}><span class="art-num">ARTICLE ${esc(
        block.number
      )}</span><br/><span class="art-title">${esc(block.title.toUpperCase())}</span></h2>`
    case 'heading': {
      const tag = block.level === 1 ? 'h2' : block.level === 2 ? 'h3' : 'h4'
      const label = block.numberLabel ? `${esc(block.numberLabel)} ` : ''
      return `<${tag} class="doc-heading"${anchor(block.ref)}>${label}${esc(block.text)}</${tag}>`
    }
    case 'paragraph':
      return `<p class="doc-para" style="${block.indent ? `margin-left:${block.indent * 1.5}em;` : ''}text-align:${
        block.align ?? 'justify'
      }"${anchor(block.ref)}>${runsHtml(block.runs)}</p>`
    case 'clause':
      return `<p class="doc-clause" style="margin-left:${(block.indent ?? 1) * 1.5}em"${anchor(block.ref)}>${
        block.number ? `<span class="clause-num">${esc(block.number)}</span> ` : ''
      }${runsHtml(block.runs)}</p>`
    case 'list': {
      const tag = block.ordered ? 'ol' : 'ul'
      const items = block.items.map((i) => `<li>${runsHtml(i)}</li>`).join('')
      return `<${tag} class="doc-list"${anchor(block.ref)}>${items}</${tag}>`
    }
    case 'spacer':
      return `<div class="doc-spacer" style="height:${(block.lines ?? 1) * 1}em"></div>`
    case 'pageBreak':
      return `<hr class="doc-pagebreak"/>`
    case 'signatureBlock': {
      const heading = block.heading ? `<p class="sig-heading">${esc(block.heading)}</p>` : ''
      const lines = block.lines
        .map(
          (l) => `<div class="sig-line">
            <div class="sig-rule">${l.name ? esc(l.name) : '&nbsp;'}</div>
            <div class="sig-label">${esc(l.role)}${l.withDate ? '<span class="sig-date">Date: __________</span>' : ''}</div>
            ${l.caption ? `<div class="sig-caption">${esc(l.caption)}</div>` : ''}
          </div>`
        )
        .join('')
      return `<div class="doc-signature"${anchor(block.ref)}>${heading}${lines}</div>`
    }
    case 'notaryBlock':
      return `<div class="doc-notary"${anchor(block.ref)}>${block.text
        .map((line) => `<p>${runsHtml(line)}</p>`)
        .join('')}</div>`
    case 'fillIn':
      return `<p class="doc-fillin"${anchor(block.ref)}><span class="fillin-label">${esc(
        block.label
      )}:</span> <span class="fillin-blank">____________________________</span>${
        block.note ? `<span class="fillin-note"> (${esc(block.note)})</span>` : ''
      }</p>`
  }
}

export const DOCUMENT_PREVIEW_CSS = `
.doc { font-family: 'Times New Roman', Georgia, serif; color:#111; line-height:1.5; max-width:8.5in; margin:0 auto; background:#fff; padding:1in; }
.doc-title { text-align:center; font-size:1.4rem; font-weight:700; text-transform:uppercase; letter-spacing:0.02em; margin:0 0 .25rem; }
.doc-subtitle { text-align:center; font-style:italic; margin:0 0 1.5rem; }
.doc-article { text-align:center; margin:1.6rem 0 .6rem; font-size:1rem; }
.doc-article .art-num { font-weight:700; letter-spacing:0.08em; }
.doc-article .art-title { font-weight:700; }
.doc-heading { margin:1rem 0 .4rem; font-size:1rem; }
.doc-para { margin:0 0 .7rem; }
.doc-clause { margin:0 0 .6rem; }
.clause-num { font-weight:700; }
.sc { font-variant:small-caps; }
.doc-list { margin:0 0 .7rem 1.5rem; }
.doc-list li { margin-bottom:.3rem; }
.doc-pagebreak { border:none; border-top:1px dashed #bbb; margin:1.5rem 0; }
.doc-signature { margin:1.5rem 0; }
.sig-heading { margin-bottom:1rem; }
.sig-line { margin:1.6rem 0 .2rem; }
.sig-rule { border-bottom:1px solid #111; min-height:1.4em; max-width:20em; }
.sig-label { font-size:.85rem; color:#333; display:flex; justify-content:space-between; max-width:20em; }
.sig-caption { font-size:.8rem; font-style:italic; color:#555; }
.doc-notary { margin:1.2rem 0; font-size:.95rem; }
.doc-fillin { margin:.4rem 0; }
.fillin-note { font-style:italic; color:#555; font-size:.85rem; }
`

/** Renders just the document body (blocks) as an HTML fragment. */
export function renderBodyHtml(model: DocumentModel): string {
  return `<div class="doc">${model.blocks.map(blockHtml).join('\n')}</div>`
}

/** Full standalone HTML page (used for print-to-PDF fallback / downloads). */
export function renderFullHtml(model: DocumentModel): string {
  return `<!doctype html><html><head><meta charset="utf-8"/><title>${esc(
    model.title
  )}</title><style>body{margin:0;background:#f3f4f6}@media print{body{background:#fff}.doc{padding:1in}}${DOCUMENT_PREVIEW_CSS}</style></head><body>${renderBodyHtml(
    model
  )}</body></html>`
}
