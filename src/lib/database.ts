import { supabase } from './supabase'
import { Property, MaintenanceTask, Expense, Document, DashboardStats } from './types'

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
  return data
}

export const updateExpense = async (id: string, updates: Partial<Expense>): Promise<Expense> => {
  const { data, error } = await supabase
    .from('expenses')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteExpense = async (id: string): Promise<void> => {
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
