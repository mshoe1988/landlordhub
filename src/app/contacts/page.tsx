'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { getContacts, getTenantContacts, createContact, updateContact, deleteContact } from '@/lib/database'
import { getProperties } from '@/lib/database'
import { Contact, Property, MaintenanceTask } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { Users, Building, Plus, Edit, Trash2, Phone, Mail, MapPin, Crown, Send, MessageSquare, FileText, Calendar, Search, Filter, X, ChevronDown, Wrench, Sparkles, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { getMaintenanceTasks } from '@/lib/database'

export default function ContactsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'tenants' | 'vendors'>('tenants')
  const [tenantContacts, setTenantContacts] = useState<Contact[]>([])
  const [vendorContacts, setVendorContacts] = useState<Contact[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([])
  const [loading, setLoading] = useState(true)
  const [showVendorForm, setShowVendorForm] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Contact | null>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'tenants' | 'vendors' | 'agents' | 'contractors'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'property' | 'last_contacted'>('name')
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [showContactDrawer, setShowContactDrawer] = useState(false)
  const [newVendor, setNewVendor] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    service_type: '',
    notes: '',
    tags: [] as string[]
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

      // Load maintenance tasks for last activity tracking
      const maintenanceData = await getMaintenanceTasks(user.id)
      setMaintenanceTasks(maintenanceData)
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
        notes: '',
        tags: []
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
        notes: '',
        tags: []
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
      notes: vendor.notes || '',
      tags: []
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
      notes: '',
      tags: []
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

  const tagOptions = [
    'Real Estate Agent',
    'Plumber',
    'Electrician',
    'Priority Tenant',
    'Late Payer',
    'Contractor',
    'HVAC',
    'Preferred Vendor'
  ]

  const tagColors: { [key: string]: string } = {
    'Real Estate Agent': '#8B5CF6', // Purple
    'Plumber': '#0EA5E9',
    'Electrician': '#F59E0B',
    'Priority Tenant': '#F59E0B', // Gold
    'Late Payer': '#EF4444',
    'Contractor': '#64748B', // Gray
    'HVAC': '#06B6D4',
    'Preferred Vendor': '#1A5F7A'
  }

  // Get role-based tag color
  const getRoleTagColor = (contact: Contact) => {
    if (contact.contact_type === 'tenant') {
      return { bg: '#E0F2FE', color: '#0D9488' } // Teal
    }
    if (contact.service_type === 'Real Estate Agent') {
      return { bg: '#F3E8FF', color: '#8B5CF6' } // Purple
    }
    if (['Plumber', 'Electrician', 'HVAC', 'Contractor', 'Carpenter', 'Painter', 'Roofing'].includes(contact.service_type || '')) {
      return { bg: '#F1F5F9', color: '#64748B' } // Gray
    }
    return { bg: '#EEF2FF', color: '#6366F1' } // Indigo for vendors
  }

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Get role label for contact
  const getRoleLabel = (contact: Contact) => {
    if (contact.contact_type === 'tenant') return 'Tenant'
    if (contact.service_type) return contact.service_type
    return 'Vendor'
  }

  // Filter and search contacts
  const getFilteredContacts = () => {
    let contacts: Contact[] = []
    
    if (activeTab === 'tenants') {
      contacts = tenantContacts
    } else {
      contacts = vendorContacts
    }

    // Apply search filter
    if (searchQuery) {
      contacts = contacts.filter(contact => 
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.company?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply type filter
    if (filterType !== 'all') {
      if (filterType === 'agents') {
        contacts = contacts.filter(c => c.service_type === 'Real Estate Agent')
      } else if (filterType === 'contractors') {
        contacts = contacts.filter(c => 
          ['Plumber', 'Electrician', 'HVAC', 'Contractor', 'Carpenter', 'Painter', 'Roofing'].includes(c.service_type || '')
        )
      }
    }

    // Sort contacts
    contacts.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      } else if (sortBy === 'property' && a.property_id && b.property_id) {
        const propA = properties.find(p => p.id === a.property_id)
        const propB = properties.find(p => p.id === b.property_id)
        return (propA?.address || '').localeCompare(propB?.address || '')
      }
      return 0
    })

    return contacts
  }

  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact)
    setShowContactDrawer(true)
  }

  const handleScheduleMaintenance = (contact: Contact) => {
    // Navigate to maintenance page with vendor prefilled
    window.location.href = `/maintenance/new?vendor=${encodeURIComponent(contact.id)}&vendorName=${encodeURIComponent(contact.name)}`
  }

  // Get last maintenance job for a vendor
  const getLastMaintenanceJob = (contact: Contact) => {
    if (contact.contact_type !== 'vendor') return null
    // Find maintenance tasks that might be related to this vendor
    // Note: This is a simplified check - in production, you'd want a vendor_id field on maintenance tasks
    const relatedTasks = maintenanceTasks
      .filter(task => task.notes?.toLowerCase().includes(contact.name.toLowerCase()) || 
                     task.task.toLowerCase().includes(contact.name.toLowerCase()))
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    
    return relatedTasks.length > 0 ? relatedTasks[0] : null
  }

  // Get last contacted date (simplified - would need to track in database)
  const getLastContacted = (contact: Contact) => {
    // This would ideally come from a contact_log or activity table
    // For now, we'll use updated_at as a proxy
    return contact.updated_at
  }

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

  const filteredContacts = getFilteredContacts()

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="relative">
                <Users className="w-8 h-8 mr-3" style={{ color: '#1A5F7A', filter: 'drop-shadow(0 2px 4px rgba(26,95,122,0.2))' }} />
              </div>
              <h1 className="text-3xl font-bold" style={{ color: '#1E293B' }}>Contacts</h1>
            </div>
          </div>

          {/* Smart Summary Card */}
          <div className="mb-6 rounded-xl p-4" style={{ backgroundColor: '#F8FBFB', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
            <div className="flex flex-wrap items-center gap-3 md:gap-6 text-sm">
              <span className="font-semibold" style={{ color: '#1E293B' }}>
                <Sparkles className="w-4 h-4 inline mr-1" style={{ color: '#1A5F7A' }} />
                Contact Summary:
              </span>
              <span style={{ color: '#64748B' }}>
                <span className="font-semibold" style={{ color: '#0F172A' }}>{tenantContacts.length}</span> Tenants
              </span>
              <span style={{ color: '#64748B' }}>
                <span className="font-semibold" style={{ color: '#0F172A' }}>{vendorContacts.length}</span> Vendors
              </span>
              <span style={{ color: '#64748B' }}>
                <span className="font-semibold" style={{ color: '#0F172A' }}>{vendorContacts.filter(v => v.service_type === 'Real Estate Agent').length}</span> Realtor{vendorContacts.filter(v => v.service_type === 'Real Estate Agent').length !== 1 ? 's' : ''}
              </span>
              <span style={{ color: '#64748B' }}>
                <span className="font-semibold" style={{ color: '#0F172A' }}>0</span> Pending Tasks
              </span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => {
                    setActiveTab('tenants')
                    setFilterType('all')
                  }}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-all ${
                    activeTab === 'tenants'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  style={{ transition: 'all 0.2s ease' }}
                >
                  <Building className="w-4 h-4 inline mr-2" />
                  Tenants ({tenantContacts.length})
                </button>
                <button
                  onClick={() => {
                    setActiveTab('vendors')
                    setFilterType('all')
                  }}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-all ${
                    activeTab === 'vendors'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  style={{ transition: 'all 0.2s ease' }}
                >
                  <Users className="w-4 h-4 inline mr-2" />
                  Vendors ({vendorContacts.length})
                </button>
              </nav>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search by name, email, or company"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                style={{ color: '#1E293B' }}
              />
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#94A3B8' }} />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                  style={{ color: '#1E293B' }}
                >
                  <option value="all">All</option>
                  {activeTab === 'vendors' && (
                    <>
                      <option value="agents">Agents</option>
                      <option value="contractors">Contractors</option>
                    </>
                  )}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#94A3B8' }} />
              </div>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="pl-4 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                  style={{ color: '#1E293B' }}
                >
                  <option value="name">Sort by Name</option>
                  <option value="property">Sort by Property</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#94A3B8' }} />
              </div>
            </div>
          </div>

          {/* Tenants Tab */}
          {activeTab === 'tenants' && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium" style={{ color: '#1E293B' }}>Tenant Contacts</h2>
                <p className="text-sm mt-1" style={{ color: '#64748B' }}>
                  Contact information pulled from your properties
                </p>
              </div>
              <div className="p-4 md:p-6">
                {filteredContacts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ backgroundColor: '#F0F9FA' }}>
                      <Building className="w-10 h-10" style={{ color: '#1A5F7A' }} />
                    </div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: '#1E293B' }}>
                      {searchQuery ? 'No contacts match your search' : "You haven't added any tenants yet"}
                    </h3>
                    <p className="mb-6 max-w-md mx-auto" style={{ color: '#64748B' }}>
                      {searchQuery 
                        ? 'Try adjusting your search terms or filters.' 
                        : 'Add tenant information to your properties to start tracking communication easily.'}
                    </p>
                    {!searchQuery && (
                      <Link
                        href="/properties"
                        className="inline-flex items-center px-4 py-2 rounded-lg transition-all"
                        style={{ 
                          background: 'linear-gradient(90deg, #1A5F7A 0%, #1E7D9A 100%)',
                          color: 'white',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.02)'
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)'
                          e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.06)'
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Tenant to Property
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredContacts.map((contact) => {
                      const property = properties.find(p => p.id === contact.property_id)
                      return (
                        <div 
                          key={contact.id} 
                          className="rounded-xl p-4 cursor-pointer transition-all"
                          style={{ 
                            background: 'linear-gradient(180deg, #FFFFFF 0%, #F9FBFC 100%)',
                            borderRadius: '12px',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                            transition: 'all 0.15s ease',
                            transform: 'translateY(0)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.06)'
                            e.currentTarget.style.transform = 'translateY(-2px)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.05)'
                            e.currentTarget.style.transform = 'translateY(0)'
                          }}
                          onClick={() => handleContactClick(contact)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3 flex-1">
                              {/* Avatar */}
                              <div 
                                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                                style={{ backgroundColor: '#1A5F7A' }}
                              >
                                {getInitials(contact.name)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold truncate" style={{ color: '#1E293B', fontSize: '16px' }}>
                                  {contact.name}
                                </h3>
                                <span 
                                  className="inline-block px-2 py-0.5 text-xs rounded-full mt-1"
                                  style={getRoleTagColor(contact)}
                                >
                                  {getRoleLabel(contact)}
                                </span>
                              </div>
                            </div>
                            {/* Quick Actions */}
                            <div className="flex gap-1.5 ml-2 flex-shrink-0">
                              {contact.email && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEmailContact(contact.email!, contact.name, 'tenant', property?.address)
                                  }}
                                  className="p-1.5 rounded hover:bg-gray-100 transition-colors relative group"
                                  title="Email Tenant"
                                  onMouseEnter={(e) => {
                                    const icon = e.currentTarget.querySelector('svg')
                                    if (icon) icon.style.color = '#1E7D9A'
                                  }}
                                  onMouseLeave={(e) => {
                                    const icon = e.currentTarget.querySelector('svg')
                                    if (icon) icon.style.color = '#64748B'
                                  }}
                                >
                                  <Mail className="w-4 h-4 transition-colors" style={{ color: '#64748B' }} />
                                </button>
                              )}
                              {contact.phone && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    window.open(`tel:${contact.phone}`, '_blank')
                                  }}
                                  className="p-1.5 rounded hover:bg-gray-100 transition-colors relative group"
                                  title="Call Tenant"
                                  onMouseEnter={(e) => {
                                    const icon = e.currentTarget.querySelector('svg')
                                    if (icon) icon.style.color = '#1E7D9A'
                                  }}
                                  onMouseLeave={(e) => {
                                    const icon = e.currentTarget.querySelector('svg')
                                    if (icon) icon.style.color = '#64748B'
                                  }}
                                >
                                  <Phone className="w-4 h-4 transition-colors" style={{ color: '#64748B' }} />
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            {property && (
                              <div className="flex items-center text-sm" style={{ color: '#64748B' }}>
                                <MapPin className="w-3 h-3 mr-2" />
                                <span className="truncate">{property.address}</span>
                              </div>
                            )}
                            {contact.email && (
                              <div className="flex items-center text-sm truncate" style={{ color: '#64748B' }}>
                                <Mail className="w-3 h-3 mr-2 flex-shrink-0" />
                                <span className="truncate">{contact.email}</span>
                              </div>
                            )}
                            {contact.phone && (
                              <div className="flex items-center text-sm" style={{ color: '#64748B' }}>
                                <Phone className="w-3 h-3 mr-2 flex-shrink-0" />
                                <span>{contact.phone}</span>
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
              <div className="px-4 md:px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                <div>
                  <h2 className="text-lg font-medium" style={{ color: '#1E293B' }}>Vendor Contacts</h2>
                  <p className="text-sm mt-1" style={{ color: '#64748B' }}>
                    Manage your service providers and contractors
                  </p>
                </div>
                <button
                  onClick={() => setShowVendorForm(true)}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg transition-all w-full md:w-auto"
                  style={{ 
                    background: 'linear-gradient(90deg, #1A5F7A 0%, #1E7D9A 100%)',
                    color: 'white',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                    transform: 'scale(1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)'
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.06)'
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Vendor
                </button>
              </div>
              
              <div className="p-4 md:p-6">
                {filteredContacts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ backgroundColor: '#F0F9FA' }}>
                      <Users className="w-10 h-10" style={{ color: '#1A5F7A' }} />
                    </div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: '#1E293B' }}>
                      {searchQuery ? 'No contacts match your search' : "You haven't added any vendors yet"}
                    </h3>
                    <p className="mb-6 max-w-md mx-auto" style={{ color: '#64748B' }}>
                      {searchQuery 
                        ? 'Try adjusting your search terms or filters.' 
                        : 'Add your service providers to keep track of their contact information and streamline maintenance requests.'}
                    </p>
                    {!searchQuery && (
                      <button
                        onClick={() => setShowVendorForm(true)}
                        className="inline-flex items-center px-4 py-2 rounded-lg transition-all"
                        style={{ 
                          background: 'linear-gradient(90deg, #1A5F7A 0%, #1E7D9A 100%)',
                          color: 'white',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.02)'
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)'
                          e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.06)'
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Vendor
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredContacts.map((contact) => {
                      const contactTags = contact.service_type ? [contact.service_type] : []
                      return (
                        <div 
                          key={contact.id} 
                          className="rounded-xl p-4 cursor-pointer transition-all"
                          style={{ 
                            background: 'linear-gradient(180deg, #FFFFFF 0%, #F9FBFC 100%)',
                            borderRadius: '12px',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                            transition: 'all 0.15s ease',
                            transform: 'translateY(0)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.06)'
                            e.currentTarget.style.transform = 'translateY(-2px)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.05)'
                            e.currentTarget.style.transform = 'translateY(0)'
                          }}
                          onClick={() => handleContactClick(contact)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3 flex-1">
                              {/* Avatar */}
                              <div 
                                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                                style={{ backgroundColor: '#1A5F7A' }}
                              >
                                {getInitials(contact.name)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold truncate" style={{ color: '#1E293B', fontSize: '16px' }}>
                                  {contact.name}
                                </h3>
                                {contact.company && (
                                  <p className="text-sm truncate mt-0.5" style={{ color: '#64748B' }}>
                                    {contact.company}
                                  </p>
                                )}
                                <span 
                                  className="inline-block px-2 py-0.5 text-xs rounded-full mt-1"
                                  style={getRoleTagColor(contact)}
                                >
                                  {getRoleLabel(contact)}
                                </span>
                              </div>
                            </div>
                            {/* Quick Actions */}
                            <div className="flex gap-1.5 ml-2 flex-shrink-0">
                              {contact.email && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEmailContact(contact.email!, contact.name, 'vendor')
                                  }}
                                  className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                  title="Email Vendor"
                                  onMouseEnter={(e) => {
                                    const icon = e.currentTarget.querySelector('svg')
                                    if (icon) icon.style.color = '#1E7D9A'
                                  }}
                                  onMouseLeave={(e) => {
                                    const icon = e.currentTarget.querySelector('svg')
                                    if (icon) icon.style.color = '#64748B'
                                  }}
                                >
                                  <Mail className="w-4 h-4 transition-colors" style={{ color: '#64748B' }} />
                                </button>
                              )}
                              {contact.phone && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    window.open(`tel:${contact.phone}`, '_blank')
                                  }}
                                  className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                  title="Call Vendor"
                                  onMouseEnter={(e) => {
                                    const icon = e.currentTarget.querySelector('svg')
                                    if (icon) icon.style.color = '#1E7D9A'
                                  }}
                                  onMouseLeave={(e) => {
                                    const icon = e.currentTarget.querySelector('svg')
                                    if (icon) icon.style.color = '#64748B'
                                  }}
                                >
                                  <Phone className="w-4 h-4 transition-colors" style={{ color: '#64748B' }} />
                                </button>
                              )}
                              {contact.notes && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleContactClick(contact)
                                  }}
                                  className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                  title="View Notes"
                                  onMouseEnter={(e) => {
                                    const icon = e.currentTarget.querySelector('svg')
                                    if (icon) icon.style.color = '#1E7D9A'
                                  }}
                                  onMouseLeave={(e) => {
                                    const icon = e.currentTarget.querySelector('svg')
                                    if (icon) icon.style.color = '#64748B'
                                  }}
                                >
                                  <FileText className="w-4 h-4 transition-colors" style={{ color: '#64748B' }} />
                                </button>
                              )}
                              {contact.contact_type === 'vendor' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleScheduleMaintenance(contact)
                                  }}
                                  className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                  title="Schedule Maintenance"
                                  onMouseEnter={(e) => {
                                    const icon = e.currentTarget.querySelector('svg')
                                    if (icon) icon.style.color = '#1E7D9A'
                                  }}
                                  onMouseLeave={(e) => {
                                    const icon = e.currentTarget.querySelector('svg')
                                    if (icon) icon.style.color = '#64748B'
                                  }}
                                >
                                  <Wrench className="w-4 h-4 transition-colors" style={{ color: '#64748B' }} />
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            {contact.email && (
                              <div className="flex items-center text-sm truncate" style={{ color: '#64748B' }}>
                                <Mail className="w-3 h-3 mr-2 flex-shrink-0" />
                                <span className="truncate">{contact.email}</span>
                              </div>
                            )}
                            {contact.phone && (
                              <div className="flex items-center text-sm" style={{ color: '#64748B' }}>
                                <Phone className="w-3 h-3 mr-2 flex-shrink-0" />
                                <span>{contact.phone}</span>
                              </div>
                            )}
                            {/* Tags */}
                            {contactTags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {contactTags.map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 text-xs rounded-full font-medium"
                                    style={{
                                      backgroundColor: tagColors[tag] ? `${tagColors[tag]}20` : '#E0F2FE',
                                      color: tagColors[tag] || '#1A5F7A'
                                    }}
                                  >
                                    {tag}
                                  </span>
                                ))}
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

          {/* Contact Detail Drawer */}
          {showContactDrawer && selectedContact && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end"
              onClick={() => {
                setShowContactDrawer(false)
                setSelectedContact(null)
              }}
            >
              <div 
                className="bg-white w-full max-w-md h-full overflow-y-auto shadow-xl"
                style={{ animation: 'slideIn 0.3s ease-out' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold" style={{ color: '#1E293B' }}>Contact Details</h2>
                  <button
                    onClick={() => {
                      setShowContactDrawer(false)
                      setSelectedContact(null)
                    }}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5" style={{ color: '#64748B' }} />
                  </button>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0"
                      style={{ backgroundColor: '#1A5F7A' }}
                    >
                      {getInitials(selectedContact.name)}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-1" style={{ color: '#1E293B' }}>
                        {selectedContact.name}
                      </h3>
                      <span 
                        className="inline-block px-3 py-1 text-xs rounded-full font-medium"
                        style={getRoleTagColor(selectedContact)}
                      >
                        {getRoleLabel(selectedContact)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {selectedContact.company && (
                      <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: '#64748B' }}>Company</label>
                        <p className="text-sm" style={{ color: '#1E293B' }}>{selectedContact.company}</p>
                      </div>
                    )}
                    {selectedContact.email && (
                      <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: '#64748B' }}>Email</label>
                        <a 
                          href={`mailto:${selectedContact.email}`}
                          className="text-sm flex items-center gap-2"
                          style={{ color: '#1A5F7A' }}
                        >
                          <Mail className="w-4 h-4" />
                          {selectedContact.email}
                        </a>
                      </div>
                    )}
                    {selectedContact.phone && (
                      <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: '#64748B' }}>Phone</label>
                        <a 
                          href={`tel:${selectedContact.phone}`}
                          className="text-sm flex items-center gap-2"
                          style={{ color: '#1A5F7A' }}
                        >
                          <Phone className="w-4 h-4" />
                          {selectedContact.phone}
                        </a>
                      </div>
                    )}
                    {selectedContact.property_id && (
                      <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: '#64748B' }}>Related Property</label>
                        <Link 
                          href={`/properties/${selectedContact.property_id}/edit`}
                          className="text-sm flex items-center gap-2"
                          style={{ color: '#1A5F7A' }}
                        >
                          <MapPin className="w-4 h-4" />
                          {properties.find(p => p.id === selectedContact.property_id)?.address || 'View Property'}
                        </Link>
                      </div>
                    )}
                    {selectedContact.notes && (
                      <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: '#64748B' }}>Notes</label>
                        <p className="text-sm whitespace-pre-wrap" style={{ color: '#1E293B' }}>{selectedContact.notes}</p>
                      </div>
                    )}
                    {/* Last Contacted */}
                    <div className="pt-4 border-t border-gray-200">
                      <label className="text-xs font-medium mb-1 block" style={{ color: '#64748B' }}>Last Contacted</label>
                      <p className="text-sm flex items-center gap-2" style={{ color: '#1E293B' }}>
                        <Calendar className="w-4 h-4" style={{ color: '#94A3B8' }} />
                        {new Date(getLastContacted(selectedContact)).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                    {/* Last Maintenance Job (for vendors) */}
                    {selectedContact.contact_type === 'vendor' && getLastMaintenanceJob(selectedContact) && (
                      <div className="pt-4 border-t border-gray-200">
                        <label className="text-xs font-medium mb-1 block" style={{ color: '#64748B' }}>Last Maintenance Job</label>
                        <div className="flex items-center gap-2 mb-2">
                          <Wrench className="w-4 h-4" style={{ color: '#94A3B8' }} />
                          <p className="text-sm font-medium" style={{ color: '#1E293B' }}>
                            {getLastMaintenanceJob(selectedContact)?.task}
                          </p>
                        </div>
                        <p className="text-xs ml-6" style={{ color: '#64748B' }}>
                          {new Date(getLastMaintenanceJob(selectedContact)!.updated_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                    )}
                    {selectedContact.contact_type === 'vendor' && (
                      <div className="pt-4 border-t border-gray-200">
                        <button
                          onClick={() => {
                            handleScheduleMaintenance(selectedContact)
                            setShowContactDrawer(false)
                          }}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all"
                          style={{ 
                            backgroundColor: '#1A5F7A',
                            color: 'white',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#164D61'
                            e.currentTarget.style.transform = 'scale(1.02)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#1A5F7A'
                            e.currentTarget.style.transform = 'scale(1)'
                          }}
                        >
                          <Wrench className="w-4 h-4" />
                          Create Work Order
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Floating Quick Add Button - Hidden on mobile when vendors tab is active (Add Vendor button is visible in header) */}
          <button
            onClick={() => {
              if (activeTab === 'tenants') {
                window.location.href = '/properties'
              } else {
                setShowVendorForm(true)
              }
            }}
            className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${
              activeTab === 'vendors' ? 'hidden md:flex' : ''
            }`}
            style={{ 
              background: 'linear-gradient(90deg, #1A5F7A 0%, #1E7D9A 100%)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(26, 95, 122, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)'
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(26, 95, 122, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(26, 95, 122, 0.3)'
            }}
            title={activeTab === 'tenants' ? 'Add Tenant' : 'Add Vendor'}
          >
            <Plus className="w-6 h-6" />
          </button>

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
