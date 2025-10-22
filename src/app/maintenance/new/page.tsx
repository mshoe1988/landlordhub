'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createMaintenanceTask, getProperties } from '@/lib/database'
import { Property } from '@/lib/types'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewMaintenanceTaskPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingProperties, setLoadingProperties] = useState(true)
  const [error, setError] = useState('')
  const [properties, setProperties] = useState<Property[]>([])
  
  const [formData, setFormData] = useState({
    property_id: '',
    task: '',
    due_date: '',
    notes: '',
  })

  useEffect(() => {
    if (user) {
      loadProperties()
    }
  }, [user])

  const loadProperties = async () => {
    try {
      const data = await getProperties(user!.id)
      setProperties(data)
    } catch (error) {
      console.error('Error loading properties:', error)
      setError('Failed to load properties')
    } finally {
      setLoadingProperties(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await createMaintenanceTask({
        user_id: user!.id,
        property_id: formData.property_id,
        task: formData.task,
        due_date: formData.due_date,
        status: 'pending',
        notes: formData.notes || null,
      })
      router.push('/maintenance')
    } catch (error: any) {
      setError(error.message || 'Failed to create maintenance task')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  if (loadingProperties) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Link
              href="/maintenance"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Maintenance
            </Link>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Maintenance Task</h1>
              
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {properties.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">You need to add a property first before creating maintenance tasks.</p>
                  <Link
                    href="/properties/new"
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Add Property
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="property_id" className="block text-sm font-medium text-gray-700">
                      Property *
                    </label>
                    <select
                      name="property_id"
                      id="property_id"
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.property_id}
                      onChange={handleChange}
                    >
                      <option value="">Select a property</option>
                      {properties.map((property) => (
                        <option key={property.id} value={property.id}>
                          {property.address}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="task" className="block text-sm font-medium text-gray-700">
                      Task Description *
                    </label>
                    <input
                      type="text"
                      name="task"
                      id="task"
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.task}
                      onChange={handleChange}
                      placeholder="e.g., Fix leaky faucet in kitchen"
                    />
                  </div>

                  <div>
                    <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">
                      Due Date *
                    </label>
                    <input
                      type="date"
                      name="due_date"
                      id="due_date"
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.due_date}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      id="notes"
                      rows={3}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Additional details or instructions..."
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Link
                      href="/maintenance"
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {loading ? 'Creating...' : 'Create Task'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
