import { db } from '@/lib/db'
import { getCurrentPatientOrRedirect } from '@/lib/currentPatient'
import { withAudit } from '@/lib/audit'

export default async function PortalRecordsPage() {
  const { session, patient } = await getCurrentPatientOrRedirect()

  const [notes, medications, allergies, diagnoses, documents] = await withAudit(
    { actorId: session.user.id, action: 'VIEW', entityType: 'Patient', entityId: patient.id },
    () =>
      Promise.all([
        db.clinicalNote.findMany({
          where: { patientId: patient.id, signedAt: { not: null } },
          orderBy: { createdAt: 'desc' },
          include: { provider: { include: { user: true } } },
        }),
        db.medication.findMany({ where: { patientId: patient.id, active: true } }),
        db.allergy.findMany({ where: { patientId: patient.id } }),
        db.diagnosis.findMany({ where: { patientId: patient.id } }),
        db.document.findMany({ where: { patientId: patient.id }, orderBy: { createdAt: 'desc' } }),
      ])
  )

  return (
    <div className="max-w-3xl space-y-10">
      <h1 className="text-2xl font-semibold text-gray-900">My Records</h1>

      <section>
        <h2 className="mb-3 font-medium text-gray-900">Visit notes</h2>
        <ul className="space-y-3">
          {notes.map((n) => (
            <li key={n.id} className="rounded-lg border border-gray-200 p-4 text-sm">
              <p className="font-medium text-gray-900">
                {new Date(n.createdAt).toLocaleDateString()} &middot; Dr. {n.provider.user.lastName}
              </p>
              {n.assessment && <p className="mt-2 text-gray-700">Assessment: {n.assessment}</p>}
              {n.plan && <p className="text-gray-700">Plan: {n.plan}</p>}
            </li>
          ))}
          {notes.length === 0 && <p className="text-sm text-gray-500">No signed notes yet.</p>}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-medium text-gray-900">Current medications</h2>
        <ul className="space-y-1 text-sm text-gray-700">
          {medications.map((m) => (
            <li key={m.id}>
              {m.name} {m.dosage ? `— ${m.dosage}` : ''} {m.frequency ? `(${m.frequency})` : ''}
            </li>
          ))}
          {medications.length === 0 && <p className="text-sm text-gray-500">None on file.</p>}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-medium text-gray-900">Allergies</h2>
        <ul className="space-y-1 text-sm text-gray-700">
          {allergies.map((a) => (
            <li key={a.id}>
              {a.substance} {a.reaction ? `— ${a.reaction}` : ''}
            </li>
          ))}
          {allergies.length === 0 && <p className="text-sm text-gray-500">None on file.</p>}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-medium text-gray-900">Diagnoses</h2>
        <ul className="space-y-1 text-sm text-gray-700">
          {diagnoses.map((d) => (
            <li key={d.id}>
              {d.description} ({d.icd10Code})
            </li>
          ))}
          {diagnoses.length === 0 && <p className="text-sm text-gray-500">None on file.</p>}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-medium text-gray-900">Documents</h2>
        <ul className="space-y-1 text-sm text-gray-700">
          {documents.map((d) => (
            <li key={d.id}>{d.fileName}</li>
          ))}
          {documents.length === 0 && <p className="text-sm text-gray-500">No documents uploaded.</p>}
        </ul>
      </section>
    </div>
  )
}
