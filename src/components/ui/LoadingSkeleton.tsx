interface LoadingSkeletonProps {
  lines?: number;
  height?: string;
  className?: string;
}

export function LoadingSkeleton({ lines = 3, height = 'h-4', className = '' }: LoadingSkeletonProps) {
  return (
    <div className={`animate-pulse ${className}`} role="status" aria-label="Contenu en cours de chargement">
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`bg-gray-200 rounded ${height} ${
              index === lines - 1 ? 'w-3/4' : 'w-full'
            }`}
            aria-hidden="true"
          />
        ))}
      </div>
      <span className="sr-only">Chargement en cours...</span>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-6" role="status" aria-label="Tableau de bord en cours de chargement">
      <div className="max-w-7xl mx-auto">
        {/* Header skeleton */}
        <div className="mb-8">
          <LoadingSkeleton lines={1} height="h-8" className="mb-2" />
          <LoadingSkeleton lines={1} height="h-4" className="w-1/2" />
        </div>

        {/* KPI Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-lg shadow animate-pulse"
              aria-hidden="true"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-8 h-8 bg-gray-200 rounded" />
                <div className="w-4 h-4 bg-gray-200 rounded" />
              </div>
              <div className="space-y-2">
                <div className="w-16 h-8 bg-gray-200 rounded" />
                <div className="w-24 h-4 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow animate-pulse" aria-hidden="true">
            <div className="w-48 h-6 bg-gray-200 rounded mb-4" />
            <div className="w-full h-64 bg-gray-200 rounded" />
          </div>
          <div className="bg-white p-6 rounded-lg shadow animate-pulse" aria-hidden="true">
            <div className="w-48 h-6 bg-gray-200 rounded mb-4" />
            <div className="w-full h-64 bg-gray-200 rounded" />
          </div>
        </div>

        {/* Table skeleton */}
        <div className="bg-white rounded-lg shadow animate-pulse" aria-hidden="true">
          <div className="p-6 border-b">
            <div className="w-48 h-6 bg-gray-200 rounded" />
          </div>
          <div className="p-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center space-x-4 py-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="w-3/4 h-4 bg-gray-200 rounded" />
                  <div className="w-1/2 h-3 bg-gray-200 rounded" />
                </div>
                <div className="w-20 h-4 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <span className="sr-only">Chargement du tableau de bord en cours...</span>
    </div>
  );
}