interface SkeletonProps {
  className?: string;
}

function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-[var(--color-base-800)] rounded ${className}`}
      aria-hidden="true"
    />
  );
}

export function TableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="overflow-hidden border border-[var(--color-border-subtle)] rounded-lg">
        <table className="min-w-full divide-y divide-[var(--color-border-subtle)]">
          <thead className="bg-[var(--color-base-900)]">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium">
                <Skeleton className="h-3 w-20" />
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium">
                <Skeleton className="h-3 w-16" />
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium">
                <Skeleton className="h-3 w-24" />
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium">
                <Skeleton className="h-3 w-20" />
              </th>
            </tr>
          </thead>
          <tbody className="bg-[var(--color-base-950)] divide-y divide-[var(--color-border-subtle)]">
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  <Skeleton className="h-3 w-32" />
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  <Skeleton className="h-3 w-16" />
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  <Skeleton className="h-3 w-40" />
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  <Skeleton className="h-3 w-20" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-[var(--color-base-900)] border border-[var(--color-border-subtle)] rounded-lg p-4">
      <div className="space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="bg-[var(--color-base-900)] border border-[var(--color-border-subtle)] rounded-lg divide-y divide-[var(--color-border-subtle)]">
        <div className="px-4 py-3">
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="px-4 py-3 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-[var(--color-base-900)] border border-[var(--color-border-subtle)] rounded-lg divide-y divide-[var(--color-border-subtle)]">
        <div className="px-4 py-3">
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="px-4 py-3">
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-3 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}