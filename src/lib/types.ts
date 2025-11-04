export interface Property {
  id: string
  user_id: string
  address: string
  monthly_rent: number
  security_deposit?: number
  nickname?: string
  tenant_name?: string
  tenant_email?: string
  tenant_phone?: string
  lease_end_date?: string
  lease_start_date?: string
  rent_due_date?: number
  created_at: string
  updated_at: string
}

export interface MaintenanceTask {
  id: string
  user_id: string
  property_id: string
  task: string
  due_date: string
  status: 'pending' | 'completed'
  notes?: string
  priority?: 'low' | 'medium' | 'high'
  attachment_url?: string
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  user_id: string
  property_id: string
  date: string
  amount: number
  category: string
  description?: string
  receipt_url?: string
  is_recurring?: boolean
  recurring_frequency?: string
  created_at: string
}

export interface Document {
  id: string
  user_id: string
  property_id: string
  name: string
  type: string
  file_url: string
  upload_date: string
  created_at: string
}

export interface Contact {
  id: string
  user_id: string
  contact_type: 'tenant' | 'vendor'
  name: string
  email?: string
  phone?: string
  company?: string
  service_type?: string
  property_id?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface RentPayment {
  id: string
  user_id: string
  property_id: string
  month: number
  year: number
  amount: number
  status: 'paid' | 'unpaid' | 'partial'
  payment_date?: string
  notes?: string
  days_covered?: number
  move_in_date?: string
  move_out_date?: string
  created_at: string
  updated_at: string
}

export interface DashboardStats {
  totalProperties: number
  totalMonthlyRent: number
  pendingMaintenanceTasks: number
  totalExpenses: number
  recentExpenses: Expense[]
  upcomingMaintenance: MaintenanceTask[]
}
