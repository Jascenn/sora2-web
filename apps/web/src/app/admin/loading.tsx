export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="mb-2 h-8 w-32 animate-pulse rounded bg-gray-200" />
        <div className="h-5 w-48 animate-pulse rounded bg-gray-200" />
      </div>

      {/* Stats Grid - 4 Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border bg-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="mb-2 h-4 w-20 animate-pulse rounded bg-gray-200" />
                <div className="mb-2 h-8 w-24 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
              </div>
              <div className="h-12 w-12 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Stats - 3 Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border bg-white p-6">
            <div className="mb-4 h-6 w-32 animate-pulse rounded bg-gray-200" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="flex items-center justify-between">
                  <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                  <div className="h-6 w-12 animate-pulse rounded-full bg-gray-200" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Credit Stats */}
      <div className="rounded-lg border bg-white p-6">
        <div className="mb-4 h-6 w-48 animate-pulse rounded bg-gray-200" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
      </div>

      {/* Storage */}
      <div className="rounded-lg border bg-white p-6">
        <div className="mb-2 h-6 w-24 animate-pulse rounded bg-gray-200" />
        <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  )
}
