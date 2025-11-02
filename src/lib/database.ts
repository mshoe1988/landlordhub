import { supabase } from './supabase'
import { Property, MaintenanceTask, Expense, Document, Contact, RentPayment, DashboardStats } from './types'

// Properties
export const getProperties = async (userId: string): Promise<Property[]> => {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export const createProperty = async (property: Omit<Property, 'id' | 'created_at' | 'updated_at'>): Promise<Property> => {
  const { data, error } = await supabase
    .from('properties')
    .insert(property)
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateProperty = async (id: string, updates: Partial<Property>): Promise<Property> => {
  const { data, error } = await supabase
    .from('properties')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteProperty = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Maintenance Tasks
export const getMaintenanceTasks = async (userId: string): Promise<MaintenanceTask[]> => {
  const { data, error } = await supabase
    .from('maintenance_tasks')
    .select('*')
    .eq('user_id', userId)
    .order('due_date', { ascending: true })

  if (error) throw error
  return data || []
}

export const createMaintenanceTask = async (task: Omit<MaintenanceTask, 'id' | 'created_at' | 'updated_at'>): Promise<MaintenanceTask> => {
  const { data, error } = await supabase
    .from('maintenance_tasks')
    .insert(task)
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateMaintenanceTask = async (id: string, updates: Partial<MaintenanceTask>): Promise<MaintenanceTask> => {
  const { data, error } = await supabase
    .from('maintenance_tasks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteMaintenanceTask = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('maintenance_tasks')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Expenses
export const getExpenses = async (userId: string): Promise<Expense[]> => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })

  if (error) throw error
  return data || []
}

export const createExpense = async (expense: Omit<Expense, 'id' | 'created_at'>): Promise<Expense> => {
  const { data, error } = await supabase
    .from('expenses')
    .insert(expense)
    .select()
    .single()

  if (error) throw error
  
  // Generate future recurring expenses if this is a recurring expense
  if (expense.is_recurring && expense.recurring_frequency) {
    try {
      await generateRecurringExpenses(data)
    } catch (recurringError) {
      console.error('Error generating recurring expenses:', recurringError)
      // Don't fail the main expense creation if recurring generation fails
    }
  }
  
  return data
}

export const updateExpense = async (id: string, updates: Partial<Expense>): Promise<Expense> => {
  // Get the original expense to check if it was recurring
  const { data: originalExpense, error: fetchError } = await supabase
    .from('expenses')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError) {
    throw fetchError
  }

  const { data, error } = await supabase
    .from('expenses')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // Handle recurring expense changes
  if (originalExpense.is_recurring || updates.is_recurring) {
    try {
      // Clean up old recurring expenses
      await cleanupRecurringExpenses(id, originalExpense.user_id)
      
      // Generate new recurring expenses if still recurring
      if (updates.is_recurring && updates.recurring_frequency) {
        const updatedExpense = { ...originalExpense, ...updates }
        await generateRecurringExpenses(updatedExpense)
      }
    } catch (recurringError) {
      console.error('Error handling recurring expense changes:', recurringError)
      // Don't fail the main update if recurring handling fails
    }
  }

  return data
}

export const deleteExpense = async (id: string): Promise<void> => {
  // Get the expense to check if it was recurring and get user_id
  const { data: expense, error: fetchError } = await supabase
    .from('expenses')
    .select('user_id, is_recurring')
    .eq('id', id)
    .single()

  if (fetchError) {
    throw fetchError
  }

  // Clean up recurring expenses if this was a recurring expense
  if (expense.is_recurring) {
    try {
      await cleanupRecurringExpenses(id, expense.user_id)
    } catch (recurringError) {
      console.error('Error cleaning up recurring expenses:', recurringError)
      // Don't fail the main deletion if cleanup fails
    }
  }

  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Documents
export const getDocuments = async (userId: string): Promise<Document[]> => {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('upload_date', { ascending: false })

  if (error) throw error
  return data || []
}

export const createDocument = async (document: Omit<Document, 'id' | 'created_at'>): Promise<Document> => {
  const { data, error } = await supabase
    .from('documents')
    .insert(document)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteDocument = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Dashboard Stats
export const getDashboardStats = async (userId: string): Promise<DashboardStats> => {
  const [properties, maintenanceTasks, expenses] = await Promise.all([
    getProperties(userId),
    getMaintenanceTasks(userId),
    getExpenses(userId)
  ])

  const totalProperties = properties.length
  const totalMonthlyRent = properties.reduce((sum, property) => sum + property.monthly_rent, 0)
  const pendingMaintenanceTasks = maintenanceTasks.filter(task => task.status === 'pending').length
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  
  const recentExpenses = expenses.slice(0, 5)
  const upcomingMaintenance = maintenanceTasks
    .filter(task => task.status === 'pending')
    .slice(0, 5)

  return {
    totalProperties,
    totalMonthlyRent,
    pendingMaintenanceTasks,
    totalExpenses,
    recentExpenses,
    upcomingMaintenance
  }
}

// Contacts
export const getContacts = async (userId: string, contactType?: 'tenant' | 'vendor'): Promise<Contact[]> => {
  let query = supabase
    .from('contacts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (contactType) {
    query = query.eq('contact_type', contactType)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export const createContact = async (contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'>): Promise<Contact> => {
  const { data, error } = await supabase
    .from('contacts')
    .insert(contact)
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateContact = async (id: string, updates: Partial<Omit<Contact, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<Contact> => {
  const { data, error } = await supabase
    .from('contacts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteContact = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export const getTenantContacts = async (userId: string): Promise<Contact[]> => {
  const { data, error } = await supabase
    .from('contacts')
    .select(`
      *,
      properties!inner(address)
    `)
    .eq('user_id', userId)
    .eq('contact_type', 'tenant')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// Generate future recurring expense entries up to current date
export const generateRecurringExpenses = async (expense: Expense): Promise<void> => {
  if (!expense.is_recurring || !expense.recurring_frequency) {
    return
  }

  const baseDate = new Date(expense.date)
  const currentDate = new Date()
  const futureExpenses: Omit<Expense, 'id' | 'created_at'>[] = []

  // Generate future expense entries until we reach current date
  let i = 1
  let futureDate = new Date(baseDate)

  while (true) {
    // Calculate next occurrence based on frequency
    if (expense.recurring_frequency === 'monthly') {
      futureDate = new Date(baseDate)
      futureDate.setMonth(futureDate.getMonth() + i)
    } else if (expense.recurring_frequency === 'weekly') {
      futureDate = new Date(baseDate)
      futureDate.setDate(futureDate.getDate() + (7 * i))
    } else if (expense.recurring_frequency === 'quarterly') {
      futureDate = new Date(baseDate)
      futureDate.setMonth(futureDate.getMonth() + (3 * i))
    } else if (expense.recurring_frequency === 'yearly') {
      futureDate = new Date(baseDate)
      futureDate.setFullYear(futureDate.getFullYear() + i)
    } else {
      break
    }

    // Stop if we've reached or passed the current date
    if (futureDate > currentDate) {
      break
    }

    // Add this expense entry
    futureExpenses.push({
      user_id: expense.user_id,
      property_id: expense.property_id,
      date: futureDate.toISOString().split('T')[0],
      amount: expense.amount,
      category: expense.category,
      description: expense.description,
      receipt_url: expense.receipt_url,
      is_recurring: false, // Future entries are not recurring themselves
      recurring_frequency: undefined
    })

    i++
  }

  // Insert all future expenses in a batch
  if (futureExpenses.length > 0) {
    const { error } = await supabase
      .from('expenses')
      .insert(futureExpenses)

    if (error) {
      console.error('Error creating recurring expenses:', error)
      throw error
    }
  }
}

// Clean up orphaned recurring expenses when original is deleted or modified
export const cleanupRecurringExpenses = async (originalExpenseId: string, userId: string): Promise<void> => {
  // Get the original expense to find related recurring expenses
  const { data: originalExpense, error: fetchError } = await supabase
    .from('expenses')
    .select('*')
    .eq('id', originalExpenseId)
    .single()

  if (fetchError || !originalExpense) {
    console.error('Error fetching original expense for cleanup:', fetchError)
    return
  }

  // Find and delete future recurring expenses that match the original
  // We'll identify them by matching amount, category, description, and property
  const { error: deleteError } = await supabase
    .from('expenses')
    .delete()
    .eq('user_id', userId)
    .eq('property_id', originalExpense.property_id)
    .eq('amount', originalExpense.amount)
    .eq('category', originalExpense.category)
    .eq('description', originalExpense.description || '')
    .eq('is_recurring', false) // Only delete the generated ones, not the original
    .gt('date', originalExpense.date) // Only future dates

  if (deleteError) {
    console.error('Error cleaning up recurring expenses:', deleteError)
  }
}

// Rent Payments
export const getRentPayments = async (userId: string, propertyId?: string, year?: number): Promise<RentPayment[]> => {
  try {
    let query = supabase
      .from('rent_payments')
      .select('*')
      .eq('user_id', userId)
      .order('year', { ascending: false })
      .order('month', { ascending: false })

    if (propertyId) {
      query = query.eq('property_id', propertyId)
    }

    if (year) {
      query = query.eq('year', year)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching rent payments:', error)
      // If table doesn't exist, return empty array instead of throwing
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('rent_payments table does not exist yet')
        return []
      }
      throw error
    }
    return data || []
  } catch (error) {
    console.error('Exception in getRentPayments:', error)
    throw error
  }
}

export const getRentPayment = async (userId: string, propertyId: string, month: number, year: number): Promise<RentPayment | null> => {
  const { data, error } = await supabase
    .from('rent_payments')
    .select('*')
    .eq('user_id', userId)
    .eq('property_id', propertyId)
    .eq('month', month)
    .eq('year', year)
    .maybeSingle()

  if (error) throw error
  return data
}

export const createRentPayment = async (payment: Omit<RentPayment, 'id' | 'created_at' | 'updated_at'>): Promise<RentPayment> => {
  const { data, error } = await supabase
    .from('rent_payments')
    .insert(payment)
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateRentPayment = async (id: string, updates: Partial<Omit<RentPayment, 'id' | 'user_id' | 'property_id' | 'month' | 'year' | 'created_at'>>): Promise<RentPayment> => {
  const { data, error } = await supabase
    .from('rent_payments')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const markRentAsPaid = async (
  userId: string,
  propertyId: string,
  month: number,
  year: number,
  amount: number,
  paymentDate?: string,
  notes?: string
): Promise<RentPayment> => {
  // Check if payment record exists
  const existing = await getRentPayment(userId, propertyId, month, year)

  if (existing) {
    // Update existing record
    return updateRentPayment(existing.id, {
      status: 'paid',
      amount,
      payment_date: paymentDate || new Date().toISOString().split('T')[0],
      notes
    })
  } else {
    // Create new payment record
    return createRentPayment({
      user_id: userId,
      property_id: propertyId,
      month,
      year,
      amount,
      status: 'paid',
      payment_date: paymentDate || new Date().toISOString().split('T')[0],
      notes
    })
  }
}

export const markRentAsUnpaid = async (
  userId: string,
  propertyId: string,
  month: number,
  year: number
): Promise<RentPayment> => {
  // Check if payment record exists
  const existing = await getRentPayment(userId, propertyId, month, year)

  if (existing) {
    // Update existing record
    return updateRentPayment(existing.id, {
      status: 'unpaid',
      payment_date: null,
      notes: existing.notes
    })
  } else {
    // Get property to get monthly rent amount
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('monthly_rent')
      .eq('id', propertyId)
      .single()

    if (propertyError) throw propertyError

    // Create new payment record marked as unpaid
    return createRentPayment({
      user_id: userId,
      property_id: propertyId,
      month,
      year,
      amount: property.monthly_rent,
      status: 'unpaid'
    })
  }
}

export const deleteRentPayment = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('rent_payments')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Helper function to get current month's payment status for all properties
export const getCurrentMonthRentStatus = async (userId: string): Promise<Record<string, RentPayment | null>> => {
  const now = new Date()
  const currentMonth = now.getMonth() + 1 // 1-12
  const currentYear = now.getFullYear()

  const properties = await getProperties(userId)
  const statusMap: Record<string, RentPayment | null> = {}

  // Get all payments for current month
  const payments = await getRentPayments(userId, undefined, currentYear)
  const currentMonthPayments = payments.filter(p => p.month === currentMonth)

  // Map payments to properties
  for (const property of properties) {
    const payment = currentMonthPayments.find(p => p.property_id === property.id)
    statusMap[property.id] = payment || null
  }

  return statusMap
}
