import Link from 'next/link'

const highlights = [
  {
    title: 'Board-certified clinicians',
    body: 'Every provider is licensed in your state before you can book — no surprises at visit time.',
  },
  {
    title: 'Secure video visits',
    body: 'End-to-end encrypted video, built on infrastructure designed for healthcare data.',
  },
  {
    title: 'Your records, in one place',
    body: 'Visit notes, medications, and documents available to you any time in your patient portal.',
  },
]

export default function HomePage() {
  return (
    <main>
      <section className="mx-auto max-w-6xl px-4 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Virtual care that fits your life
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
          Talk to a licensed clinician from home. Same-week appointments, transparent pricing, and a
          portal that keeps your records organized.
        </p>
        <Link
          href="/book"
          className="mt-8 inline-block rounded-md bg-brand-600 px-6 py-3 text-base font-medium text-white hover:bg-brand-700"
        >
          Book your visit
        </Link>
      </section>

      <section className="bg-gray-50 py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:grid-cols-3">
          {highlights.map((item) => (
            <div key={item.title} className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">{item.title}</h2>
              <p className="mt-2 text-sm text-gray-600">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
