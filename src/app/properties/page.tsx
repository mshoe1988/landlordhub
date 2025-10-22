'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getProperties, deleteProperty } from '@/lib/database'
import { Property } from '@/lib/types'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import PropertyLimitModal from '@/components/PropertyLimitModal'
import EmptyState from '@/components/EmptyState'
import { Plus, Trash2 } from 'lucide-react'

export default function PropertiesPage() {
  const { user } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddProperty, setShowAddProperty] = useState(false)
  const [subscription, setSubscription] = useState<any>(null)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [newProperty, setNewProperty] = useState({
    address: '',
    monthly_rent: '',
    tenant_name: '',
    lease_end_date: '',
    purchase_date: ''
  })

  useEffect(() => {
    if (user) {
      loadProperties()
      loadSubscription()
    }
  }, [user])

  const loadProperties = async () => {
    try {
      const data = await getProperties(user!.id)
      setProperties(data)
    } catch (error) {
      console.error('Error loading properties:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSubscription = async () => {
    try {
      const response = await fetch('/api/get-subscription')
      const data = await response.json()
      setSubscription(data.subscription)
    } catch (error) {
      console.error('Error loading subscription:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this property? This will also delete associated maintenance tasks, expenses, and documents.')) {
      try {
        await deleteProperty(id)
        setProperties(properties.filter(property => property.id !== id))
      } catch (error) {
        console.error('Error deleting property:', error)
        alert('Failed to delete property')
      }
    }
  }

  const addProperty = async () => {
    if (!newProperty.address || !newProperty.monthly_rent) {
      alert('Please fill in required fields (Address and Monthly Rent)')
      return
    }
    
    // Check property limit
    const currentPlan = subscription?.plan || 'free'
    const currentCount = properties.length
    
    if (currentPlan === 'free' && currentCount >= 1) {
      setShowLimitModal(true)
      return
    }
    
    if (currentPlan === 'starter' && currentCount >= 5) {
      setShowLimitModal(true)
      return
    }
    
    try {
      const { createProperty } = await import('@/lib/database')
      const property = await createProperty({
        user_id: user!.id,
        address: newProperty.address,
        monthly_rent: parseFloat(newProperty.monthly_rent),
        tenant_name: newProperty.tenant_name || null,
        lease_end_date: newProperty.lease_end_date || null,
        purchase_date: newProperty.purchase_date || null,
      })
      
      setProperties([...properties, property])
      setNewProperty({ address: '', monthly_rent: '', tenant_name: '', lease_end_date: '', purchase_date: '' })
      setShowAddProperty(false)
    } catch (error) {
      console.error('Error creating property:', error)
      alert('Failed to create property')
    }
  }

  if (loading) {
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
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">My Properties</h2>
            <button
              onClick={() => setShowAddProperty(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Property
            </button>
          </div>

          {showAddProperty && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-bold mb-4">Add New Property</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                  <input
                    type="text"
                    value={newProperty.address}
                    onChange={(e) => setNewProperty({ ...newProperty, address: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="123 Main Street"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent *</label>
                  <input
                    type="number"
                    value={newProperty.monthly_rent}
                    onChange={(e) => setNewProperty({ ...newProperty, monthly_rent: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="1200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tenant Name</label>
                  <input
                    type="text"
                    value={newProperty.tenant_name}
                    onChange={(e) => setNewProperty({ ...newProperty, tenant_name: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lease End Date</label>
                  <input
                    type="date"
                    value={newProperty.lease_end_date}
                    onChange={(e) => setNewProperty({ ...newProperty, lease_end_date: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                  <input
                    type="date"
                    value={newProperty.purchase_date}
                    onChange={(e) => setNewProperty({ ...newProperty, purchase_date: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={addProperty}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                >
                  Save Property
                </button>
                <button
                  onClick={() => setShowAddProperty(false)}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {properties.length === 0 ? (
            <EmptyState
              type="properties"
              onAction={() => setShowAddProperty(true)}
              actionText="Add Your First Property"
            />
          ) : (
            <div className="space-y-4">
              {properties.map(property => (
                <div key={property.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800">{property.address}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-gray-500">Monthly Rent</p>
                          <p className="text-lg font-semibold text-green-600">${property.monthly_rent}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Tenant</p>
                          <p className="text-lg font-semibold">{property.tenant_name || 'Vacant'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Lease Ends</p>
                          <p className="text-lg font-semibold">{property.lease_end_date || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(property.id)}
                      className="text-red-600 hover:text-red-800 p-2"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <PropertyLimitModal
            isOpen={showLimitModal}
            onClose={() => setShowLimitModal(false)}
            currentPlan={subscription?.plan || 'free'}
            currentCount={properties.length}
          />
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
