/**
 * Loading Skeleton Components
 *
 * Week 4: Performance Optimization - Loading States
 * Reusable loading placeholders for lazy-loaded components
 */

export function PageLoadingSkeleton() {
  return (
    <main className="min-h-screen bg-gray-50 animate-pulse">
      <div className="border-b bg-white h-16" />
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="h-10 bg-gray-200 rounded w-1/3" />
          <div className="h-6 bg-gray-200 rounded w-2/3" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    </main>
  )
}

export function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="h-4 bg-gray-200 rounded w-64" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border bg-white p-6">
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-20" />
              <div className="h-8 bg-gray-200 rounded w-24" />
              <div className="h-3 bg-gray-200 rounded w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function GalleryLoadingSkeleton() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="border-b bg-white h-16 animate-pulse" />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-32 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-48" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="rounded-lg border bg-white overflow-hidden animate-pulse">
              <div className="aspect-video bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

export function AdminLoadingSkeleton() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="w-64 border-r bg-white animate-pulse p-6">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
      <div className="flex-1 p-8">
        <DashboardLoadingSkeleton />
      </div>
    </div>
  )
}

export function FormLoadingSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-6 animate-pulse">
        <div className="text-center space-y-2">
          <div className="h-8 bg-gray-200 rounded w-48 mx-auto" />
          <div className="h-4 bg-gray-200 rounded w-64 mx-auto" />
        </div>
        <div className="rounded-lg border bg-white p-8 space-y-4">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-20" />
            <div className="h-10 bg-gray-200 rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-20" />
            <div className="h-10 bg-gray-200 rounded" />
          </div>
          <div className="h-10 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  )
}
