'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getDocuments, deleteDocument, getProperties } from '@/lib/database'
import { Document, Property } from '@/lib/types'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import FileUpload from '@/components/FileUpload'
import { uploadFile } from '@/lib/storage'
import { Plus, Trash2, FileText, Download, ChevronUp, ChevronDown } from 'lucide-react'

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
    return property ? property.address : 'Unknown Property'
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

  const getSortedDocuments = () => {
    return [...documents].sort((a, b) => {
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
            <h2 className="text-2xl font-bold text-gray-800">Documents</h2>
            <button
              onClick={() => setShowAddDocument(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Document
            </button>
          </div>

          {showAddDocument && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-bold mb-4">Add Document</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property *</label>
                  <select
                    value={newDocument.property_id}
                    onChange={(e) => setNewDocument({ ...newDocument, property_id: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="">Select Property</option>
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>{p.address}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                  <select
                    value={newDocument.type}
                    onChange={(e) => setNewDocument({ ...newDocument, type: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    {DOCUMENT_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Document Name *</label>
                  <input
                    type="text"
                    value={newDocument.name}
                    onChange={(e) => setNewDocument({ ...newDocument, name: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="Lease Agreement - John Smith"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload File *</label>
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
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
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

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      Document Name
                      {getSortIcon('name')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('type')}
                  >
                    <div className="flex items-center">
                      Type
                      {getSortIcon('type')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('property')}
                  >
                    <div className="flex items-center">
                      Property
                      {getSortIcon('property')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('upload_date')}
                  >
                    <div className="flex items-center">
                      Upload Date
                      {getSortIcon('upload_date')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getSortedDocuments().map(doc => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-blue-500 mr-2" />
                        {doc.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {doc.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{getPropertyAddress(doc.property_id)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.upload_date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <FileText className="w-4 h-4" />
                        </a>
                        <a
                          href={doc.file_url}
                          download
                          className="text-green-600 hover:text-green-800"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
