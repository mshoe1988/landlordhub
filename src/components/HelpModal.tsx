'use client'

import { useState } from 'react'
import { X, Send } from 'lucide-react'

interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    priority: 'medium'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      // Create mailto link with form data
      const subject = encodeURIComponent(`[LandlordHub Help] ${formData.subject}`)
      const body = encodeURIComponent(
        `Name: ${formData.name}\n` +
        `Email: ${formData.email}\n` +
        `Priority: ${formData.priority}\n\n` +
        `Message:\n${formData.message}`
      )
      
      const mailtoLink = `mailto:support@landlordhubapp.com?subject=${subject}&body=${body}`
      
      // Open email client
      window.open(mailtoLink, '_blank')
      
      setSubmitStatus('success')
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        priority: 'medium'
      })
      setTimeout(() => {
        onClose()
        setSubmitStatus('idle')
      }, 2000)
    } catch (error) {
      console.error('Error opening email client:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Need Help?</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject *
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
              placeholder="Brief description of your issue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority Level
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
            >
              <option value="low">Low - General question</option>
              <option value="medium">Medium - Minor issue</option>
              <option value="high">High - Feature not working</option>
              <option value="urgent">Urgent - App is broken</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message *
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={6}
              className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
              placeholder="Please describe your issue in detail. Include steps to reproduce if it's a bug, or any error messages you're seeing."
            />
          </div>

          {submitStatus === 'success' && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              Your email client should open with a pre-filled message. Please send the email to complete your help request.
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              Sorry, there was an error sending your message. Please try again or contact us directly.
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
