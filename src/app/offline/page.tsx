'use client'

import { WifiOff, RefreshCw } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <WifiOff className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">You're Offline</h1>
          <p className="text-gray-600">
            It looks like you're not connected to the internet. Some features may not be available.
          </p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
          
          <p className="text-sm text-gray-500">
            You can still view cached content while offline.
          </p>
        </div>
      </div>
    </div>
  )
}
