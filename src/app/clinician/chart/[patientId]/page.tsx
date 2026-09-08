import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { assertCanAccessPatientChart } from '@/lib/rbac'
import { withAudit } from '@/lib/audit'
import { addClinicalNote, addMedication, addAllergy, addDiagnosis } from './actions'
import { PrescribeForm } from './PrescribeForm'

export default async function ClinicianChartPage({ params }: { params: { patientId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) notFound()

  await assertCanAccessPatientChart(
    { id: session.user.id, role: session.user.role, organizationId: session.user.organizationId },
    params.patientId
  )

  const patient = await withAudit(
    { actorId: session.user.id, action: 'VIEW', entityType: 'Patient', entityId: params.patientId },
    () =>
      db.patient.findUnique({
        where: { id: params.patientId },
        include: {
          user: true,
          clinicalNotes: { orderBy: { createdAt: 'desc' }, include: { provider: { include: { user: true } } } },
          medications: { where: { active: true } },
          allergies: true,
          diagnoses: true,
          prescriptions: { orderBy: { createdAt: 'desc' } },
        },
      })
  )

  if (!patient) notFound()

  return (
    <div className="max-w-4xl space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          {patient.user.firstName} {patient.user.lastName}
        </h1>
        <p className="text-sm text-gray-500">
          DOB {new Date(patient.dateOfBirth).toLocaleDateString()} &middot; {patient.state}
        </p>
      </div>

      <section>
        <h2 className="mb-3 font-medium text-gray-900">Allergies</h2>
        <ul className="mb-3 space-y-1 text-sm text-gray-700">
          {patient.allergies.map((a) => (
            <li key={a.id}>
              {a.substance} {a.reaction && `— ${a.reaction}`} {a.severity && `(${a.severity})`}
            </li>
          ))}
          {patient.allergies.length === 0 && <p className="text-sm text-gray-400">None on file.</p>}
        </ul>
        <form action={addAllergy} className="flex flex-wrap gap-2">
          <input type="hidden" name="patientId" value={patient.id} />
          <input name="substance" placeholder="Substance" required className="rounded-md border border-gray-300 px-2 py-1 text-sm" />
          <input name="reaction" placeholder="Reaction" className="rounded-md border border-gray-300 px-2 py-1 text-sm" />
          <input name="severity" placeholder="Severity" className="rounded-md border border-gray-300 px-2 py-1 text-sm" />
          <button className="rounded-md bg-gray-800 px-3 py-1 text-sm text-white">Add</button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 font-medium text-gray-900">Medications</h2>
        <ul className="mb-3 space-y-1 text-sm text-gray-700">
          {patient.medications.map((m) => (
            <li key={m.id}>
              {m.name} {m.dosage && `— ${m.dosage}`} {m.frequency && `(${m.frequency})`}
            </li>
          ))}
          {patient.medications.length === 0 && <p className="text-sm text-gray-400">None on file.</p>}
        </ul>
        <form action={addMedication} className="flex flex-wrap gap-2">
          <input type="hidden" name="patientId" value={patient.id} />
          <input name="name" placeholder="Medication" required className="rounded-md border border-gray-300 px-2 py-1 text-sm" />
          <input name="dosage" placeholder="Dosage" className="rounded-md border border-gray-300 px-2 py-1 text-sm" />
          <input name="frequency" placeholder="Frequency" className="rounded-md border border-gray-300 px-2 py-1 text-sm" />
          <button className="rounded-md bg-gray-800 px-3 py-1 text-sm text-white">Add</button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 font-medium text-gray-900">Diagnoses</h2>
        <ul className="mb-3 space-y-1 text-sm text-gray-700">
          {patient.diagnoses.map((d) => (
            <li key={d.id}>
              {d.description} ({d.icd10Code})
            </li>
          ))}
          {patient.diagnoses.length === 0 && <p className="text-sm text-gray-400">None on file.</p>}
        </ul>
        <form action={addDiagnosis} className="flex flex-wrap gap-2">
          <input type="hidden" name="patientId" value={patient.id} />
          <input name="icd10Code" placeholder="ICD-10 code" required className="rounded-md border border-gray-300 px-2 py-1 text-sm" />
          <input name="description" placeholder="Description" required className="rounded-md border border-gray-300 px-2 py-1 text-sm" />
          <button className="rounded-md bg-gray-800 px-3 py-1 text-sm text-white">Add</button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 font-medium text-gray-900">Prescriptions</h2>
        <ul className="mb-3 space-y-1 text-sm text-gray-700">
          {patient.prescriptions.map((p) => (
            <li key={p.id}>
              {p.medicationName} {p.dosage} &times; {p.quantity} — {p.status}
              {p.isControlled && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">Controlled</span>}
            </li>
          ))}
          {patient.prescriptions.length === 0 && <p className="text-sm text-gray-400">None on file.</p>}
        </ul>
        <PrescribeForm patientId={patient.id} />
      </section>

      <section>
        <h2 className="mb-3 font-medium text-gray-900">Visit notes</h2>
        <ul className="mb-4 space-y-3">
          {patient.clinicalNotes.map((n) => (
            <li key={n.id} className="rounded-lg border border-gray-200 p-3 text-sm">
              <p className="mb-1 text-xs text-gray-500">
                {new Date(n.createdAt).toLocaleString()} &middot; Dr. {n.provider.user.lastName}
                {n.signedAt ? ' · Signed' : ' · Draft'}
              </p>
              {n.subjective && <p><strong>S:</strong> {n.subjective}</p>}
              {n.objective && <p><strong>O:</strong> {n.objective}</p>}
              {n.assessment && <p><strong>A:</strong> {n.assessment}</p>}
              {n.plan && <p><strong>P:</strong> {n.plan}</p>}
            </li>
          ))}
          {patient.clinicalNotes.length === 0 && <p className="text-sm text-gray-400">No notes yet.</p>}
        </ul>

        <form action={addClinicalNote} className="space-y-2 rounded-lg border border-gray-200 p-4">
          <input type="hidden" name="patientId" value={patient.id} />
          <p className="text-xs font-medium uppercase text-gray-500">New SOAP note</p>
          <textarea name="subjective" placeholder="Subjective" rows={2} className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm" />
          <textarea name="objective" placeholder="Objective" rows={2} className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm" />
          <textarea name="assessment" placeholder="Assessment" rows={2} className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm" />
          <textarea name="plan" placeholder="Plan" rows={2} className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm" />
          <button className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            Sign and save note
          </button>
        </form>
      </section>
    </div>
  )
}
