import Papa from 'papaparse'
import { Expense, Property, MaintenanceTask } from './types'

export interface DateRange {
  start: string
  end: string
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

export const exportExpensesToCSV = (
  expenses: Expense[], 
  properties: Property[], 
  dateRange?: DateRange
): void => {
  // Filter expenses by date range if provided
  let filteredExpenses = expenses
  if (dateRange) {
    filteredExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date)
      const startDate = new Date(dateRange.start)
      const endDate = new Date(dateRange.end)
      return expenseDate >= startDate && expenseDate <= endDate
    })
  }

  // Create property lookup map
  const propertyMap = new Map(properties.map(p => [p.id, p.address]))

  // Format data for CSV
  const csvData = filteredExpenses.map(expense => ({
    Date: expense.date,
    Property: propertyMap.get(expense.property_id) || 'Unknown Property',
    Category: expense.category,
    Description: expense.description || '',
    Amount: formatCurrency(expense.amount)
  }))

  // Generate CSV
  const csv = Papa.unparse(csvData, {
    header: true,
    delimiter: ','
  })

  // Create and download file
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  
  const dateRangeStr = dateRange 
    ? `_${dateRange.start}_to_${dateRange.end}` 
    : '_all'
  link.setAttribute('download', `expenses${dateRangeStr}.csv`)
  
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const exportAllDataToCSV = (
  properties: Property[],
  expenses: Expense[],
  maintenanceTasks: MaintenanceTask[]
): void => {
  // Export Properties
  const propertiesData = properties.map(property => ({
    Type: 'Property',
    ID: property.id,
    Address: property.address,
    Monthly_Rent: formatCurrency(property.monthly_rent),
    Rent_Due_Date: property.rent_due_date ? `${property.rent_due_date}${property.rent_due_date === 1 ? 'st' : property.rent_due_date === 2 ? 'nd' : property.rent_due_date === 3 ? 'rd' : property.rent_due_date === 21 ? 'st' : property.rent_due_date === 22 ? 'nd' : property.rent_due_date === 23 ? 'rd' : property.rent_due_date === 31 ? 'st' : 'th'}` : '1st',
    Tenant_Name: property.tenant_name || '',
    Lease_End_Date: property.lease_end_date || '',
    Lease_Start_Date: property.lease_start_date || '',
    Created_At: property.created_at
  }))

  // Export Expenses
  const expensesData = expenses.map(expense => ({
    Type: 'Expense',
    ID: expense.id,
    Date: expense.date,
    Amount: formatCurrency(expense.amount),
    Category: expense.category,
    Description: expense.description || '',
    Receipt_URL: expense.receipt_url || '',
    Created_At: expense.created_at
  }))

  // Export Maintenance Tasks
  const maintenanceData = maintenanceTasks.map(task => ({
    Type: 'Maintenance',
    ID: task.id,
    Task: task.task,
    Due_Date: task.due_date,
    Status: task.status,
    Notes: task.notes || '',
    Created_At: task.created_at
  }))

  // Combine all data
  const allData = [...propertiesData, ...expensesData, ...maintenanceData]

  // Generate CSV
  const csv = Papa.unparse(allData, {
    header: true,
    delimiter: ','
  })

  // Create and download file
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `landlordhub_backup_${new Date().toISOString().split('T')[0]}.csv`)
  
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const getDateRangeOptions = () => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const currentDate = now.getDate()

  return {
    'This Month': {
      start: new Date(currentYear, currentMonth, 1).toISOString().split('T')[0],
      end: new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0]
    },
    'Last Month': {
      start: new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0],
      end: new Date(currentYear, currentMonth, 0).toISOString().split('T')[0]
    },
    'This Quarter': {
      start: new Date(currentYear, Math.floor(currentMonth / 3) * 3, 1).toISOString().split('T')[0],
      end: new Date(currentYear, Math.floor(currentMonth / 3) * 3 + 3, 0).toISOString().split('T')[0]
    },
    'This Year': {
      start: new Date(currentYear, 0, 1).toISOString().split('T')[0],
      end: new Date(currentYear, 11, 31).toISOString().split('T')[0]
    }
  }
}
