import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentActor } from '@/lib/session'
import { canDownloadDocuments } from '@/lib/rbac'
import { getDocumentStorageAdapter } from '@/lib/documentStorage'
import { recordAudit } from '@/lib/audit'

export async function GET(req: NextRequest, { params }: { params: Promise<{ documentId: string }> }) {
  const actor = await getCurrentActor()
  if (!actor) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  if (!canDownloadDocuments(actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { documentId } = await params
  const document = await db.document.findFirst({ where: { id: documentId, organizationId: actor.organizationId } })
  if (!document) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const adapter = getDocumentStorageAdapter()
  const buffer = await adapter.read(document.storageKey)

  await recordAudit({
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: 'DOWNLOAD',
    entityType: 'Document',
    entityId: document.id,
  })

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': document.contentType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(document.fileName)}"`,
      'Cache-Control': 'no-store',
    },
  })
}
