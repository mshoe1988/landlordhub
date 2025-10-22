export interface Property {
  id: string
  user_id: string
  address: string
  monthly_rent: number
  tenant_name?: string
  lease_end_date?: string
  purchase_date?: string
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

export interface DashboardStats {
  totalProperties: number
  totalMonthlyRent: number
  pendingMaintenanceTasks: number
  totalExpenses: number
  recentExpenses: Expense[]
  upcomingMaintenance: MaintenanceTask[]
}
