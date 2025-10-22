'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createDocument, getProperties } from '@/lib/database'
import { Property } from '@/lib/types'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import { ArrowLeft, Upload, FileText } from 'lucide-react'
import Link from 'next/link'

const DOCUMENT_TYPES = [
  'Lease Agreement',
  'Property Insurance',
  'Property Tax',
  'Maintenance Record',
  'Receipt',
  'Invoice',
  'Contract',
  'Other'
]

export default function NewDocumentPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingProperties, setLoadingProperties] = useState(true)
  const [error, setError] = useState('')
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  const [formData, setFormData] = useState({
    property_id: '',
    name: '',
    type: '',
  })

  useEffect(() => {
    if (user) {
      loadProperties()
    }
  }, [user])

  const loadProperties = async () => {
    try {
      const data = await getProperties(user!.id)
      setProperties(data)
    } catch (error) {
      console.error('Error loading properties:', error)
      setError('Failed to load properties')
    } finally {
      setLoadingProperties(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      if (!formData.name) {
        setFormData(prev => ({ ...prev, name: file.name }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!selectedFile) {
      setError('Please select a file to upload')
      setLoading(false)
      return
    }

    try {
      // For now, we'll create a placeholder URL
      // In a real implementation, you would upload to Supabase Storage
      const fileUrl = `https://example.com/uploads/${selectedFile.name}`
      
      await createDocument({
        user_id: user!.id,
        property_id: formData.property_id,
        name: formData.name,
        type: formData.type,
        file_url: fileUrl,
        upload_date: new Date().toISOString().split('T')[0],
      })
      router.push('/documents')
    } catch (error: any) {
      setError(error.message || 'Failed to upload document')
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

  if (loadingProperties) {
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
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Link
              href="/documents"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Documents
            </Link>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Upload Document</h1>
              
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {properties.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">You need to add a property first before uploading documents.</p>
                  <Link
                    href="/properties/new"
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Add Property
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="property_id" className="block text-sm font-medium text-gray-700">
                      Property *
                    </label>
                    <select
                      name="property_id"
                      id="property_id"
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.property_id}
                      onChange={handleChange}
                    >
                      <option value="">Select a property</option>
                      {properties.map((property) => (
                        <option key={property.id} value={property.id}>
                          {property.address}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="file" className="block text-sm font-medium text-gray-700">
                      File *
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                      <div className="space-y-1 text-center">
                        <FileText className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="file"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                          >
                            <span>Upload a file</span>
                            <input
                              id="file"
                              name="file"
                              type="file"
                              className="sr-only"
                              onChange={handleFileSelect}
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PDF, DOC, DOCX, JPG, PNG, GIF, TXT up to 10MB
                        </p>
                      </div>
                    </div>
                    {selectedFile && (
                      <p className="mt-2 text-sm text-gray-600">
                        Selected: {selectedFile.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Document Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g., Lease Agreement - 123 Main St"
                    />
                  </div>

                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                      Document Type *
                    </label>
                    <select
                      name="type"
                      id="type"
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.type}
                      onChange={handleChange}
                    >
                      <option value="">Select a type</option>
                      {DOCUMENT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Link
                      href="/documents"
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      disabled={loading || !selectedFile}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {loading ? 'Uploading...' : 'Upload Document'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
