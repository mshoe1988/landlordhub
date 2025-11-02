'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getProperties, deleteProperty, updateProperty, getCurrentMonthRentStatus } from '@/lib/database'
import { Property, RentPayment } from '@/lib/types'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import PropertyLimitModal from '@/components/PropertyLimitModal'
import EmptyState from '@/components/EmptyState'
import RentPaymentStatus from '@/components/RentPaymentStatus'
import { Plus, Trash2, Edit, Upload } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { uploadFile } from '@/lib/storage'
import { canAddProperty } from '@/lib/stripe'

export default function PropertiesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddProperty, setShowAddProperty] = useState(false)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [newProperty, setNewProperty] = useState({
    address: '',
    monthly_rent: '',
    security_deposit: '',
    tenant_name: '',
    tenant_email: '',
    tenant_phone: '',
    lease_end_date: '',
    lease_start_date: '',
    rent_due_date: '1'
  })
  const [selectedDocument, setSelectedDocument] = useState<File | null>(null)
  const [documentType, setDocumentType] = useState('Lease')
  const [uploadingDocument, setUploadingDocument] = useState(false)
  const [rentPayments, setRentPayments] = useState<Record<string, RentPayment | null>>({})

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
      // Load current month's rent payments
      try {
        const payments = await getCurrentMonthRentStatus(user!.id)
        setRentPayments(payments)
        console.log('Rent payments loaded:', payments)
      } catch (paymentError: any) {
        console.error('Error loading rent payments:', paymentError)
        // Don't fail the whole page load if rent payments fail
        // This allows the page to still load even if the rent_payments table doesn't exist yet
        setRentPayments({})
      }
    } catch (error) {
      console.error('Error loading properties:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshRentPayments = async () => {
    if (!user) return
    try {
      const payments = await getCurrentMonthRentStatus(user.id)
      setRentPayments(payments)
    } catch (error) {
      console.error('Error refreshing rent payments:', error)
    }
  }

  const loadSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/get-subscription', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })
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

  const handleEdit = (property: Property) => {
    setEditingProperty(property)
    setNewProperty({
      address: property.address,
      monthly_rent: property.monthly_rent.toString(),
      security_deposit: property.security_deposit?.toString() || '',
      tenant_name: property.tenant_name || '',
      tenant_email: property.tenant_email || '',
      tenant_phone: property.tenant_phone || '',
      lease_end_date: property.lease_end_date || '',
      lease_start_date: property.lease_start_date || '',
      rent_due_date: property.rent_due_date?.toString() || '1'
    })
  }

  const handleUpdateProperty = async () => {
    if (!editingProperty || !newProperty.address || !newProperty.monthly_rent) {
      alert('Please fill in required fields (Address and Monthly Rent)')
      return
    }
    
    try {
      const updatedProperty = await updateProperty(editingProperty.id, {
        address: newProperty.address,
        monthly_rent: parseFloat(newProperty.monthly_rent),
        security_deposit: newProperty.security_deposit ? parseFloat(newProperty.security_deposit) : undefined,
        tenant_name: newProperty.tenant_name || undefined,
        tenant_email: newProperty.tenant_email || undefined,
        tenant_phone: newProperty.tenant_phone || undefined,
        lease_end_date: newProperty.lease_end_date || undefined,
        lease_start_date: newProperty.lease_start_date || undefined,
        rent_due_date: parseInt(newProperty.rent_due_date),
      })
      
      // Upload document if one is selected
      if (selectedDocument) {
        setUploadingDocument(true)
        try {
          console.log('Starting document upload for property:', editingProperty.id)
          const uploadResult = await uploadFile(selectedDocument, user!.id, 'documents')
          console.log('Upload result:', uploadResult)
          
          if (!uploadResult.success || !uploadResult.url) {
            throw new Error(uploadResult.error || 'Upload failed')
          }
          const fileUrl = uploadResult.url
          console.log('File URL:', fileUrl)
          
          const { createDocument } = await import('@/lib/database')
          const documentData = {
            user_id: user!.id,
            property_id: editingProperty.id,
            name: selectedDocument.name,
            type: documentType,
            file_url: fileUrl,
            upload_date: new Date().toISOString()
          }
          console.log('Creating document with data:', documentData)
          
          const createdDocument = await createDocument(documentData)
          console.log('Document created successfully:', createdDocument)
        } catch (docError: any) {
          console.error('Error uploading document:', docError)
          alert(`Property updated but document upload failed: ${docError.message || 'Unknown error'}`)
        } finally {
          setUploadingDocument(false)
        }
      }
      
      setProperties(properties.map(property => 
        property.id === editingProperty.id ? updatedProperty : property
      ))
      setEditingProperty(null)
      setNewProperty({ address: '', monthly_rent: '', security_deposit: '', tenant_name: '', tenant_email: '', tenant_phone: '', lease_end_date: '', lease_start_date: '', rent_due_date: '1' })
      setSelectedDocument(null)
      setDocumentType('Lease')
    } catch (error: any) {
      console.error('Error updating property:', error)
      const errorMessage = error?.message || error?.error?.message || 'Failed to update property'
      alert(`Failed to update property: ${errorMessage}`)
    }
  }

  const addProperty = async () => {
    if (!newProperty.address || !newProperty.monthly_rent) {
      alert('Please fill in required fields (Address and Monthly Rent)')
      return
    }
    
    // Check property limit based on mapped plan
    const dbPlan = subscription?.plan || 'free' // values: free | starter | growth | pro
    const currentCount = properties.length
    const mappedPlan = dbPlan === 'starter' ? 'basic' : dbPlan // map DB -> pricing key

    console.log('Subscription:', subscription)
    console.log('Mapped plan:', mappedPlan)
    console.log('Current count:', currentCount)

    if (!canAddProperty(mappedPlan, currentCount)) {
      console.log('Plan limit reached - redirecting to pricing')
      router.push('/pricing')
      return
    }
    
    try {
      const { createProperty } = await import('@/lib/database')
      const property = await createProperty({
        user_id: user!.id,
        address: newProperty.address,
        monthly_rent: parseFloat(newProperty.monthly_rent),
        security_deposit: newProperty.security_deposit ? parseFloat(newProperty.security_deposit) : undefined,
        tenant_name: newProperty.tenant_name || undefined,
        tenant_email: newProperty.tenant_email || undefined,
        tenant_phone: newProperty.tenant_phone || undefined,
        lease_end_date: newProperty.lease_end_date || undefined,
        lease_start_date: newProperty.lease_start_date || undefined,
        rent_due_date: parseInt(newProperty.rent_due_date),
      })
      
      // Upload document if one is selected
      if (selectedDocument) {
        setUploadingDocument(true)
        try {
          console.log('Starting document upload for property:', property.id)
          const uploadResult = await uploadFile(selectedDocument, user!.id, 'documents')
          console.log('Upload result:', uploadResult)
          
          if (!uploadResult.success || !uploadResult.url) {
            throw new Error(uploadResult.error || 'Upload failed')
          }
          const fileUrl = uploadResult.url
          console.log('File URL:', fileUrl)
          
          const { createDocument } = await import('@/lib/database')
          const documentData = {
            user_id: user!.id,
            property_id: property.id,
            name: selectedDocument.name,
            type: documentType,
            file_url: fileUrl,
            upload_date: new Date().toISOString()
          }
          console.log('Creating document with data:', documentData)
          
          const createdDocument = await createDocument(documentData)
          console.log('Document created successfully:', createdDocument)
        } catch (docError: any) {
          console.error('Error uploading document:', docError)
          alert(`Property created but document upload failed: ${docError.message || 'Unknown error'}`)
        } finally {
          setUploadingDocument(false)
        }
      }
      
      setProperties([...properties, property])
      setNewProperty({ address: '', monthly_rent: '', security_deposit: '', tenant_name: '', tenant_email: '', tenant_phone: '', lease_end_date: '', lease_start_date: '', rent_due_date: '1' })
      setSelectedDocument(null)
      setDocumentType('Lease')
      setShowAddProperty(false)
    } catch (error: any) {
      console.error('Error creating property:', error)
      const errorMessage = error?.message || error?.error?.message || 'Failed to create property'
      alert(`Failed to create property: ${errorMessage}`)
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

          {(showAddProperty || editingProperty) && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-bold mb-4">
                {editingProperty ? 'Edit Property' : 'Add New Property'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                  <input
                    type="text"
                    value={newProperty.address}
                    onChange={(e) => setNewProperty({ ...newProperty, address: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-black !text-black"
                    style={{ color: 'black' }}
                    placeholder="123 Main Street"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent *</label>
                  <input
                    type="number"
                    value={newProperty.monthly_rent}
                    onChange={(e) => setNewProperty({ ...newProperty, monthly_rent: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-black !text-black"
                    style={{ color: 'black' }}
                    placeholder="1200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Security Deposit</label>
                  <input
                    type="number"
                    value={newProperty.security_deposit}
                    onChange={(e) => setNewProperty({ ...newProperty, security_deposit: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-black !text-black"
                    style={{ color: 'black' }}
                    placeholder="1200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rent Due Date *</label>
                  <select
                    value={newProperty.rent_due_date}
                    onChange={(e) => setNewProperty({ ...newProperty, rent_due_date: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-black !text-black"
                    style={{ color: 'black' }}
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>
                        {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : day === 21 ? 'st' : day === 22 ? 'nd' : day === 23 ? 'rd' : day === 31 ? 'st' : 'th'} of the month
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload Document (Optional)</label>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Document Type</label>
                      <select
                        value={documentType}
                        onChange={(e) => setDocumentType(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-black !text-black"
                        style={{ color: 'black' }}
                      >
                        <option value="Lease">Lease Agreement</option>
                        <option value="Inspection">Inspection Report</option>
                        <option value="Insurance">Insurance Document</option>
                        <option value="Tax Document">Tax Document</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Select File</label>
                      <input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null
                          console.log('File selected:', file)
                          setSelectedDocument(file)
                        }}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-black !text-black"
                        style={{ color: 'black' }}
                      />
                      {selectedDocument && (
                        <p className="text-sm text-gray-600 mt-1">
                          Selected: {selectedDocument.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tenant Name</label>
                  <input
                    type="text"
                    value={newProperty.tenant_name}
                    onChange={(e) => setNewProperty({ ...newProperty, tenant_name: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-black !text-black"
                    style={{ color: 'black' }}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tenant Email</label>
                  <input
                    type="email"
                    value={newProperty.tenant_email}
                    onChange={(e) => setNewProperty({ ...newProperty, tenant_email: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-black !text-black"
                    style={{ color: 'black' }}
                    placeholder="tenant@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tenant Phone</label>
                  <input
                    type="tel"
                    value={newProperty.tenant_phone}
                    onChange={(e) => setNewProperty({ ...newProperty, tenant_phone: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-black !text-black"
                    style={{ color: 'black' }}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lease End Date</label>
                  <input
                    type="date"
                    value={newProperty.lease_end_date}
                    onChange={(e) => setNewProperty({ ...newProperty, lease_end_date: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-black !text-black"
                    style={{ color: 'black' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lease Start Date</label>
                  <input
                    type="date"
                    value={newProperty.lease_start_date}
                    onChange={(e) => setNewProperty({ ...newProperty, lease_start_date: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-black !text-black"
                    style={{ color: 'black' }}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={editingProperty ? handleUpdateProperty : addProperty}
                  disabled={uploadingDocument}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {uploadingDocument && <Upload className="w-4 h-4 animate-spin" />}
                  <span>
                    {uploadingDocument ? 'Uploading...' : editingProperty ? 'Update Property' : 'Save Property'}
                  </span>
                </button>
                <button
                  onClick={() => {
                    setShowAddProperty(false)
                    setEditingProperty(null)
                    setNewProperty({ address: '', monthly_rent: '', security_deposit: '', tenant_name: '', tenant_email: '', tenant_phone: '', lease_end_date: '', lease_start_date: '', rent_due_date: '1' })
                    setSelectedDocument(null)
                    setDocumentType('Lease')
                  }}
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
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-gray-500">Monthly Rent</p>
                          <p className="text-lg font-semibold text-green-600">${property.monthly_rent}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Security Deposit</p>
                          <p className="text-lg font-semibold text-blue-600">{property.security_deposit ? `$${property.security_deposit.toLocaleString()}` : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Rent Due</p>
                          <p className="text-lg font-semibold text-black">{property.rent_due_date ? `${property.rent_due_date}${property.rent_due_date === 1 ? 'st' : property.rent_due_date === 2 ? 'nd' : property.rent_due_date === 3 ? 'rd' : property.rent_due_date === 21 ? 'st' : property.rent_due_date === 22 ? 'nd' : property.rent_due_date === 23 ? 'rd' : property.rent_due_date === 31 ? 'st' : 'th'}` : '1st'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Tenant</p>
                          <p className="text-lg font-semibold text-black">{property.tenant_name || 'Vacant'}</p>
                          {property.tenant_email && (
                            <p className="text-sm text-gray-600">{property.tenant_email}</p>
                          )}
                          {property.tenant_phone && (
                            <p className="text-sm text-gray-600">{property.tenant_phone}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Lease Ends</p>
                          <p className="text-lg font-semibold text-black">{property.lease_end_date || 'N/A'}</p>
                        </div>
                      </div>
                      {property.tenant_name && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm text-gray-500 mb-2">Current Month Payment Status</p>
                          <RentPaymentStatus
                            property={property}
                            userId={user!.id}
                            currentPayment={rentPayments[property.id]}
                            onPaymentUpdate={refreshRentPayments}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(property)}
                        className="text-blue-600 hover:text-blue-800 p-2"
                        title="Edit property"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(property.id)}
                        className="text-red-600 hover:text-red-800 p-2"
                        title="Delete property"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
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

