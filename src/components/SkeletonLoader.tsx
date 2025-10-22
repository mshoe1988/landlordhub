'use client'

interface SkeletonLoaderProps {
  className?: string
}

export const SkeletonCard = ({ className = '' }: SkeletonLoaderProps) => (
  <div className={`bg-white rounded-lg shadow p-6 animate-pulse ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      <div className="h-8 bg-gray-200 rounded w-20"></div>
    </div>
    <div className="space-y-3">
      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
    </div>
  </div>
)

export const SkeletonTable = ({ rows = 5 }: { rows?: number }) => (
  <div className="bg-white rounded-lg shadow overflow-hidden animate-pulse">
    <div className="px-6 py-4 border-b border-gray-200">
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
    </div>
    <div className="divide-y divide-gray-200">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/6"></div>
            <div className="h-4 bg-gray-200 rounded w-1/6"></div>
            <div className="h-4 bg-gray-200 rounded w-1/6"></div>
            <div className="h-4 bg-gray-200 rounded w-1/6"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

export const SkeletonChart = ({ className = '' }: SkeletonLoaderProps) => (
  <div className={`bg-white rounded-lg shadow p-6 animate-pulse ${className}`}>
    <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
    <div className="h-64 bg-gray-200 rounded"></div>
  </div>
)

export const SkeletonForm = () => (
  <div className="bg-white rounded-lg shadow p-6 animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index}>
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
    <div className="flex gap-3 mt-6">
      <div className="h-10 bg-gray-200 rounded w-24"></div>
      <div className="h-10 bg-gray-200 rounded w-20"></div>
    </div>
  </div>
)

export const SkeletonButton = ({ className = '' }: SkeletonLoaderProps) => (
  <div className={`h-10 bg-gray-200 rounded animate-pulse ${className}`}></div>
)

export const SkeletonText = ({ lines = 3 }: { lines?: number }) => (
  <div className="animate-pulse">
    {Array.from({ length: lines }).map((_, index) => (
      <div
        key={index}
        className={`h-3 bg-gray-200 rounded ${
          index === lines - 1 ? 'w-2/3' : 'w-full'
        } ${index > 0 ? 'mt-2' : ''}`}
      ></div>
    ))}
  </div>
)
