'use client'

import { useState } from 'react'
import { Eye, X } from 'lucide-react'

interface EmailPreviewProps {
  task: {
    task: string
    properties: {
      address: string
    }
    due_date: string
    notes?: string
  }
}

export default function EmailPreview({ task }: EmailPreviewProps) {
  const [showPreview, setShowPreview] = useState(false)

  const generatePreviewHTML = () => {
    const dueDate = new Date(task.due_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Maintenance Reminder</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🏠 LandlordHub</h1>
          <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Property Management Suite</p>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0; font-size: 24px;">Maintenance Reminder</h2>
          
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-weight: bold; color: #92400e;">
              ⚠️ This maintenance task is due in 3 days
            </p>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0; font-size: 20px;">${task.task}</h3>
            
            <div style="margin: 15px 0;">
              <p style="margin: 5px 0;"><strong>Property:</strong> ${task.properties.address}</p>
              <p style="margin: 5px 0;"><strong>Due Date:</strong> ${dueDate}</p>
              ${task.notes ? `<p style="margin: 5px 0;"><strong>Notes:</strong> ${task.notes}</p>` : ''}
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="#" 
               style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              View in LandlordHub
            </a>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; font-size: 14px; color: #6b7280;">
            <p>This is an automated reminder from LandlordHub. Please log in to your account to manage your maintenance tasks.</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  if (!showPreview) {
    return (
      <button
        onClick={() => setShowPreview(true)}
        className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
      >
        <Eye className="w-4 h-4" />
        Preview Email
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Email Preview</h3>
          <button
            onClick={() => setShowPreview(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
          <iframe
            srcDoc={generatePreviewHTML()}
            className="w-full h-[600px] border-0"
            title="Email Preview"
          />
        </div>
      </div>
    </div>
  )
}
