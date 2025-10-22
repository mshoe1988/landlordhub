'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getProperties, getMaintenanceTasks, getExpenses } from '@/lib/database'
import { Property, MaintenanceTask, Expense } from '@/lib/types'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import { 
  Home, 
  DollarSign, 
  Wrench, 
  Calendar
} from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [maintenance, setMaintenance] = useState<MaintenanceTask[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    try {
      const [propertiesData, maintenanceData, expensesData] = await Promise.all([
        getProperties(user!.id),
        getMaintenanceTasks(user!.id),
        getExpenses(user!.id)
      ])
      
      setProperties(propertiesData)
      setMaintenance(maintenanceData)
      setExpenses(expensesData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
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

  // Calculate totals
  const totalMonthlyRent = properties.reduce((sum, p) => sum + p.monthly_rent, 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const upcomingTasks = maintenance.filter(m => m.status === 'pending').length

  const getExpensesByProperty = (propertyId: string) => {
    return expenses.filter(e => e.property_id === propertyId).reduce((sum, e) => sum + e.amount, 0)
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Properties</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{properties.length}</p>
                </div>
                <Home className="w-12 h-12 text-blue-500 opacity-20" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Monthly Rent</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">${totalMonthlyRent.toLocaleString()}</p>
                </div>
                <DollarSign className="w-12 h-12 text-green-500 opacity-20" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Expenses</p>
                  <p className="text-3xl font-bold text-red-600 mt-1">${totalExpenses.toLocaleString()}</p>
                </div>
                <DollarSign className="w-12 h-12 text-red-500 opacity-20" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Upcoming Tasks</p>
                  <p className="text-3xl font-bold text-orange-600 mt-1">{upcomingTasks}</p>
                </div>
                <Calendar className="w-12 h-12 text-orange-500 opacity-20" />
              </div>
            </div>
          </div>

          {/* Properties Overview */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">Properties Overview</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {properties.map(property => {
                  const propertyExpenses = getExpensesByProperty(property.id)
                  const netForProperty = property.monthly_rent - propertyExpenses
                  return (
                    <div key={property.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{property.address}</h3>
                          <p className="text-sm text-gray-500 mt-1">Tenant: {property.tenant_name || 'Vacant'}</p>
                          <div className="flex gap-4 mt-2 text-sm">
                            <span className="text-green-600">Rent: ${property.monthly_rent}/mo</span>
                            <span className="text-red-600">Expenses: ${propertyExpenses}</span>
                            <span className={`font-semibold ${netForProperty >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              Net: ${netForProperty}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Upcoming Maintenance */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">Upcoming Maintenance</h2>
            </div>
            <div className="p-6">
              {maintenance.filter(m => m.status === 'pending').length === 0 ? (
                <p className="text-gray-500 text-center py-8">No upcoming maintenance tasks</p>
              ) : (
                <div className="space-y-3">
                  {maintenance.filter(m => m.status === 'pending').map(task => {
                    const property = properties.find(p => p.id === task.property_id)
                    return (
                      <div key={task.id} className="border rounded-lg p-4 flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-gray-800">{task.task}</h3>
                          <p className="text-sm text-gray-500">{property?.address || 'Unknown Property'}</p>
                          <p className="text-sm text-orange-600 mt-1">Due: {new Date(task.due_date).toLocaleDateString()}</p>
                        </div>
                        <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                          Mark Complete
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
