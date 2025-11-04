'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getDocuments, deleteDocument, getProperties } from '@/lib/database'
import { Document, Property } from '@/lib/types'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import FileUpload from '@/components/FileUpload'
import { uploadFile } from '@/lib/storage'
import { Plus, Trash2, FileText, Download, ChevronUp, ChevronDown, Eye, Filter, SortAsc, FolderOpen, FileType, HardDrive, Calendar } from 'lucide-react'

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

          {/* Add Document Button */}
          <div className="flex justify-end mb-6">
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

          {/* Document Summary Card */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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

          {/* Filter and Sort Controls */}
          <div className="bg-white p-4 rounded-lg mb-6" style={{ borderRadius: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" style={{ color: '#1C7C63' }} />
                <span className="text-sm font-medium" style={{ color: '#0A2540' }}>Filters:</span>
              </div>
              <div className="flex flex-wrap gap-3 flex-1">
                <select
                  value={filterProperty}
                  onChange={(e) => setFilterProperty(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  style={{ backgroundColor: '#F9FCFB', borderColor: '#E5E9E7', color: '#0A2540' }}
                >
                  <option value="">All Properties</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.nickname || p.address}</option>
                  ))}
                </select>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  style={{ backgroundColor: '#F9FCFB', borderColor: '#E5E9E7', color: '#0A2540' }}
                >
                  <option value="">All Types</option>
                  {DOCUMENT_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <SortAsc className="w-4 h-4" style={{ color: '#1C7C63' }} />
                <select
                  value={`${sortField}-${sortDirection}`}
                  onChange={(e) => {
                    const [field, dir] = e.target.value.split('-')
                    setSortField(field as 'name' | 'type' | 'property' | 'upload_date')
                    setSortDirection(dir as 'asc' | 'desc')
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  style={{ backgroundColor: '#F9FCFB', borderColor: '#E5E9E7', color: '#0A2540' }}
                >
                  <option value="upload_date-desc">Newest First</option>
                  <option value="upload_date-asc">Oldest First</option>
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                  <option value="type-asc">Type A-Z</option>
                  <option value="type-desc">Type Z-A</option>
                </select>
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
              {getFilteredAndSortedDocuments().map(doc => (
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
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.06)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.03)'
                  }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center flex-1">
                      <FileText className="w-5 h-5 mr-2 flex-shrink-0" style={{ color: '#1C7C63' }} />
                      <div className="text-sm font-medium" style={{ color: '#0A2540' }}>{doc.name}</div>
                    </div>
                    <div className="flex items-center gap-2">
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
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-medium" style={{ color: '#647474' }}>Type:</span>
                      <span className="ml-2 px-2 py-1 text-xs rounded-full" style={{ backgroundColor: '#E7F2EF', color: '#1C7C63' }}>
                        {doc.type}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs font-medium" style={{ color: '#647474' }}>Property:</span>
                      <span className="ml-2 text-sm" style={{ color: '#0A2540' }}>{getPropertyAddress(doc.property_id)}</span>
                    </div>
                    <div>
                      <span className="text-xs font-medium" style={{ color: '#647474' }}>Upload Date:</span>
                      <span className="ml-2 text-sm" style={{ color: '#0A2540' }}>{doc.upload_date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Card View */}
            <div className="hidden md:block p-6">
              <div className="space-y-3">
                {getFilteredAndSortedDocuments().map(doc => (
                  <div 
                    key={doc.id}
                    className="flex justify-between items-center transition-all duration-200"
                    style={{
                      background: 'linear-gradient(180deg, #FFFFFF 0%, #F9FCFB 100%)',
                      borderRadius: '12px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                      padding: '14px 20px'
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
                    <div className="flex items-center gap-4 flex-1">
                      <FileText className="w-5 h-5 flex-shrink-0" style={{ color: '#1C7C63' }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium mb-1" style={{ color: '#0A2540' }}>{doc.name}</div>
                        <div className="flex items-center gap-4 text-xs" style={{ color: '#647474' }}>
                          <span className="px-2 py-1 rounded-full" style={{ backgroundColor: '#E7F2EF', color: '#1C7C63' }}>
                            {doc.type}
                          </span>
                          <span>{getPropertyAddress(doc.property_id)}</span>
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
                      >
                        <Eye className="w-5 h-5" />
                      </a>
                      <a
                        href={doc.file_url}
                        download
                        title="Download Document"
                        className="text-green-600 hover:text-green-800 transition-colors"
                      >
                        <Download className="w-5 h-5" />
                      </a>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        title="Delete Document"
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
                {getFilteredAndSortedDocuments().length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: '#1C7C63' }} />
                    <p className="text-gray-500">No documents found. {filterProperty || filterType ? 'Try adjusting your filters.' : 'Add your first document to get started.'}</p>
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
