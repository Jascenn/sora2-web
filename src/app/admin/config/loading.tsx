export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-2 h-8 w-32 animate-pulse rounded bg-gray-200" />
          <div className="h-5 w-64 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="h-10 w-24 animate-pulse rounded bg-gray-200" />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-8 w-24 animate-pulse rounded bg-gray-200" />
        ))}
      </div>

      {/* Configs List */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
                  <div className="h-5 w-20 animate-pulse rounded bg-gray-200" />
                </div>
                <div className="h-4 w-full max-w-md animate-pulse rounded bg-gray-200" />
              </div>
              <div className="w-96">
                <div className="h-10 w-full animate-pulse rounded-md bg-gray-200" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Help Text */}
      <div className="rounded-lg border bg-amber-50 p-4">
        <div className="mb-2 h-6 w-32 animate-pulse rounded bg-gray-200" />
        <div className="space-y-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 w-full animate-pulse rounded bg-gray-200" />
          ))}
        </div>
      </div>
    </div>
  )
}
