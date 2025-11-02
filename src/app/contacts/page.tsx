'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { getContacts, getTenantContacts, createContact, updateContact, deleteContact } from '@/lib/database'
import { getProperties } from '@/lib/database'
import { Contact, Property } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { Users, Building, Plus, Edit, Trash2, Phone, Mail, MapPin, Crown, Send } from 'lucide-react'
import Link from 'next/link'

export default function ContactsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'tenants' | 'vendors'>('tenants')
  const [tenantContacts, setTenantContacts] = useState<Contact[]>([])
  const [vendorContacts, setVendorContacts] = useState<Contact[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showVendorForm, setShowVendorForm] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Contact | null>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [newVendor, setNewVendor] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    service_type: '',
    notes: ''
  })

  useEffect(() => {
    if (user) {
      checkSubscription()
    }
  }, [user])

  const checkSubscription = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/get-subscription', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })
      const data = await response.json()
      setSubscription(data.subscription)

      // Only load data if user has Pro subscription
      if (data.subscription && data.subscription.status === 'active' && data.subscription.plan === 'pro') {
        loadData()
      }
    } catch (error) {
      console.error('Error checking subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadData = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Load properties and extract tenant information
      const propertiesData = await getProperties(user.id)
      setProperties(propertiesData)

      // Create tenant contacts from properties with tenant info
      const tenantContactsFromProperties = propertiesData
        .filter(property => property.tenant_name || property.tenant_email || property.tenant_phone)
        .map(property => ({
          id: `tenant-${property.id}`,
          user_id: property.user_id,
          contact_type: 'tenant' as const,
          name: property.tenant_name || 'Unknown Tenant',
          email: property.tenant_email,
          phone: property.tenant_phone,
          property_id: property.id,
          created_at: property.created_at,
          updated_at: property.updated_at
        }))
      setTenantContacts(tenantContactsFromProperties)

      // Load vendor contacts
      const vendorData = await getContacts(user.id, 'vendor')
      setVendorContacts(vendorData)
    } catch (error) {
      console.error('Error loading contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      console.log('Adding vendor:', newVendor)
      const result = await createContact({
        user_id: user.id,
        contact_type: 'vendor',
        name: newVendor.name,
        email: newVendor.email || undefined,
        phone: newVendor.phone || undefined,
        company: newVendor.company || undefined,
        service_type: newVendor.service_type || undefined,
        notes: newVendor.notes || undefined
      })
      console.log('Vendor added successfully:', result)

      setNewVendor({
        name: '',
        email: '',
        phone: '',
        company: '',
        service_type: '',
        notes: ''
      })
      setShowVendorForm(false)
      setActiveTab('vendors')
      loadData()
    } catch (error) {
      console.error('Error adding vendor:', error)
      alert(`Failed to add vendor contact: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleEditVendor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingVendor) return

    try {
      await updateContact(editingVendor.id, {
        name: newVendor.name,
        email: newVendor.email || undefined,
        phone: newVendor.phone || undefined,
        company: newVendor.company || undefined,
        service_type: newVendor.service_type || undefined,
        notes: newVendor.notes || undefined
      })

      setEditingVendor(null)
      setShowVendorForm(false)
      setActiveTab('vendors')
      setNewVendor({
        name: '',
        email: '',
        phone: '',
        company: '',
        service_type: '',
        notes: ''
      })
      loadData()
    } catch (error) {
      console.error('Error updating vendor:', error)
      alert('Failed to update vendor contact')
    }
  }

  const handleDeleteVendor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vendor contact?')) return

    try {
      await deleteContact(id)
      loadData()
    } catch (error) {
      console.error('Error deleting vendor:', error)
      alert('Failed to delete vendor contact')
    }
  }

  const startEditVendor = (vendor: Contact) => {
    setEditingVendor(vendor)
    setNewVendor({
      name: vendor.name,
      email: vendor.email || '',
      phone: vendor.phone || '',
      company: vendor.company || '',
      service_type: vendor.service_type || '',
      notes: vendor.notes || ''
    })
    setShowVendorForm(true)
  }

  const cancelForm = () => {
    setShowVendorForm(false)
    setEditingVendor(null)
    setNewVendor({
      name: '',
      email: '',
      phone: '',
      company: '',
      service_type: '',
      notes: ''
    })
  }

  const handleEmailContact = (email: string, name: string, contactType: string, propertyAddress?: string) => {
    let subject: string
    let body: string

    console.log('Email contact:', { email, name, contactType, propertyAddress })

    if (contactType === 'tenant' && propertyAddress) {
      subject = `Regarding ${propertyAddress}`
      body = `Hello ${name},\n\n` +
        `I hope this message finds you well. I'm writing regarding your tenancy at ${propertyAddress}.\n\n` +
        `Please let me know if you have any questions or concerns.\n\n` +
        `Best regards,\n` +
        `Your Landlord`
    } else if (contactType === 'vendor') {
      subject = `Business Inquiry`
      body = `Hello ${name},\n\n` +
        `I hope this message finds you well. I'm reaching out regarding potential business opportunities.\n\n` +
        `Please let me know if you have any questions or if you'd like to discuss further.\n\n` +
        `Best regards,\n` +
        `Property Owner`
    } else {
      subject = `Message from Your Landlord`
      body = `Hello ${name},\n\n` +
        `I hope this message finds you well. I'm writing to you regarding your tenancy.\n\n` +
        `Please let me know if you have any questions or concerns.\n\n` +
        `Best regards,\n` +
        `Your Landlord`
    }

    console.log('Generated email:', { subject, body })
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    console.log('Mailto link:', mailtoLink)
    window.open(mailtoLink, '_blank')
  }

  const serviceTypes = [
    'Plumber',
    'HVAC',
    'Electrician',
    'Lawn Care',
    'Real Estate Agent',
    'Contractor',
    'Painter',
    'Carpenter',
    'Roofing',
    'Cleaning',
    'Other'
  ]

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  // Check if user has Pro access
  const isPro = subscription && subscription.status === 'active' && subscription.plan === 'pro'

  if (!isPro) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Header with Pro Badge */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600 mr-3" />
                <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
                <span className="ml-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm px-3 py-1 rounded-full font-bold">
                  PRO FEATURE
                </span>
              </div>
            </div>

            {/* Preview Content */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center mb-8">
                <Crown className="mx-auto h-16 w-16 text-purple-600 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Unlock Your Contacts Hub</h2>
                <p className="text-lg text-gray-600 mb-6">
                  Manage tenant and vendor contacts in one centralized location. Perfect for staying organized and building relationships.
                </p>
              </div>

              {/* Feature Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Tenants Preview */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Building className="mx-auto h-12 w-12 text-blue-500 mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Tenant Contacts</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Automatically sync tenant information from your properties
                  </p>
                  <div className="bg-gray-100 rounded p-3 text-sm text-gray-500">
                    <div className="flex items-center justify-between mb-2">
                        <span>John Smith</span>
                        <span className="text-gray-400">123 Main St</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span>Sarah Johnson</span>
                        <span className="text-gray-400">456 Oak Ave</span>
                      </div>
                      <div className="text-center text-gray-400">+2 more tenants</div>
                  </div>
                </div>

                {/* Vendors Preview */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Users className="mx-auto h-12 w-12 text-green-500 mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Vendor Contacts</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Keep track of contractors, suppliers, and service providers
                  </p>
                  <div className="bg-gray-100 rounded p-3 text-sm text-gray-500">
                    <div className="flex items-center justify-between mb-2">
                        <span>ABC Plumbing</span>
                        <span className="text-gray-400">Plumbing</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span>XYZ Electric</span>
                        <span className="text-gray-400">Electrical</span>
                      </div>
                      <div className="text-center text-gray-400">+3 more vendors</div>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">What You'll Get:</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-purple-600 mr-2" />
                    <span className="text-sm text-gray-700">Email Integration</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-purple-600 mr-2" />
                    <span className="text-sm text-gray-700">Contact Management</span>
                  </div>
                  <div className="flex items-center">
                    <Send className="h-5 w-5 text-purple-600 mr-2" />
                    <span className="text-sm text-gray-700">Quick Communication</span>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="text-center">
                <Link 
                  href="/pricing"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-lg font-semibold text-lg inline-block hover:from-purple-700 hover:to-pink-700 transition-all"
                >
                  Upgrade to Pro - Unlock Contacts
                </Link>
                <p className="text-sm text-gray-500 mt-3">
                  Starting at $39/month • Cancel anytime
                </p>
              </div>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center mb-6">
            <Users className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('tenants')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'tenants'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Building className="w-4 h-4 inline mr-2" />
                  Tenants ({tenantContacts.length})
                </button>
                <button
                  onClick={() => setActiveTab('vendors')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'vendors'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Users className="w-4 h-4 inline mr-2" />
                  Vendors ({vendorContacts.length})
                </button>
              </nav>
            </div>
          </div>

          {/* Tenants Tab */}
          {activeTab === 'tenants' && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Tenant Contacts</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Contact information pulled from your properties
                </p>
              </div>
              <div className="p-6">
                {tenantContacts.length === 0 ? (
                  <div className="text-center py-8">
                    <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No tenant contacts</h3>
                    <p className="text-gray-600">
                      Add tenant information to your properties to see contacts here.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {tenantContacts.map((contact) => {
                      const property = properties.find(p => p.id === contact.property_id)
                      return (
                        <div key={contact.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-medium text-gray-900">{contact.name}</h3>
                              {property && (
                                <p className="text-sm text-gray-600">{property.address}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            {contact.email && (
                              <div className="flex items-center justify-between text-sm text-gray-600">
                                <div className="flex items-center">
                                  <Mail className="w-4 h-4 mr-2" />
                                  <a href={`mailto:${contact.email}`} className="hover:text-blue-600">
                                    {contact.email}
                                  </a>
                                </div>
                                <button
                                  onClick={() => handleEmailContact(contact.email!, contact.name, 'tenant', property?.address)}
                                  className="flex items-center px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                >
                                  <Send className="w-3 h-3 mr-1" />
                                  Email
                                </button>
                              </div>
                            )}
                            {contact.phone && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Phone className="w-4 h-4 mr-2" />
                                <a href={`tel:${contact.phone}`} className="hover:text-blue-600">
                                  {contact.phone}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Vendors Tab */}
          {activeTab === 'vendors' && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Vendor Contacts</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage your service providers and contractors
                  </p>
                </div>
                <button
                  onClick={() => setShowVendorForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Vendor
                </button>
              </div>
              
              <div className="p-6">
                {vendorContacts.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No vendor contacts</h3>
                    <p className="text-gray-600 mb-4">
                      Add your service providers to keep track of their contact information.
                    </p>
                    <button
                      onClick={() => setShowVendorForm(true)}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Vendor
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {vendorContacts.map((contact) => (
                      <div key={contact.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-medium text-gray-900">{contact.name}</h3>
                            {contact.company && (
                              <p className="text-sm text-gray-600">{contact.company}</p>
                            )}
                            {contact.service_type && (
                              <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full mt-1">
                                {contact.service_type}
                              </span>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => startEditVendor(contact)}
                              className="p-1 text-gray-400 hover:text-blue-600"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteVendor(contact.id)}
                              className="p-1 text-gray-400 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {contact.email && (
                            <div className="flex items-center justify-between text-sm text-gray-600">
                              <div className="flex items-center">
                                <Mail className="w-4 h-4 mr-2" />
                                <a href={`mailto:${contact.email}`} className="hover:text-blue-600">
                                  {contact.email}
                                </a>
                              </div>
                              <button
                                onClick={() => handleEmailContact(contact.email!, contact.name, 'vendor')}
                                className="flex items-center px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                              >
                                <Send className="w-3 h-3 mr-1" />
                                Email
                              </button>
                            </div>
                          )}
                          {contact.phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="w-4 h-4 mr-2" />
                              <a href={`tel:${contact.phone}`} className="hover:text-blue-600">
                                {contact.phone}
                              </a>
                            </div>
                          )}
                          {contact.notes && (
                            <p className="text-sm text-gray-600 mt-2">{contact.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Vendor Form Modal */}
          {showVendorForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-md w-full p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
                </h3>
                
                <form onSubmit={editingVendor ? handleEditVendor : handleAddVendor} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={newVendor.name}
                      onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company
                    </label>
                    <input
                      type="text"
                      value={newVendor.company}
                      onChange={(e) => setNewVendor({ ...newVendor, company: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service Type
                    </label>
                    <select
                      value={newVendor.service_type}
                      onChange={(e) => setNewVendor({ ...newVendor, service_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    >
                      <option value="">Select service type</option>
                      {serviceTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newVendor.email}
                      onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={newVendor.phone}
                      onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={newVendor.notes}
                      onChange={(e) => setNewVendor({ ...newVendor, notes: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={cancelForm}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {editingVendor ? 'Update' : 'Add'} Vendor
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
