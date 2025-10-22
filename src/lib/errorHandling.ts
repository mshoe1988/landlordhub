import toast from 'react-hot-toast'

export interface ApiError {
  message: string
  code?: string
  details?: any
}

export const handleApiError = (error: any, defaultMessage: string = 'An error occurred'): void => {
  console.error('API Error:', error)
  
  let message = defaultMessage
  
  if (error?.message) {
    message = error.message
  } else if (error?.error?.message) {
    message = error.error.message
  } else if (typeof error === 'string') {
    message = error
  }
  
  toast.error(message, {
    duration: 5000,
    position: 'top-right',
  })
}

export const showSuccessToast = (message: string): void => {
  toast.success(message, {
    duration: 3000,
    position: 'top-right',
  })
}

export const showLoadingToast = (message: string): string => {
  return toast.loading(message, {
    position: 'top-right',
  })
}

export const dismissToast = (toastId: string): void => {
  toast.dismiss(toastId)
}

export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  errorMessage: string = 'Operation failed'
): Promise<T | null> => {
  try {
    return await operation()
  } catch (error) {
    handleApiError(error, errorMessage)
    return null
  }
}

export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T | null> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      if (attempt === maxRetries) {
        handleApiError(error, 'Operation failed after multiple attempts')
        return null
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay * attempt))
    }
  }
  
  return null
}
