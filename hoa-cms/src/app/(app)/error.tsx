'use client'

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const isForbidden = error.message === 'Forbidden' || error.name === 'ForbiddenError'

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <h1 className="text-lg font-semibold text-slate-900">
        {isForbidden ? "You don't have access to this." : 'Something went wrong.'}
      </h1>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        {isForbidden
          ? "Your role doesn't permit this action or view. If you believe this is wrong, contact an admin."
          : error.message || 'An unexpected error occurred.'}
      </p>
      <button
        onClick={reset}
        className="mt-4 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
      >
        Try again
      </button>
    </div>
  )
}
