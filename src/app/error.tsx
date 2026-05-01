'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 text-center">
      <div>
        <h2 className="text-2xl font-bold mb-2">Something went wrong!</h2>
        <p className="text-gray-600 mb-4">{error.message || 'An unexpected error occurred.'}</p>
        <button
          onClick={reset}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
        >
          Try again
        </button>
      </div>
    </div>
  )
}