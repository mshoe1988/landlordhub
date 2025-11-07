'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getProperties, deleteProperty, updateProperty, getCurrentMonthRentStatus, getRentCollectionSessions } from '@/lib/database'
import { Property, RentPayment, RentCollectionSession } from '@/lib/types'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import PropertyLimitModal from '@/components/PropertyLimitModal'
import EmptyState from '@/components/EmptyState'
import RentPaymentStatus from '@/components/RentPaymentStatus'
import CollectRentModal, { CollectRentFormValues } from '@/components/CollectRentModal'
import { Plus, Trash2, Edit, Upload, Search, CheckCircle2, XCircle, Settings, ChevronDown, Mail, Phone, CreditCard, RefreshCw, Copy, ExternalLink, Repeat, AlertTriangle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { uploadFile } from '@/lib/storage'
import { canAddProperty } from '@/lib/stripe'

const formatMoney = (value: number, currency: string = 'USD') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value || 0)

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
  const [stripeStatus, setStripeStatus] = useState({
    loading: true,
    connected: false,
    account: null as any,
    requirements: null as any
  })
  const [checkingStripe, setCheckingStripe] = useState(false)
  const [rentCollectionSessions, setRentCollectionSessions] = useState<RentCollectionSession[]>([])
  const [rentCollectionLoading, setRentCollectionLoading] = useState(false)
  const [collectModalOpen, setCollectModalOpen] = useState(false)
  const [collectModalProperty, setCollectModalProperty] = useState<Property | null>(null)

  useEffect(() => {
     if (user) {
       loadProperties()
       loadSubscription()
       loadStripeStatus()
       loadRentCollectionSessions()
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

  const getAccessToken = async (): Promise<string> => {
    const {
      data: { session }
    } = await supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('Your session expired. Please sign in again.')
    }
    return session.access_token
  }

  const loadStripeStatus = async () => {
    if (!user) return
    try {
      setStripeStatus((prev) => ({ ...prev, loading: true }))
      const token = await getAccessToken()
      const response = await fetch('/api/stripe/connect/status', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        setStripeStatus({ loading: false, connected: false, account: null, requirements: null })
        return
      }

      const data = await response.json()
      setStripeStatus({
        loading: false,
        connected: Boolean(data.connected),
        account: data.account || null,
        requirements: data.requirements || null
      })
    } catch (error) {
      console.error('Error loading Stripe status:', error)
      setStripeStatus({ loading: false, connected: false, account: null, requirements: null })
    }
  }

  const handleConnectStripe = async () => {
    try {
      setCheckingStripe(true)
      const token = await getAccessToken()
      const response = await fetch('/api/stripe/connect/create-account-link', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (!response.ok || !data.url) {
        throw new Error(data.error || 'Unable to create Stripe onboarding link')
      }

      window.location.href = data.url
    } catch (error: any) {
      const message = error?.message || 'Failed to start Stripe onboarding.'
      toast.error(message)
    } finally {
      setCheckingStripe(false)
    }
  }

  const loadRentCollectionSessions = async () => {
    if (!user) return
    try {
      setRentCollectionLoading(true)
      const sessions = await getRentCollectionSessions(user.id)
      setRentCollectionSessions(sessions)
    } catch (error) {
      console.error('Error loading rent collection sessions:', error)
    } finally {
      setRentCollectionLoading(false)
    }
  }

  const openCollectRentModal = (property: Property) => {
    if (!stripeStatus.connected) {
      toast.error('Connect Stripe to start collecting rent online.')
      return
    }
    setCollectModalProperty(property)
    setCollectModalOpen(true)
  }

  const closeCollectRentModal = () => {
    setCollectModalOpen(false)
    setCollectModalProperty(null)
  }

  const handleCollectRentSubmit = async (values: CollectRentFormValues) => {
    if (!collectModalProperty) {
      throw new Error('No property selected for rent collection')
    }

    const token = await getAccessToken()
    const response = await fetch('/api/rent/collect', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        propertyId: collectModalProperty.id,
        ...values
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create rent checkout session')
    }

    await Promise.all([loadRentCollectionSessions(), refreshRentPayments()])

    return data as { checkoutUrl: string }
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
          <div className="mb-8" style={{ paddingTop: '15px' }}>
            <div className="flex justify-between items-start mb-4">
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
                  borderRadius: '6px',
                  padding: '6px 12px',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  transform: 'scale(1)',
                  fontWeight: 500
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#155A47'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.08)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#1C7C63'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)'
                }}
            >
              <Plus className="w-5 h-5" />
              Add Property
            </button>
            </div>
            
            {/* Portfolio Summary */}
            {properties.length > 0 && (
              <div className="mb-6 p-4 rounded-lg" style={{ 
                backgroundColor: '#F7FBF9',
                border: '1px solid #E5EBE9',
                borderRadius: '8px'
              }}>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span style={{ color: '#0A2540', fontWeight: 500 }}>
                    <strong>Portfolio Overview:</strong> {properties.length} {properties.length === 1 ? 'property' : 'properties'}
                  </span>
                  <span style={{ color: '#647474' }}>
                    • ${properties.reduce((sum, p) => sum + p.monthly_rent, 0).toLocaleString()} total monthly rent
                  </span>
                  {properties.filter(p => p.tenant_name).length > 0 && (
                    <>
                      <span style={{ color: '#647474' }}>
                        • {Math.round((Object.values(rentPayments).filter(p => p?.status === 'paid').length / properties.filter(p => p.tenant_name).length) * 100) || 0}% paid
                      </span>
                      <span style={{ color: '#647474' }}>
                        • {Object.values(rentPayments).filter(p => {
                          if (!p || p.status === 'paid') return false
                          const now = new Date()
                          const property = properties.find(prop => prop.id === p.property_id)
                          return property && property.rent_due_date && now.getDate() > property.rent_due_date
                        }).length} overdue
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {!stripeStatus.loading && !stripeStatus.connected && (
              <div className="mb-6 p-5 rounded-xl border border-emerald-200 bg-emerald-50" style={{ boxShadow: '0 6px 18px rgba(28, 124, 99, 0.12)' }}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm uppercase tracking-wide">
                      <CreditCard className="h-4 w-4" />
                      Stripe rent collection
                    </div>
                    <h3 className="text-lg font-semibold text-emerald-900 mt-1">Collect rent online in minutes</h3>
                    <p className="text-sm text-emerald-800 mt-2 max-w-2xl">
                      Set up Stripe Connect once. Generate secure checkout links for each lease and let tenants pay online—funds land directly in your bank.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleConnectStripe}
                      disabled={checkingStripe}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold shadow-sm"
                      style={{
                        background: 'linear-gradient(135deg, #1C7C63 0%, #155a47 100%)',
                        boxShadow: '0 6px 16px rgba(28, 124, 99, 0.35)'
                      }}
                    >
                      {checkingStripe ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Redirecting…
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4" />
                          Connect Stripe
                        </>
                      )}
                    </button>
                    <button
                      onClick={loadStripeStatus}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-200 text-emerald-700 text-sm font-medium bg-white hover:bg-emerald-100"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh status
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!stripeStatus.loading && stripeStatus.connected && (
              <div className="mb-6 p-4 rounded-lg border border-emerald-100 bg-emerald-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3 text-emerald-800">
                  <CheckCircle2 className="h-5 w-5" />
                  <div>
                    <p className="text-sm font-semibold">Stripe account connected</p>
                    <p className="text-sm text-emerald-700">Generate checkout links to let tenants pay securely online.</p>
                  </div>
                </div>
                <button
                  onClick={loadStripeStatus}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white text-sm font-medium text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                >
                  <RefreshCw className="h-4 w-4" />
                  Sync status
                </button>
              </div>
            )}
 
            {/* Search and Filter Bar */}
            {properties.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#6B7B7A', zIndex: 1 }} />
                  <input
                    type="text"
                    placeholder="Search properties..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border rounded-lg"
                    style={{
                      borderColor: '#D7E2DF',
                      color: '#0A2540',
                      fontSize: '14px',
                      backgroundColor: 'white',
                      borderRadius: '8px'
                    }}
                  />
                </div>
                <div className="relative inline-block">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'rent' | 'tenant' | 'lease')}
                    className="appearance-none px-4 py-2.5 pr-8 border rounded-full"
                    style={{
                      borderColor: '#D7E2DF',
                      color: '#0A2540',
                      fontSize: '14px',
                      backgroundColor: '#F7FBF9',
                      borderRadius: '20px',
                      paddingRight: '32px',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="rent">Sort by Rent Amount</option>
                    <option value="tenant">Sort by Tenant</option>
                    <option value="lease">Sort by Lease End</option>
                  </select>
                  <ChevronDown 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" 
                    style={{ 
                      color: '#647474',
                      width: '16px',
                      height: '16px'
                    }} 
                  />
                </div>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {filteredAndSortedProperties.map(property => {
                  const isPaid = rentPayments[property.id]?.status === 'paid'
                  const isPartial = rentPayments[property.id]?.status === 'partial'
                  const now = new Date()
                  const isOverdue = !isPaid && !isPartial && property.rent_due_date && now.getDate() > property.rent_due_date
                  const paymentStatus = isPaid ? 'paid' : isPartial ? 'partial' : isOverdue ? 'overdue' : 'unpaid'
                  const propertySessions = rentCollectionSessions
                    .filter(session => session.property_id === property.id)
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 3)
                  const getSessionStatusStyles = (status: RentCollectionSession['status']) => {
                    switch (status) {
                      case 'paid':
                        return { bg: '#DFF7E4', color: '#1C7C63', label: 'Paid' }
                      case 'open':
                        return { bg: '#E0F2FF', color: '#0369A1', label: 'Pending' }
                      case 'expired':
                        return { bg: '#F1F5F9', color: '#475569', label: 'Expired' }
                      case 'canceled':
                        return { bg: '#F8FAFC', color: '#64748B', label: 'Canceled' }
                      case 'past_due':
                        return { bg: '#FEF3C7', color: '#B45309', label: 'Past due' }
                      default:
                        return { bg: '#E0F2FF', color: '#0369A1', label: status }
                    }
                  }
                  
                  return (
                    <div 
                      key={property.id} 
                      className="bg-white p-6"
                      style={{ 
                        borderRadius: '12px',
                        boxShadow: '0 3px 12px rgba(0, 0, 0, 0.05)',
                        border: '1px solid #E5EBE9',
                        transform: 'translateY(0)',
                        transition: 'all 0.2s ease-in-out'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.08)'
                        e.currentTarget.style.transform = 'translateY(-3px)'
                        const editBtn = e.currentTarget.querySelector('.edit-icon-btn') as HTMLElement
                        if (editBtn) {
                          editBtn.style.opacity = '1'
                          editBtn.style.pointerEvents = 'auto'
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 3px 12px rgba(0, 0, 0, 0.05)'
                        e.currentTarget.style.transform = 'translateY(0)'
                        const editBtn = e.currentTarget.querySelector('.edit-icon-btn') as HTMLElement
                        if (editBtn) {
                          editBtn.style.opacity = '0'
                          editBtn.style.pointerEvents = 'none'
                        }
                      }}
                    >
                      {/* Header Section */}
                      <div className="mb-4 pb-4 border-b flex justify-between items-start" style={{ borderColor: '#E5E9E7', borderBottomWidth: '1px' }}>
                    <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold" style={{ color: '#0A2540', fontSize: '18px', fontWeight: 600 }}>
                              {property.nickname || property.address}
                            </h3>
                            <button
                              onClick={() => handleEdit(property)}
                              className="edit-icon-btn transition-opacity duration-200"
                              style={{ 
                                opacity: 0,
                                color: '#1C7C63',
                                pointerEvents: 'none'
                              }}
                              title="Edit property"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                          {property.nickname && (
                            <p className="text-sm mt-1" style={{ color: '#647474', fontSize: '13px' }}>{property.address}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <button
                            onClick={() => openCollectRentModal(property)}
                            disabled={!stripeStatus.connected}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 disabled:opacity-60"
                            style={{
                              background: 'linear-gradient(135deg, #1C7C63 0%, #155a47 100%)',
                              color: '#ffffff',
                              boxShadow: stripeStatus.connected ? '0 4px 12px rgba(28, 124, 99, 0.25)' : 'none',
                              cursor: stripeStatus.connected ? 'pointer' : 'not-allowed'
                            }}
                          >
                            <CreditCard className="h-4 w-4" />
                            Collect Rent
                          </button>
                          {!stripeStatus.connected && (
                            <div className="flex items-center gap-1 text-xs" style={{ color: '#b45309' }}>
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Connect Stripe to enable
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Two-Column Grid Layout */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column: Property Info */}
                        <div className="pr-0 md:pr-6 md:border-r" style={{ borderColor: '#E7ECEA', borderRightWidth: '1px' }}>
                          {/* Property Details */}
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm mb-1" style={{ color: '#647474', fontSize: '13px' }}>Monthly Rent</p>
                              <p className="font-bold" style={{ color: '#1C7C63', fontSize: '16px' }}>
                                ${property.monthly_rent.toLocaleString()}
                              </p>
                            </div>
                            {property.security_deposit && (
                        <div>
                                <p className="text-sm mb-1" style={{ color: '#647474', fontSize: '13px' }}>Security Deposit</p>
                                <p className="font-bold" style={{ color: '#1C7C63', fontSize: '16px' }}>
                                  ${property.security_deposit.toLocaleString()}
                                </p>
                        </div>
                            )}
                        <div>
                              <p className="text-sm mb-1" style={{ color: '#647474', fontSize: '13px' }}>Rent Due</p>
                              <p className="font-semibold" style={{ color: '#0A2540', fontSize: '14px' }}>
                                {property.rent_due_date ? `${property.rent_due_date}${property.rent_due_date === 1 ? 'st' : property.rent_due_date === 2 ? 'nd' : property.rent_due_date === 3 ? 'rd' : property.rent_due_date === 21 ? 'st' : property.rent_due_date === 22 ? 'nd' : property.rent_due_date === 23 ? 'rd' : property.rent_due_date === 31 ? 'st' : 'th'}` : '1st'} of the month
                              </p>
                            </div>
                          </div>

                          {/* Payment Status Section */}
                          {property.tenant_name && (
                            <div className="mt-6 pt-4 border-t" style={{ borderColor: '#E7ECEA', borderTopWidth: '1px' }}>
                              <p className="text-sm mb-3" style={{ color: '#647474', fontSize: '13px' }}>Current Month Payment Status</p>
                              <div className="flex flex-wrap gap-2 mb-4">
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
                        <div className="pl-0 md:pl-6">
                          <div className="space-y-4">
                        <div>
                              <p className="text-sm mb-1" style={{ color: '#647474', fontSize: '13px' }}>Tenant</p>
                              <div className="group relative inline-block">
                                <p 
                                  className="font-semibold cursor-pointer" 
                                  style={{ color: '#0A2540', fontSize: '14px' }}
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
                                {(property.tenant_email || property.tenant_phone) && (
                                  <div className="flex items-center gap-3 mt-1">
                                    {property.tenant_email && (
                                      <>
                                        <p className="text-sm" style={{ color: '#7B8B8A', fontSize: '13px' }}>
                                          {property.tenant_email}
                                        </p>
                                        <div className="flex items-center gap-1">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              const subject = `Regarding ${property.nickname || property.address}`
                                              const body = `Hello ${property.tenant_name || 'Tenant'},\n\n` +
                                                `I hope this message finds you well. I'm writing regarding your tenancy at ${property.nickname || property.address}.\n\n` +
                                                `Please let me know if you have any questions or concerns.\n\n` +
                                                `Best regards,\n` +
                                                `Your Landlord`
                                              const mailtoLink = `mailto:${property.tenant_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
                                              
                                              // Visual feedback
                                              const button = e.currentTarget
                                              const originalColor = button.style.color
                                              button.style.color = '#A1E6C1'
                                              
                                              setTimeout(() => {
                                                button.style.color = originalColor
                                              }, 500)
                                              
                                              // Open email client
                                              window.open(mailtoLink, '_blank')
                                              
                                              // Show toast notification
                                              toast.success(`✉️ Email draft opened for ${property.tenant_name || 'tenant'}`, {
                                                duration: 2000,
                                                icon: '✉️',
                                              })
                                            }}
                                            className="p-1.5 transition-all duration-200 rounded"
                                            title="Email tenant"
                                            aria-label={`Email ${property.tenant_name || 'tenant'}`}
                                            style={{ 
                                              color: '#1C7C63',
                                              opacity: 0.85,
                                              borderRadius: '6px',
                                              border: '1px solid #E6ECE9',
                                              backgroundColor: 'transparent',
                                              transform: 'translateY(0)',
                                              padding: '4px 6px',
                                              cursor: 'pointer',
                                              transition: 'all 0.2s ease-in-out'
                                            }}
                                            onMouseEnter={(e) => {
                                              e.currentTarget.style.color = '#0A513D'
                                              e.currentTarget.style.opacity = '1'
                                              e.currentTarget.style.backgroundColor = '#F7FBF9'
                                              e.currentTarget.style.transform = 'translateY(-1px)'
                                              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.08)'
                                            }}
                                            onMouseLeave={(e) => {
                                              e.currentTarget.style.color = '#1C7C63'
                                              e.currentTarget.style.opacity = '0.85'
                                              e.currentTarget.style.backgroundColor = 'transparent'
                                              e.currentTarget.style.transform = 'translateY(0)'
                                              e.currentTarget.style.boxShadow = 'none'
                                            }}
                                          >
                                            <Mail className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </>
                                    )}
                                    {property.tenant_phone && (
                                      <div className="flex items-center gap-1" style={{ marginLeft: property.tenant_email ? '4px' : '0' }}>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            const telLink = `tel:${property.tenant_phone}`
                                            window.open(telLink, '_self')
                                            toast.success(`📞 Calling ${property.tenant_name || 'tenant'}`, {
                                              duration: 2000,
                                              icon: '📞',
                                            })
                                          }}
                                          className="p-1.5 transition-all duration-200 rounded"
                                          title="Call tenant"
                                          aria-label={`Call ${property.tenant_name || 'tenant'}`}
                                          style={{ 
                                            color: '#1C7C63',
                                            opacity: 0.85,
                                            borderRadius: '6px',
                                            border: '1px solid #E6ECE9',
                                            backgroundColor: 'transparent',
                                            transform: 'translateY(0)',
                                            padding: '4px 6px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease-in-out'
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.color = '#0A513D'
                                            e.currentTarget.style.opacity = '1'
                                            e.currentTarget.style.backgroundColor = '#F7FBF9'
                                            e.currentTarget.style.transform = 'translateY(-1px)'
                                            e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.08)'
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.color = '#1C7C63'
                                            e.currentTarget.style.opacity = '0.85'
                                            e.currentTarget.style.backgroundColor = 'transparent'
                                            e.currentTarget.style.transform = 'translateY(0)'
                                            e.currentTarget.style.boxShadow = 'none'
                                          }}
                                        >
                                          <Phone className="w-4 h-4" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            {property.lease_end_date && (
                               <div>
                                 <p className="text-sm mb-1" style={{ color: '#647474', fontSize: '13px' }}>Lease Ends</p>
                                 <p className="font-semibold" style={{ color: '#0A2540', fontSize: '14px' }}>
                                   {new Date(property.lease_end_date + 'T00:00:00').toLocaleDateString()}
                                 </p>
                               </div>
                             )}
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                                  <CreditCard className="h-4 w-4" />
                                  Rent collection
                                </div>
                                <button
                                  onClick={() => openCollectRentModal(property)}
                                  className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 px-3 py-1.5 rounded-lg bg-white border border-emerald-200 hover:bg-emerald-100 transition-colors"
                                  disabled={!stripeStatus.connected}
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  New link
                                </button>
                              </div>

                              {rentCollectionLoading && (
                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-3">
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  Syncing Stripe sessions…
                                </div>
                              )}

                              {propertySessions.length === 0 && !rentCollectionLoading && (
                                <p className="text-xs text-slate-500 mt-3">
                                  No checkout links yet. Use <strong>Collect Rent</strong> to send a Stripe payment link to this tenant.
                                </p>
                              )}

                              {propertySessions.length > 0 && (
                                <div className="mt-3 space-y-3">
                                  {propertySessions.map((session) => {
                                    const styles = getSessionStatusStyles(session.status)
                                    const sentAt = new Date(session.created_at)
                                    const dueDate = session.due_date ? new Date(session.due_date + 'T00:00:00') : null
                                    return (
                                      <div key={session.id} className="rounded-lg bg-white border border-slate-200 px-3 py-3">
                                        <div className="flex items-start justify-between gap-3">
                                          <div>
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                              {formatMoney(session.amount, (session.currency || 'usd').toUpperCase())}
                                              {session.is_recurring && (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                                  <Repeat className="h-3 w-3" />
                                                  Recurring
                                                </span>
                                              )}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">
                                              Sent {sentAt.toLocaleDateString()} · {session.tenant_email || 'Tenant email pending'}
                                              {dueDate && ` · Due ${dueDate.toLocaleDateString()}`}
                                            </p>
                                          </div>
                                          <span
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                                            style={{ backgroundColor: styles.bg, color: styles.color }}
                                          >
                                            {styles.label}
                                          </span>
                                        </div>
                                        {session.stripe_payment_link_url && (
                                          <div className="flex flex-wrap items-center gap-2 mt-3">
                                            <button
                                              onClick={() => {
                                                navigator.clipboard.writeText(session.stripe_payment_link_url!)
                                                  .then(() => toast.success('Link copied to clipboard'))
                                                  .catch(() => toast.error('Unable to copy link'))
                                              }}
                                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-100"
                                            >
                                              <Copy className="h-3.5 w-3.5" />
                                              Copy link
                                            </button>
                                            <a
                                              href={session.stripe_payment_link_url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-emerald-700 bg-emerald-100 hover:bg-emerald-200"
                                            >
                                              <ExternalLink className="h-3.5 w-3.5" />
                                              View checkout
                                            </a>
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
 
                          {/* Quick Actions */}
                          <div className="flex gap-2 mt-6 pt-4 border-t" style={{ borderColor: '#E7ECEA', borderTopWidth: '1px' }}>
                            <button
                              onClick={() => handleEdit(property)}
                              className="p-2.5 transition-all duration-200"
                              title="Edit property"
                              style={{ 
                                color: '#647474',
                                borderRadius: '6px',
                                border: '1px solid #E6ECE9',
                                backgroundColor: 'transparent',
                                transform: 'translateY(0)',
                                padding: '8px 10px'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = '#0A2540'
                                e.currentTarget.style.backgroundColor = '#F7FBF9'
                                e.currentTarget.style.transform = 'translateY(-1px)'
                                e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.08)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = '#647474'
                                e.currentTarget.style.backgroundColor = 'transparent'
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = 'none'
                              }}
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(property.id)}
                              className="p-2.5 transition-all duration-200"
                              title="Delete property"
                              style={{ 
                                color: '#EE5C4D',
                                borderRadius: '6px',
                                border: '1px solid #E6ECE9',
                                backgroundColor: 'transparent',
                                transform: 'translateY(0)',
                                padding: '8px 10px'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = '#D94A4A'
                                e.currentTarget.style.backgroundColor = '#FEF5F5'
                                e.currentTarget.style.borderColor = '#F5C2BA'
                                e.currentTarget.style.transform = 'translateY(-1px)'
                                e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.08)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = '#EE5C4D'
                                e.currentTarget.style.backgroundColor = 'transparent'
                                e.currentTarget.style.borderColor = '#E6ECE9'
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = 'none'
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

        <CollectRentModal
          open={collectModalOpen}
          property={collectModalProperty}
          onClose={closeCollectRentModal}
          onSubmit={handleCollectRentSubmit}
        />
      </Layout>
    </ProtectedRoute>
  )
}

