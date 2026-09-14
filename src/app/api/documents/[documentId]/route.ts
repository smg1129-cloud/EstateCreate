import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { canAccessMatter, isStaff } from '@/lib/rbac'
import { db } from '@/lib/db'
import { getStorage } from '@/lib/storage'
import { recordAudit } from '@/lib/audit'

// Streams a rendered document artifact (PDF or DOCX) with access control and an
// audit entry. Not protected by middleware (API path), so auth is enforced here.
export async function GET(req: NextRequest, { params }: { params: { documentId: string } }) {
  const actor = await getCurrentUser()
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const doc = await db.generatedDocument.findUnique({ where: { id: params.documentId } })
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!(await canAccessMatter(actor, doc.matterId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Clients may only download an approved or executed document; staff anytime.
  if (!isStaff(actor) && !(doc.status === 'APPROVED' || doc.status === 'EXECUTED')) {
    return NextResponse.json({ error: 'This document is not yet available for download.' }, { status: 403 })
  }

  const format = req.nextUrl.searchParams.get('format') === 'docx' ? 'docx' : 'pdf'
  const key = format === 'docx' ? doc.docxKey : doc.pdfKey
  if (!key) return NextResponse.json({ error: 'Artifact not available' }, { status: 404 })

  let bytes: Buffer
  try {
    bytes = await getStorage().read(key)
  } catch {
    return NextResponse.json({ error: 'Artifact not found in storage' }, { status: 404 })
  }

  await recordAudit({ actorId: actor.id, action: 'DOWNLOAD', entityType: 'GeneratedDocument', entityId: doc.id, metadata: { format } })

  const filename = `${doc.title.replace(/[^a-z0-9]+/gi, '_')}.${format}`
  const contentType =
    format === 'docx'
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : 'application/pdf'

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
