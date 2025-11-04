'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getDocuments, deleteDocument, getProperties } from '@/lib/database'
import { Document, Property } from '@/lib/types'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import FileUpload from '@/components/FileUpload'
import { uploadFile } from '@/lib/storage'
import { Plus, Trash2, FileText, Download, ChevronUp, ChevronDown, Eye, Filter, SortAsc, FolderOpen, FileType, HardDrive, Calendar, Search } from 'lucide-react'

const DOCUMENT_TYPES = [
  'Lease',
  'Inspection',
  'Receipt',
  'Insurance',
  'Tax Document',
  'Other'
]

export default function DocumentsPage() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDocument, setShowAddDocument] = useState(false)
  const [newDocument, setNewDocument] = useState({
    property_id: '',
    name: '',
    type: 'Lease'
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [sortField, setSortField] = useState<'name' | 'type' | 'property' | 'upload_date'>('upload_date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [filterProperty, setFilterProperty] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      const [documentsData, propertiesData] = await Promise.all([
        getDocuments(user!.id),
        getProperties(user!.id)
      ])
      setDocuments(documentsData)
      setProperties(propertiesData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this document?')) {
      try {
        await deleteDocument(id)
        setDocuments(documents.filter(doc => doc.id !== id))
      } catch (error) {
        console.error('Error deleting document:', error)
        alert('Failed to delete document')
      }
    }
  }

  const addDocument = async () => {
    if (!newDocument.property_id || !newDocument.name) {
      alert('Please fill in all required fields')
      return
    }
    
    if (!selectedFile) {
      alert('Please select a file to upload')
      return
    }
    
    setUploading(true)
    
    try {
      // Upload file to Supabase Storage
      const uploadResult = await uploadFile(selectedFile, user!.id, 'documents')
      if (!uploadResult.success) {
        alert(`Upload failed: ${uploadResult.error}`)
        setUploading(false)
        return
      }
      
      const { createDocument } = await import('@/lib/database')
      const doc = await createDocument({
        user_id: user!.id,
        property_id: newDocument.property_id,
        name: newDocument.name,
        type: newDocument.type,
        file_url: uploadResult.url!,
        upload_date: new Date().toISOString().split('T')[0],
      })
      
      setDocuments([...documents, doc])
      setNewDocument({ property_id: '', name: '', type: 'Lease' })
      setSelectedFile(null)
      setShowAddDocument(false)
    } catch (error) {
      console.error('Error creating document:', error)
      alert('Failed to create document')
    } finally {
      setUploading(false)
    }
  }

  const getPropertyAddress = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId)
    return property ? (property.nickname || property.address) : 'Unknown Property'
  }

  const handleSort = (field: 'name' | 'type' | 'property' | 'upload_date') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: 'name' | 'type' | 'property' | 'upload_date') => {
    if (sortField !== field) {
      return <ChevronUp className="w-4 h-4 opacity-30" />
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />
  }

  const getFilteredAndSortedDocuments = () => {
    let filtered = [...documents]
    
    // Filter by property
    if (filterProperty) {
      filtered = filtered.filter(doc => doc.property_id === filterProperty)
    }
    
    // Filter by type
    if (filterType) {
      filtered = filtered.filter(doc => doc.type === filterType)
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(doc => 
        doc.name.toLowerCase().includes(query) ||
        doc.type.toLowerCase().includes(query)
      )
    }
    
    // Sort
    return filtered.sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'type':
          aValue = a.type.toLowerCase()
          bValue = b.type.toLowerCase()
          break
        case 'property':
          aValue = getPropertyAddress(a.property_id).toLowerCase()
          bValue = getPropertyAddress(b.property_id).toLowerCase()
          break
        case 'upload_date':
          aValue = new Date(a.upload_date).getTime()
          bValue = new Date(b.upload_date).getTime()
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }

  // Calculate summary metrics
  const getSummaryMetrics = () => {
    const totalDocuments = documents.length
    const typeCounts: Record<string, number> = {}
    documents.forEach(doc => {
      typeCounts[doc.type] = (typeCounts[doc.type] || 0) + 1
    })
    const mostCommonType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
    
    // Calculate storage (estimate - in real app, get from storage API)
    const storageUsed = `${(documents.length * 2).toFixed(0)} MB` // Estimate 2MB per document
    
    // Get last upload date
    const sortedByDate = [...documents].sort((a, b) => 
      new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime()
    )
    const lastUpload = sortedByDate[0] 
      ? new Date(sortedByDate[0].upload_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'N/A'
    
    return {
      totalDocuments,
      mostCommonType,
      storageUsed,
      lastUpload
    }
  }

  const summaryMetrics = getSummaryMetrics()

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
        <div style={{ background: 'linear-gradient(to bottom, #EAF4F1, #E7F2EF)', minHeight: '100vh', padding: '24px' }}>
          {/* Header Bar */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">📂</span>
              <h2 className="text-2xl font-bold" style={{ color: '#0A2540' }}>Your Documents</h2>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#8DA6A0', fontWeight: 400 }}>
              Manage property leases, tax forms, and receipts. Securely stored and accessible anytime.
            </p>
          </div>

          {/* Add Document Button - Desktop */}
          <div className="hidden md:flex justify-end mb-6 relative">
            <button
              onClick={() => setShowAddDocument(true)}
              className="text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all duration-200 font-semibold"
              style={{
                background: 'linear-gradient(90deg, #1C7C63, #29A184)',
                border: 'none',
                fontWeight: 600,
                boxShadow: '0 3px 8px rgba(28,124,99,0.25)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'brightness(1.08)'
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(28,124,99,0.35)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'brightness(1)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 3px 8px rgba(28,124,99,0.25)'
              }}
            >
              <Plus className="w-5 h-5" />
              Add Document
            </button>
          </div>

          {/* Floating Add Button - Mobile */}
          <button
            onClick={() => setShowAddDocument(true)}
            className="md:hidden fixed bottom-6 right-6 z-50 text-white rounded-full p-4 shadow-lg transition-all duration-200"
            style={{
              background: 'linear-gradient(90deg, #1C7C63, #29A184)',
              border: 'none',
              boxShadow: '0 4px 12px rgba(28,124,99,0.4)',
              width: '56px',
              height: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = 'brightness(1.1)'
              e.currentTarget.style.transform = 'scale(1.1)'
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(28,124,99,0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'brightness(1)'
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(28,124,99,0.4)'
            }}
          >
            <Plus className="w-6 h-6" />
          </button>

          {/* Document Summary Card */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div 
              className="bg-white rounded-lg transition-all duration-250"
              style={{
                background: 'linear-gradient(180deg, #FFFFFF 0%, #F9FCFB 100%)',
                borderRadius: '12px',
                padding: '16px 20px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.06)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.03)'
              }}
            >
              <div className="flex-1">
                <div className="text-sm font-medium mb-1" style={{ color: '#647474' }}>Total Documents</div>
                <div className="text-2xl font-bold" style={{ color: '#0A2540' }}>{summaryMetrics.totalDocuments}</div>
              </div>
              <FolderOpen className="w-6 h-6" style={{ color: '#1C7C63', opacity: 0.6 }} />
            </div>
            <div 
              className="bg-white rounded-lg transition-all duration-250"
              style={{
                background: 'linear-gradient(180deg, #FFFFFF 0%, #F9FCFB 100%)',
                borderRadius: '12px',
                padding: '16px 20px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.06)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.03)'
              }}
            >
              <div className="flex-1">
                <div className="text-sm font-medium mb-1" style={{ color: '#647474' }}>Most Common Type</div>
                <div className="text-lg font-bold" style={{ color: '#1C7C63' }}>{summaryMetrics.mostCommonType}</div>
              </div>
              <FileType className="w-6 h-6" style={{ color: '#1C7C63', opacity: 0.6 }} />
            </div>
            <div 
              className="bg-white rounded-lg transition-all duration-250"
              style={{
                background: 'linear-gradient(180deg, #FFFFFF 0%, #F9FCFB 100%)',
                borderRadius: '12px',
                padding: '16px 20px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.06)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.03)'
              }}
            >
              <div className="flex-1">
                <div className="text-sm font-medium mb-1" style={{ color: '#647474' }}>Storage Used</div>
                <div className="text-2xl font-bold" style={{ color: '#0A2540' }}>{summaryMetrics.storageUsed}</div>
              </div>
              <HardDrive className="w-6 h-6" style={{ color: '#1C7C63', opacity: 0.6 }} />
            </div>
            <div 
              className="bg-white rounded-lg transition-all duration-250"
              style={{
                background: 'linear-gradient(180deg, #FFFFFF 0%, #F9FCFB 100%)',
                borderRadius: '12px',
                padding: '16px 20px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.06)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.03)'
              }}
            >
              <div className="flex-1">
                <div className="text-sm font-medium mb-1" style={{ color: '#647474' }}>Last Upload</div>
                <div className="text-lg font-bold" style={{ color: '#0A2540' }}>{summaryMetrics.lastUpload}</div>
              </div>
              <Calendar className="w-6 h-6" style={{ color: '#1C7C63', opacity: 0.6 }} />
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div 
            className="bg-white rounded-lg mb-6"
            style={{ 
              borderRadius: '12px', 
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              padding: '12px 16px'
            }}
          >
            {/* Search Field */}
            <div className="mb-4 md:mb-0 md:absolute md:right-6 md:top-4 md:w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#6B7B7A' }} />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                  style={{ 
                    backgroundColor: '#F9FCFB', 
                    borderColor: '#E5E9E7', 
                    color: '#0A2540',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
            </div>

            {/* Filter and Sort Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center md:justify-between">
              <div className="flex items-center gap-2 mb-2 md:mb-0">
                <Filter className="w-4 h-4" style={{ color: '#1C7C63' }} />
                <span className="text-sm font-medium" style={{ color: '#0A2540' }}>Filter:</span>
              </div>
              <div className="flex flex-wrap gap-2 flex-1 overflow-x-auto md:overflow-x-visible">
                <button
                  onClick={() => setFilterProperty('')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    !filterProperty ? 'text-white' : 'text-gray-700'
                  }`}
                  style={{
                    background: !filterProperty 
                      ? 'linear-gradient(90deg, #1C7C63, #29A184)' 
                      : 'linear-gradient(180deg, #F9FCFB, #EEF9F4)',
                    border: !filterProperty ? 'none' : '1px solid #D8EAE2',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (filterProperty) {
                      e.currentTarget.style.borderColor = '#1C7C63'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (filterProperty) {
                      e.currentTarget.style.borderColor = '#D8EAE2'
                    }
                  }}
                >
                  All Properties
                </button>
                {properties.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setFilterProperty(filterProperty === p.id ? '' : p.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      filterProperty === p.id ? 'text-white' : 'text-gray-700'
                    }`}
                    style={{
                      background: filterProperty === p.id 
                        ? 'linear-gradient(90deg, #1C7C63, #29A184)' 
                        : 'linear-gradient(180deg, #F9FCFB, #EEF9F4)',
                      border: filterProperty === p.id ? 'none' : '1px solid #D8EAE2',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      if (filterProperty !== p.id) {
                        e.currentTarget.style.borderColor = '#1C7C63'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (filterProperty !== p.id) {
                        e.currentTarget.style.borderColor = '#D8EAE2'
                      }
                    }}
                  >
                    {p.nickname || p.address}
                  </button>
                ))}
                <button
                  onClick={() => setFilterType('')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    !filterType ? 'text-white' : 'text-gray-700'
                  }`}
                  style={{
                    background: !filterType 
                      ? 'linear-gradient(90deg, #1C7C63, #29A184)' 
                      : 'linear-gradient(180deg, #F9FCFB, #EEF9F4)',
                    border: !filterType ? 'none' : '1px solid #D8EAE2',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (filterType) {
                      e.currentTarget.style.borderColor = '#1C7C63'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (filterType) {
                      e.currentTarget.style.borderColor = '#D8EAE2'
                    }
                  }}
                >
                  All Types
                </button>
                {DOCUMENT_TYPES.map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(filterType === type ? '' : type)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      filterType === type ? 'text-white' : 'text-gray-700'
                    }`}
                    style={{
                      background: filterType === type 
                        ? 'linear-gradient(90deg, #1C7C63, #29A184)' 
                        : 'linear-gradient(180deg, #F9FCFB, #EEF9F4)',
                      border: filterType === type ? 'none' : '1px solid #D8EAE2',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      if (filterType !== type) {
                        e.currentTarget.style.borderColor = '#1C7C63'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (filterType !== type) {
                        e.currentTarget.style.borderColor = '#D8EAE2'
                      }
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <SortAsc className="w-4 h-4" style={{ color: '#1C7C63' }} />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSortField('upload_date')
                      setSortDirection('desc')
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      sortField === 'upload_date' && sortDirection === 'desc' ? 'text-white' : 'text-gray-700'
                    }`}
                    style={{
                      background: sortField === 'upload_date' && sortDirection === 'desc'
                        ? 'linear-gradient(90deg, #1C7C63, #29A184)' 
                        : 'linear-gradient(180deg, #F9FCFB, #EEF9F4)',
                      border: sortField === 'upload_date' && sortDirection === 'desc' ? 'none' : '1px solid #D8EAE2',
                      cursor: 'pointer'
                    }}
                  >
                    Newest
                  </button>
                  <button
                    onClick={() => {
                      setSortField('upload_date')
                      setSortDirection('asc')
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      sortField === 'upload_date' && sortDirection === 'asc' ? 'text-white' : 'text-gray-700'
                    }`}
                    style={{
                      background: sortField === 'upload_date' && sortDirection === 'asc'
                        ? 'linear-gradient(90deg, #1C7C63, #29A184)' 
                        : 'linear-gradient(180deg, #F9FCFB, #EEF9F4)',
                      border: sortField === 'upload_date' && sortDirection === 'asc' ? 'none' : '1px solid #D8EAE2',
                      cursor: 'pointer'
                    }}
                  >
                    Oldest
                  </button>
                  <button
                    onClick={() => {
                      setSortField('type')
                      setSortDirection('asc')
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      sortField === 'type' ? 'text-white' : 'text-gray-700'
                    }`}
                    style={{
                      background: sortField === 'type'
                        ? 'linear-gradient(90deg, #1C7C63, #29A184)' 
                        : 'linear-gradient(180deg, #F9FCFB, #EEF9F4)',
                      border: sortField === 'type' ? 'none' : '1px solid #D8EAE2',
                      cursor: 'pointer'
                    }}
                  >
                    By Type
                  </button>
                </div>
              </div>
            </div>
          </div>

          {showAddDocument && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-bold mb-4 text-gray-900">Add Document</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Property *</label>
                  <select
                    value={newDocument.property_id}
                    onChange={(e) => setNewDocument({ ...newDocument, property_id: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
                  >
                    <option value="">Select Property</option>
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>{p.address}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Document Type</label>
                  <select
                    value={newDocument.type}
                    onChange={(e) => setNewDocument({ ...newDocument, type: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
                  >
                    {DOCUMENT_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-900 mb-1">Document Name *</label>
                  <input
                    type="text"
                    value={newDocument.name}
                    onChange={(e) => setNewDocument({ ...newDocument, name: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
                    placeholder="Lease Agreement - John Smith"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-900 mb-1">Upload File *</label>
                  <FileUpload
                    onFileSelect={setSelectedFile}
                    onFileRemove={() => setSelectedFile(null)}
                    selectedFile={selectedFile}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    maxSize={5 * 1024 * 1024}
                    disabled={uploading}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={addDocument}
                  disabled={uploading}
                  className="text-white px-6 py-2 rounded-lg disabled:opacity-50 transition-all duration-200 font-semibold"
                  style={{
                    background: 'linear-gradient(90deg, #1C7C63, #29A184)',
                    border: 'none',
                    fontWeight: 600,
                    boxShadow: '0 3px 8px rgba(28,124,99,0.25)'
                  }}
                  onMouseEnter={(e) => {
                    if (!uploading) {
                      e.currentTarget.style.filter = 'brightness(1.08)'
                      e.currentTarget.style.transform = 'translateY(-1px)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = 'brightness(1)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  {uploading ? 'Uploading...' : 'Save Document'}
                </button>
                <button
                  onClick={() => setShowAddDocument(false)}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow overflow-hidden" style={{ borderRadius: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            {/* Mobile Card View */}
            <div className="md:hidden p-4 space-y-4">
              {getFilteredAndSortedDocuments().map(doc => {
                // Estimate file size (in real app, get from metadata)
                const fileSize = '2.4 MB' // Placeholder
                return (
                  <div 
                    key={doc.id} 
                    className="rounded-lg p-4 transition-all duration-200"
                    style={{
                      background: 'linear-gradient(180deg, #FFFFFF 0%, #F9FCFB 100%)',
                      borderRadius: '12px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                      padding: '14px 20px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(180deg, #FFFFFF 0%, #F3FBF8 100%)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.04)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(180deg, #FFFFFF 0%, #F9FCFB 100%)'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.03)'
                    }}
                  >
                    {/* Title */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center flex-1">
                        <FileText className="w-5 h-5 mr-2 flex-shrink-0" style={{ color: '#1C7C63' }} />
                        <div className="text-sm font-medium" style={{ color: '#0A2540' }}>{doc.name}</div>
                      </div>
                    </div>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="px-2 py-1 text-xs rounded-full" style={{ backgroundColor: '#E7F2EF', color: '#1C7C63' }}>
                        {doc.type}
                      </span>
                      <span className="px-2 py-1 text-xs rounded-full" style={{ backgroundColor: '#F7FBF9', color: '#647474' }}>
                        {getPropertyAddress(doc.property_id)}
                      </span>
                    </div>
                    
                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs mb-3" style={{ color: '#647474' }}>
                      <span>{fileSize}</span>
                      <span>{doc.upload_date}</span>
                    </div>
                    
                    {/* Action Icons */}
                    <div className="flex items-center gap-3 pt-2 border-t" style={{ borderColor: '#E5E9E7' }}>
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View Document"
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                      <a
                        href={doc.file_url}
                        download
                        title="Download Document"
                        className="text-green-600 hover:text-green-800 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        title="Delete Document"
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
              {getFilteredAndSortedDocuments().length === 0 && (
                <div className="text-center py-16">
                  <div className="mb-6">
                    <div 
                      className="mx-auto mb-4"
                      style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #E7F2EF 0%, #F3FBF8 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <FileText className="w-16 h-16" style={{ color: '#1C7C63', opacity: 0.4 }} />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: '#0A2540' }}>🗂 No documents uploaded yet</h3>
                  <p className="text-gray-600 mb-6 text-sm px-4">
                    Upload leases, receipts, and forms to keep everything in one place.
                  </p>
                  <button
                    onClick={() => setShowAddDocument(true)}
                    className="text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all duration-200 font-semibold mx-auto"
                    style={{
                      background: 'linear-gradient(90deg, #1C7C63, #29A184)',
                      border: 'none',
                      fontWeight: 600,
                      boxShadow: '0 3px 8px rgba(28,124,99,0.25)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.filter = 'brightness(1.08)'
                      e.currentTarget.style.transform = 'translateY(-1px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.filter = 'brightness(1)'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    <Plus className="w-5 h-5" />
                    Upload Document
                  </button>
                </div>
              )}
            </div>

            {/* Desktop Card View */}
            <div className="hidden md:block p-6">
              <div className="space-y-3">
                {getFilteredAndSortedDocuments().map(doc => {
                  // Estimate file size (in real app, get from metadata)
                  const fileSize = '2.4 MB' // Placeholder
                  return (
                    <div 
                      key={doc.id}
                      className="flex justify-between items-center transition-all duration-200 cursor-pointer"
                      style={{
                        background: 'linear-gradient(180deg, #FFFFFF 0%, #F9FCFB 100%)',
                        borderRadius: '12px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                        padding: '14px 20px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(180deg, #FFFFFF 0%, #F3FBF8 100%)'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.04)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(180deg, #FFFFFF 0%, #F9FCFB 100%)'
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.03)'
                      }}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <FileText className="w-5 h-5 flex-shrink-0" style={{ color: '#1C7C63' }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium mb-1" style={{ color: '#0A2540' }}>{doc.name}</div>
                          <div className="flex items-center gap-4 text-xs" style={{ color: '#647474' }}>
                            <span className="px-2 py-1 rounded-full" style={{ backgroundColor: '#E7F2EF', color: '#1C7C63' }}>
                              {doc.type}
                            </span>
                            <span>{getPropertyAddress(doc.property_id)}</span>
                            <span>{fileSize}</span>
                            <span>{doc.upload_date}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View Document"
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Eye className="w-5 h-5" />
                        </a>
                        <a
                          href={doc.file_url}
                          download
                          title="Download Document"
                          className="text-green-600 hover:text-green-800 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Download className="w-5 h-5" />
                        </a>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(doc.id)
                          }}
                          title="Delete Document"
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
                {getFilteredAndSortedDocuments().length === 0 && (
                  <div className="text-center py-16">
                    <div className="mb-6">
                      <div 
                        className="mx-auto mb-4"
                        style={{
                          width: '120px',
                          height: '120px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #E7F2EF 0%, #F3FBF8 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <FileText className="w-16 h-16" style={{ color: '#1C7C63', opacity: 0.4 }} />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-2" style={{ color: '#0A2540' }}>🗂 No documents uploaded yet</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Upload leases, receipts, and forms to keep everything in one place.
                    </p>
                    <button
                      onClick={() => setShowAddDocument(true)}
                      className="text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all duration-200 font-semibold mx-auto"
                      style={{
                        background: 'linear-gradient(90deg, #1C7C63, #29A184)',
                        border: 'none',
                        fontWeight: 600,
                        boxShadow: '0 3px 8px rgba(28,124,99,0.25)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.filter = 'brightness(1.08)'
                        e.currentTarget.style.transform = 'translateY(-1px)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.filter = 'brightness(1)'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      <Plus className="w-5 h-5" />
                      Upload Document
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
