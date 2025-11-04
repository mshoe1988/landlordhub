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
import { Plus, Trash2, Edit, Upload, Search, CheckCircle2, XCircle, Settings } from 'lucide-react'
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
    nickname: '',
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
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'rent' | 'tenant' | 'lease'>('rent')

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
      nickname: property.nickname || '',
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
        nickname: newProperty.nickname || undefined,
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
      setNewProperty({ address: '', monthly_rent: '', security_deposit: '', nickname: '', tenant_name: '', tenant_email: '', tenant_phone: '', lease_end_date: '', lease_start_date: '', rent_due_date: '1' })
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
        nickname: newProperty.nickname || undefined,
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
      setNewProperty({ address: '', monthly_rent: '', security_deposit: '', nickname: '', tenant_name: '', tenant_email: '', tenant_phone: '', lease_end_date: '', lease_start_date: '', rent_due_date: '1' })
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

  // Filter and sort properties
  const filteredAndSortedProperties = properties
    .filter(property => {
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return (
        property.address.toLowerCase().includes(query) ||
        (property.nickname?.toLowerCase().includes(query) || false) ||
        (property.tenant_name?.toLowerCase().includes(query) || false)
      )
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rent':
          return b.monthly_rent - a.monthly_rent
        case 'tenant':
          const aTenant = a.tenant_name || 'ZZZ'
          const bTenant = b.tenant_name || 'ZZZ'
          return aTenant.localeCompare(bTenant)
        case 'lease':
          const aLease = a.lease_end_date || '9999-12-31'
          const bLease = b.lease_end_date || '9999-12-31'
          return aLease.localeCompare(bLease)
        default:
          return 0
      }
    })

  return (
    <ProtectedRoute>
      <Layout>
        <div>
          {/* Header Section */}
          <div className="mb-6">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h2 className="font-bold" style={{ color: '#0A2540', fontSize: '20px', fontWeight: 600 }}>
                  My Properties
                </h2>
                <p className="text-sm mt-1" style={{ color: '#667680' }}>
                  Track rent, deposits, and tenant status for each of your properties.
                </p>
              </div>
              <button
                onClick={() => setShowAddProperty(true)}
                className="text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-200 font-medium"
                style={{
                  backgroundColor: '#1C7C63',
                  borderRadius: '8px',
                  transform: 'scale(1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#155A47'
                  e.currentTarget.style.transform = 'scale(1.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#1C7C63'
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                <Plus className="w-5 h-5" />
                Add Property
              </button>
            </div>
            
            {/* Search and Filter Bar */}
            {properties.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#6B7B7A' }} />
                  <input
                    type="text"
                    placeholder="Search properties..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border rounded-lg"
                    style={{
                      borderColor: '#E7ECEA',
                      color: '#0A2540',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'rent' | 'tenant' | 'lease')}
                  className="px-4 py-2.5 border rounded-lg"
                  style={{
                    borderColor: '#E7ECEA',
                    color: '#0A2540',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="rent">Sort by Rent Amount</option>
                  <option value="tenant">Sort by Tenant</option>
                  <option value="lease">Sort by Lease End</option>
                </select>
              </div>
            )}
          </div>

          {(showAddProperty || editingProperty) && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-bold mb-4 text-gray-900">
                {editingProperty ? 'Edit Property' : 'Add New Property'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Address *</label>
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
                  <label className="block text-sm font-medium text-gray-900 mb-1">Nickname (Optional)</label>
                  <input
                    type="text"
                    value={newProperty.nickname}
                    onChange={(e) => setNewProperty({ ...newProperty, nickname: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-black !text-black"
                    style={{ color: 'black' }}
                    placeholder="e.g., Smith House, Main Property"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Monthly Rent *</label>
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
                  <label className="block text-sm font-medium text-gray-900 mb-1">Security Deposit</label>
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
                  <label className="block text-sm font-medium text-gray-900 mb-1">Rent Due Date *</label>
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
                  <label className="block text-sm font-medium text-gray-900 mb-1">Upload Document (Optional)</label>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">Document Type</label>
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
                      <label className="block text-sm font-medium text-gray-900 mb-1">Select File</label>
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
                  <label className="block text-sm font-medium text-gray-900 mb-1">Tenant Name</label>
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
                  <label className="block text-sm font-medium text-gray-900 mb-1">Tenant Email</label>
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
                  <label className="block text-sm font-medium text-gray-900 mb-1">Tenant Phone</label>
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
                  <label className="block text-sm font-medium text-gray-900 mb-1">Lease End Date</label>
                  <input
                    type="date"
                    value={newProperty.lease_end_date}
                    onChange={(e) => setNewProperty({ ...newProperty, lease_end_date: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-black !text-black"
                    style={{ color: 'black' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Lease Start Date</label>
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
                    setNewProperty({ address: '', monthly_rent: '', security_deposit: '', nickname: '', tenant_name: '', tenant_email: '', tenant_phone: '', lease_end_date: '', lease_start_date: '', rent_due_date: '1' })
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
            filteredAndSortedProperties.length === 0 && searchQuery ? (
              <div className="bg-white rounded-lg shadow p-12 text-center" style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)' }}>
                <p className="text-gray-600">No properties found matching "{searchQuery}"</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {filteredAndSortedProperties.map(property => {
                  const isPaid = rentPayments[property.id]?.status === 'paid'
                  const isPartial = rentPayments[property.id]?.status === 'partial'
                  const now = new Date()
                  const isOverdue = !isPaid && !isPartial && property.rent_due_date && now.getDate() > property.rent_due_date
                  const paymentStatus = isPaid ? 'paid' : isPartial ? 'partial' : isOverdue ? 'overdue' : 'unpaid'
                  
                  return (
                    <div 
                      key={property.id} 
                      className="bg-white p-6 transition-all duration-200"
                      style={{ 
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
                        transform: 'translateY(0)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.08)'
                        e.currentTarget.style.transform = 'translateY(-3px)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.06)'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      {/* Header Section */}
                      <div className="mb-4 pb-4 border-b" style={{ borderColor: '#E7ECEA', borderBottomWidth: '1px' }}>
                        <h3 className="font-bold" style={{ color: '#0A2540', fontSize: '18px', fontWeight: 600 }}>
                          {property.nickname || property.address}
                        </h3>
                        {property.nickname && (
                          <p className="text-sm mt-1" style={{ color: '#6B7B7A' }}>{property.address}</p>
                        )}
                      </div>

                      {/* Two-Column Grid Layout */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column: Property Info */}
                        <div className="pr-6 border-r" style={{ borderColor: '#E7ECEA', borderRightWidth: '1px' }}>
                          {/* Property Details */}
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm mb-1" style={{ color: '#6B7B7A', fontSize: '13px' }}>Monthly Rent</p>
                              <p className="font-bold" style={{ color: '#1C7C63', fontSize: '16px' }}>
                                ${property.monthly_rent.toLocaleString()}
                              </p>
                            </div>
                            {property.security_deposit && (
                              <div>
                                <p className="text-sm mb-1" style={{ color: '#6B7B7A', fontSize: '13px' }}>Security Deposit</p>
                                <p className="font-bold" style={{ color: '#1C7C63', fontSize: '16px' }}>
                                  ${property.security_deposit.toLocaleString()}
                                </p>
                              </div>
                            )}
                            <div>
                              <p className="text-sm mb-1" style={{ color: '#6B7B7A', fontSize: '13px' }}>Rent Due</p>
                              <p className="font-semibold" style={{ color: '#0A2540', fontSize: '14px' }}>
                                {property.rent_due_date ? `${property.rent_due_date}${property.rent_due_date === 1 ? 'st' : property.rent_due_date === 2 ? 'nd' : property.rent_due_date === 3 ? 'rd' : property.rent_due_date === 21 ? 'st' : property.rent_due_date === 22 ? 'nd' : property.rent_due_date === 23 ? 'rd' : property.rent_due_date === 31 ? 'st' : 'th'}` : '1st'} of the month
                              </p>
                            </div>
                          </div>

                          {/* Payment Status Section */}
                          {property.tenant_name && (
                            <div className="mt-6 pt-4 border-t" style={{ borderColor: '#E7ECEA', borderTopWidth: '1px' }}>
                              <p className="text-sm mb-3" style={{ color: '#6B7B7A', fontSize: '13px' }}>Current Month Payment Status</p>
                              <div className="flex flex-wrap gap-2 mb-3">
                                {paymentStatus === 'paid' && (
                                  <span 
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-colors duration-200"
                                    style={{
                                      backgroundColor: '#DFF7E4',
                                      color: '#1C7C63',
                                      borderRadius: '20px',
                                      fontSize: '13px',
                                      fontWeight: 500
                                    }}
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Paid
                                  </span>
                                )}
                                {paymentStatus === 'unpaid' && (
                                  <span 
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-colors duration-200"
                                    style={{
                                      backgroundColor: '#FBEAEA',
                                      color: '#D94A4A',
                                      borderRadius: '20px',
                                      fontSize: '13px',
                                      fontWeight: 500
                                    }}
                                  >
                                    <XCircle className="w-4 h-4" />
                                    Unpaid
                                  </span>
                                )}
                                {paymentStatus === 'overdue' && (
                                  <span 
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-colors duration-200"
                                    style={{
                                      backgroundColor: '#FBEAEA',
                                      color: '#D94A4A',
                                      borderRadius: '20px',
                                      fontSize: '13px',
                                      fontWeight: 500
                                    }}
                                  >
                                    <XCircle className="w-4 h-4" />
                                    Overdue
                                  </span>
                                )}
                                {paymentStatus === 'partial' && (
                                  <span 
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-colors duration-200"
                                    style={{
                                      backgroundColor: '#EEEAFB',
                                      color: '#6B4AE2',
                                      borderRadius: '20px',
                                      fontSize: '13px',
                                      fontWeight: 500
                                    }}
                                  >
                                    <Settings className="w-4 h-4" />
                                    Prorated
                                  </span>
                                )}
                              </div>
                              <RentPaymentStatus
                                property={property}
                                userId={user!.id}
                                currentPayment={rentPayments[property.id]}
                                onPaymentUpdate={refreshRentPayments}
                              />
                            </div>
                          )}
                        </div>

                        {/* Right Column: Tenant Info */}
                        <div className="pl-6">
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm mb-1" style={{ color: '#6B7B7A', fontSize: '13px' }}>Tenant</p>
                              <div className="group relative inline-block">
                                <p 
                                  className="font-semibold cursor-pointer" 
                                  style={{ color: '#5E6B6B', fontSize: '14px' }}
                                  onMouseEnter={(e) => {
                                    // Show tooltip on hover
                                    const tooltip = document.createElement('div')
                                    tooltip.id = `tooltip-${property.id}`
                                    tooltip.className = 'absolute z-10 bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg'
                                    tooltip.style.bottom = '100%'
                                    tooltip.style.left = '50%'
                                    tooltip.style.transform = 'translateX(-50%)'
                                    tooltip.style.marginBottom = '8px'
                                    tooltip.style.whiteSpace = 'nowrap'
                                    tooltip.innerHTML = `
                                      <div class="mb-1 font-semibold">${property.tenant_name || 'Vacant'}</div>
                                      ${property.tenant_email ? `<div>📧 ${property.tenant_email}</div>` : ''}
                                      ${property.tenant_phone ? `<div>📞 ${property.tenant_phone}</div>` : ''}
                                    `
                                    e.currentTarget.parentElement?.appendChild(tooltip)
                                  }}
                                  onMouseLeave={(e) => {
                                    const tooltip = document.getElementById(`tooltip-${property.id}`)
                                    if (tooltip) {
                                      tooltip.remove()
                                    }
                                  }}
                                >
                                  {property.tenant_name || 'Vacant'}
                                </p>
                                {property.tenant_email && (
                                  <p className="text-sm mt-1" style={{ color: '#5E6B6B', fontSize: '13px' }}>
                                    {property.tenant_email}
                                  </p>
                                )}
                                {property.tenant_phone && (
                                  <p className="text-sm" style={{ color: '#5E6B6B', fontSize: '13px' }}>
                                    {property.tenant_phone}
                                  </p>
                                )}
                              </div>
                            </div>
                            {property.lease_end_date && (
                              <div>
                                <p className="text-sm mb-1" style={{ color: '#6B7B7A', fontSize: '13px' }}>Lease Ends</p>
                                <p className="font-semibold" style={{ color: '#5E6B6B', fontSize: '14px' }}>
                                  {new Date(property.lease_end_date + 'T00:00:00').toLocaleDateString()}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Quick Actions */}
                          <div className="flex gap-2 mt-6 pt-4 border-t" style={{ borderColor: '#E7ECEA', borderTopWidth: '1px' }}>
                            <button
                              onClick={() => handleEdit(property)}
                              className="text-blue-600 hover:text-blue-800 p-2 transition-colors duration-200"
                              title="Edit property"
                              style={{ color: '#1C7C63' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = '#155A47'
                                e.currentTarget.style.transform = 'scale(1.1)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = '#1C7C63'
                                e.currentTarget.style.transform = 'scale(1)'
                              }}
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(property.id)}
                              className="text-red-600 hover:text-red-800 p-2 transition-colors duration-200"
                              title="Delete property"
                              style={{ color: '#D94A4A' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = '#B83232'
                                e.currentTarget.style.transform = 'scale(1.1)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = '#D94A4A'
                                e.currentTarget.style.transform = 'scale(1)'
                              }}
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
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

