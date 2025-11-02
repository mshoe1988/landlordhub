export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validateRequired = (value: string | number | null | undefined): boolean => {
  if (typeof value === 'string') {
    return value.trim().length > 0
  }
  if (typeof value === 'number') {
    return value !== 0
  }
  return value !== null && value !== undefined
}

export const validateNumber = (value: string | number): boolean => {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return !isNaN(num) && isFinite(num)
}

export const validatePositiveNumber = (value: string | number): boolean => {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return !isNaN(num) && isFinite(num) && num >= 0
}

export const validateDate = (date: string): boolean => {
  const dateObj = new Date(date)
  return dateObj instanceof Date && !isNaN(dateObj.getTime())
}

export const validateFutureDate = (date: string): boolean => {
  const dateObj = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return dateObj >= today
}

export const validatePassword = (password: string): boolean => {
  return password.length >= 6
}

export const validateProperty = (property: {
  address: string
  monthly_rent: string | number
  tenant_name?: string
  lease_end_date?: string
  purchase_date?: string
}): ValidationResult => {
  const errors: ValidationError[] = []

  if (!validateRequired(property.address)) {
    errors.push({ field: 'address', message: 'Address is required' })
  }

  if (!validateRequired(property.monthly_rent)) {
    errors.push({ field: 'monthly_rent', message: 'Monthly rent is required' })
  } else if (!validatePositiveNumber(property.monthly_rent)) {
    errors.push({ field: 'monthly_rent', message: 'Monthly rent must be a positive number' })
  }

  if (property.lease_end_date && !validateDate(property.lease_end_date)) {
    errors.push({ field: 'lease_end_date', message: 'Invalid lease end date format' })
  }

  if (property.purchase_date && !validateDate(property.purchase_date)) {
    errors.push({ field: 'purchase_date', message: 'Invalid purchase date format' })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateExpense = (expense: {
  property_id: string
  date: string
  amount: string | number
  category: string
  description?: string
}): ValidationResult => {
  const errors: ValidationError[] = []

  if (!validateRequired(expense.property_id)) {
    errors.push({ field: 'property_id', message: 'Property is required' })
  }

  if (!validateRequired(expense.date)) {
    errors.push({ field: 'date', message: 'Date is required' })
  } else if (!validateDate(expense.date)) {
    errors.push({ field: 'date', message: 'Invalid date format' })
  }

  if (!validateRequired(expense.amount)) {
    errors.push({ field: 'amount', message: 'Amount is required' })
  } else if (!validatePositiveNumber(expense.amount)) {
    errors.push({ field: 'amount', message: 'Amount must be a positive number' })
  }

  if (!validateRequired(expense.category)) {
    errors.push({ field: 'category', message: 'Category is required' })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateMaintenanceTask = (task: {
  property_id: string
  task: string
  due_date: string
  notes?: string
}): ValidationResult => {
  const errors: ValidationError[] = []

  if (!validateRequired(task.property_id)) {
    errors.push({ field: 'property_id', message: 'Property is required' })
  }

  if (!validateRequired(task.task)) {
    errors.push({ field: 'task', message: 'Task description is required' })
  }

  if (!validateRequired(task.due_date)) {
    errors.push({ field: 'due_date', message: 'Due date is required' })
  } else if (!validateDate(task.due_date)) {
    errors.push({ field: 'due_date', message: 'Invalid due date format' })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateDocument = (document: {
  property_id: string
  name: string
  type: string
}): ValidationResult => {
  const errors: ValidationError[] = []

  if (!validateRequired(document.property_id)) {
    errors.push({ field: 'property_id', message: 'Property is required' })
  }

  if (!validateRequired(document.name)) {
    errors.push({ field: 'name', message: 'Document name is required' })
  }

  if (!validateRequired(document.type)) {
    errors.push({ field: 'type', message: 'Document type is required' })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateAuth = (auth: {
  email: string
  password: string
}): ValidationResult => {
  const errors: ValidationError[] = []

  if (!validateRequired(auth.email)) {
    errors.push({ field: 'email', message: 'Email is required' })
  } else if (!validateEmail(auth.email)) {
    errors.push({ field: 'email', message: 'Invalid email format' })
  }

  if (!validateRequired(auth.password)) {
    errors.push({ field: 'password', message: 'Password is required' })
  } else if (!validatePassword(auth.password)) {
    errors.push({ field: 'password', message: 'Password must be at least 6 characters' })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}
