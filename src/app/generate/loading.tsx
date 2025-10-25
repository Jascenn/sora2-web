export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="h-8 w-24 animate-pulse rounded bg-gray-200" />
          <div className="flex items-center gap-6">
            <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      </header>

      {/* Main Content Skeleton */}
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl">
          {/* Title */}
          <div className="mb-2 h-10 w-64 animate-pulse rounded bg-gray-200" />
          <div className="mb-8 h-5 w-96 animate-pulse rounded bg-gray-200" />

          {/* Form Card */}
          <div className="rounded-lg border bg-white p-8 shadow-sm">
            {/* Prompt Label */}
            <div className="mb-2 h-5 w-24 animate-pulse rounded bg-gray-200" />
            {/* Textarea */}
            <div className="mb-2 h-32 w-full animate-pulse rounded-md bg-gray-200" />
            <div className="mb-6 h-4 w-24 animate-pulse rounded bg-gray-200" />

            {/* Parameters Grid */}
            <div className="mb-6 grid gap-6 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <div className="mb-2 h-5 w-20 animate-pulse rounded bg-gray-200" />
                  <div className="h-10 w-full animate-pulse rounded-md bg-gray-200" />
                </div>
              ))}
            </div>

            {/* Credits Info Box */}
            <div className="mb-6 h-24 w-full animate-pulse rounded-md bg-gray-200" />

            {/* Generate Button */}
            <div className="h-12 w-full animate-pulse rounded-md bg-gray-200" />
          </div>

          {/* Tips Section */}
          <div className="mt-8 rounded-lg border bg-white p-6">
            <div className="mb-4 h-6 w-48 animate-pulse rounded bg-gray-200" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-4 w-full animate-pulse rounded bg-gray-200" />
              ))}
            </div>
            <div className="mt-4 h-16 w-full animate-pulse rounded-md bg-gray-200" />
          </div>
        </div>
      </main>
    </div>
  )
}
