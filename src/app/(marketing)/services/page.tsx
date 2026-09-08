const services = [
  { name: 'Primary care check-ins', desc: 'Routine wellness visits, prescription refills, lab review.' },
  { name: 'Urgent, non-emergency care', desc: 'Colds, rashes, minor infections, and other same-week concerns.' },
  { name: 'Mental health', desc: 'Talk therapy and psychiatric medication management.' },
  { name: 'Chronic condition management', desc: 'Ongoing support for diabetes, hypertension, and more.' },
]

export default function ServicesPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900">Services</h1>
      <p className="mt-2 text-gray-600">
        Every visit is with a clinician licensed in your state. If we&apos;re not the right fit for your
        needs, we&apos;ll tell you and help you find appropriate care.
      </p>
      <dl className="mt-10 grid gap-6 sm:grid-cols-2">
        {services.map((s) => (
          <div key={s.name} className="rounded-lg border border-gray-200 p-5">
            <dt className="font-semibold text-gray-900">{s.name}</dt>
            <dd className="mt-1 text-sm text-gray-600">{s.desc}</dd>
          </div>
        ))}
      </dl>
    </main>
  )
}
