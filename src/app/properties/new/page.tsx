'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createProperty } from '@/lib/database'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewPropertyPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    address: '',
    monthly_rent: '',
    tenant_name: '',
    lease_end_date: '',
    purchase_date: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await createProperty({
        user_id: user!.id,
        address: formData.address,
        monthly_rent: parseFloat(formData.monthly_rent),
        tenant_name: formData.tenant_name || null,
        lease_end_date: formData.lease_end_date || null,
        purchase_date: formData.purchase_date || null,
      })
      router.push('/properties')
    } catch (error: any) {
      setError(error.message || 'Failed to create property')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Link
              href="/properties"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Properties
            </Link>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Property</h1>
              
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    id="address"
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="123 Main St, City, State 12345"
                  />
                </div>

                <div>
                  <label htmlFor="monthly_rent" className="block text-sm font-medium text-gray-700">
                    Monthly Rent *
                  </label>
                  <input
                    type="number"
                    name="monthly_rent"
                    id="monthly_rent"
                    required
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.monthly_rent}
                    onChange={handleChange}
                    placeholder="1500.00"
                  />
                </div>

                <div>
                  <label htmlFor="tenant_name" className="block text-sm font-medium text-gray-700">
                    Tenant Name
                  </label>
                  <input
                    type="text"
                    name="tenant_name"
                    id="tenant_name"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.tenant_name}
                    onChange={handleChange}
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label htmlFor="lease_end_date" className="block text-sm font-medium text-gray-700">
                    Lease End Date
                  </label>
                  <input
                    type="date"
                    name="lease_end_date"
                    id="lease_end_date"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.lease_end_date}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="purchase_date" className="block text-sm font-medium text-gray-700">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    name="purchase_date"
                    id="purchase_date"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.purchase_date}
                    onChange={handleChange}
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <Link
                    href="/properties"
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Property'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
