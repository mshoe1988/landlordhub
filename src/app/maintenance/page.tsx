'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getMaintenanceTasks, updateMaintenanceTask, deleteMaintenanceTask, getProperties, createExpense } from '@/lib/database'
import { MaintenanceTask, Property } from '@/lib/types'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import { Plus, Trash2, Check, X, Edit, Wrench, Droplets, Zap, Home, Filter, SortAsc, AlertCircle, Clock } from 'lucide-react'
import CostInputModal from '@/components/CostInputModal'
import EmptyState from '@/components/EmptyState'
import toast from 'react-hot-toast'

export default function MaintenancePage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<MaintenanceTask[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddMaintenance, setShowAddMaintenance] = useState(false)
  const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null)
  const [newMaintenance, setNewMaintenance] = useState({
    property_id: '',
    task: '',
    due_date: '',
    notes: ''
  })
  const [showCostModal, setShowCostModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'property' | 'type'>('date')

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      const [tasksData, propertiesData] = await Promise.all([
        getMaintenanceTasks(user!.id),
        getProperties(user!.id)
      ])
      setTasks(tasksData)
      setProperties(propertiesData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusToggle = async (task: MaintenanceTask) => {
    if (task.status === 'pending') {
      // Show cost input modal when marking as complete
      setSelectedTask(task)
      setShowCostModal(true)
    } else {
      // Just mark as pending if it was completed
      try {
        await updateMaintenanceTask(task.id, { status: 'pending' })
        setTasks(tasks.map(t => t.id === task.id ? { ...t, status: 'pending' } : t))
      } catch (error) {
        console.error('Error updating task status:', error)
        alert('Failed to update task status')
      }
    }
  }

  const handleCostConfirm = async (cost: number) => {
    if (!selectedTask || !user) return

    try {
      // Update maintenance task status
      await updateMaintenanceTask(selectedTask.id, { status: 'completed' })
      
      // Create expense entry
      const property = properties.find(p => p.id === selectedTask.property_id)
      await createExpense({
        user_id: user.id,
        property_id: selectedTask.property_id,
        date: new Date().toISOString().split('T')[0],
        amount: cost,
        category: 'Maintenance',
        description: `${selectedTask.task}${property ? ` - ${property.address}` : ''}`,
        is_recurring: false,
        recurring_frequency: undefined
      })

      // Update local state
      setTasks(prev => 
        prev.map(task => 
          task.id === selectedTask.id 
            ? { ...task, status: 'completed' as const }
            : task
        )
      )

    } catch (error) {
      console.error('Error completing task and adding expense:', error)
      throw error
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this maintenance task?')) {
      try {
        await deleteMaintenanceTask(id)
        setTasks(tasks.filter(task => task.id !== id))
      } catch (error) {
        console.error('Error deleting task:', error)
        alert('Failed to delete task')
      }
    }
  }

  const handleEdit = (task: MaintenanceTask) => {
    setEditingTask(task)
    setNewMaintenance({
      property_id: task.property_id,
      task: task.task,
      due_date: task.due_date,
      notes: task.notes || ''
    })
  }

  const handleUpdateTask = async () => {
    if (!editingTask || !newMaintenance.property_id || !newMaintenance.task || !newMaintenance.due_date) {
      alert('Please fill in all required fields')
      return
    }
    
    try {
      const updatedTask = await updateMaintenanceTask(editingTask.id, {
        property_id: newMaintenance.property_id,
        task: newMaintenance.task,
        due_date: newMaintenance.due_date, // Already in YYYY-MM-DD format from date input
        notes: newMaintenance.notes || undefined,
      })
      
      setTasks(tasks.map(task => 
        task.id === editingTask.id ? updatedTask : task
      ))
      setEditingTask(null)
      setNewMaintenance({ property_id: '', task: '', due_date: '', notes: '' })
    } catch (error) {
      console.error('Error updating task:', error)
      alert('Failed to update task')
    }
  }

  const addMaintenance = async () => {
    if (!newMaintenance.property_id || !newMaintenance.task || !newMaintenance.due_date) {
      alert('Please fill in all required fields')
      return
    }
    
    try {
      const { createMaintenanceTask } = await import('@/lib/database')
      
      // Ensure the date is stored as-is (YYYY-MM-DD format)
      const task = await createMaintenanceTask({
        user_id: user!.id,
        property_id: newMaintenance.property_id,
        task: newMaintenance.task,
        due_date: newMaintenance.due_date, // Already in YYYY-MM-DD format from date input
        status: 'pending',
        notes: newMaintenance.notes || undefined,
      })
      
      setTasks([...tasks, task])
      setNewMaintenance({ property_id: '', task: '', due_date: '', notes: '' })
      setShowAddMaintenance(false)
    } catch (error) {
      console.error('Error creating maintenance task:', error)
      alert('Failed to create maintenance task')
    }
  }

  const getPropertyAddress = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId)
    return property ? property.address : 'Unknown Property'
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

  return (
    <ProtectedRoute>
      <Layout>
        <div>
          <div className="mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold" style={{ color: '#0A2540' }}>Maintenance Tasks</h2>
                <p className="text-sm mt-1" style={{ color: '#667680' }}>
                  Track and manage repairs, upkeep, and maintenance for your properties.
                </p>
              </div>
              <button
                onClick={() => setShowAddMaintenance(true)}
                className="text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-200 font-medium"
                style={{
                  backgroundColor: '#1C7C63',
                  borderRadius: '8px',
                  transform: 'scale(1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#155A47'
                  e.currentTarget.style.transform = 'scale(1.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#1C7C63'
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                <Plus className="w-5 h-5" />
                Add Task
              </button>
            </div>

            {/* Filter and Sort Controls */}
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" style={{ color: '#647474' }} />
                <span className="text-sm font-medium" style={{ color: '#647474' }}>Filter:</span>
                <div className="flex gap-1">
                  {(['all', 'pending', 'completed', 'overdue'] as const).map(status => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className="px-3 py-1.5 text-sm rounded-lg transition-all duration-200"
                      style={{
                        backgroundColor: filterStatus === status ? '#1C7C63' : 'transparent',
                        color: filterStatus === status ? 'white' : '#647474',
                        border: `1px solid ${filterStatus === status ? '#1C7C63' : '#D7E2DF'}`,
                        fontWeight: filterStatus === status ? 500 : 400
                      }}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <SortAsc className="w-4 h-4" style={{ color: '#647474' }} />
                <span className="text-sm font-medium" style={{ color: '#647474' }}>Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'property' | 'type')}
                  className="px-3 py-1.5 text-sm border rounded-lg"
                  style={{
                    borderColor: '#D7E2DF',
                    color: '#0A2540',
                    backgroundColor: 'white',
                    borderRadius: '8px'
                  }}
                >
                  <option value="date">By Date</option>
                  <option value="property">By Property</option>
                  <option value="type">By Type</option>
                </select>
              </div>
            </div>
          </div>


          {(showAddMaintenance || editingTask) && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-bold mb-4 text-gray-900">
                {editingTask ? 'Edit Maintenance Task' : 'Add Maintenance Task'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Property *</label>
                  <select
                    value={newMaintenance.property_id}
                    onChange={(e) => setNewMaintenance({ ...newMaintenance, property_id: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
                  >
                    <option value="">Select Property</option>
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>{p.address}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Task *</label>
                  <input
                    type="text"
                    value={newMaintenance.task}
                    onChange={(e) => setNewMaintenance({ ...newMaintenance, task: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
                    placeholder="HVAC Filter Replacement"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Date Scheduled *</label>
                  <input
                    type="date"
                    value={newMaintenance.due_date}
                    onChange={(e) => setNewMaintenance({ ...newMaintenance, due_date: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Notes</label>
                  <input
                    type="text"
                    value={newMaintenance.notes}
                    onChange={(e) => setNewMaintenance({ ...newMaintenance, notes: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
                    placeholder="Additional details..."
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={editingTask ? handleUpdateTask : addMaintenance}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                >
                  {editingTask ? 'Update Task' : 'Save Task'}
                </button>
                <button
                  onClick={() => {
                    setShowAddMaintenance(false)
                    setEditingTask(null)
                    setNewMaintenance({ property_id: '', task: '', due_date: '', notes: '' })
                  }}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {tasks.length === 0 ? (
            <EmptyState
              type="maintenance"
              onAction={() => setShowAddMaintenance(true)}
              actionText="Add Your First Task"
            />
          ) : (
            <>
              {/* Pending & Overdue Tasks */}
              {(pendingTasks.length > 0 || overdueTasks.length > 0) && (
                <div className="mb-8">
                  {(overdueTasks.length > 0 || pendingTasks.length > 0) && (
                    <h3 className="text-lg font-semibold mb-4" style={{ color: '#0A2540', fontWeight: 600 }}>
                      {overdueTasks.length > 0 && `Overdue (${overdueTasks.length})`}
                      {overdueTasks.length > 0 && pendingTasks.length > 0 && ' • '}
                      {pendingTasks.length > 0 && `Pending (${pendingTasks.length})`}
                    </h3>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...overdueTasks, ...pendingTasks].map(task => {
                      const taskOverdue = isOverdue(task)
                      const taskDueSoon = isDueSoon(task)
                      const property = getProperty(task.property_id)
                      
                      return (
                        <div 
                          key={task.id} 
                          className="bg-white rounded-lg shadow p-6 transition-all duration-200"
                          style={{
                            borderRadius: '12px',
                            boxShadow: '0 3px 12px rgba(0, 0, 0, 0.05)',
                            border: '1px solid #E5EBE9',
                            borderLeft: `4px solid ${taskOverdue ? '#B0372A' : '#1C7C63'}`,
                            transform: 'translateY(0)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 6px 18px rgba(0, 0, 0, 0.08)'
                            e.currentTarget.style.transform = 'translateY(-2px)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = '0 3px 12px rgba(0, 0, 0, 0.05)'
                            e.currentTarget.style.transform = 'translateY(0)'
                          }}
                        >
                          {/* Card Header */}
                          <div className="flex justify-between items-start mb-3 pb-3" style={{ borderBottom: '1px solid #EAEAEA' }}>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {getTaskIcon(task.task)}
                                <h3 className="font-bold" style={{ color: '#0A2540', fontSize: '16px', fontWeight: 600 }}>
                                  {task.task}
                                </h3>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                {taskOverdue ? (
                                  <span 
                                    className="inline-block px-2 py-1 text-xs font-medium rounded"
                                    style={{ backgroundColor: '#FFEAEA', color: '#B0372A', borderRadius: '8px', fontWeight: 500 }}
                                  >
                                    🔴 Overdue
                                  </span>
                                ) : task.status === 'pending' ? (
                                  <span 
                                    className="inline-block px-2 py-1 text-xs font-medium rounded"
                                    style={{ backgroundColor: '#FFF7E0', color: '#8A6E00', borderRadius: '8px', fontWeight: 500 }}
                                  >
                                    🟡 Pending
                                  </span>
                                ) : null}
                                {taskDueSoon && !taskOverdue && (
                                  <span 
                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded"
                                    style={{ backgroundColor: '#FFF4E6', color: '#D97706', borderRadius: '8px', fontWeight: 500 }}
                                  >
                                    <Clock className="w-3 h-3" />
                                    Due Soon
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleEdit(task)}
                                className="p-1.5 rounded transition-all duration-200"
                                title="Edit task"
                                aria-label="Edit task"
                                style={{ 
                                  opacity: 0.8,
                                  color: '#647474',
                                  borderRadius: '6px',
                                  border: '1px solid #E6ECE9',
                                  backgroundColor: 'transparent'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.opacity = '1'
                                  e.currentTarget.style.backgroundColor = '#F7FBF9'
                                  e.currentTarget.style.color = '#0A2540'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.opacity = '0.8'
                                  e.currentTarget.style.backgroundColor = 'transparent'
                                  e.currentTarget.style.color = '#647474'
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (task.status === 'pending') {
                                    handleStatusToggle(task)
                                  } else {
                                    handleStatusToggle(task)
                                  }
                                }}
                                className="p-1.5 rounded transition-all duration-200"
                                title={task.status === 'pending' ? 'Mark complete' : 'Mark pending'}
                                aria-label={task.status === 'pending' ? 'Mark complete' : 'Mark pending'}
                                style={{ 
                                  opacity: 0.8,
                                  color: task.status === 'pending' ? '#1C7C63' : '#647474',
                                  borderRadius: '6px',
                                  border: '1px solid #E6ECE9',
                                  backgroundColor: 'transparent'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.opacity = '1'
                                  e.currentTarget.style.backgroundColor = '#F7FBF9'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.opacity = '0.8'
                                  e.currentTarget.style.backgroundColor = 'transparent'
                                }}
                              >
                                {task.status === 'pending' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => handleDelete(task.id)}
                                className="p-1.5 rounded transition-all duration-200"
                                title="Delete task"
                                aria-label="Delete task"
                                style={{ 
                                  opacity: 0.8,
                                  color: '#EE5C4D',
                                  borderRadius: '6px',
                                  border: '1px solid #E6ECE9',
                                  backgroundColor: 'transparent'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.opacity = '1'
                                  e.currentTarget.style.backgroundColor = '#FEF5F5'
                                  e.currentTarget.style.borderColor = '#F5C2BA'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.opacity = '0.8'
                                  e.currentTarget.style.backgroundColor = 'transparent'
                                  e.currentTarget.style.borderColor = '#E6ECE9'
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Card Body */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span 
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded"
                                style={{ backgroundColor: '#E7F2EF', color: '#1C7C63', borderRadius: '6px', fontSize: '12px' }}
                              >
                                <Home className="w-3 h-3" />
                                {property?.nickname || getPropertyAddress(task.property_id)}
                              </span>
                            </div>
                            <p className="text-sm" style={{ color: taskOverdue ? '#B0372A' : '#D97706', fontSize: '13px' }}>
                              Scheduled: {new Date(task.due_date + 'T00:00:00').toLocaleDateString()}
                            </p>
                            {task.notes && (
                              <p className="text-sm mt-2" style={{ color: '#6E7B7A', fontSize: '13px' }}>
                                {task.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Completed Tasks Section */}
              {completedTasks.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: '#0A2540', fontWeight: 600 }}>
                    <CheckCircle2 className="w-5 h-5" style={{ color: '#1C7C63' }} />
                    Completed Tasks ({completedTasks.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {completedTasks.map(task => {
                      const property = getProperty(task.property_id)
                      
                      return (
                        <div 
                          key={task.id} 
                          className="bg-white rounded-lg shadow p-6 transition-all duration-200"
                          style={{
                            borderRadius: '12px',
                            boxShadow: '0 3px 12px rgba(0, 0, 0, 0.05)',
                            border: '1px solid #E5EBE9',
                            borderLeft: '4px solid #1C7C63',
                            transform: 'translateY(0)',
                            opacity: 0.7
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 6px 18px rgba(0, 0, 0, 0.08)'
                            e.currentTarget.style.transform = 'translateY(-2px)'
                            e.currentTarget.style.opacity = '0.9'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = '0 3px 12px rgba(0, 0, 0, 0.05)'
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.opacity = '0.7'
                          }}
                        >
                          {/* Card Header */}
                          <div className="flex justify-between items-start mb-3 pb-3" style={{ borderBottom: '1px solid #EAEAEA' }}>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {getTaskIcon(task.task)}
                                <h3 className="font-bold line-through" style={{ color: '#647474', fontSize: '16px', fontWeight: 600 }}>
                                  {task.task}
                                </h3>
                              </div>
                              <span 
                                className="inline-block px-2 py-1 text-xs font-medium rounded"
                                style={{ backgroundColor: '#E6F5EA', color: '#1C7C63', borderRadius: '8px', fontWeight: 500 }}
                              >
                                🟢 Completed
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleStatusToggle(task)}
                                className="p-1.5 rounded transition-all duration-200"
                                title="Mark pending"
                                aria-label="Mark pending"
                                style={{ 
                                  opacity: 0.8,
                                  color: '#647474',
                                  borderRadius: '6px',
                                  border: '1px solid #E6ECE9',
                                  backgroundColor: 'transparent'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.opacity = '1'
                                  e.currentTarget.style.backgroundColor = '#F7FBF9'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.opacity = '0.8'
                                  e.currentTarget.style.backgroundColor = 'transparent'
                                }}
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(task.id)}
                                className="p-1.5 rounded transition-all duration-200"
                                title="Delete task"
                                aria-label="Delete task"
                                style={{ 
                                  opacity: 0.8,
                                  color: '#EE5C4D',
                                  borderRadius: '6px',
                                  border: '1px solid #E6ECE9',
                                  backgroundColor: 'transparent'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.opacity = '1'
                                  e.currentTarget.style.backgroundColor = '#FEF5F5'
                                  e.currentTarget.style.borderColor = '#F5C2BA'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.opacity = '0.8'
                                  e.currentTarget.style.backgroundColor = 'transparent'
                                  e.currentTarget.style.borderColor = '#E6ECE9'
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Card Body */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span 
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded"
                                style={{ backgroundColor: '#E7F2EF', color: '#1C7C63', borderRadius: '6px', fontSize: '12px' }}
                              >
                                <Home className="w-3 h-3" />
                                {property?.nickname || getPropertyAddress(task.property_id)}
                              </span>
                            </div>
                            <p className="text-sm" style={{ color: '#647474', fontSize: '13px' }}>
                              Completed: {new Date(task.due_date + 'T00:00:00').toLocaleDateString()}
                            </p>
                            {task.notes && (
                              <p className="text-sm mt-2" style={{ color: '#6E7B7A', fontSize: '13px' }}>
                                {task.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Cost Input Modal */}
        <CostInputModal
          isOpen={showCostModal}
          onClose={() => {
            setShowCostModal(false)
            setSelectedTask(null)
          }}
          onConfirm={handleCostConfirm}
          taskName={selectedTask?.task || ''}
          propertyAddress={properties.find(p => p.id === selectedTask?.property_id)?.address || ''}
        />
      </Layout>
    </ProtectedRoute>
  )
}
