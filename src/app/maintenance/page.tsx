'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getMaintenanceTasks, updateMaintenanceTask, deleteMaintenanceTask, getProperties, createExpense } from '@/lib/database'
import { MaintenanceTask, Property } from '@/lib/types'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import { Plus, Trash2, Check, X, Edit } from 'lucide-react'
import CostInputModal from '@/components/CostInputModal'

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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Maintenance Tasks</h2>
            <button
              onClick={() => setShowAddMaintenance(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Task
            </button>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks
              .sort((a, b) => {
                // Sort by status first (pending tasks first, then completed)
                if (a.status !== b.status) {
                  return a.status === 'pending' ? -1 : 1
                }
                // Then sort by due date (earliest first)
                return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
              })
              .map(task => (
              <div key={task.id} className={`bg-white rounded-lg shadow p-6 ${task.status === 'completed' ? 'opacity-60' : ''}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className={`text-lg font-bold ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                        {task.task}
                      </h3>
                      {task.status === 'completed' && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Completed</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{getPropertyAddress(task.property_id)}</p>
                    <p className="text-sm text-orange-600 mt-1">Scheduled: {new Date(task.due_date + 'T00:00:00').toLocaleDateString()}</p>
                    {task.notes && <p className="text-sm text-gray-600 mt-2">{task.notes}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(task)}
                      className="text-blue-600 hover:bg-blue-50 p-2 rounded"
                      title="Edit task"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleStatusToggle(task)}
                      className={`p-2 rounded ${task.status === 'pending' ? 'text-green-600 hover:bg-green-50' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      {task.status === 'pending' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="text-red-600 hover:bg-red-50 p-2 rounded"
                      title="Delete task"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
