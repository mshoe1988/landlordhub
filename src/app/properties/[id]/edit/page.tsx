'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getProperties, updateProperty } from '@/lib/database'
import { Property } from '@/lib/types'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function EditPropertyPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const propertyId = params.id as string
  
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [property, setProperty] = useState<Property | null>(null)
  
  const [formData, setFormData] = useState({
    address: '',
    monthly_rent: '',
    security_deposit: '',
    tenant_name: '',
    lease_end_date: '',
    lease_start_date: '',
    rent_due_date: '1',
  })

  useEffect(() => {
    if (user && propertyId) {
      loadProperty()
    }
  }, [user, propertyId])

  const loadProperty = async () => {
    try {
      const properties = await getProperties(user!.id)
      const property = properties.find(p => p.id === propertyId)
      if (property) {
        setProperty(property)
        setFormData({
          address: property.address,
          monthly_rent: property.monthly_rent.toString(),
          security_deposit: property.security_deposit?.toString() || '',
          tenant_name: property.tenant_name || '',
          lease_end_date: property.lease_end_date || '',
          lease_start_date: property.lease_start_date || '',
          rent_due_date: property.rent_due_date?.toString() || '1',
        })
      } else {
        setError('Property not found')
      }
    } catch (error) {
      console.error('Error loading property:', error)
      setError('Failed to load property')
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await updateProperty(propertyId, {
        address: formData.address,
        monthly_rent: parseFloat(formData.monthly_rent),
        security_deposit: formData.security_deposit ? parseFloat(formData.security_deposit) : undefined,
        tenant_name: formData.tenant_name || undefined,
        lease_end_date: formData.lease_end_date || undefined,
        lease_start_date: formData.lease_start_date || undefined,
        rent_due_date: parseInt(formData.rent_due_date),
      })
      router.push('/properties')
    } catch (error: any) {
      setError(error.message || 'Failed to update property')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  if (loadingData) {
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

  if (!property) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900">Property not found</h1>
            <p className="mt-2 text-gray-500">The property you're looking for doesn't exist.</p>
            <Link
              href="/properties"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Back to Properties
            </Link>
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
              href="/properties"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Properties
            </Link>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Property</h1>
              
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
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
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
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                    value={formData.monthly_rent}
                    onChange={handleChange}
                    placeholder="1500.00"
                  />
                </div>

                <div>
                  <label htmlFor="security_deposit" className="block text-sm font-medium text-gray-700">
                    Security Deposit
                  </label>
                  <input
                    type="number"
                    name="security_deposit"
                    id="security_deposit"
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                    value={formData.security_deposit}
                    onChange={handleChange}
                    placeholder="1500.00"
                  />
                </div>

                <div>
                  <label htmlFor="rent_due_date" className="block text-sm font-medium text-gray-700">
                    Rent Due Date *
                  </label>
                  <select
                    name="rent_due_date"
                    id="rent_due_date"
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                    value={formData.rent_due_date}
                    onChange={handleChange}
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>
                        {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : day === 21 ? 'st' : day === 22 ? 'nd' : day === 23 ? 'rd' : day === 31 ? 'st' : 'th'} of the month
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="tenant_name" className="block text-sm font-medium text-gray-700">
                    Tenant Name
                  </label>
                  <input
                    type="text"
                    name="tenant_name"
                    id="tenant_name"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
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
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                    value={formData.lease_end_date}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="lease_start_date" className="block text-sm font-medium text-gray-700">
                    Lease Start Date
                  </label>
                  <input
                    type="date"
                    name="lease_start_date"
                    id="lease_start_date"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                    value={formData.lease_start_date}
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
                    {loading ? 'Updating...' : 'Update Property'}
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
