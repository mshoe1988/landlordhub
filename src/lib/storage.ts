import { supabase } from './supabase'

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export const validateFile = (file: File): { valid: boolean; error?: string } => {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size must be less than 5MB' }
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { valid: false, error: 'File type not supported. Allowed: PDF, JPG, PNG, DOC, DOCX' }
  }

  return { valid: true }
}

export const uploadFile = async (
  file: File, 
  userId: string, 
  folder: 'receipts' | 'documents',
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  try {
    // Validate file
    const validation = validateFile(file)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // Create unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${userId}/${folder}/${fileName}`

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      return { success: false, error: error.message }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath)

    return { success: true, url: urlData.publicUrl }
  } catch (error: any) {
    return { success: false, error: error.message || 'Upload failed' }
  }
}

export const deleteFile = async (fileUrl: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Extract file path from URL
    const url = new URL(fileUrl)
    const pathParts = url.pathname.split('/')
    const filePath = pathParts.slice(pathParts.indexOf('documents') + 1).join('/')

    const { error } = await supabase.storage
      .from('documents')
      .remove([filePath])

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Delete failed' }
  }
}
