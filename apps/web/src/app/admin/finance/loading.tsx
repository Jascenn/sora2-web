export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="mb-2 h-8 w-32 animate-pulse rounded bg-gray-200" />
        <div className="h-5 w-48 animate-pulse rounded bg-gray-200" />
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="h-10 w-32 animate-pulse rounded-md bg-gray-200" />
      </div>

      {/* Transactions Table */}
      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">
                  <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
                </th>
                <th className="px-4 py-3 text-left">
                  <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
                </th>
                <th className="px-4 py-3 text-left">
                  <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
                </th>
                <th className="px-4 py-3 text-left">
                  <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
                </th>
                <th className="px-4 py-3 text-left">
                  <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
                </th>
                <th className="px-4 py-3 text-left">
                  <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                      <div className="h-3 w-32 animate-pulse rounded bg-gray-200" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t px-4 py-3">
          <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
          <div className="flex gap-2">
            <div className="h-8 w-16 animate-pulse rounded bg-gray-200" />
            <div className="h-8 w-16 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  )
}
